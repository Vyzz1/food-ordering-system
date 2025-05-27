import { Request } from "express";

export interface TypedRequest<T = object> extends Request {
  body: T;
}

export interface TypedRequestBody<T> extends Request {
  body: T;
}

export interface TypedRequestParams<T> extends Request {
  params: T;
}

export interface TypedRequestQuery<T> extends Request {
  query: T;
}

export interface TypedRequestFull<
  TBody = object,
  TParams = object,
  TQuery = object,
> extends Request {
  body: TBody;
  params: TParams;
  query: TQuery;
}
