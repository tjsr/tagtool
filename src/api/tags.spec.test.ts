import { ObjectId, UserId } from '../types.js';
import { TaskContext, afterAll, beforeAll, beforeEach, describe, expect, test } from 'vitest';
import { closeConnectionPool, verifyDatabaseReady } from '@tjsr/mysql-pool-utils';
import { createTestObjectId, createTestSessionId, createTestUserId } from '../testUtils.js';

import { SESSION_ID_HEADER } from './apiUtils.js';
import { SystemSessionDataType } from '@tjsr/user-session-middleware';
import { TagResponse } from './apiTypes.js';
import { connectionDetails } from '../setup-tests.js';
import { createRandomId } from '../../../user-session-middleware/src/utils/createRandomId.js';
import { createRandomUserId } from '../../../user-session-middleware/src/auth/user.js';
import { elideValues } from '../utils/elideValues.js';
import express from 'express';
import { insertTag } from '../database/insertTag.js';
import { randomUUID } from 'crypto';
import session from 'express-session';
import { startApp } from '../server.js';
import supertest from 'supertest';

type TagTestContext = TaskContext & {
  app: express.Express;
  generatedObjectId: ObjectId;
  generatedTag: string;
  generatedUid: UserId;
  memoryStore: session.MemoryStore;
};

describe('GET /tags', () => {
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

  beforeEach(async (context: TagTestContext) => {
    context.generatedUid = createRandomUserId();
    context.generatedObjectId = createRandomId(randomUUID());
    context.generatedTag = 'some-tag-' + createRandomId(randomUUID()).substring(0, 7);
    context.memoryStore = new session.MemoryStore();

    await insertTag(context.generatedUid, context.generatedObjectId, context.generatedTag);

    const testSessionId = 's1234';
    context.memoryStore.set(testSessionId, {
      cookie: new session.Cookie(),
    });
    context.app = startApp({ sessionStore: context.memoryStore });
    return Promise.resolve();
  });

  afterAll(() => {
    return closeConnectionPool();
  });

  test<TagTestContext>('Should return a 200 when retrieving a tag list for a valid object via callback.', async ({
    app,
    generatedObjectId,
  }) => {
    return new Promise<void>((resolve, reject) => {
      supertest(app)
        .get(`/tags/${generatedObjectId}`)
        .expect(200, (err, response) => {
          try {
            expect(err).toBeNull();
            expect(response.body.message).not.toBe(`Invalid objectId ${generatedObjectId}`);
          } catch (e) {
            reject(e);
          }
          resolve();
        });
    });
  });

  test<TagTestContext>('Should return a 200 retrieving a tag list for a valid object via async method.', async ({
    app,
    generatedObjectId,
  }) => {
    const response = await supertest(app).get(`/tags/${generatedObjectId}`);

    expect(response.body.message).not.toBe(`Invalid objectId ${generatedObjectId}`);
    expect(response.status).toBe(200);
    return Promise.resolve();
  });

  test<TagTestContext>('Should reject a made-up SessionID that we dont know about', async ({
    app,
    generatedObjectId,
    task,
  }) => {
    const testSessionId = createTestSessionId(task.name);
    const response = await supertest(app)
      .get(`/tags/${generatedObjectId}`)
      .set(SESSION_ID_HEADER, testSessionId)
      .set('Content-Type', 'application/json');

    expect(response.status).toBe(401);
    expect(response.body.data).toBeUndefined();
    return Promise.resolve();
  });

  test<TagTestContext>('Should return a 200 if there is no authenticated user for the session.', async ({
    app,
    memoryStore,
    task,
  }) => {
    const testSessionId = createTestSessionId(task.name);
    const testObjectId: ObjectId = createTestObjectId(task.name);
    const ownerUser: UserId = createTestUserId(task.name);
    memoryStore.set(testSessionId, {
      cookie: new session.Cookie(),
    });

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

  test<TagTestContext>('Should return a 200 and a count of each tag where permitted', async ({
    app,
    memoryStore,
    task,
  }) => {
    const testSessionId = createTestSessionId(task.name);
    const testObjectId: ObjectId = createTestObjectId(task.name);

    const promises: Promise<void>[] = [];
    const testOwners: UserId[] = [1, 2, 3, 4].map((i) => createTestUserId(task.name + '-' + i));
    testOwners.forEach(async (ownerUser: UserId, index: number) => {
      if (index < 1) {
        console.log(`Added ${index + 1} as some-tag-1`);
        promises.push(insertTag(ownerUser, testObjectId, 'some-tag-1'));
      }
      if (index < 2) {
        console.log(`Added ${index + 1} as some-tag-2`);
        promises.push(insertTag(ownerUser, testObjectId, 'some-tag-2'));
      }
      if (index < 3) {
        console.log(`Added ${index + 1} as some-tag-3`);
        promises.push(insertTag(ownerUser, testObjectId, 'some-tag-3'));
      }
      if (index < 4) {
        console.log(`Added ${index + 1} as some-tag-4`);
        promises.push(insertTag(ownerUser, testObjectId, 'some-tag-4'));
      }
    });
    await Promise.all(promises);

    memoryStore.set(testSessionId, {
      cookie: new session.Cookie(),
      userId: testOwners[0],
    } as SystemSessionDataType);

    const response = await supertest(app)
      .get(`/tags/${testObjectId}`)
      .set(SESSION_ID_HEADER, testSessionId)
      .set('Content-Type', 'application/json');

    expect(response.statusCode).toBe(200);

    const tagCollectionBody: TagResponse = response.body;
    tagCollectionBody.tags.forEach((tag) => {
      expect(tag.tag, `Comparing some-tag-${tag.count} with ${tag.tag}`).toEqual('some-tag-' + tag.count);
    });
    return Promise.resolve();
  });

  test.todo<TagTestContext>(
    'Should return a 200 but no item counts where limited read permitted',
    async ({ memoryStore, task }) => {
      const app = startApp({
        enableTagCount: false,
        sessionStore: memoryStore,
      });

      const testSessionId = createTestSessionId(task.name);
      const testObjectId: ObjectId = createTestObjectId(task.name);

      const promises: Promise<void>[] = [];
      const testOwners: UserId[] = [1, 2, 3, 4].map((i) => createTestUserId(task.name + '-' + i));
      testOwners.forEach(async (ownerUser: UserId, index: number) => {
        if (index < 1) {
          console.log(`Added ${index + 1} as some-tag-1`);
          promises.push(insertTag(ownerUser, testObjectId, 'some-tag-1'));
        }
        if (index < 2) {
          console.log(`Added ${index + 1} as some-tag-2`);
          promises.push(insertTag(ownerUser, testObjectId, 'some-tag-2'));
        }
        if (index < 3) {
          console.log(`Added ${index + 1} as some-tag-3`);
          promises.push(insertTag(ownerUser, testObjectId, 'some-tag-3'));
        }
        if (index < 4) {
          console.log(`Added ${index + 1} as some-tag-4`);
          promises.push(insertTag(ownerUser, testObjectId, 'some-tag-4'));
        }
      });
      await Promise.all(promises);

      memoryStore.set(testSessionId, {
        cookie: new session.Cookie(),
        userId: testOwners[0],
      } as SystemSessionDataType);

      const response = await supertest(app)
        .get(`/tags/${testObjectId}`)
        .set(SESSION_ID_HEADER, testSessionId)
        .set('Content-Type', 'application/json');

      expect(response.statusCode).toBe(200);

      const tagCollectionBody: TagResponse = response.body;
      tagCollectionBody.tags.forEach((tag) => {
        expect(tag.count).toBeUndefined();
      });
      return Promise.resolve();
    }
  );
});

describe('POST.withNoSessionId /tags/:objectId', () => {
  test.todo<TagTestContext>(
    'Return a 401 creating a tag without a session ID when mode is enabled.',
    async (_context: TagTestContext) => {}
  );

  test.todo<TagTestContext>(
    'Return a 201 creating a tag without a session ID when mode is permitted.',
    async (_context: TagTestContext) => {}
  );
});

describe('POST.withAnonymousUser /tags/:objectId', () => {
  test.todo<TagTestContext>(
    'Return a 201 creating a tag with a valid session but anonymous user where permitted.',
    async () => {}
  );

  test.todo<TagTestContext>(
    'Return a 401 creating a tag with a valid session but anonymous user where not permitted.',
    async () => {}
  );
});

describe('POST.withRegisteredUser /tags/:objectId', () => {
  test.todo<TagTestContext>(
    'Return a 201 creating a tag with a valid session but known user where permitted.',
    async (_context: TagTestContext) => {}
  );

  test.todo<TagTestContext>(
    'Return a 403 creating a tag with a valid session but known user where disallowed.',
    async (_context: TagTestContext) => {}
  );

  test.todo<TagTestContext>(
    'Return a 201 creating a tag with a logged in user.',
    async (_context: TagTestContext) => {}
  );

  test.todo<TagTestContext>(
    'Return a 302 creating a tag for a user that already exists.',
    async (_context: TagTestContext) => {}
  );

  test.todo<TagTestContext>(
    'Return a 202 creating an already existing tag that was created by other users.',
    async (_context: TagTestContext) => {}
  );

  test.todo<TagTestContext>(
    'Return a 409 attempting to create existing tag for that user.',
    async (_context: TagTestContext) => {}
  );

  test.todo<TagTestContext>(
    'Return a 404 attempting to create a tag for an object that can not be created.',
    async (_context: TagTestContext) => {}
  );

  test.todo<TagTestContext>(
    'Return a 201 attempting to create a tag for an object that does not exist.',
    async (_context: TagTestContext) => {}
  );
});
