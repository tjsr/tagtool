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
import { elideValues } from '../utils/elideValues.js';
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
  const generatedTag = 'some-tag-' + createRandomId(randomUUID()).substring(0, 7);

  beforeAll(
    async () =>
      new Promise((resolve, fail) => {
        console.debug('connectionDetails for test run:', JSON.stringify(connectionDetails, elideValues));
        const dbReadyPromise: Promise<void> = verifyDatabaseReady(connectionDetails);
        return dbReadyPromise
          .then(() => resolve())
          .catch((err) => {
            console.error('Failed connecting to database.');
            return fail(err);
          });
      })
  );

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

  test('Should return a 200 when retrieving a tag list for a valid object via callback.', (_done) => {
    supertest(app)
      .get(`/tags/${generatedObjectId}`)
      .expect(200, (err, response) => {
        expect(response.body.message).not.toBe(`Invalid objectId ${generatedObjectId}`);
        return Promise.resolve();
        // done();
      });
  });

  test('Should return a 200 retrieving a tag list for a valid object via async method.', async () => {
    const response = await supertest(app).get(`/tags/${generatedObjectId}`);

    expect(response.body.message).not.toBe(`Invalid objectId ${generatedObjectId}`);
    expect(response.status).toBe(200);
    return Promise.resolve();
  });

  test('Should reject a made-up SessionID that we dont know about', async () => {
    const response = await supertest(app)
      .get(`/tags/${generatedObjectId}`)
      .set('x-session-id', 'abcd-1234')
      .set('Content-Type', 'application/json');

    expect(response.status).toBe(401);
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
    const response = await supertest(app).get(`/tags/${testObjectId}`).set('Content-Type', 'application/json');

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type'].match(/json/)).toBeTruthy();
    const responseBody: TagResponse = response.body;
    expect(responseBody.objectId).toBe(testObjectId);
    expect(responseBody.tags.length).toBe(2);
    return Promise.resolve();
  });

  test.todo('Should return a 200 and a count of each tag where permitted', () => {});

  test.todo('Should return a 200 but no item counts where limited read permitted', () => {});
});

describe('POST /tags/:objectId', () => {
  test.todo('Return a 401 creating a tag without a session ID when mode is enabled.', async () => {});

  test.todo('Return a 201 creating a tag without a session ID when mode is permitted.', async () => {});

  test.todo('Return a 201 creating a tag with a valid session but anonymous user where permitted.', async () => {});

  test.todo('Return a 403 creating a tag with a valid session but anonymous user where disallowed.', async () => {});

  test.todo('Return a 201 creating a tag with a logged in user.', async () => {});

  test.todo('Return a 302 creating a tag for a user that already exists.', async () => {});

  test.todo('Return a 202 creating an already existing tag that was created by other users.', async () => {});

  test.todo('Return a 409 attempting to create existing tag for that user.', async () => {});

  test.todo('Return a 404 attempting to create a tag for an object that can not be created.', async () => {});

  test.todo('Return a 201 attempting to create a tag for an object that does not exist.', async () => {});
});
