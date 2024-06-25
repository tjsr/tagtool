import { SessionHandlerError, useUserSessionMiddleware, validateHasUserId } from '@tjsr/user-session-middleware';
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

// process.env.PRODUCTION =='true' ? 'common' : 'dev'

export const startApp = (config: Partial<TagtoolConfig>): express.Express => {
  const expressHelper = new ExpressServerHelper(config);

  const app: express.Express = expressHelper.init().app();

  useUserSessionMiddleware(app, config.sessionOptions);

  // initialisePassportToExpressApp(app);

  app.use(
    express.urlencoded({
      extended: true,
    })
  );
  app.use(express.json());

  // const _validateHasUserIdFunc: RequestHandler & UserSessionMiddlewareRequestHandler = validateHasUserId;
  // const _getUserFunc: RequestHandler & UserSessionMiddlewareRequestHandler = getUser;

  // TODO: Add session endpoint block in USM.
  // app.use(userSessionEndpoints);

  // TODO: Migrate /session endpoint to USM.
  // app.get('/session', apiSession);

  // TODO: Migrate /login endpoint to USM.
  // app.post('/login', login);

  // TODO: Migrate /logout endpoint to USM.
  // app.get('/logout', logout);
  // TODO: Migrate /logout endpoint to USM.
  // app.post('/logout', logout);
  app.get(
    '/tags/:objectId',
    validateHasUserId as express.RequestHandler,
    validateTags,
    asyncHandlerWrap(validateObjectExists) as express.RequestHandler,
    asyncHandlerWrap(getTags) as express.RequestHandler
  );
  app.post(
    '/tags/:objectId',
    validateHasUserId as express.RequestHandler,
    validateTags,
    asyncHandlerWrap(addTag) as express.RequestHandler
  );
  app.delete(
    '/tags/:objectId',
    validateHasUserId as express.RequestHandler,
    validateTags,
    asyncHandlerWrap(validateObjectExists) as express.RequestHandler,
    asyncHandlerWrap(deleteTags) as express.RequestHandler
  );
  app.get('/user', getUser as express.RequestHandler);
  app.get('/user/:userId', getUser as express.RequestHandler);

  app.get('/', (_request, response: express.Response) => {
    response.send({});
    response.end();
  });

  // type TestTagtoolRequest =
  //   | SystemHttpRequestType<TagtoolSessionDataType>
  //   | (SystemHttpRequestType<TagtoolSessionDataType> & {
  //       reportTagCounts: boolean;
  //     })
  //   | {
  //       reportTagCounts: boolean;
  //     };

  // type TestTagtoolRequest2 = SystemHttpRequestType<TagtoolSessionDataType> & {
  //   reportTagCounts: boolean;
  // };

  // type TestTagtoolRequest3 =
  //   | SystemHttpRequestType<TagtoolSessionDataType>
  //   | {
  //       reportTagCounts: boolean;
  //     };

  // type TestTagtoolRequest4 = SystemHttpRequestType<TagtoolSessionDataType> &
  //   (SystemHttpRequestType<TagtoolSessionDataType> & {
  //     reportTagCounts: boolean;
  //   });

  // type TestTagtoolRequest5 = SystemHttpRequestType<TagtoolSessionDataType> &
  //   Partial<{
  //     reportTagCounts: boolean;
  //   }>;

  app.use(
    (
      error: Error | SessionHandlerError,
      // request: TagtoolRequest,
      // request: TagtoolRequest,
      // request: Request, // SystemHttpRequestType<TagtoolSessionDataType>,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      request: any,
      // : TagtoolRequest<ParamsDictionary, any, any, ParsedQs>, // SystemHttpRequestType<TagtoolSessionDataType>,
      // request: SystemHttpRequestType<UserSessionData>,
      // request: SystemHttpRequestType<TagtoolSessionDataType>,
      // _response: SystemHttpResponseType<SessionStoreDataType>,
      // _response: SystemHttpResponseType<TagtoolSessionStoreDataType>,
      response: express.Response,
      // _response: TagtoolResponse,
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
      // res.send();
      // res.end();

      next(error);
    }
  );

  app.use(express.static('build'));

  return app;
};
