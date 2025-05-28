import { Router } from "express";
import paymentController from "../controllers/payment.controller";

const paymnetRoute = Router();

paymnetRoute.post("/webhook", paymentController.webHookHanlder);

export default paymnetRoute;
