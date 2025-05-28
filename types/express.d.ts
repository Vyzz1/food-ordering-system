import { Request } from "express";
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

interface RequestTypes {
  TBody?: any;
  TQuery?: any;
  TParams?: any;
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

export type TypedRequest<T extends RequestTypes = {}> = Request<
  ExtractParams<T>,
  any,
  ExtractBody<T>,
  ExtractQuery<T>
>;
