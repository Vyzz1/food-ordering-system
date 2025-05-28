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

const ItemOptionRequestSchema = Joi.object<ItemOptionRequest>({
  id: Joi.string().uuid().optional(),
  optionName: Joi.string().required(),
  additionalPrice: Joi.number().required(),
  sequence: Joi.number().required(),
});

const OptionGroupRequestSchema = Joi.object<OptionGroupRequest>({
  id: Joi.string().uuid().optional(),
  name: Joi.string().required(),
  required: Joi.boolean().required(),
  multiple: Joi.boolean().required(),
  freeLimit: Joi.number().required(),
  sequence: Joi.number().required(),
  options: Joi.array().items(ItemOptionRequestSchema).required(),
}).custom((value, helpers) => {
  const { required, multiple, freeLimit, options } = value;

  if (required === multiple) {
    return helpers.error("any.invalid", {
      message: "Required and Multiple cannot be the same value",
    });
  }

  if (freeLimit > 0) {
    if (!multiple) {
      return helpers.error("any.invalid", {
        message: "Free limit can only be set for multiple option groups",
      });
    }
  }

  if (!options || options.length <= freeLimit) {
    return helpers.error("any.invalid", {
      message: "Options must be greater than free limit",
    });
  }

  return value;
});

export const FoodItemRequestSchema = Joi.object<FoodItemRequest>({
  name: Joi.string().required(),
  description: Joi.string().required(),
  costPrice: Joi.number().required(),
  sellingPrice: Joi.number().required(),
  images: Joi.array().items(Joi.string()).required(),
  timeEstimate: Joi.number().required(),
  categoryId: Joi.string().uuid().required(),
  optionGroups: Joi.array().items(OptionGroupRequestSchema).required(),
});
