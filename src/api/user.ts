import express, { NextFunction } from 'express';

import { UserId } from '../types.js';
import { getUserId } from '@tjsr/user-session-middleware';

export const getUser = async (request: express.Request, res: express.Response, next: NextFunction) => {
  const userId: UserId | undefined = await getUserId(request);
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
