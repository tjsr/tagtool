import * as dotenv from 'dotenv';

import express from 'express';
import { requireEnv } from '@tjsr/simple-env-utils';
import { startApp } from './src/server.js';

dotenv.config();

requireEnv('SESSION_SECRET');
requireEnv('USERID_UUID_NAMESPACE');
requireEnv('HTTP_PORT');

const HTTP_PORT: number =
  process.env.HTTP_PORT !== undefined ? parseInt(process.env.HTTP_PORT!) : 8242;

const app: express.Express = startApp();
app.listen(HTTP_PORT, () => {
  console.log(`Listening on port ${HTTP_PORT}`);
});
