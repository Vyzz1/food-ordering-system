import { Request, Response } from "express";
import errorHandler from "../utils/error";
import paymentService from "../services/payment.service";

class PaymentController {
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
}

export default new PaymentController();
