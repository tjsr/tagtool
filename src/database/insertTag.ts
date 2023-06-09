import { ObjectId, UserId } from '../types';

import { basicMySqlInsert } from './basicMysqlInsert';

export const insertTag = async (userId: UserId, objectId: ObjectId, tag: string): Promise<void> => {
  await basicMySqlInsert('Tags',
    ['objectId', 'tag', 'createdByUserId'],
    {
      objectId,
      tag,
      userId,
    });

  return;
};

