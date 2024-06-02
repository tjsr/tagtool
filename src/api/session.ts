import { TagtoolRequest } from '../session.js';
import express from 'express';

export const session = (request: TagtoolRequest, response: express.Response, next: express.NextFunction) => {
  console.debug(session, 'Retrieving session id:', request.sessionID, request.session.id);
  request.session.save();
  response.status(200);
  response.send({
    sessionId: request.sessionID,
  });
  next();
};
