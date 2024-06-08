import { UserModel, createUserIdFromEmail } from '@tjsr/user-session-middleware';

import { EmailAddress } from '../types.js';
import { loadEnv } from '@tjsr/simple-env-utils';

loadEnv();

export const getDbUserByEmail = (email: EmailAddress): UserModel => {
  return {
    email: email,
    userId: createUserIdFromEmail(email),
  };
};
