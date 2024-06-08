import { SystemHttpRequestType, SystemSessionDataType } from '@tjsr/user-session-middleware';
import express, { NextFunction } from 'express';

import { UserId } from '../types.js';
import { getUserId } from '../../../user-session-middleware/src/auth/user.js';

export const endWithJsonMessage = async <ResponseType extends express.Response>(
  res: ResponseType,
  status: number,
  message: string,
  next?: NextFunction,
  additionalMessageFields: object = {}
): Promise<void> => {
  res.status(status);
  res.contentType('application/json');
  const outputBody = {
    ...additionalMessageFields,
    message,
  } as object;
  res.send(outputBody);
  const error = new Error(`${status}/${message}`);
  return new Promise((resolve) => {
    if (next) {
      next(error);
    } else {
      res.end();
    }
    return resolve();
  });
};

export const validateHasUserId = async <
  DataType extends SystemSessionDataType,
  RequestType extends SystemHttpRequestType<DataType>,
  ResponseType extends express.Response,
>(
  request: RequestType,
  res: ResponseType,
  next: NextFunction
): Promise<void> => {
  let userId: UserId | undefined = undefined;
  try {
    userId = getUserId(request);
  } catch (error) {
    console.warn('Got an exception when getting userId data', error);
    return endWithJsonMessage(res, 500, 'Invalid user', next);
  }
  if (userId === undefined) {
    return endWithJsonMessage(res, 401, 'Invalid user');
  }
  console.debug(validateHasUserId, 'Got valid userId', userId);
  next();
  return;
};
