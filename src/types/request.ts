import { ParamsDictionary, Query } from 'express-serve-static-core';
import { SystemHttpRequestType, SystemHttpResponseType, SystemResponseLocals } from '@tjsr/user-session-middleware';

import { TagtoolUserSessionData } from './session.js';

/* eslint-disable @typescript-eslint/no-explicit-any */

// interface TagtoolSessionStoreDataType extends SessionStoreDataType {}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface TagtoolRequestProperties extends Record<string, any> {
  // extends express.Request {
  reportTagCounts: boolean;
}

export interface TagtoolResponseLocals extends SystemResponseLocals<TagtoolUserSessionData> {}

// export type TagtoolRequest = SystemHttpRequestType<TagtoolSessionDataType> & Partial<TagtoolRequestProperties>;
export interface TagtoolRequest<
  P extends ParamsDictionary = ParamsDictionary,
  ResBody = any,
  ReqBody = any,
  ReqQuery extends Query = Query,
> extends SystemHttpRequestType<TagtoolUserSessionData, P, ResBody, ReqBody, ReqQuery, TagtoolResponseLocals>,
    TagtoolRequestProperties {}

export interface TagtoolResponse<ResBody = any>
  extends SystemHttpResponseType<TagtoolUserSessionData, ResBody, TagtoolResponseLocals> {}
