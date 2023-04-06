import { EmailAddress } from '../types';

export type RestCallResult = {
  success: boolean;
  data?: any;
  status: number;
};

export type AuthenticationRestResult = {
  email: EmailAddress | undefined;
  isLoggedIn: boolean;
  message?: string;
  sessionId?: string;
};
