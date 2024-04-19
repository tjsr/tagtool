import * as dotenv from 'dotenv';

import { EmailAddress } from '../types';
import { UserModel } from '../types/model';
import { createUserIdFromEmail } from '../auth/user';
import mysql from 'mysql';

export type PoolConnection = mysql.PoolConnection;

dotenv.config();

export const getDbUserByEmail = (email: EmailAddress): UserModel => {
  return {
    email: email,
    userId: createUserIdFromEmail(email),
  };
};
