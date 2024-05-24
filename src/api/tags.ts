import { ObjectId, Tag, UserId } from '../types.js';
import { TagResponse, TagResponseElement } from './apiTypes.js';
import { TagtoolRequest, TagtoolResponse } from '../session.js';

import { NextFunction } from 'express';
import { deleteOwnedTag } from '../database/deleteOwnedTag.js';
import { endWithJsonMessage } from './apiMiddlewareUtils.js';
import { findTagsByObjectId } from '../database/findTagsByObjectId.js';
import { getUserId } from '../auth/user.js';
import { insertTag } from '../database/insertTag.js';
import { validateObjectId } from '../utils/validateObjectId.js';
import { validateTag } from '../utils/validateTag.js';

const checkObjectExists = async (id: ObjectId): Promise<boolean> => {
  return Promise.resolve(id !== undefined);
};

export const addTag = async (request: TagtoolRequest, res: TagtoolResponse, next: NextFunction) => {
  const userId: UserId = getUserId(request);
  const objectId: ObjectId | undefined = request.params.objectId;

  const tag = request.body.tag;
  if (!tag || !validateTag(tag)) {
    res.status(400);
    res.contentType('application/json');
    res.send({
      message: 'Invalid tag',
    });
    res.end();
    return;
  }

  const tags: Tag[] = await findTagsByObjectId(objectId);

  if (tags.length >= 0) {
    await insertTag(userId, objectId, tag);
  }
  next();
};

const tagsToTagResponse = (tags: Tag[], userId: UserId | undefined): TagResponse => {
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
        count: 1,
        isOwner: t.createdByUserId == userId,
        tag: t.tag,
      };
      responseTags.push(tag);
    } else {
      foundTag.count = foundTag.count + 1;
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

export const validateTags = async (
  request: TagtoolRequest,
  res: TagtoolResponse,
  next: NextFunction
): Promise<void> => {
  const objectId: ObjectId | undefined = request.params.objectId;
  if (!objectId) {
    return endWithJsonMessage(res, 400, 'No objectId provided');
  }
  if (!validateObjectId(objectId)) {
    return endWithJsonMessage(res, 400, `Invalid objectId ${objectId}`);
  }
  console.debug('Got valid tags.');
  next();
  return Promise.resolve();
};

export const validateObjectExists = async (
  request: TagtoolRequest,
  res: TagtoolResponse,
  next: NextFunction
): Promise<void> => {
  const objectId: ObjectId | undefined = request.params.objectId;
  const objectExists = await checkObjectExists(objectId);
  if (!objectExists) {
    return endWithJsonMessage(res, 404, 'Object not found', undefined, { objectId });
  }

  console.debug('Object exists.');
  next();
  return Promise.resolve();
};

export const getTags = async (request: TagtoolRequest, res: TagtoolResponse, next: NextFunction): Promise<void> => {
  const userId: UserId | undefined = getUserId(request);

  const objectId: ObjectId | undefined = request.params.objectId;

  try {
    const tags: Tag[] = await findTagsByObjectId(objectId);
    if (tags === undefined) {
      return endWithJsonMessage(res, 404, 'No tag result returned.');
    } else if (tags.length == 0) {
      return endWithJsonMessage(res, 404, 'Empty tag result list returned.');
    } else {
      res.contentType('application/json');
      const response: TagResponse = tagsToTagResponse(tags, userId);
      res.status(200);
      res.send(response);
      next();
      return Promise.resolve();
    }
  } catch (err) {
    console.warn('Error retrieving tags', err);
    return endWithJsonMessage(res, 500, 'Error retrieving tags');
  }
};

export const deleteTags = async (request: TagtoolRequest, res: TagtoolResponse, next: NextFunction) => {
  const userId: UserId = getUserId(request);
  if (userId === undefined) {
    return endWithJsonMessage(res, 401, 'Invalid user');
  }

  if (!Array.isArray(request.body?.tags)) {
    return endWithJsonMessage(res, 400, 'Tags must be specified as an array');
  }

  let hasInValidTag = false;
  request.body.tags.forEach((tag: string) => {
    if (!validateTag(tag)) {
      hasInValidTag = true;
    }
  });

  if (hasInValidTag) {
    return endWithJsonMessage(res, 400, 'Invalid tag');
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
};
