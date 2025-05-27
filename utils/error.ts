import { Response } from "express";

const errorHandler = (error: any, res: Response) => {
  if (error instanceof Error) {
    res.status(400).send({ message: error.message });
  } else {
    res.status(500).send({ message: "Internal server error" });
  }
};

export default errorHandler;
