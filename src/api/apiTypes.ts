import { ObjectId } from '../types.ts';

export interface TagResponse {
  objectId: ObjectId;
  tags: TagResponseElement[];
}

export interface TagResponseElement {
  count?: number;
  isOwner?: boolean;
  tag: string;
}
