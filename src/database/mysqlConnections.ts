import * as dotenv from 'dotenv';

import mysql from 'mysql';
import { requireEnv } from '../utils/requireEnv';

export type PoolConnection = mysql.PoolConnection;

dotenv.config();

const config: mysql.PoolConfig = {
  connectionLimit:
    process.env.MYSQL_CONNECTION_POOL_SIZE !== undefined ?
      parseInt(process.env.MYSQL_CONNECTION_POOL_SIZE) :
      5,
  database: requireEnv('MYSQL_DATABASE'),
  host: requireEnv('MYSQL_HOST'),
  password: requireEnv('MYSQL_PASSWORD'),
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
  await connectionPool.end();
};
