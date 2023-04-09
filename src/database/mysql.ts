import * as dotenv from 'dotenv';

import { EmailAddress } from '../types';
import { UserModel } from '../types/model';
import { createUserIdFromEmail } from '../auth/user';
import { getConnection } from './mysqlConnections';
import mysql from 'mysql';

export type PoolConnection = mysql.PoolConnection;

dotenv.config();

export const basicMySqlInsert = (
  table: string,
  fields: string[],
  values: any
): Promise<void> => {
  const params: string[] = Array(fields.length).fill('?');
  return new Promise((resolve, reject) => {
    getConnection()
      .then((conn: PoolConnection) => {
        conn.query(
          `insert into ${table} (${fields.join(', ')}) values (${params.join(
            ', '
          )})`,
          Object.keys(values).map((v) => values[v]),
          (err) => {
            conn.release();
            if (err && err.sqlState === '23000') {
              resolve();
            } else if (err) {
              reject(err);
            }
            resolve();
          }
        );
      })
      .catch((err) => reject(err));
  });
};

export const getDbUserByEmail = (email: EmailAddress): UserModel => {
  return {
    email: email,
    userId: createUserIdFromEmail(email),
  };
};
