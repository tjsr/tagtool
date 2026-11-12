import { applyD1Migrations, type D1Migration } from 'cloudflare:test';
import { env } from 'cloudflare:workers';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
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
});
