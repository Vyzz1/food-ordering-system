import { Router } from "express";
import cartController from "../controllers/cart.controller";
import validateSchema from "../middlewares/validateSchema";
import { cartRequestSchema, quantityUpdateSchema } from "../validation/cart";
import validateJWT from "../middlewares/validateJWT";

const cartRouter = Router();

cartRouter.use(validateJWT);
cartRouter.post(
  "/",
  validateSchema(cartRequestSchema),
  cartController.addToCart
);

cartRouter.get("/", cartController.getCart);

cartRouter.delete("/:id", cartController.removeFromCart);

cartRouter.patch(
  "/quantity/:id",
  validateSchema(quantityUpdateSchema),
  cartController.updateCartItem
);

export default cartRouter;
