import { DEFAULT_HTTP_PORT, startApp } from './src/server.js';
import { UserSessionOptions, getMysqlSessionStore } from '@tjsr/user-session-middleware';
import { intEnv, loadEnv, requireEnv } from '@tjsr/simple-env-utils';

import { CorsOptions } from 'cors';
import express from 'express';

console.log(`Starting with NODE_ENV ${process.env['NODE_ENV']}`);

loadEnv();

requireEnv('SESSION_SECRET');
requireEnv('USERID_UUID_NAMESPACE');
requireEnv('HTTP_PORT');

const HTTP_PORT: number = intEnv('HTTP_PORT', DEFAULT_HTTP_PORT);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const corsOptions: CorsOptions | any = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Expose-Headers': '*',
  optionsSuccessStatus: 200,
  origin: '*',
};

const sessionOptions: Partial<UserSessionOptions> = {
  skipExposeHeaders: false,
  store: getMysqlSessionStore(),
};

const app: express.Express = startApp({ cors: corsOptions, sessionOptions });
app.listen(HTTP_PORT, () => {
  console.log(`Listening on port ${HTTP_PORT}`);
});
