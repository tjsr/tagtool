import { ParamsDictionary, Query } from 'express-serve-static-core';
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  SessionStoreDataType,
  SystemHttpRequestType,
  SystemHttpResponseType,
  SystemResponseLocals,
} from '@tjsr/user-session-middleware';

import { TagtoolSessionDataType } from './session.js';

interface TagtoolSessionStoreDataType extends SessionStoreDataType {}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface TagtoolRequestProperties extends Record<string, any> {
  // extends express.Request {
  reportTagCounts: boolean;
}

export interface TagtoolResponseLocals extends SystemResponseLocals<TagtoolSessionStoreDataType> {}

// export type TagtoolRequest = SystemHttpRequestType<TagtoolSessionDataType> & Partial<TagtoolRequestProperties>;
export interface TagtoolRequest<
  P extends ParamsDictionary = ParamsDictionary,
  ResBody = any,
  ReqBody = any,
  ReqQuery extends Query = Query,
> extends SystemHttpRequestType<
      TagtoolSessionDataType,
      TagtoolSessionStoreDataType,
      P,
      ResBody,
      ReqBody,
      ReqQuery,
      TagtoolResponseLocals
    >,
    TagtoolRequestProperties {}

export interface TagtoolResponse<ResBody = any>
  extends SystemHttpResponseType<TagtoolSessionStoreDataType, ResBody, TagtoolResponseLocals> {}
