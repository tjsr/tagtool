import { ParamsDictionary, Query } from 'express-serve-static-core';
import {
  SystemHttpRequestType,
  SystemHttpResponseType,
  SystemRequestOrExpressRequest,
  SystemResponseOrExpressResponse,
  UserSessionMiddlewareRequestHandler,
} from '@tjsr/user-session-middleware';
import { TagtoolRequest, TagtoolResponse, TagtoolResponseLocals } from './request.js';
import { TagtoolSessionDataType, TagtoolSessionStoreDataType } from './session.js';

/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextFunction } from 'express';

type TagtoolOrSystemRequest<RequestType> =
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  RequestType extends TagtoolRequest<infer P, infer RB, infer RR, infer Q>
    ? RequestType // TagtoolRequest<P, RB, RR, Q>
    : SystemRequestOrExpressRequest<
        RequestType,
        TagtoolSessionDataType,
        any,
        TagtoolResponseLocals
        // P,
        // RB,
        // RR,
        // Q
      >;

type TagtoolOrSystemResponse<ResponseType> =
  ResponseType extends TagtoolResponse<infer RB>
    ? TagtoolResponse<RB>
    : SystemResponseOrExpressResponse<ResponseType, TagtoolSessionStoreDataType, any, TagtoolResponseLocals>;

export interface TagtoolRequestHandler<
  TagtoolRequestType extends TagtoolOrSystemRequest<TagtoolRequest> = TagtoolOrSystemRequest<TagtoolRequest>,
  TagtoolResponseType extends TagtoolOrSystemResponse<TagtoolResponse> = TagtoolOrSystemResponse<TagtoolResponse>,
  P extends ParamsDictionary = ParamsDictionary,
  ResBody = any,
  ReqBody = any,
  ReqQuery extends Query = Query,
> extends UserSessionMiddlewareRequestHandler<
    TagtoolSessionDataType,
    TagtoolSessionStoreDataType,
    P,
    ResBody,
    ReqBody,
    ReqQuery,
    TagtoolResponseLocals
  > {
  (request: TagtoolRequestType, response: TagtoolResponseType, next: NextFunction): void;
}

export type AsyncTagtoolRequestHandler = (
  request: TagtoolRequest,
  response: TagtoolResponse,
  next: NextFunction
) => (request: SystemHttpRequestType, response: SystemHttpResponseType, next: NextFunction) => Promise<void>;

export type ForwardTagtoolRequestHandler = (
  request: SystemHttpRequestType,
  response: SystemHttpResponseType,
  next: NextFunction
) => (request: TagtoolRequest, response: TagtoolResponse, next: NextFunction) => void;
