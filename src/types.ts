import session from 'express-session';
import { uuid5 } from '@tjsr/user-session-middleware';

export type UserId = uuid5;
export type SnowflakeType = bigint | string;
export type ISO8601Date = Date;
export type ObjectId = string;

export interface Tag {
  createdByUserId: UserId;
  objectId: ObjectId;
  tag: string;
}

export interface TagtoolConfig {
  enableTagCount?: boolean;
  sessionStore?: session.Store;
}

export type { EmailAddress, IPAddress, uuid, uuid4, uuid5 } from '@tjsr/user-session-middleware';
