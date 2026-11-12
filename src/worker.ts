type Session = { userId: string };
type TagRow = { tag: string; createdByUserId: string };

const SESSION_LIFETIME_SECONDS = 30 * 24 * 60 * 60;
const VALID_VALUE = /^[a-zA-Z0-9_-]{1,32}$/;

const json = (body: unknown, status = 200): Response => Response.json(body, { status });

const sessionIdFromRequest = (request: Request): string | undefined => {
  const header = request.headers.get('x-session-id');
  if (header && header !== 'undefined') return header;
  const cookie = request.headers.get('cookie')?.split(';').map((part) => part.trim())
    .find((part) => part.startsWith('sessionId='));
  return cookie?.slice('sessionId='.length);
};

const getSession = async (request: Request, env: Env): Promise<Session | undefined> => {
  const id = sessionIdFromRequest(request);
  if (!id) return undefined;
  const row = await env.DB.prepare('SELECT sess FROM session WHERE session_id = ? AND expire > ?')
    .bind(id, Math.floor(Date.now() / 1000)).first<{ sess: string }>();
  if (!row) return undefined;
  try {
    const session: unknown = JSON.parse(row.sess);
    if (typeof session === 'object' && session !== null && 'userId' in session &&
      typeof session.userId === 'string' && session.userId.length > 0) return { userId: session.userId };
  } catch {
    // Treat malformed persisted sessions as invalid.
  }
  return undefined;
};

const newSession = async (env: Env, previousId?: string, previousSession?: Session): Promise<Response> => {
  const sessionId = crypto.randomUUID();
  const session = previousSession ?? { userId: crypto.randomUUID() };
  const create = env.DB.prepare('INSERT INTO session (session_id, sess, expire) VALUES (?, ?, ?)')
    .bind(sessionId, JSON.stringify(session), Math.floor(Date.now() / 1000) + SESSION_LIFETIME_SECONDS);
  if (previousId) {
    await env.DB.batch([create, env.DB.prepare('DELETE FROM session WHERE session_id = ?').bind(previousId)]);
  } else {
    await create.run();
  }
  return Response.json({ sessionId, userId: session.userId }, {
    headers: { 'Set-Cookie': `sessionId=${sessionId}; Path=/; HttpOnly; Secure; SameSite=Strict` },
  });
};

const readBody = async (request: Request): Promise<unknown> => {
  if (!request.body) throw new Error('Missing body');
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > 8192) {
      await reader.cancel();
      throw new RangeError('Body too large');
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset); offset += chunk.byteLength; 
  }
  return JSON.parse(new TextDecoder().decode(bytes));
};

const withCors = (response: Response): Response => {
  const headers = new Headers(response.headers);
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, X-Session-Id');
  return new Response(response.body, { headers, status: response.status, statusText: response.statusText });
};

const handle = async (request: Request, env: Env): Promise<Response> => {
  const url = new URL(request.url);
  if (request.method === 'OPTIONS') return new Response(null, { status: 204 });
  if (url.pathname === '/health' && request.method === 'GET') return json({ status: 'ok' });
  const sessionId = sessionIdFromRequest(request);
  const session = await getSession(request, env);
  if (sessionId && !session) return json({ message: 'Invalid session' }, 401);
  if (url.pathname === '/session' && request.method === 'GET') return newSession(env, sessionId, session);
  if (url.pathname === '/' && request.method === 'GET') return json({});
  if ((url.pathname === '/user' || /^\/user\/[^/]+$/.test(url.pathname)) && request.method === 'GET') {
    return session ? json({ userId: session.userId }) : json({ message: 'Invalid user' }, 401);
  }
  if (url.pathname === '/logout' && (request.method === 'GET' || request.method === 'POST')) {
    return newSession(env, sessionId);
  }
  if (url.pathname === '/login') {
    return json({ message: 'Sign-in migration is not configured.' }, 501);
  }

  const match = /^\/tags\/([^/]+)$/.exec(url.pathname);
  if (!match) return json({ message: 'Not found' }, 404);
  let objectId: string;
  try {
    objectId = decodeURIComponent(match[1]); 
  } catch {
    return json({ message: 'Invalid objectId' }, 400); 
  }
  if (!VALID_VALUE.test(objectId)) return json({ message: `Invalid objectId ${objectId}` }, 400);

  if (request.method === 'GET') {
    const result = await env.DB.prepare('SELECT tag, createdByUserId FROM Tags WHERE objectId = ? ORDER BY rowid')
      .bind(objectId).all<TagRow>();
    if (!result.results.length) return json({ message: 'Empty tag result list returned.' }, 404);
    const tags = new Map<string, { tag: string; count: number; isOwner: boolean }>();
    for (const row of result.results) {
      const item = tags.get(row.tag) ?? { count: 0, isOwner: false, tag: row.tag };
      item.count += 1;
      item.isOwner ||= row.createdByUserId === session?.userId;
      tags.set(row.tag, item);
    }
    return json({ objectId, tags: [...tags.values()] });
  }

  if (!session) return json({ message: 'Invalid user' }, 401);
  let body: unknown;
  if (Number(request.headers.get('content-length') ?? 0) > 8192) return json({ message: 'Body too large' }, 413);
  try {
    body = await readBody(request);
  } catch (error) {
    return error instanceof RangeError ? json({ message: 'Body too large' }, 413) : json({ message: 'Invalid JSON' }, 400);
  }
  if (typeof body !== 'object' || body === null) return json({ message: 'Invalid body' }, 400);
  if (request.method === 'POST') {
    const tag = 'tag' in body ? body.tag : undefined;
    if (typeof tag !== 'string' || !VALID_VALUE.test(tag)) return json({ message: 'Invalid tag' }, 400);
    await env.DB.prepare('INSERT INTO Tags (id, objectId, tag, createdByUserId) VALUES (?, ?, ?, ?)')
      .bind(crypto.randomUUID(), objectId, tag, session.userId).run();
    return json({ sessionId, userId: session.userId });
  }
  if (request.method === 'DELETE') {
    const tags = 'tags' in body ? body.tags : undefined;
    if (!Array.isArray(tags) || tags.length > 100 ||
      tags.some((tag: unknown) => typeof tag !== 'string' || !VALID_VALUE.test(tag))) {
      return json({ message: 'Invalid tag' }, 400);
    }
    if (tags.length === 0) return new Response(null, { status: 404 });
    const statements = [...new Set(tags as string[])].map((tag) => env.DB
      .prepare('DELETE FROM Tags WHERE objectId = ? AND tag = ? AND createdByUserId = ?')
      .bind(objectId, tag, session.userId));
    const results = await env.DB.batch(statements);
    const deleted = results.reduce((sum, result) => sum + result.meta.changes, 0);
    return deleted ? json({ delted: deleted }) : new Response(null, { status: 404 });
  }
  return json({ message: 'Method not allowed' }, 405);
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      return withCors(await handle(request, env)); 
    } catch (error) {
      console.error(JSON.stringify({ error: String(error), message: 'Tagtool request failed' }));
      return withCors(json({ message: 'Internal server error' }, 500));
    }
  },
} satisfies ExportedHandler<Env>;
