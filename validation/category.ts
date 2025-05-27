import Joi from "joi";

export const categorySchema = Joi.object({
  name: Joi.string().min(3).max(255).required().messages({
    "string.min": "Category name must be at least 3 characters long",
    "string.max": "Category name must not exceed 255 characters",
  }),
  imageUrl: Joi.string().uri().required(),
});
