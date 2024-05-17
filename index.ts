import { DEFAULT_HTTP_PORT, startApp } from './src/server.js';
import { intEnv, loadEnv, requireEnv } from '@tjsr/simple-env-utils';

import express from 'express';

loadEnv();

requireEnv('SESSION_SECRET');
requireEnv('USERID_UUID_NAMESPACE');
requireEnv('HTTP_PORT');

const HTTP_PORT: number = intEnv('HTTP_PORT', DEFAULT_HTTP_PORT);

const app: express.Express = startApp();
app.listen(HTTP_PORT, () => {
  console.log(`Listening on port ${HTTP_PORT}`);
});
