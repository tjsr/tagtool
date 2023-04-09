import { ObjectId, Tag, UserId } from '../types';
import { TagResponse, TagResponseElement } from './apiTypes';
import express, { NextFunction } from 'express';

import { TagtoolRequest } from '../session';
import { deleteOwnedTag } from '../database/deleteOwnedTag';
import { findTagsByObjectId } from '../database/findTagsByObjectId';
import { getUserId } from '../auth/user';
import { insertTag } from '../database/insertTag';
import { validateObjectId } from '../utils/validateObjectId';
import { validateTag } from '../utils/validateTag';

const checkObjectExists = async (id: ObjectId): Promise<boolean> => {
  return Promise.resolve(id !== undefined);
};

export const addTag = async (request: TagtoolRequest, res: express.Response, next: NextFunction) => {
  const userId: UserId = getUserId(request);
  if (userId === undefined) {
    res.status(401);
    res.contentType('application/json');
    res.send({
      message: 'Invalid user',
    });
    res.end();
    return;
  }

  const objectId: ObjectId|undefined = request.params.objectId;
  if (!objectId || !validateObjectId(objectId)) {
    res.status(400);
    res.contentType('application/json');
    res.send({
      message: 'Invalid objectId',
    });
    res.end();
    return;
  }

  const objectExists = await checkObjectExists(objectId);
  if (!objectExists) {
    res.status(404);
    res.contentType('application/json');
    res.send({
      message: 'Invalid object',
      objectId: objectId,
    });
    res.end();
    return;
  }

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

const tagsToTagResponse = (tags: Tag[], userId: UserId|undefined): TagResponse => {
  const objectId: ObjectId = tags[0].objectId;
  const responseTags: TagResponseElement[] = [];
  tags.forEach((t) => {
    const foundTag:TagResponseElement|undefined = responseTags.find((ft) => ft.tag === t.tag);
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

export const getTags = async (request: TagtoolRequest, res: express.Response, next: NextFunction) => {
  res.contentType('application/json');
  let userId: UserId|undefined = undefined;
  try {
    userId = getUserId(request);
  } catch (error) {
    console.debug(`Got an exception when getting userId data`, error);
  }
  const objectId: ObjectId|undefined = request.params.objectId;
  if (!objectId || !validateObjectId(objectId)) {
    res.status(400);
    res.send({
      message: 'Invalid objectId',
    });
    res.end();
    return;
  }

  const tags: Tag[] = await findTagsByObjectId(objectId);

  const response: TagResponse = tagsToTagResponse(tags, userId);
  res.status(200);
  res.send(response);
  next();
};

export const deleteTags = async (request: TagtoolRequest, res: express.Response, next: NextFunction) => {
  const userId: UserId = getUserId(request);
  if (userId === undefined) {
    res.status(401);
    res.contentType('application/json');
    res.send({
      message: 'Invalid user',
    });
    res.end();
    return;
  }
  const objectId: ObjectId|undefined = request.params?.objectId;
  if (!objectId || !validateObjectId(objectId)) {
    res.status(400);
    res.send({
      message: 'Invalid objectId',
    });
    next();
    return;
  }

  if (!Array.isArray(request.body?.tags)) {
    res.status(400);
    res.send({
      message: 'Tags must be specified as an array',
    });
    next();
    return;
  }

  let hasInValidTag = false;
  request.body.tags.forEach((tag: string) => {
    if (!validateTag(tag)) {
      hasInValidTag = true;
    }
  });

  if (hasInValidTag) {
    res.status(400);
    res.contentType('application/json');
    res.send({
      message: 'Invalid tag',
    });
    res.end();
    return;
  }

  const tags: string[] = request.body.tags;
  let tagsDeleted = 0;
  tags.forEach(async (tag) => {
    const deleted = await deleteOwnedTag(userId, objectId, tag);
    tagsDeleted = tagsDeleted + deleted;
  });

  if (tagsDeleted == 0) {
    res.status(404);
  } else {
    res.status(200);
  }

  res.send({
    delted: tagsDeleted,
  });
};
