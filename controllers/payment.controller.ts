import { Request, Response } from "express";
import errorHandler from "../utils/error";
import paymentService from "../services/payment.service";
import { TypedRequest } from "../types/express";
import { NextHandleFunction } from "connect";

class PaymentController {
  async getAllPayments(
    req: TypedRequest<{ TQuery: PaymentFilterRequest }>,
    res: Response
  ) {
    try {
      const payments = await paymentService.getAllPayments(req.query, true);

      res.status(200).send(payments);
    } catch (error) {
      errorHandler(error, res);
    }
  }

  async getUserPayments(
    req: TypedRequest<{ TQuery: PaymentFilterRequest }>,
    res: Response
  ) {
    try {
      const userId = req.user?.userId;
      const payments = await paymentService.getAllPayments(
        req.query,
        false,
        userId
      );

      res.status(200).send(payments);
    } catch (error) {
      errorHandler(error, res);
    }
  }

  async webHookHanlder(req: Request, res: Response) {
    try {
      const sig = req.headers["stripe-signature"];
      const rawBody = req.body;

      if (!sig || !rawBody) {
        res.status(400).send("Bad Request: Missing signature or raw body");
      }

      const response = await paymentService.handleWebhook(
        rawBody,
        sig as string
      );

      res.status(200).send(response);
    } catch (error) {
      errorHandler(error, res);
    }
  }

  async retryPayment(
    req: TypedRequest<{ TBody: { orderId: string } }>,
    res: Response
  ) {
    try {
      const { orderId } = req.body;

      const response = await paymentService.handleRepay(orderId);

      res.status(200).send(response);
    } catch (error) {
      errorHandler(error, res);
    }
  }
  async deletePayment(
    req: TypedRequest<{ TParams: { id: string } }>,
    res: Response
  ) {
    try {
      const { id } = req.params;

      await paymentService.deletePayment(id);

      res.status(204).send();
    } catch (error) {
      errorHandler(error, res);
    }
  }
}

export default new PaymentController();
