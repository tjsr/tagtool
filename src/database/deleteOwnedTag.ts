import { FieldPacket, QueryError, QueryResult, ResultSetHeader } from 'mysql2/promise';
import { ObjectId, UserId } from '../types.js';
import { deleteFromTable, mysqlQuery } from '@tjsr/mysql-pool-utils';

export const deleteOwnedTag = async (
  userId: UserId,
  objectId: ObjectId,
  tag: string
): Promise<number> => {
  return deleteFromTable('Tags', { createdByUserId: userId, objectId, tag });
};

