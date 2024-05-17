import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { getSession, useSessionId } from '@tjsr/user-session-middleware';

import { TagtoolSessionData } from './session.js';
import { connectionDetails } from './setup-tests.js';
import express from 'express';
import session from 'express-session';
import { startApp } from './server.js';
import supertest from 'supertest';
import { verifyDatabaseReady } from '@tjsr/mysql-pool-utils';

describe('useSessionId', () => {
  let app: express.Express;
  let realApp: express.Express;
  let memoryStore: session.MemoryStore;
  let realAppMemoryStore: session.MemoryStore;

  beforeAll(async () => {
    await verifyDatabaseReady(connectionDetails);
  });

  beforeAll(() => {
    memoryStore = new session.MemoryStore();
    realAppMemoryStore = new session.MemoryStore();

    app = express();
    app.use(getSession(memoryStore));
    app.use(useSessionId);
    app.get('/', (req, res, next) => {
      res.status(200);
      // res.end();
      next();
    });

    realApp = startApp(realAppMemoryStore);

    // done();
  });

  afterAll(async () => {
    return Promise.resolve(); // closeConnectionPool();
  });

  test(
    'Should reject a made-up SessionID that we dont know about',
    {},
    async () =>
      new Promise<void>((done) => {
        supertest(app)
          .get('/')
          .set('x-session-id', 'abcd-1234')
          .set('Content-Type', 'application/json')
          .expect(401, () => {
            done();
          });
      })
  );

  test(
    'Should reject a made-up SessionID that we dont know about in real app',
    {},
    async () =>
      new Promise<void>((done) => {
        supertest(realApp)
          .get('/')
          .set('x-session-id', 'abcd-1234')
          .set('Content-Type', 'application/json')
          .expect(401, () => {
            done();
          });
      })
  );

  test('Should reject a made-up SessionID that we dont know about in real app- mode B', {}, async () => {
    const response = await supertest(realApp)
      .get('/')
      .set('x-session-id', 'abcd-1234')
      .set('Content-Type', 'application/json');

    expect(response.status).toBe(401);
    return Promise.resolve();
  });

  test(
    'Should accept a request with no sessionId',
    {},
    async () =>
      new Promise<void>((done) => {
        supertest(app)
          .get('/')
          .set('Content-Type', 'application/json')
          .expect(200, () => {
            done();
          });
      })
  );

  test(
    'Should accept a request with a valid sessionId',
    {},
    async () =>
      new Promise<void>((done) => {
        const testUserId = 'user-4321';
        memoryStore.set('abcd-1234', {
          userId: testUserId,
        } as TagtoolSessionData);

        supertest(app)
          .get('/')
          .set('x-session-id', 'abcd-1234')
          .set('Content-Type', 'application/json')
          .expect(200, () => {
            done();
          });
      })
  );
});
