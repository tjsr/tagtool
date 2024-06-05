import { DEFAULT_HTTP_PORT, startApp } from './src/server.js';
import { intEnv, loadEnv, requireEnv } from '@tjsr/simple-env-utils';

import express from 'express';
import { mysqlSessionStore } from '@tjsr/user-session-middleware';

console.log(`Starting with NODE_ENV ${process.env['NODE_ENV']}`);

loadEnv();

requireEnv('SESSION_SECRET');
requireEnv('USERID_UUID_NAMESPACE');
requireEnv('HTTP_PORT');

const HTTP_PORT: number = intEnv('HTTP_PORT', DEFAULT_HTTP_PORT);

const app: express.Express = startApp(mysqlSessionStore);
app.listen(HTTP_PORT, () => {
  console.log(`Listening on port ${HTTP_PORT}`);
});
