import * as dotenvFlow from 'dotenv-flow';

import { setTestMode } from '@tjsr/simple-env-utils';

dotenvFlow.config({ path: process.cwd() });

process.env['USE_LOGGING'] = 'false';

setTestMode();
