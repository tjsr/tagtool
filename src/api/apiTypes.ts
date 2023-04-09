import { ObjectId } from '../types';

export interface TagResponse {
  objectId: ObjectId;
  tags: TagResponseElement[];
}

export interface TagResponseElement {
  isOwner?: boolean;
  tag: string;
  count: number;
}
