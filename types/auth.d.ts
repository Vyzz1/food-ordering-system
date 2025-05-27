import { Request } from "express";

export interface AuthenticatedUser {
  userId: string;
  email: string;
  role: "admin" | "user";
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

export interface AuthenticatedTypedRequest<T = {}, V = {}> extends Request {
  body: T;
  query: V;
  user?: AuthenticatedUser;
}
