import { Router } from "express";
import foodController from "../controllers/food.controller";
import validateJWT from "../middlewares/validateJWT";
import validateRole from "../middlewares/validateRole";
import validateSchema from "../middlewares/validateSchema";
import {
  adminFilterFoodSchema,
  filterFoodRequestSchema,
} from "../validation/food";

const foodRoute = Router();

foodRoute.get(
  "/filter",
  validateSchema(filterFoodRequestSchema, "query"),
  foodController.getFoodByFilter
);
foodRoute.get(
  "/",
  validateSchema(adminFilterFoodSchema, "query"),
  foodController.getFoodByFilter
);

foodRoute.post("/", foodController.createFood);

foodRoute.get("/homepage", foodController.getHomePageFood);

foodRoute.patch(
  "/change-status/:foodId",
  validateJWT,
  validateRole("admin"),
  foodController.updateStatus
);
foodRoute.patch("/:foodId", foodController.updateMenuItem);
foodRoute.get("/:foodId", foodController.getFoodById);

foodRoute.delete("/:foodId", foodController.deleteFood);

export default foodRoute;
