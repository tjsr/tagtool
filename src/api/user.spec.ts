import express from 'express';
import session from 'express-session';
import { startApp } from '../server';
import supertest from 'supertest';

describe('API tests for tags', () => {
  let app:express.Express;

  beforeAll(async () => {
    const memoryStore = new session.MemoryStore();
    const testSessionId = 's1234';
    memoryStore.set(testSessionId, {
      cookie: new session.Cookie(),
    });
    app = startApp(memoryStore);
    return;
  });

  test('GET /user with sessionId', (done) => {
    supertest(app)
      .get('/tags/123')
      .expect(200, (err, res) => {
        if (err) {
          return done(err);
        }
        expect(res.body.user).toBe('u1234');
        done();
      });
  });
});
