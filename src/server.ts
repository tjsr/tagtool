import * as dotenv from 'dotenv';

import { addTag, deleteTags, getTags } from './api/tags';
import { getSession, simpleSessionId, useSessionId } from './session';

import { IPAddress } from './types';
import { session as apiSession } from './api/session';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import { getUser } from './api/user';
import { login } from './api/login';
import { logout } from './api/logout';
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
  app.use(morganLog);
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
  app.get('/tags/:objectId', getTags);
  app.post('/tags/:objectId', addTag);
  app.delete('/tags/:objectId', deleteTags);
  app.get('/user', getUser);

  app.use(express.static('build'));

  return app;
};
