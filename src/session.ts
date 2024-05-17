import * as expressSession from 'express-session';

import { EmailAddress, UserId } from './types.js';
import { SystemHttpRequestType, SystemSessionDataType } from '@tjsr/user-session-middleware';

import MySQLStore from 'express-mysql-session';
import { Session } from 'express-session';
import express from 'express';
import { getCallbackConnectionPromise } from '@tjsr/mysql-pool-utils';
import { loadEnv } from '@tjsr/simple-env-utils';

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

loadEnv();

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

export const getMysqlSessionStore = async (
  sessionStoreOptions?: MySQLStore.Options
): Promise<MySQLStore.MySQLStore> => {
  // eslint-disable-next-line new-cap
  const MysqlSessionStore = MySQLStore(expressSession);
  const connection = await getCallbackConnectionPromise();

  const mysqlSessionStore = new MysqlSessionStore(
    sessionStoreOptions ?? defaultSessionStoreOptions /* session store options */,
    connection
  );

  return Promise.resolve(mysqlSessionStore);
};
