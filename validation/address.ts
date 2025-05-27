import Joi from "joi";

export const addressSchema = Joi.object({
  fullName: Joi.string().min(6).max(255).required(),
  fullAddress: Joi.string().min(10).max(500).required(),
  phoneNumber: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .messages({
      "string.pattern.base": "Phone number must be 10 digits",
    })
    .required(),
  specificAddress: Joi.string().min(3).max(500).required(),
});
