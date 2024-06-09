import * as expressSession from 'express-session';

import {
  SessionStoreDataType,
  SystemHttpRequestType,
  SystemHttpResponseType,
  SystemSessionDataType,
} from '@tjsr/user-session-middleware';

import MySQLStore from 'express-mysql-session';
import { getCallbackConnectionPromise } from '@tjsr/mysql-pool-utils';
import { loadEnv } from '@tjsr/simple-env-utils';

// import express from 'express';

// const SESSION_ID_NAMESPACE = '0fac0952-9b54-43a9-be74-8d60533aa667';

export interface TagtoolSessionDataType extends SystemSessionDataType {}

export interface TagtoolSessionStoreDataType extends SessionStoreDataType {}

// Partial<SystemSessionDataType> !== Partial<TagtoolSessionDataType>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface TagtoolRequestProperties extends Record<string, any> {
  // extends express.Request {
  reportTagCounts: boolean;
}

// export type TagtoolRequest = SystemHttpRequestType<TagtoolSessionDataType> & Partial<TagtoolRequestProperties>;
export interface TagtoolRequest extends SystemHttpRequestType<TagtoolSessionDataType>, TagtoolRequestProperties {}

export interface TagtoolResponse extends SystemHttpResponseType<TagtoolSessionStoreDataType> {}

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
