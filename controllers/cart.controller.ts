import { Response } from "express";
import shoppingCartService from "../services/shoppingCart.service";
import { AuthenticatedRequest, AuthenticatedTypedRequest } from "../types/auth";
import errorHandler from "../utils/error";
import { TypedRequest } from "../types/express";

class ShoppingCartController {
  async addToCart(
    req: AuthenticatedTypedRequest<ShoppingCartRequest>,
    res: Response
  ) {
    try {
      const email = req.user!.email;
      const request = req.body;

      const result = await shoppingCartService.addToCartHandler(email, request);

      res.status(200).json(result);
    } catch (error) {
      errorHandler(error, res);
    }
  }

  async getCart(req: AuthenticatedRequest, res: Response) {
    try {
      const email = req.user!.email;

      const cart = await shoppingCartService.getCart(email);

      res.status(200).json(cart);
    } catch (error) {
      errorHandler(error, res);
    }
  }

  async removeFromCart(
    req: TypedRequest<{ TParams: { id: string } }>,
    res: Response
  ) {
    try {
      const { id } = req.params;

      const result = await shoppingCartService.removeItem(id);

      res.status(200).json(result);
    } catch (error) {
      errorHandler(error, res);
    }
  }

  async updateCartItem(
    req: TypedRequest<{ TBody: { quantity: number }; TParams: { id: string } }>,
    res: Response
  ) {
    try {
      const { id } = req.params;
      const { quantity } = req.body;

      const result = await shoppingCartService.updateQuantity(id, quantity);

      res.status(200).json(result);
    } catch (error) {
      errorHandler(error, res);
    }
  }
}

export default new ShoppingCartController();
