import { ObjectId, UserId } from '../types.js';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
} from 'vitest';
import {
  closeConnectionPool,
  verifyDatabaseReady,
} from '@tjsr/mysql-pool-utils';

import { TagResponse } from './apiTypes.js';
import { connectionDetails } from '../setup-tests.js';
import { createRandomId } from '../utils/createRandomId.js';
import { createRandomUserId } from '../auth/user.js';
import express from 'express';
import { insertTag } from '../database/insertTag.js';
import { randomUUID } from 'crypto';
import session from 'express-session';
import { startApp } from '../server.js';
import supertest from 'supertest';

describe('GET /tags', () => {
  let app: express.Express;
  const generatedUid: UserId = createRandomUserId();
  const generatedObjectId: ObjectId = createRandomId(randomUUID());
  const generatedTag =
    'some-tag-' + createRandomId(randomUUID()).substring(0, 7);

  beforeAll(async () => {
    console.log('connectionDetails:', JSON.stringify(connectionDetails));
    const dbReadyPromise: Promise<void> =
      verifyDatabaseReady(connectionDetails);
    dbReadyPromise.catch((err) => {
      return fail(err);
    });
    await dbReadyPromise;
  });

  beforeAll(async () => {
    await insertTag(generatedUid, generatedObjectId, generatedTag);
    return Promise.resolve();
  });

  beforeEach(async () => {
    const memoryStore = new session.MemoryStore();
    const testSessionId = 's1234';
    memoryStore.set(testSessionId, {
      cookie: new session.Cookie(),
    });
    app = startApp(memoryStore);
    return Promise.resolve();
  });

  afterAll(() => {
    return closeConnectionPool();
  });

  test("Should return a 200 error if there's no session userInfo.", (done) => {
    supertest(app)
      .get(`/tags/${generatedObjectId}`)
      .expect(200, (err, response) => {
        expect(response.body.message).not.toBe(
          `Invalid objectId ${generatedObjectId}`,
        );
        return Promise.resolve();
        // done();
      });
  });

  test("Should return a 200 error if there's no session userInfo.", async () => {
    const response = await supertest(app).get(`/tags/${generatedObjectId}`);

    expect(response.body.message).not.toBe(
      `Invalid objectId ${generatedObjectId}`,
    );
    expect(response.statusCode).toBe(200);
    return Promise.resolve();
  });

  test('Should reject a made-up SessionID that we dont know about', async () => {
    const response = await supertest(app)
      .get(`/tags/${generatedObjectId}`)
      .set('x-session-id', 'abcd-1234')
      .set('Content-Type', 'application/json');

    expect(response.statusCode).toBe(401);
    expect(response.body.data).toBeUndefined();
    return Promise.resolve();
  });

  test('Should return a 200 if there is no authenticated user for the session.', async () => {
    const memoryStore = new session.MemoryStore();
    const testSessionId = 's1234';
    const testObjectId: ObjectId = 'o1234';
    const ownerUser: UserId = 'u1234';
    memoryStore.set(testSessionId, {
      cookie: new session.Cookie(),
    });
    const app: express.Express = startApp(memoryStore);

    await insertTag(ownerUser, testObjectId, 'some-tag');
    await insertTag(ownerUser, testObjectId, 'some-other-tag');
    const response = await supertest(app)
      .get(`/tags/${testObjectId}`)
      .set('Content-Type', 'application/json');

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type'].match(/json/)).toBeTruthy();
    const responseBody: TagResponse = response.body;
    expect(responseBody.objectId).toBe(testObjectId);
    expect(responseBody.tags.length).toBe(2);
    return Promise.resolve();
  });
});
