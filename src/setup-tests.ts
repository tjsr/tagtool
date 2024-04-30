import * as dotenvFlow from 'dotenv-flow';

import { ConnectionOptions } from 'mysql2/promise';
import { setTestMode } from '@tjsr/simple-env-utils';

dotenvFlow.config({ path: process.cwd() });

process.env['USE_LOGGING'] = 'false';

setTestMode();

export const connectionDetails: ConnectionOptions = {
  host: '127.0.0.1',
  user: 'testuser',
  password: 'testpassword',
  database: 'testdb',
  port: 23406,
} as const;
