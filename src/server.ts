import * as dotenv from 'dotenv-flow';

import { addTag, deleteTags, getTags, validateHasUserId, validateTags } from './api/tags.js';
import { getSession, simpleSessionId } from './session.js';

import { IPAddress } from './types.js';
import { session as apiSession } from './api/session.js';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import { getUser } from './api/user.js';
import { login } from './api/login.js';
import { logout } from './api/logout.js';
import morgan from 'morgan';
import requestIp from 'request-ip';
import session from 'express-session';

dotenv.config();

const morganLog = morgan('common');
// process.env.PRODUCTION =='true' ? 'common' : 'dev'

const corsOptions = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Expose-Headers': '*',
  'optionsSuccessStatus': 200,
  'origin': '*',
};

export const getIp = (req: express.Request): IPAddress => {
  try {
    if (req.headers.forwarded) {
      const forwardedForHeader: string|undefined = req.headers.forwarded
        .split(';')
        .find((header) => header.startsWith('for='));
      const forParts: string[]|undefined = forwardedForHeader?.split('=');
      if (forParts !== undefined && forParts.length == 2) {
        return forParts[1];
      }
    }
  } catch (err) {
    console.warn('Got part of forwarded header, but couldn\'t parse it.');
  }
  return (req as any).clientIp;
};

export const startApp = (sessionStore?: session.MemoryStore): express.Express => {
  const app: express.Express = express();
  if (process.env['USE_LOGGING'] !== 'false') {
    app.use(morganLog);
  }
  app.use(cors(corsOptions));
  app.use(requestIp.mw());
  app.set('trust proxy', true);

  app.use(function (req, res, next) {
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

  app.use((req, res, next) => {
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
