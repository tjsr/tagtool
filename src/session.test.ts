import { SESSION_ID_HEADER } from './api/apiUtils.js';
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
    realAppMemoryStore = new session.MemoryStore();
    realApp = startApp({ sessionOptions: { store: realAppMemoryStore } });
  });

  // beforeAll(() => {
  //   realAppMemoryStore = new session.MemoryStore();
  //   realApp = startApp(realAppMemoryStore);
  // });

  afterAll(async () => {
    return Promise.resolve(); // closeConnectionPool();
  });

  test('Should reject a made-up SessionID that we dont know about in real app - using Promise', async () => {
    return new Promise<void>((done) => {
      supertest(realApp)
        .get('/')
        .set(SESSION_ID_HEADER, 'abcd-2345')
        .set('Content-Type', 'application/json')
        .expect(401, (err, res) => {
          expect(res.status).toBe(401);
          done();
        });
      // .end((err, res) => {
      //   expect(res.status).toBe(401);
      // });
    });
  });

  test('Should not hang when no session ID header is sent', async () => {
    const response = await supertest(realApp).get('/').set('Content-Type', 'application/json').expect(200);

    expect(response.status).toBe(200);
  });

  test('Should reject a made-up SessionID that we dont know about in real app - using await', async () => {
    const response = await supertest(realApp)
      .get('/')
      .set(SESSION_ID_HEADER, 'abcd-1234')
      .set('Content-Type', 'application/json')
      .expect(401);
    // .expect(401, (err, res) => {
    //   expect(res.status).toBe(401);
    // });

    expect(response.status).toBe(401);

    // expect(response.status).toBe(401);
    return Promise.resolve();
  });
});
