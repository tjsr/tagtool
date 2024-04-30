import * as dotenv from 'dotenv';

import { EmailAddress } from '../types.js';
import { UserModel } from '../types/model.js';
import { createUserIdFromEmail } from '../auth/user.js';

dotenv.config();

export const getDbUserByEmail = (email: EmailAddress): UserModel => {
  return {
    email: email,
    userId: createUserIdFromEmail(email),
  };
};
