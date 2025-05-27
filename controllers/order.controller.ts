import { Response } from "express";
import { AuthenticatedTypedRequest } from "../types/auth";
import errorHandler from "../utils/error";
import orderService from "../services/order.service";
import { TypedRequestParams } from "../types/express";
import paymentService from "../services/payment.service";

class OrderController {
  async createOrder(
    req: AuthenticatedTypedRequest<OrderRequest>,
    res: Response
  ) {
    try {
      const response = await orderService.createOrder(
        req.body,
        req.user!.email
      );

      if (response.paymentMethod === "stripe") {
        const payResponse = await paymentService.createPayment(
          response,
          req.user!.email
        );

        res.status(201).send(payResponse);
      }

      res.status(201).send(response);
    } catch (error) {
      console.error("Error creating order:", error);
      errorHandler(error, res);
    }
  }

  async getOrderById(req: TypedRequestParams<{ id: string }>, res: Response) {
    try {
      const response = await orderService.getOrderById(req.params.id);

      res.send(response);
    } catch (error) {
      errorHandler(error, res);
    }
  }

  async getAllOrders(
    req: AuthenticatedTypedRequest<{}, AdminOrderFilterRequest>,
    res: Response
  ) {
    try {
      if (req.user!.role !== "admin") {
        res.status(403).send({ message: "Forbidden" });
      }
      const response = await orderService.getAllOrders(req.query);

      res.send(response);
    } catch (error) {
      console.error("Error fetching all orders:", error);
      errorHandler(error, res);
    }
  }

  async getUserOrder(
    req: AuthenticatedTypedRequest<{}, UserOrderFilterRequest>,
    res: Response
  ) {
    try {
      const response = await orderService.getUserOrder(
        req.user!.userId,
        req.query
      );

      res.send(response);
    } catch (error) {
      console.error("Error fetching user orders:", error);
      errorHandler(error, res);
    }
  }

  async updateOrderStatus(
    req: AuthenticatedTypedRequest<{ status: OrderStatus }>,
    res: Response
  ) {
    try {
      if (req.user!.role !== "admin") {
        res.status(403).send({ message: "Forbidden" });
      }
      const response = await orderService.updateOrderStatus(
        req.params.id,
        req.body.status
      );

      res.send(response);
    } catch (error) {
      console.error("Error updating order status:", error);
      errorHandler(error, res);
    }
  }
}

export default new OrderController();
