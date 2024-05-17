import { ObjectId, UserId } from '../types.js';

import { deleteFromTable } from '@tjsr/mysql-pool-utils';

export const deleteOwnedTag = async (userId: UserId, objectId: ObjectId, tag: string): Promise<number> => {
  return deleteFromTable('Tags', { createdByUserId: userId, objectId, tag });
};
