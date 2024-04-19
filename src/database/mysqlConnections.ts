import * as dotenv from 'dotenv';

import mysql from 'mysql';
import { requireEnv } from '../utils/requireEnv';

export type PoolConnection = mysql.PoolConnection;

dotenv.config();

const config: mysql.PoolConfig = {
  bigNumberStrings: true,
  connectTimeout: process.env['MYSQL_CONNECT_TIMEOUT'] ? parseInt(process.env['MYSQL_CONNECT_TIMEOUT']) : 2000,
  connectionLimit:
    process.env.MYSQL_CONNECTION_POOL_SIZE !== undefined ?
      parseInt(process.env.MYSQL_CONNECTION_POOL_SIZE) :
      5,
  database: requireEnv('MYSQL_DATABASE'),
  debug: process.env['MYSQL_DEBUG'] === 'true' ? true : false,
  host: requireEnv('MYSQL_HOST'),
  password: requireEnv('MYSQL_PASSWORD'),
  port: process.env['MYSQL_PORT'] ? parseInt(process.env['MYSQL_PORT']) : 3306,
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
