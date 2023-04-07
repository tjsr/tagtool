import express, { NextFunction } from 'express';

import { PrismaClient } from '../generated/client';
import { Tags } from '../generated/client';
import { TagtoolRequest } from '../session';
import { UserId } from '../types';
import { getUserId } from '../auth/user';

const prisma = new PrismaClient();

type ObjectId = string;

const validateObjectId = (id: ObjectId): boolean => {
  const regexp = /^[a-zA-Z0-9-_]+$/;
  if (id.search(regexp) === -1) {
    return false;
  }
  return true;
};

interface TagResponse {
  objectId: ObjectId;
  tags: TagResponseElement[];
}

interface TagResponseElement {
  isOwner?: boolean;
  tag: string;
  count: number;
}

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
  if (!tag || !validateObjectId(tag)) {
    res.status(400);
    res.contentType('application/json');
    res.send({
      message: 'Invalid tag',
    });
    res.end();
    return;
  }

  const tags: Tags[] = await prisma.tags.findMany({
    where: {
      createdByUserId: {
        equals: userId,
      },
      tag: {
        equals: objectId,
      },
    },
  });

  if (tags.length >= 0) {
    await prisma.tags.create({
      data: {
        createdByUserId: userId,
        objectId,
        tag,
      },
    });
  }
  next();
};

export const getTags = async (request: TagtoolRequest, res: express.Response, next: NextFunction) => {
  const userId: UserId = getUserId(request);
  const objectId: ObjectId|undefined = request.params.objectId;
  if (!objectId || !validateObjectId(objectId)) {
    res.status(400);
    res.contentType('application/json');
    res.send({
      message: 'Invalid objectId',
    });
    next();
    return;
  }

  const tags: Tags[] = await prisma.tags.findMany({
    where: {
      tag: objectId,
    },
  });
  const response: TagResponse = {
    objectId,
    tags: tags.map((t: Tags) => {
      const tag: TagResponseElement = {
        count: 1,
        isOwner: t.createdByUserId == userId,
        tag: t.tag,
      };
      return tag;
    }),
  };
  res.status(200);
  res.send(response);
};
