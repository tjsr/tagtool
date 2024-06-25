import { SessionHandlerError, validateHasUserId } from '@tjsr/user-session-middleware';
import { addTag, deleteTags, getTags, validateObjectExists, validateTags } from './api/tags.js';

import { ExpressServerHelper } from './utils/expressHelper.js';
import { TagtoolConfig } from './types.js';
import { TagtoolRequest } from './types/request.js';
import { asyncHandlerWrap } from './utils/asyncHandlerWrap.js';
import express from 'express';
import { getUser } from './api/user.js';
import { loadEnv } from '@tjsr/simple-env-utils';

export const DEFAULT_HTTP_PORT = 8242;

loadEnv();

export const startApp = (config: Partial<TagtoolConfig>): express.Express => {
  const expressHelper = new ExpressServerHelper(config);

  const app: express.Express = expressHelper.init().app();

  app.get(
    '/tags/:objectId',
    validateHasUserId,
    validateTags,
    asyncHandlerWrap(validateObjectExists),
    asyncHandlerWrap(getTags)
  );
  app.post('/tags/:objectId', validateHasUserId, validateTags, asyncHandlerWrap(addTag));
  app.delete(
    '/tags/:objectId',
    validateHasUserId,
    validateTags,
    asyncHandlerWrap(validateObjectExists),
    asyncHandlerWrap(deleteTags)
  );
  app.get('/user', getUser);
  app.get('/user/:userId', getUser);

  app.get('/', (_request, response: express.Response) => {
    response.send({});
    response.end();
  });

  app.use(
    (
      error: Error | SessionHandlerError,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      request: express.Request,
      response: express.Response,
      next: express.NextFunction
    ): void => {
      const tagReq: TagtoolRequest = request as TagtoolRequest;
      tagReq.reportTagCounts = true;
      response.locals.reportTagCounts = true;
      if (SessionHandlerError.isType(error)) {
        const sessionError: SessionHandlerError = error as SessionHandlerError;
        console.error('errorHandler', request.statusCode, sessionError.status, sessionError, sessionError.stack);
        response.status(sessionError.status);
        response.json({ message: sessionError.message });
      } else if (response.statusCode <= 200) {
        console.error(
          'errorHandler',
          request.statusCode,
          error,
          error.stack,
          'No status code set on response, setting to 500.'
        );
        response.status(500);
      } else {
        console.error(error, error.stack);
      }

      next(error);
    }
  );

  app.use(express.static('build'));

  return app;
};
