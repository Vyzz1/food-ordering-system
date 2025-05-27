import { Router } from "express";
import validateJWT from "../middlewares/validateJWT";
import validateSchema from "../middlewares/validateSchema";
import {
  filterRatingRequestSchema,
  ratingRequestSchema,
} from "../validation/rating";
import ratingController from "../controllers/rating.controller";

const ratingRoute = Router({});

ratingRoute.get("/dish/:foodId/statics", ratingController.getStatis);

ratingRoute.get(
  "/dish/:foodId",
  validateSchema(filterRatingRequestSchema, "query"),
  ratingController.getRatings
);

ratingRoute.post(
  "/",
  validateSchema(ratingRequestSchema),
  ratingController.createRating
);

export default ratingRoute;
