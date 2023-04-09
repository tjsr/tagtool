import { ObjectId, UserId } from '../types';

import { getConnection } from './mysqlConnections';

export const deleteOwnedTag = async (
  userId: UserId,
  objectId: ObjectId,
  tag: string
): Promise<number> => {
  const conn = await getConnection();
  return new Promise((resolve, reject) => {
    conn.query(
      `delete from Tags where createdByUserId=? and objectId=? and tag=?`,
      [userId, objectId, tag],
      (err, results) => {
        conn.release();
        if (err) {
          reject(err);
        } else {
          resolve(results.affectedRows);
        }
      });
  });
};

