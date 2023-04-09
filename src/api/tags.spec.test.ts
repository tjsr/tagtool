import { ObjectId, UserId } from '../types';

import { TagResponse } from './apiTypes';
import { closeConnections } from '../database/mysqlConnections';
import express from 'express';
import { insertTag } from '../database/insertTag';
import session from 'express-session';
import { startApp } from '../server';
import supertest from 'supertest';

describe('GET /tags', () => {
  let app:express.Express;

  beforeAll(async () => {
    const memoryStore = new session.MemoryStore();
    const testSessionId = 's1234';
    memoryStore.set(testSessionId, {
      cookie: new session.Cookie(),
    });
    app = startApp(memoryStore);
    return Promise.resolve();
  });

  // afterAll(() => {
  //   closeConnections();
  // });

  test('Should return a 200 error if there\'s no session userInfo.', (done) => {
    supertest(app)
      .get('/tags/123')
      .expect(200, (err, res) => {
        if (err) {
          return done(err);
        }
        done();
      });
  });

  test('Should reject a made-up SessionID that we dont know about', (done) => {
    supertest(app)
      .get('/tags/123')
      .set('x-session-id', 'abcd-1234')
      .set('Content-Type', 'application/json')
      .expect(401, () => {
        done();
      });
  });

  test('Should return a 200 error if the user is unregistered.', async () => {
    const memoryStore = new session.MemoryStore();
    const testSessionId = 's1234';
    const testObjectId: ObjectId = 'o1234';
    const ownerUser:UserId = 'u1234';
    memoryStore.set(testSessionId, {
      cookie: new session.Cookie(),
    });
    const app:express.Express = startApp(memoryStore);
    // console.log('Session store configured');

    await insertTag(ownerUser, testObjectId, 'some-tag'); // .then(() => {
    await insertTag(ownerUser, testObjectId, 'some-other-tag'); // .then(() => {

    // });
    supertest(app)
      .get(`/tags/${testObjectId}`)
      .set('Content-Type', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200, (err, res) => {
        expect(err).toBeNull();
        // if (err) {
        //   return done(err);
        // } else {
        const response: TagResponse = res.body;
        expect(response.objectId).toBe(testObjectId);
        expect(response.tags.length).toBe(2);
        //   done();
        // }
      });
    // });
    // });
  });
});
