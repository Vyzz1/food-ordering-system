import express, { Router } from "express";
import paymentController from "../controllers/payment.controller";

const paymnetRoute = Router();

paymnetRoute.post(
  "/webhook",
  express.raw({
    type: "application/json",
  }),
  paymentController.webHookHanlder
);

export default paymnetRoute;
