import { FieldPacket, QueryResult } from 'mysql2/promise';
import { ObjectId, Tag, UserId } from '../types.js';
import { getConnection, mysqlQuery, safeReleaseConnection } from '@tjsr/mysql-pool-utils';

export const findTagsByObjectId = async (
  objectId: ObjectId
): Promise<Tag[]> => {
  // const conn = (await getConnection()).promise();
  const conn = await getConnection();
  return new Promise((resolve, reject) => {
    mysqlQuery(
        'select objectId, createdByUserId, tag from Tags where objectId=?',
        [objectId]).then(([queryResult, fieldPacket]: [QueryResult, FieldPacket[]]) => {
        
        const tags: Tag[] = queryResult as Tag[];
        // Convert to an in-memory array so the query cursor is closed off.
        const outputTags: Tag[] = tags.map((queryTag: Tag) => {
          const outputTag: Tag = {
            createdByUserId: queryTag.createdByUserId as UserId,
            objectId: queryTag.objectId as ObjectId,
            tag: queryTag.tag as string
          };
          return outputTag;
        });
        safeReleaseConnection(conn);
        return resolve(outputTags);

        // return resolve(queryResult as Tag[] & mysql.QueryResult);
        // for (const row of queryResult) {

        // }
        // const rows: RowDataPacket[][] = queryResult as RowDataPacket[][];
        // const tags: Tag[] = [];
        // for (let n = 0;n < rows.length;n++) {
        //   const row: RowDataPacket[] = rows[n];
        //   const currentTag = {
        //     createdByUser: row['createdByUser'] as unknown as string,
        //     objectId: row['objectId'] as string,
        //     tag: row['tag'] as string
        //   }
        //   tags.push(currentTag);
        // }

    }).catch((err) => {
      safeReleaseConnection(conn);
      conn.release();
      return reject(err);
    });
    //     (err, results) => {
    //       if (err) {
    //       }
    //   if (results == undefined) {
    //     conn.release();
    //     return reject(
    //       new Error(
    //         `Retrieving by objectId ${objectId} results was undefined.`
    //       )
    //     );
    //   }
    //   const tags: Tag[] = [];
    //   for (let n = 0;n < results.length;n++) {
    //     const currentTag = results[n];
    //     tags.push(currentTag);
    //   }
    //   conn.release();
    //   return resolve(tags);
    // } catch (err) {
    //   conn.release();
    //   return reject(err);
    // }
  });
};
