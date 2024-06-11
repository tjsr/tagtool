import { ObjectId } from '../types.js';

export interface TagResponse {
  objectId: ObjectId;
  tags: TagResponseElement[];
}

export interface TagResponseElement {
  count?: number;
  isOwner?: boolean;
  tag: string;
}
