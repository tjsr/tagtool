import { applyD1Migrations, type D1Migration } from 'cloudflare:test';
import { env } from 'cloudflare:workers';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { exportJWK, generateKeyPair, SignJWT } from 'jose';
import { v5 as uuidv5 } from 'uuid';
import worker from '../src/worker.js';

const bindings = env as Env & { TEST_MIGRATIONS: D1Migration[] };
const call = (path: string, init?: RequestInit) => worker.fetch(new Request(`https://tagtool.test${path}`, init), bindings);
const createSession = async (): Promise<{ sessionId: string; userId: string }> => {
  const response = await call('/session');
  expect(response.status).toBe(200);
  return response.json();
};

beforeAll(async () => applyD1Migrations(bindings.DB, bindings.TEST_MIGRATIONS));
beforeEach(async () => {
  await bindings.DB.prepare('DELETE FROM Tags').run();
  await bindings.DB.prepare('DELETE FROM session').run();
  await bindings.DB.prepare('DELETE FROM GoogleIdentity').run();
});

describe('Tagtool Worker', () => {
  it('isolates tag ownership and aggregates counts across sessions', async () => {
    const first = await createSession();
    const second = await createSession();
    for (const session of [first, second]) {
      const response = await call('/tags/pin-1', { method: 'POST',
        headers: { 'content-type': 'application/json', 'x-session-id': session.sessionId },
        body: JSON.stringify({ tag: 'rare' }) });
      expect(response.status).toBe(200);
    }
    const response = await call('/tags/pin-1', { headers: { 'x-session-id': first.sessionId } });
    expect(await response.json()).toEqual({ objectId: 'pin-1', tags: [{ tag: 'rare', count: 2, isOwner: true }] });
    const deleted = await call('/tags/pin-1', { method: 'DELETE',
      headers: { 'content-type': 'application/json', 'x-session-id': first.sessionId },
      body: JSON.stringify({ tags: ['rare'] }) });
    expect(await deleted.json()).toEqual({ delted: 1 });
    const remaining = await call('/tags/pin-1', { headers: { 'x-session-id': first.sessionId } });
    expect(await remaining.json()).toEqual({ objectId: 'pin-1', tags: [{ tag: 'rare', count: 1, isOwner: false }] });
  });

  it('rejects invalid sessions and unauthenticated writes', async () => {
    expect((await call('/tags/pin-1', { headers: { 'x-session-id': 'unknown' } })).status).toBe(401);
    expect((await call('/tags/pin-1', { method: 'POST', body: '{}' })).status).toBe(401);
    await bindings.DB.prepare('INSERT INTO session (session_id, sess, expire) VALUES (?, ?, ?)')
      .bind('expired', JSON.stringify({ userId: 'owner' }), Math.floor(Date.now() / 1000) - 1).run();
    expect((await call('/user', { headers: { 'x-session-id': 'expired' } })).status).toBe(401);
  });

  it('rotates sessions without losing the owner, and invalidates the old session', async () => {
    const original = await createSession();
    const refresh = await call('/session', { headers: { 'x-session-id': original.sessionId } });
    const rotated = await refresh.json() as { sessionId: string; userId: string };
    expect(rotated.userId).toBe(original.userId);
    expect(rotated.sessionId).not.toBe(original.sessionId);
    expect((await call('/user', { headers: { 'x-session-id': original.sessionId } })).status).toBe(401);
    expect((await call('/user', { headers: { 'x-session-id': rotated.sessionId } })).status).toBe(200);
  });

  it('rejects invalid tag data and handles preflight requests', async () => {
    const session = await createSession();
    const response = await call('/tags/pin-1', { method: 'POST',
      headers: { 'content-type': 'application/json', 'x-session-id': session.sessionId },
      body: JSON.stringify({ tag: 'not valid!' }) });
    expect(response.status).toBe(400);
    const large = await call('/tags/pin-1', { method: 'POST',
      headers: { 'content-type': 'application/json', 'x-session-id': session.sessionId },
      body: JSON.stringify({ tag: 'x'.repeat(9000) }) });
    expect(large.status).toBe(413);
    const options = await call('/tags/pin-1', { method: 'OPTIONS' });
    expect(options.status).toBe(204);
    expect(options.headers.get('access-control-allow-headers')).toContain('X-Session-Id');
  });

  it('preserves imported large MySQL IDs and session ownership', async () => {
    const owner = 'legacy-user-id';
    await bindings.DB.prepare('INSERT INTO Tags (id, objectId, tag, createdByUserId) VALUES (?, ?, ?, ?)')
      .bind('9223372036854775807', 'Pin-1', 'rare', owner).run();
    await bindings.DB.prepare('INSERT INTO session (session_id, sess, expire) VALUES (?, ?, ?)')
      .bind('legacy-session', JSON.stringify({ userId: owner }), Math.floor(Date.now() / 1000) + 3600).run();
    const response = await call('/tags/pin-1', { headers: { 'x-session-id': 'legacy-session' } });
    expect(await response.json()).toEqual({ objectId: 'pin-1', tags: [{ tag: 'rare', count: 1, isOwner: true }] });
  });

  it('accepts only verified Google credentials, rotates sessions, and keeps stable ownership', async () => {
    const keys = await generateKeyPair('RS256', { extractable: true });
    const publicKey = await exportJWK(keys.publicKey);
    publicKey.kid = 'test-key';
    publicKey.alg = 'RS256';
    const mockedFetch = vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
      Response.json({ keys: [publicKey] }, { headers: { 'Cache-Control': 'max-age=60' } }));
    const namespace = '12345678-1234-4234-8234-123456789012';
    const configured = { ...bindings, GOOGLE_CLIENT_ID: 'test-client', USERID_UUID_NAMESPACE: namespace };
    const token = async (email: string, audience = 'test-client', verified = true, subject = 'google-subject') => new SignJWT({
      email, email_verified: verified,
    }).setProtectedHeader({ alg: 'RS256', kid: 'test-key' }).setIssuer('https://accounts.google.com')
      .setAudience(audience).setSubject(subject).setIssuedAt().setExpirationTime('5m').sign(keys.privateKey);
    const login = async (sessionId: string, credential: string) => worker.fetch(new Request('https://tagtool.test/login', {
      method: 'POST', headers: { 'content-type': 'application/json', 'x-session-id': sessionId },
      body: JSON.stringify({ credential }),
    }), configured);
    try {
      const session = await createSession();
      expect((await login(session.sessionId, 'google-subject')).status).toBe(401);
      expect((await login(session.sessionId, await token('alice@gmail.com', 'wrong-client'))).status).toBe(401);
      const authenticated = await login(session.sessionId, await token('alice@gmail.com'));
      expect(authenticated.status).toBe(200);
      const auth = await authenticated.json() as { sessionId: string; userId: string };
      expect(auth.userId).toBe(uuidv5('alice@gmail.com', namespace));
      expect((await call('/user', { headers: { 'x-session-id': session.sessionId } })).status).toBe(401);
      const next = await login(auth.sessionId, await token('new-name@gmail.com'));
      expect((await next.json() as { userId: string }).userId).toBe(auth.userId);
      const otherSession = await createSession();
      const otherLogin = await login(otherSession.sessionId, await token('alice@example.org', 'test-client', true, 'other-subject'));
      expect(otherLogin.status).toBe(200);
      const otherAuth = await otherLogin.json() as { sessionId: string; userId: string };
      expect(otherAuth.userId).not.toBe(uuidv5('alice@example.org', namespace));
      const again = await login(otherAuth.sessionId, await token('alice@example.org', 'test-client', false, 'other-subject'));
      expect((await again.json() as { userId: string }).userId).toBe(otherAuth.userId);
    } finally {
      mockedFetch.mockRestore();
    }
  });
});
