import { ObjectId, UserId } from '../types.js';

import { basicMySqlInsert } from '@tjsr/mysql-pool-utils';

export const insertTag = async (createdByUserId: UserId, objectId: ObjectId, tag: string): Promise<void> => {
  return basicMySqlInsert('Tags', ['objectId', 'tag', 'createdByUserId'], {
    createdByUserId,
    objectId,
    tag,
  });
};

