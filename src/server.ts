import { TagtoolRequest, TagtoolResponse } from './session.js';
import { addTag, deleteTags, getTags, validateObjectExists, validateTags } from './api/tags.js';
import express, { NextFunction } from 'express';
import {
  handleSessionWithNewlyGeneratedId,
  requiresSessionId,
  retrieveSessionData,
  sessionHandlerMiddleware,
} from '@tjsr/user-session-middleware';

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
    // TODO: express-sessio no longer needs cookie parser, so if the app isn't using cookies, eg we're
    // going to store all user data in a session, we don't need to use cookie-parser.
    app.use(cookieParser());
  }
  app.use(sessionHandlerMiddleware(sessionStore));
  app.use(requiresSessionId, handleSessionWithNewlyGeneratedId, retrieveSessionData);

  // initialisePassportToExpressApp(app);

  app.use(
    express.urlencoded({
      extended: true,
    })
  );
  app.use(express.json());

  app.use((req: TagtoolRequest, res: TagtoolResponse, next: NextFunction) => {
    res.set('Set-Cookie', `sessionId=${req.session.id}`);
    next();
  });

  app.get('/session', apiSession);
  app.post('/login', login);
  app.get('/logout', logout);
  app.get('/tags/:objectId', validateHasUserId, validateTags, validateObjectExists, getTags);
  app.post('/tags/:objectId', validateHasUserId, validateTags, addTag);
  app.delete('/tags/:objectId', validateHasUserId, validateTags, validateObjectExists, deleteTags);
  app.get('/user', getUser);
  app.get('/user/:userId', getUser);

  app.use((err: Error, req: TagtoolRequest, res: TagtoolResponse, next: NextFunction) => {
    console.error(err.stack);
    if (res.statusCode < 200) {
      res.status(500);
    }
    next();
  });

  app.use(express.static('build'));

  return app;
};
