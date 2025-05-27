import { Request, Response } from "express";
import { AuthenticatedRequest, AuthenticatedTypedRequest } from "../types/auth";
import { TypedRequestBody, TypedRequestQuery } from "../types/express";
import errorHandler from "../utils/error";
import ratingService from "../services/rating.service";

class RatingController {
  async createRating(
    req: AuthenticatedTypedRequest<RatingRequest>,
    res: Response
  ) {
    try {
      const userId = req.user?.userId;

      const rating = await ratingService.createRating(userId!, req.body);

      res.status(201).json({
        rating,
      });
    } catch (error) {
      errorHandler(error, res);
    }
  }

  async getStatis(req: Request, res: Response) {
    try {
      const { foodId } = req.params;

      const statis = await ratingService.getStatis(foodId);

      res.status(200).json(statis);
    } catch (error) {
      errorHandler(error, res);
    }
  }

  async getRatings(req: TypedRequestQuery<FilterRatingRequest>, res: Response) {
    try {
      const { foodId } = req.params;

      const ratings = await ratingService.getReviewForFood(foodId, req.query);

      res.status(200).json(ratings);
    } catch (error) {
      errorHandler(error, res);
    }
  }
}

export default new RatingController();
