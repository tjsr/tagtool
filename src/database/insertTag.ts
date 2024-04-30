import { ObjectId, UserId } from '../types.js';

import { basicMySqlInsert } from '@tjsr/mysql-pool-utils';

export const insertTag = async (
  createdByUserId: UserId,
  objectId: ObjectId,
  tag: string,
): Promise<void> => {
  await basicMySqlInsert('Tags', ['objectId', 'tag', 'createdByUserId'], {
    objectId,
    tag,
    createdByUserId,
  });

  return;
};

