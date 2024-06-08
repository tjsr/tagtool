import { intEnv, loadEnv, setTestMode } from '@tjsr/simple-env-utils';

import { ConnectionOptions } from 'mysql2/promise';
import { setUserIdNamespace } from '../../user-session-middleware/src/auth/user.js';
import { v4 as uuidv4 } from 'uuid';

loadEnv();

process.env['USE_LOGGING'] = 'false';

setTestMode();
setUserIdNamespace(uuidv4());

export const connectionDetails: ConnectionOptions = {
  database: process.env['MYSQL_DATABASE'] || 'testdb',
  host: process.env['MYSQL_HOST'] || '127.0.0.1',
  password: process.env['MYSQL_PASSWORD'] || 'testpassword',
  port: intEnv('MYSQL_PORT', 3306),
  user: process.env['MYSQL_USER'] || 'testuser',
} as const;

