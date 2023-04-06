import { EmailAddress, uuid4 } from '../types';

export type UserModel = {
  userId: uuid4;
  email: EmailAddress;
};
