import { beforeAll, describe, expect, test } from 'vitest';

import { TagtoolSessionData } from '../session.js';
import express from 'express';
import session from 'express-session';
import { startApp } from '../server.js';
import supertest from 'supertest';

describe('API tests for tags', () => {
  let app: express.Express;
  const testSessionId = 's1234';
  const testUserId = 'u1234';

  beforeAll(async () => {
    const memoryStore = new session.MemoryStore();
    memoryStore.set(testSessionId, {
      cookie: new session.Cookie(),
      userId: testUserId,
    } as TagtoolSessionData);
    app = startApp(memoryStore);
    return;
  });

  test('GET /user with sessionId', async () => {
    const response = await supertest(app)
      .get('/user/123')
      .set('x-session-id', testSessionId);
    expect(response.status).toBe(200);
    expect(response.body.userId).toBe('u1234');
  });
});
