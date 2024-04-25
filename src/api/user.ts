import express, { NextFunction } from 'express';

import { TagtoolRequest } from '../session.js';
import { UserId } from '../types.js';
import { getUserId } from '../auth/user.js';

export const getUser = async (request: TagtoolRequest, res: express.Response, next: NextFunction) => {
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

  res.status(200);
  res.send({
    userId: userId,
  });
  next();
};
