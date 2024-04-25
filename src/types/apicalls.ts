import { EmailAddress } from '../types.js';

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
