import Joi from "joi";

export const ratingRequestSchema = Joi.object<RatingRequest>({
  orderItemId: Joi.string().uuid().required(),
  rating: Joi.number().integer().min(1).max(5).required(),
  content: Joi.string().trim().max(500).min(10).required(),
  images: Joi.array()
    .items(Joi.string().uri().max(500).required())
    .optional()
    .default([]),
  menuItemId: Joi.string().uuid().required(),
});

export const filterRatingRequestSchema = Joi.object<FilterRatingRequest>({
  menuItemId: Joi.string().uuid().optional(),
  page: Joi.number().integer().min(0).default(0),
  limit: Joi.number().integer().min(1).max(100).default(10),
  filterBy: Joi.string().optional(),
  sortBy: Joi.string().optional(),
});
