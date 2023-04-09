import { getConnection } from './mysqlConnections';

export const basicMySqlInsert = async (
  table: string,
  fields: string[],
  values: any
): Promise<void> => {
  const params: string[] = Array(fields.length).fill('?');
  const conn = await getConnection();
  return new Promise((resolve, reject) => {
    conn.query(
      `insert into ${table} (${fields.join(', ')}) values (${params.join(
        ', '
      )})`,
      Object.keys(values).map((v) => values[v]),
      (err) => {
        conn.release();
        if (err && err.sqlState === '23000') {
          resolve();
          console.log('Inserted value.');
        } else if (err) {
          reject(err);
        }
        resolve();
      }
    );
  });
};
