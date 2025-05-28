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

interface RequestTypes {
  TBody?: any; // Optional, default là any
  TQuery?: any; // Optional, default là any
  TParams?: any; // Optional, default là any
}

type ExtractBody<T extends RequestTypes> = T["TBody"] extends undefined
  ? any
  : T["TBody"];

type ExtractQuery<T extends RequestTypes> = T["TQuery"] extends undefined
  ? any
  : T["TQuery"];

type ExtractParams<T extends RequestTypes> = T["TParams"] extends undefined
  ? any
  : T["TParams"];

type MyTypedRequest<T extends RequestTypes = {}> = Request<
  ExtractParams<T>, // Params (thứ 1 trong Express Request generic)
  any, // Response body (thứ 2 - không quan tâm)
  ExtractBody<T>, // Request body (thứ 3)
  ExtractQuery<T> // Query (thứ 4)
>;
