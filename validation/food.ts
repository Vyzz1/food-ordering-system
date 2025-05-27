import Joi from "joi";

export const filterFoodRequestSchema = Joi.object({
  search: Joi.string().optional(),
  categoriesIds: Joi.alternatives()
    .try(Joi.array().items(Joi.string()), Joi.string())
    .optional(),
  page: Joi.number().integer().min(0).optional(),
  limit: Joi.number().integer().min(1).optional(),
  fromPrice: Joi.number().min(0).optional(),
  toPrice: Joi.number().min(0).optional(),
  sort: Joi.string().optional(),
  rating: Joi.string().optional(),
});

export const adminFilterFoodSchema = filterFoodRequestSchema.keys({
  isActives: Joi.alternatives().try(
    Joi.array().items(Joi.boolean()),
    Joi.boolean()
  ),
});
