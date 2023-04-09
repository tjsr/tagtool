import { ObjectId } from '../types';

export const validateObjectId = (id: ObjectId): boolean => {
  const regexp = /^[a-zA-Z0-9-_]{1,32}$/;
  if (id.search(regexp) === -1) {
    return false;
  }
  return true;
};
