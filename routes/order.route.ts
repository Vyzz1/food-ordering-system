import { Router } from "express";
import orderController from "../controllers/order.controller";
import validateJWT from "../middlewares/validateJWT";
import validateSchema from "../middlewares/validateSchema";
import { orderRequestSchema, userOrderFilterSchema } from "../validation/order";
import validateRole from "../middlewares/validateRole";

const orderRoute = Router();

orderRoute.use(validateJWT);

orderRoute.post(
  "/",
  validateSchema(orderRequestSchema),
  orderController.createOrder
);

orderRoute.get("/admin", validateRole("admin"), orderController.getAllOrders);
orderRoute.get(
  "/me",
  validateSchema(userOrderFilterSchema, "query"),
  orderController.getUserOrder
);

orderRoute.get(
  "/user/:userId",
  validateRole("admin"),
  orderController.getUserOrdersForAdmin
);

orderRoute.get(
  "/food/:foodId",
  validateRole("admin"),
  orderController.getOrdersByFoodId
);

orderRoute.patch(
  "/:id",
  validateRole("admin"),
  orderController.updateOrderStatus
);

orderRoute.get("/:id", orderController.getOrderById);

export default orderRoute;
