import { Response } from "express";
import { AuthenticatedTypedRequest } from "../types/auth";
import errorHandler from "../utils/error";
import orderService from "../services/order.service";
import paymentService from "../services/payment.service";
import { TypedRequest } from "../types/express";

class OrderController {
  async getOrdersByFoodId(
    req: TypedRequest<{ TParams: { foodId: string } }>,
    res: Response
  ) {
    try {
      const foodId = req.params.foodId;
      const response = await orderService.getOrdersByFoodId(foodId);

      res.status(200).send(response);
    } catch (error) {
      console.error("Error fetching orders by food ID:", error);
      errorHandler(error, res);
    }
  }
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

  async getOrderById(
    req: TypedRequest<{ TParams: { id: string } }>,
    res: Response
  ) {
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

  async getUserOrdersForAdmin(
    req: TypedRequest<{ TParams: { userId: string } }>,
    res: Response
  ) {
    try {
      const userId = req.params.userId;
      const response = await orderService.getUserOrdersForAdmin(userId);

      res.status(200).send(response);
    } catch (error) {
      console.error("Error fetching user orders for admin:", error);
      errorHandler(error, res);
    }
  }
}

export default new OrderController();
