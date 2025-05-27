import { NextFunction, Response } from "express";
import jwt from "jsonwebtoken";
import { AuthenticatedRequest } from "../types/auth";

const validateJWT = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const token = authHeader.split(" ")[1];

  jwt.verify(
    token,
    process.env.ACCESS_TOKEN_SECRET as string,
    async (err, decoded: any) => {
      if (err) {
        res.status(403).json({ message: "Forbidden" });
        return;
      }

      req.user = decoded;
      next();
    }
  );
};

export default validateJWT;
