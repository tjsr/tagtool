// Exports a consistent, read-only snapshot to a new SQL file for an empty D1 database.
// The output contains user and session data; keep it private and out of source control.
import mysql from 'mysql';
import { createWriteStream } from 'node:fs';
import { finished } from 'node:stream/promises';
import { once } from 'node:events';

const outputPath = process.argv[2];
if (!outputPath || !process.env.MYSQL_HOST || !process.env.MYSQL_DATABASE || !process.env.MYSQL_USER ||
    !process.env.MYSQL_PASSWORD) {
  throw new Error('Usage: node scripts/export-mysql-for-d1.mjs <new-output-file>; set MYSQL_HOST, MYSQL_DATABASE, MYSQL_USER and MYSQL_PASSWORD');
}

const connection = mysql.createConnection({
  host: process.env.MYSQL_HOST,
  port: Number(process.env.MYSQL_PORT || 3306),
  database: process.env.MYSQL_DATABASE,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  supportBigNumbers: true,
  bigNumberStrings: true,
  charset: 'utf8mb4',
});
const query = (sql) => new Promise((resolve, reject) => connection.query(sql, (error, rows) =>
  error ? reject(error) : resolve(rows)));
const quote = (value) => {
  if (value === null || value === undefined || String(value).includes('\0')) {
    throw new Error('Unexpected null or NUL in source data; export stopped');
  }
  return `'${String(value).replaceAll("'", "''")}'`;
};

const output = createWriteStream(outputPath, { flags: 'wx', mode: 0o600 });
await once(output, 'open');
try {
  await query('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ');
  await query('START TRANSACTION WITH CONSISTENT SNAPSHOT, READ ONLY');
  const tables = [
    { sql: 'SELECT id, email FROM User ORDER BY id', name: 'User', columns: ['id', 'email'] },
    { sql: 'SELECT CAST(id AS CHAR) AS id, objectId, tag, createdByUserId FROM Tags ORDER BY id',
      name: 'Tags', columns: ['id', 'objectId', 'tag', 'createdByUserId'] },
    { sql: 'SELECT session_id, sess, CAST(UNIX_TIMESTAMP(expire) AS UNSIGNED) AS expire FROM session WHERE expire > NOW() ORDER BY session_id',
      name: 'session', columns: ['session_id', 'sess', 'expire'] },
  ];
  for (const table of tables) {
    const rows = await query(table.sql);
    for (const row of rows) {
      const values = table.columns.map((column) => quote(row[column])).join(', ');
      const statement = `INSERT INTO "${table.name}" (${table.columns.map((column) => `"${column}"`).join(', ')}) VALUES (${values});\n`;
      if (!output.write(statement)) await once(output, 'drain');
    }
    console.log(`Exported ${rows.length} ${table.name} rows.`);
  }
  await query('ROLLBACK');
  output.end();
  await finished(output);
} catch (error) {
  output.destroy();
  console.error('Export failed. The output file may be incomplete; do not import it.');
  throw error;
} finally {
  connection.destroy();
}
