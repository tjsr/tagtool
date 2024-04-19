import * as dotenvFlow from 'dotenv-flow';

import { setTestMode } from './utils';

dotenvFlow.config({ path: process.cwd() });

setTestMode();
