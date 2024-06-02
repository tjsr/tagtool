import { SessionHandlerError, sessionHandlerMiddleware, userSessionMiddleware } from '@tjsr/user-session-middleware';
import { TagtoolRequest, TagtoolResponse } from './session.js';
import { addTag, deleteTags, getTags, validateObjectExists, validateTags } from './api/tags.js';
import express, { NextFunction } from 'express';

import { IPAddress } from './types.js';
import { session as apiSession } from './api/session.js';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { getUser } from './api/user.js';
import { loadEnv } from '@tjsr/simple-env-utils';
import { login } from './api/login.js';
import { logout } from './api/logout.js';
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

export const getIp = (req: TagtoolRequest): IPAddress | undefined => {
  try {
    if (req.headers.forwarded) {
      const forwardedForHeader: string | undefined = req.headers.forwarded
        .split(';')
        .find((header: string) => header?.startsWith('for='));
      const forParts: string[] | undefined = forwardedForHeader?.split('=');
      if (forParts !== undefined && forParts.length == 2) {
        return forParts[1];
      }
    }
  } catch (err) {
    console.warn("Got part of forwarded header, but couldn't parse it.");
  }
  return (req as express.Request).clientIp;
};

export const startApp = (sessionStore?: session.MemoryStore): express.Express => {
  const app: express.Express = express();
  if (process.env['USE_LOGGING'] !== 'false') {
    app.use(morganLog);
  }
  app.use(cors(corsOptions));
  app.use(requestIp.mw());
  app.set('trust proxy', true);

  app.use((req: TagtoolRequest, res: TagtoolResponse, next: NextFunction) => {
    res.header('Access-Control-Expose-Headers', '*');
    next();
  });

  if (enableCookies) {
    // TODO: express-session no longer needs cookie parser, so if the app isn't using cookies, eg we're
    // going to store all user data in a session, we don't need to use cookie-parser.
    app.use(cookieParser());
  }
  app.use(sessionHandlerMiddleware(sessionStore));
  // app.use(requiresSessionId, handleSessionWithNewlyGeneratedId, retrieveSessionData, setSessionCookie);
  app.use(userSessionMiddleware);

  // initialisePassportToExpressApp(app);

  app.use(
    express.urlencoded({
      extended: true,
    })
  );
  app.use(express.json());

  app.get('/session', apiSession);
  app.post('/login', login);
  app.get('/logout', logout);
  app.get('/tags/:objectId', validateHasUserId, validateTags, validateObjectExists, getTags);
  app.post('/tags/:objectId', validateHasUserId, validateTags, addTag);
  app.delete('/tags/:objectId', validateHasUserId, validateTags, validateObjectExists, deleteTags);
  app.get('/user', getUser);
  app.get('/user/:userId', getUser);

  app.get('/', (req: TagtoolRequest, res: TagtoolResponse) => {
    res.send({});
    res.end();
  });

  app.use((err: Error, req: TagtoolRequest, res: TagtoolResponse, next: NextFunction): void => {
    if (SessionHandlerError.isType(err)) {
      const sessionError: SessionHandlerError = err as SessionHandlerError;
      console.error('errorHandler', res.statusCode, sessionError.status, sessionError, sessionError.stack);
      res.status(sessionError.status);
      res.json({ message: sessionError.message });
    } else if (res.statusCode <= 200) {
      console.error('errorHandler', res.statusCode, err, err.stack, 'No status code set on response, setting to 500.');
      res.status(500);
    } else {
      console.error(err, err.stack);
    }
    // res.send();
    // res.end();

    next(err);
  });

  app.use(express.static('build'));

  return app;
};
