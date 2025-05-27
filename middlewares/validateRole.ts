import { NextFunction, Request, Response } from "express";
import { AuthenticatedRequest } from "../types/auth";

const validateRole = (...allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userRole = req.user?.role;
    if (!userRole || !allowedRoles.includes(userRole)) {
      res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };
};

export default validateRole;
