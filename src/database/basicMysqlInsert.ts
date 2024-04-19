import { PoolConnection, getConnection } from './mysqlConnections';

import { MysqlError } from 'mysql';

export const basicMySqlInsert = (
  table: string,
  fields: string[],
  values: any
): Promise<boolean> => {
  const params: string[] = Array(fields.length).fill('?');
  return new Promise((resolve, reject) => {
    getConnection()
      .then((conn: PoolConnection) => {
        conn.query(
          `insert into ${table} (${fields.join(', ')}) values (${params.join(
            ', '
          )})`,
          Object.keys(values).map((v) => values[v]),
          (err: MysqlError| null) => {
            conn.release();
            if (err && err.sqlState === '23000') {
              console.warn('Duplicate key error', err);
              return reject(err);
            }
            if (err) {
              return reject(err);
            }
            return resolve(true);
          }
        );
      })
      .catch((err) => reject(err));
  });
};
