import { getSession, useSessionId } from './session';

import express from 'express';
import session from 'express-session';
import supertest from 'supertest';

describe('useSessionId', () => {
  let app:express.Express;

  beforeAll((done) => {
    const memoryStore = new session.MemoryStore();

    app = express();
    app.use(getSession(memoryStore));
    app.use(useSessionId);
    app.get('/', (req, res) => {
      res.status(200);
      res.end();
    });

    done();
  });

  test('Should reject a made-up SessionID that we dont know about', (done) => {
    supertest(app)
      .get('/')
      .set('x-session-id', 'abcd-1234')
      .set('Content-Type', 'application/json')
      .expect(401, () => {
        done();
      });
  });
});
