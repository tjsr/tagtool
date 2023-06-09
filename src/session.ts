import * as Express from 'express';
import * as dotenv from 'dotenv';
import * as expressSession from 'express-session';

import { EmailAddress, UserId, uuid4, uuid5 } from './types';
import session, { Session, SessionData } from 'express-session';

import { IncomingHttpHeaders } from 'http';
import { createRandomUserId } from './auth/user';
import express from 'express';
import { getConnectionPool } from './database/mysqlConnections';
import mySQLStore from 'express-mysql-session';
import { v4 as uuidv4 } from 'uuid';

// const SESSION_ID_NAMESPACE = '0fac0952-9b54-43a9-be74-8d60533aa667';

export interface TagtoolSessionData extends SessionData {
  userId: UserId;
  email: EmailAddress;
}

export interface TagtoolRequest extends Express.Request {
  session: Session & Partial<TagtoolSessionData>;
}

dotenv.config();
const IN_PROD = process.env.NODE_ENV === 'production';
const TWO_HOURS = 1000 * 60 * 60 * 2;
const TWENTYFOUR_HOURS = 1000 * 60 * 60 * 24;

const sessionStoreOptions = {
  schema: {
    columnNames: {
      data: 'sess',
      expires: 'expire',
      session_id: 'session_id',
    },
    tableName: 'session',
  },
};
const MysqlSessionStore = mySQLStore(expressSession);

const sessionStore = new MysqlSessionStore(
  sessionStoreOptions /* session store options */,
  getConnectionPool()
);

const memoryStore = new session.MemoryStore();

export const getSession = (useSessionStore: expressSession.Store = sessionStore) => {
  return session({
    cookie: {
      maxAge: IN_PROD ? TWO_HOURS : TWENTYFOUR_HOURS,
      path: '/',
      sameSite: true,
      secure: IN_PROD,
    },
    genid: function (req: express.Request) {
      const headers: IncomingHttpHeaders = req.headers;
      const sessionIdHeader: string | string[] | undefined =
        headers['x-session-id'];
      if (
        typeof sessionIdHeader === 'string' &&
        sessionIdHeader !== 'undefined'
      ) {
        return sessionIdHeader;
      }
      if (req.sessionID) {
        return req.sessionID;
      }
      const cookieValue = req.cookies['sessionId'];
      if (cookieValue !== undefined && cookieValue !== 'undefined') {
        return cookieValue;
      }
      const newId: uuid4 = uuidv4(); // use UUIDs for session IDs
      return newId;
    },
    resave: false,
    rolling: false,
    saveUninitialized: false,
    secret: process.env.SESSION_SECRET || uuidv4(),
    store: useSessionStore !== undefined ? useSessionStore : memoryStore,
  });
};

export const simpleSessionId = (
  req: TagtoolRequest,
  res: express.Response,
  next: () => void
) => {
  req.sessionStore.get(req.sessionID, (err, sessionData) => {
    if (!sessionData || req.session.userId == undefined) {
      const userId: uuid5 = createRandomUserId();
      req.session.userId = userId;
    }

    if (err) {
      res.status(500);
      res.end();
    } else {
      req.session.save();
      next();
    }
  });
};

export const useSessionId = (
  req: TagtoolRequest,
  res: express.Response,
  next: () => void
) => {
  const sessionId = req.header('x-session-id');
  if (sessionId && sessionId !== 'undefined') {
    if (!req.sessionID) {
      req.sessionID = sessionId;
    }
    // req.sessionID = 'xyxy1234';
    if (!req.sessionStore) {
      const errMsg = 'sessionStore has not been configured and is undefined';
      console.error(errMsg);
      throw Error(errMsg);
    }
    // retrieve session from session store using sessionId
    req.sessionStore.get(sessionId, (err, sessionData) => {
      if (err) {
        console.log('Given sessionId was not found, generate a new one...');
      }
      if (sessionData && req.sessionID.length > 16) {
        req.session = Object.assign(req.session, sessionData);
        if (req.session.userId == undefined) {
          const userId: uuid5 = createRandomUserId();
          console.log(
            `Assigned a new userId ${userId} to session ${sessionId}`
          );
          req.session.userId = userId;
        }
        req.session.save();
        next();
      } else {
        res.status(401);
        res.end();
      }
    });
  } else {
    if (req.session.userId == undefined) {
      const userId: uuid5 = createRandomUserId();
      console.log(
        `Assigned a new userId ${userId} to session ${req.session.id}`
      );
      req.session.userId = userId;
    }

    next();
  }
};
