import { SessionHandlerError, userSessionMiddleware } from '@tjsr/user-session-middleware';
import { addTag, deleteTags, getTags, validateObjectExists, validateTags } from './api/tags.js';
import express, { NextFunction } from 'express';
import { isProductionMode, loadEnv } from '@tjsr/simple-env-utils';

import { TagtoolConfig } from './types.js';
import { TagtoolRequest } from './session.js';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { getUser } from './api/user.js';
import morgan from 'morgan';
import requestIp from 'request-ip';
import session from 'express-session';
import { validateHasUserId } from './api/apiMiddlewareUtils.js';

export const DEFAULT_HTTP_PORT = 8242;
const enableCookies = true;

loadEnv();

const morganLog = morgan('common');
// process.env.PRODUCTION =='true' ? 'common' : 'dev'

const corsOptions = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Expose-Headers': '*',
  optionsSuccessStatus: 200,
  origin: '*',
};

export const startApp = (config: TagtoolConfig): express.Express => {
  if (config === undefined) {
    throw new Error('No configuration provided to startApp.');
  }
  if (config.sessionStore === undefined && isProductionMode()) {
    throw new Error('MemoryStore is not permitted for use in production mode.');
  } else if (config.sessionStore === undefined) {
    config.sessionStore = new session.MemoryStore();
  }

  const app: express.Express = express();
  if (process.env['USE_LOGGING'] !== 'false') {
    app.use(morganLog);
  }
  app.use(cors(corsOptions));
  app.use(requestIp.mw());
  app.set('trust proxy', true);

  app.use((_request: express.Request, response: express.Response, next: NextFunction) => {
    response.header('Access-Control-Expose-Headers', '*');
    next();
  });

  if (enableCookies) {
    // TODO: express-session no longer needs cookie parser, so if the app isn't using cookies, eg we're
    // going to store all user data in a session, we don't need to use cookie-parser.
    app.use(cookieParser());
  }
  app.use(
    userSessionMiddleware({
      skipExposeHeaders: false,
      store: config.sessionStore,
    })
  );

  // initialisePassportToExpressApp(app);

  app.use(
    express.urlencoded({
      extended: true,
    })
  );
  app.use(express.json());

  app.use(userSessionEndpoints);
  // app.get('/session', apiSession);
  // app.post('/login', login);
  // app.get('/logout', logout);
  // app.post('/logout', logout);
  app.get('/tags/:objectId', validateHasUserId, validateTags, validateObjectExists, getTags);
  app.post('/tags/:objectId', validateHasUserId, validateTags, addTag);
  app.delete('/tags/:objectId', validateHasUserId, validateTags, validateObjectExists, deleteTags);
  app.get('/user', getUser);
  app.get('/user/:userId', getUser);

  app.get('/', (_request: express.Request, response: express.Response) => {
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
      error: Error,
      // request: TagtoolRequest,
      request: TagtoolRequest,
      // request: Request, // SystemHttpRequestType<TagtoolSessionDataType>,
      // request: express.Request, // SystemHttpRequestType<TagtoolSessionDataType>,
      // request: SystemHttpRequestType<SystemSessionDataType>,
      // request: SystemHttpRequestType<TagtoolSessionDataType>,
      // _response: SystemHttpResponseType<SessionStoreDataType>,
      // _response: SystemHttpResponseType<TagtoolSessionStoreDataType>,
      response: express.Response,
      // _response: TagtoolResponse,
      next: express.NextFunction
    ): void => {
      request.reportTagCounts = true;
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
