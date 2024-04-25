import { ObjectId, Tag } from '../types.js';

import { PoolConnection } from 'mysql';
import { getConnection } from '@tjsr/mysql-pool-utils';

export const findTagsByObjectId = async (
  objectId: ObjectId
): Promise<Tag[]> => {
  const conn: PoolConnection = await getConnection();

  return new Promise((resolve, reject) => {
    try {
      conn.query(
        'select objectId, createdByUserId, tag from Tags where objectId=?',
        [objectId],
        (err, results) => {
          if (err) {
            conn.release();
            return reject(err);
          }
          if (results == undefined) {
            conn.release();
            return reject(
              new Error(
                `Retrieving by objectId ${objectId} results was undefined.`
              )
            );
          }
          const tags: Tag[] = [];
          for (let n = 0;n < results.length;n++) {
            const currentTag = results[n];
            tags.push(currentTag);
          }
          conn.release();
          return resolve(tags);
        }
      );
    } catch (err) {
      reject(err);
    }
  });
};
