/* eslint-disable @typescript-eslint/no-explicit-any */

import { ObjectId, Tag, UserId } from '../types.js';
import { TagResponse, TagResponseElement } from './apiTypes.js';
import { TagtoolRequest, TagtoolResponse } from '../types/request.js';
import { endWithJsonMessage, express, getUserIdFromRequest, getUserIdFromSession } from '@tjsr/user-session-middleware';

import assert from 'node:assert';
import { asyncHandlerWrap } from '../utils/asyncHandlerWrap.js';
import { deleteOwnedTag } from '../database/deleteOwnedTag.js';
import { findTagsByObjectId } from '../database/findTagsByObjectId.js';
import { insertTag } from '../database/insertTag.js';
import { validateObjectId } from '../utils/validateObjectId.js';
import { validateTag } from '../utils/validateTag.js';

const checkObjectExists = async (id: ObjectId): Promise<boolean> => {
  // TODO: This is way too simple to be complete - must be something to do here.
  return Promise.resolve(id !== undefined);
};

export const addTag = async (
  request: TagtoolRequest,
  response: TagtoolResponse,
  next: express.NextFunction
): Promise<void> => {
  try {
    const userId: UserId | undefined = await getUserIdFromSession(request.session);
    assert(request.params, 'Request params must be defined');
    assert(request.params.objectId, 'Request params.objectId must be defined');
    assert(userId, 'User ID must be defined');
    const objectId: ObjectId = request.params.objectId;

    assert(request.body, 'Request body must be defined');

    const tag = request.body.tag;
    if (!tag || !validateTag(tag)) {
      return endWithJsonMessage(response, 400, 'Invalid tag', next);
    }

    const tags: Tag[] = await findTagsByObjectId(objectId);

    if (tags.length >= 0) {
      await insertTag(userId, objectId, tag);
    }
    next();
    return Promise.resolve();
  } catch (err) {
    next(err);
    return Promise.reject(err);
  }
};

const tagsToTagResponse = (tags: Tag[], userId: UserId | undefined, reportTagCounts = true): TagResponse => {
  if (tags === undefined || tags.length === 0) {
    throw new Error('Tags must be defined and not empty');
  }
  const objectId: ObjectId = tags[0].objectId;

  if (tags.filter((current: Tag) => current.objectId === undefined).length !== 0) {
    throw new Error('objectId must be defined on each returned tag');
  }
  const responseTags: TagResponseElement[] = [];
  tags.forEach((t) => {
    const foundTag: TagResponseElement | undefined = responseTags.find((ft) => ft.tag === t.tag);
    if (foundTag === undefined) {
      const tag: TagResponseElement = {
        isOwner: t.createdByUserId == userId,
        tag: t.tag,
      } as TagResponseElement;
      if (reportTagCounts) {
        tag.count = 1;
      }
      responseTags.push(tag);
    } else {
      if (reportTagCounts) {
        foundTag.count = (foundTag.count || 0) + 1;
      }
      if (t.createdByUserId == userId) {
        foundTag.isOwner = true;
      }
    }
  });
  const response: TagResponse = {
    objectId,
    tags: responseTags,
  };
  return response;
};

export const validateTagsAsync = async (
  request: express.Request,
  response: express.Response,
  next: express.NextFunction
): Promise<void> => {
  const objectId: ObjectId | undefined = request.params.objectId;
  if (!objectId) {
    return endWithJsonMessage(response, 400, 'No objectId provided', next);
  }
  if (!validateObjectId(objectId)) {
    return endWithJsonMessage(response, 400, `Invalid objectId ${objectId}`, next);
  }
  console.debug(validateTagsAsync, `Got valid tags for objectId ${objectId}`);
  next();
  return Promise.resolve();
};

export const validateTags: express.RequestHandler = asyncHandlerWrap(validateTagsAsync);

export const validateObjectExists =
  // <
  //   TagtoolRequest,
  //   TagtoolResponse,
  //   P extends ParamsDictionary = ParamsDictionary,
  //   ResBody = any,
  //   ReqBody = any,
  //   ReqQuery extends QueryString.ParsedQs = QueryString.ParsedQs
  // >
  async (request: TagtoolRequest, response: TagtoolResponse, next: express.NextFunction): Promise<void> => {
    const objectId: ObjectId | undefined = request.params.objectId;
    const objectExists = await checkObjectExists(objectId);
    if (!objectExists) {
      return endWithJsonMessage(response, 404, 'Object not found', next, { objectId });
    }

    console.debug(validateObjectExists, `Object ${objectId} exists.`);
    next();
    return Promise.resolve();
  };

export const getTags = async (
  request: TagtoolRequest,
  res: TagtoolResponse,
  next: express.NextFunction
): Promise<void> => {
  try {
    const userId: UserId | undefined = await getUserIdFromRequest(request);
    const objectId: ObjectId | undefined = request.params?.objectId;

    const tags: Tag[] = await findTagsByObjectId(objectId);
    if (tags === undefined) {
      return endWithJsonMessage(res, 404, 'No tag result returned.', next);
    } else if (tags.length == 0) {
      return endWithJsonMessage(res, 404, 'Empty tag result list returned.', next);
    } else {
      res.contentType('application/json');
      const response: TagResponse = tagsToTagResponse(tags, userId, request.reportTagCounts);
      res.status(200);
      res.send(response);
      next();
      return Promise.resolve();
    }
  } catch (err) {
    console.warn('Error retrieving tags', err);
    return endWithJsonMessage(res, 500, 'Error retrieving tags', next);
  }
};

export const deleteTags = async (request: TagtoolRequest, res: TagtoolResponse, next: express.NextFunction) => {
  try {
    const userId: UserId | undefined = await getUserIdFromRequest(request);
    if (userId === undefined) {
      return endWithJsonMessage(res, 401, 'Invalid user', next);
    }

    if (!Array.isArray(request.body?.tags)) {
      return endWithJsonMessage(res, 400, 'Tags must be specified as an array', next);
    }

    let hasInValidTag = false;
    request.body.tags.forEach((tag: string) => {
      if (!validateTag(tag)) {
        hasInValidTag = true;
      }
    });

    if (hasInValidTag) {
      return endWithJsonMessage(res, 400, 'Invalid tag', next);
    }

    const objectId: ObjectId | undefined = request.params.objectId;

    const tags: string[] = request.body.tags;
    let tagsDeleted = 0;
    tags.forEach(async (tag) => {
      const deleted = await deleteOwnedTag(userId, objectId, tag);
      tagsDeleted = tagsDeleted + deleted;
    });

    if (tagsDeleted == 0) {
      res.status(404);
      res.end();
    } else {
      res.status(200);
      res.send({
        delted: tagsDeleted,
      });
      next();
    }
  } catch (err) {
    next(err);
  }
};
