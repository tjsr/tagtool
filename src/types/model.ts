import { EmailAddress, uuid4 } from '../types.js';

export type UserModel = {
  userId: uuid4;
  email: EmailAddress;
};
