import { EmailAddress } from '../types.js';
import { UserModel } from '../types/model.js';
import { createUserIdFromEmail } from '../auth/user.js';
import { loadEnv } from '@tjsr/simple-env-utils';

loadEnv();

export const getDbUserByEmail = (email: EmailAddress): UserModel => {
  return {
    email: email,
    userId: createUserIdFromEmail(email),
  };
};
