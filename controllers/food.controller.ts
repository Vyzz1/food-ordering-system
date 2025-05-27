import { Request, Response } from "express";
import {
  TypedRequestBody,
  TypedRequestFull,
  TypedRequestParams,
  TypedRequestQuery,
} from "../types/express";
import errorHandler from "../utils/error";
import { foodService } from "../services/food.service";

class FoodController {
  async createFood(req: TypedRequestBody<FoodItemRequest>, res: Response) {
    try {
      const foodResponse = await foodService.createFood(req.body);

      res.status(201).json({
        message: "Food item created successfully",
        data: foodResponse,
      });
    } catch (error) {
      errorHandler(error, res);
    }
  }
  async deleteFood(req: TypedRequestParams<{ foodId: string }>, res: Response) {
    try {
      const { foodId } = req.params;

      await foodService.deleteFood(foodId);
      res.status(204).send();
    } catch (error) {
      errorHandler(error, res);
    }
  }

  async updateMenuItem(req: TypedRequestBody<FoodItemRequest>, res: Response) {
    try {
      const { foodId } = req.params;
      const updatedMenuItem = await foodService.updateMenuItem(
        foodId,
        req.body
      );
      res.status(200).json(updatedMenuItem);
    } catch (error) {
      errorHandler(error, res);
    }
  }
  async updateStatus(
    req: TypedRequestFull<{ isActive: boolean }, { foodId: string }>,
    res: Response
  ) {
    try {
      const { foodId } = req.params;
      const updatedStatus = await foodService.changeFoodStatus(
        foodId,
        req.body.isActive
      );
      res.status(200).json(updatedStatus);
    } catch (error) {
      errorHandler(error, res);
    }
  }

  async getHomePageFood(req: Request, res: Response) {
    try {
      const foodItems = await foodService.getHomePageFood();
      res.status(200).json(foodItems);
    } catch (error) {
      console.error("Error in getHomePageFood:", error);
      errorHandler(error, res);
    }
  }

  async getFoodById(
    req: TypedRequestParams<{ foodId: string }>,
    res: Response
  ) {
    try {
      const { foodId } = req.params;
      const food = await foodService.getFoodById(foodId);
      res.status(200).json(food);
    } catch (error) {
      errorHandler(error, res);
    }
  }

  async getFoodByFilter(
    req: TypedRequestQuery<AdminFilterRequest>,
    res: Response
  ) {
    try {
      const foodItems = await foodService.getFoodTableList(req.query);
      res.status(200).json(foodItems);
    } catch (error) {
      console.error("Error in getFoodByFilter:", error);
      errorHandler(error, res);
    }
  }
}

export const foodController = new FoodController();
export default foodController;
