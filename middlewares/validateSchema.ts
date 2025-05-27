import { NextFunction, Request, Response } from "express";
import Joi from "joi";

type TypedRequest = "body" | "query" | "params";

const validateSchema = (
  schema: Joi.ObjectSchema,
  type: TypedRequest = "body"
) => {
  return <T extends Request>(req: T, res: Response, next: NextFunction) => {
    const validationTarget =
      type === "body" ? req.body : type === "query" ? req.query : req.params;
    if (!validationTarget) {
      res.status(400).json({ message: "No data to validate" });
      return;
    }

    const { error } = schema.validate(validationTarget, { abortEarly: false });
    if (error) {
      res
        .status(400)
        .json({ message: "Validation error", details: error.message });
      return;
    }
    next();
  };
};

export default validateSchema;
