import { TagtoolRequest } from '../session.js';
import express from 'express';

export const session = (request: TagtoolRequest, response: express.Response) => {
  console.log('Retrieving session id:', request.session.id);
  request.session.save();
  response.status(200);
  response.send({
    sessionId: request.session.id,
  });
  response.end();
};
