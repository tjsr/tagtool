import { ParamsDictionary, Query } from 'express-serve-static-core';
import {
  SystemHttpRequestType,
  SystemHttpResponseType,
  UserSessionMiddlewareRequestHandler,
  express,
} from '@tjsr/user-session-middleware';
import { TagtoolRequest, TagtoolResponse, TagtoolResponseLocals } from './request.js';

import { TagtoolUserSessionData } from './session.js';

/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

export interface TagtoolRequestHandler<
  P extends ParamsDictionary = ParamsDictionary,
  ResBody = any,
  ReqBody = any,
  ReqQuery extends Query = Query,
  TagtoolResponseType extends express.Response = TagtoolResponse<ResBody>,
  TagtoolRequestType extends express.Request = TagtoolRequest<P, ResBody, ReqBody, ReqQuery>,
> extends UserSessionMiddlewareRequestHandler<
    TagtoolUserSessionData,
    P,
    ResBody,
    ReqBody,
    ReqQuery,
    TagtoolResponseLocals
  > {
  (request: TagtoolRequestType, response: TagtoolResponseType, next: express.NextFunction): void;
}

export type AsyncTagtoolRequestHandler = (
  request: TagtoolRequest,
  response: TagtoolResponse,
  next: express.NextFunction
) => (request: SystemHttpRequestType, response: SystemHttpResponseType, next: express.NextFunction) => Promise<void>;

export type ForwardTagtoolRequestHandler = (
  request: SystemHttpRequestType,
  response: SystemHttpResponseType,
  next: express.NextFunction
) => (request: TagtoolRequest, response: TagtoolResponse, next: express.NextFunction) => void;
