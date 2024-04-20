import * as dotenv from 'dotenv-flow';

import { booleanEnv, intEnv, requireEnv } from '@tjsr/simple-env-utils';

import mysql from 'mysql';

export type PoolConnection = mysql.PoolConnection;

dotenv.config({ silent: true });

const config: mysql.PoolConfig = {
  bigNumberStrings: true,
  connectTimeout: intEnv('MYSQL_CONNECT_TIMEOUT', 2000),
  connectionLimit:
    process.env.MYSQL_CONNECTION_POOL_SIZE !== undefined ?
      parseInt(process.env.MYSQL_CONNECTION_POOL_SIZE) :
      5,
  database: requireEnv('MYSQL_DATABASE'),
  debug: booleanEnv('MYSQL_DEBUG', false),
  host: requireEnv('MYSQL_HOST'),
  password: requireEnv('MYSQL_PASSWORD'),
  port: intEnv('MYSQL_PORT', 3306),
  supportBigNumbers: true,
  user: requireEnv('MYSQL_USER'),
};

const connectionPool = mysql.createPool(config);

export const getConnectionPool = () => {
  return connectionPool;
};

export const getConnection = async (): Promise<PoolConnection> => {
  return new Promise((resolve, reject) => {
    connectionPool.getConnection((err, connection) => {
      if (err) {
        reject(err);
      } else {
        resolve(connection);
      }
    });
  });
};

export const closeConnections = async (): Promise<void> => {
  if (connectionPool !== undefined) {
    connectionPool.end();
  }
  return Promise.resolve();
};
