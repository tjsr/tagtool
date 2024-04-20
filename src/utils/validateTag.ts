import { isTestMode } from '@tjsr/simple-env-utils';
import { validate } from 'uuid';

export const validateTag = (id: string): boolean => {
  if (isTestMode() && validate(id)) return true;

  const regexp = /^[a-zA-Z0-9-_]{1,32}$/;
  if (id.search(regexp) === -1) {
    return false;
  }
  return true;
};
