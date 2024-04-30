import * as dotenv from 'dotenv';
import * as expressSession from 'express-session';

import { EmailAddress, UserId } from './types.js';
import {
  SystemHttpRequestType,
  SystemSessionDataType,
} from '@tjsr/user-session-middleware';
import express, { RequestHandler } from 'express';
import { getCallbackConnectionPromise, getConnection, getConnectionPool } from '@tjsr/mysql-pool-utils';

import MySQLStore from 'express-mysql-session';
import { Session } from 'express-session';

// const SESSION_ID_NAMESPACE = '0fac0952-9b54-43a9-be74-8d60533aa667';

export interface TagtoolSessionData extends SystemSessionDataType {
  email: EmailAddress;
  newId: boolean;
  userId: UserId;
}

export interface TagtoolRequest extends SystemHttpRequestType<TagtoolSessionData> {
  newSessionIdGenerated?: boolean;
  session: Session & Partial<TagtoolSessionData>;
}

export interface TagtoolResponse extends express.Response {}

dotenv.config();

const defaultSessionStoreOptions: MySQLStore.Options = {
  schema: {
    columnNames: {
      data: 'sess',
      expires: 'expire',
      session_id: 'session_id',
    },
    tableName: 'session',
  },
};

export const getMysqlSessionStore = async (sessionStoreOptions?: MySQLStore.Options): Promise<MySQLStore.MySQLStore> => {
  const MysqlSessionStore = MySQLStore(expressSession);
  const connection = await getCallbackConnectionPromise();
  
  const mysqlSessionStore = new MysqlSessionStore(
    sessionStoreOptions ?? defaultSessionStoreOptions/* session store options */,
    connection,
  );
  
  return Promise.resolve(mysqlSessionStore);
};
