import { addTag, deleteTags, getTags, validateHasUserId, validateTags } from './api/tags.js';
import { getSession, simpleSessionId } from '@tjsr/user-session-middleware';

import { IPAddress } from './types.js';
import { TagtoolRequest } from './session.js';
import { session as apiSession } from './api/session.js';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import { getUser } from './api/user.js';
import { loadEnv } from '@tjsr/simple-env-utils';
import { login } from './api/login.js';
import { logout } from './api/logout.js';
import morgan from 'morgan';
import requestIp from 'request-ip';
import session from 'express-session';

export const DEFAULT_HTTP_PORT = 8242;

loadEnv();

const morganLog = morgan('common');
// process.env.PRODUCTION =='true' ? 'common' : 'dev'

const corsOptions = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Expose-Headers': '*',
  optionsSuccessStatus: 200,
  origin: '*',
};

export const getIp = (req: express.Request): IPAddress | undefined => {
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

  app.use((req: TagtoolRequest, res: express.Response, next) => {
    res.header('Access-Control-Expose-Headers', '*');
    next();
  });

  app.use(cookieParser());
  app.use(getSession(sessionStore));
  app.use(simpleSessionId);

  // initialisePassportToExpressApp(app);

  app.use(
    express.urlencoded({
      extended: true,
    })
  );
  app.use(express.json());

  app.use((req: TagtoolRequest, res, next) => {
    res.set('Set-Cookie', `sessionId=${req.session.id}`);
    next();
  });

  app.get('/session', apiSession);
  app.post('/login', login);
  app.get('/logout', logout);
  app.get('/tags/:objectId', validateHasUserId, validateTags, getTags);
  app.post('/tags/:objectId', validateHasUserId, validateTags, addTag);
  app.delete('/tags/:objectId', validateHasUserId, validateTags, deleteTags);
  app.get('/user', getUser);
  app.get('/user/:userId', getUser);

  app.use(express.static('build'));

  return app;
};
