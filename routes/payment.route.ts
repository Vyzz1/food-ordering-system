import express, { Router } from "express";
import paymentController from "../controllers/payment.controller";
import validateJWT from "../middlewares/validateJWT";
import validateRole from "../middlewares/validateRole";

const paymnetRoute = Router();

paymnetRoute.post(
  "/webhook",
  express.raw({
    type: "application/json",
  }),
  paymentController.webHookHanlder
);

paymnetRoute.post("/retry", express.json(), paymentController.retryPayment);

paymnetRoute.get(
  "/all",
  validateJWT,
  validateRole("admin"),
  express.json(),
  paymentController.getAllPayments
);

paymnetRoute.delete(
  "/:id",
  express.json(),
  validateJWT,
  validateRole("admin"),
  paymentController.deletePayment
);

paymnetRoute.get(
  "/me",
  express.json(),
  validateJWT,
  paymentController.getUserPayments
);

export default paymnetRoute;
