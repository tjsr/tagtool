import { afterAll, beforeAll, describe, expect, test } from 'vitest';

import { connectionDetails } from './setup-tests.js';
import express from 'express';
import session from 'express-session';
import { startApp } from './server.js';
import supertest from 'supertest';
import { verifyDatabaseReady } from '@tjsr/mysql-pool-utils';

describe('retrieveSessionData', () => {
  let realApp: express.Express;
  let realAppMemoryStore: session.MemoryStore;

  beforeAll(async () => {
    await verifyDatabaseReady(connectionDetails);
  });

  beforeAll(() => {
    realAppMemoryStore = new session.MemoryStore();
    realApp = startApp(realAppMemoryStore);
  });

  afterAll(async () => {
    return Promise.resolve(); // closeConnectionPool();
  });

  test('Should reject a made-up SessionID that we dont know about in real app - using Promise',
    async () => {
      return new Promise<void>((done) => {
        supertest(realApp)
          .get('/')
          .set('x-session-id', 'abcd-1234')
          .set('Content-Type', 'application/json')
          .expect(401, () => {
            done();
          });
      });
    }
  );

  test('Should reject a made-up SessionID that we dont know about in real app - using await', async () => {
    const response = await supertest(realApp)
      .get('/')
      .set('x-session-id', 'abcd-1234')
      .set('Content-Type', 'application/json');

    expect(response.status).toBe(401);
    return Promise.resolve();
  });
});
