import Joi from "joi";

export const cartRequestSchema = Joi.object({
  quantity: Joi.number().integer().min(1).required(),
  menuItemId: Joi.string().uuid().required(),
  options: Joi.array()
    .items(
      Joi.object({
        optionGroupId: Joi.string().uuid().required(),
        optionIds: Joi.array().items(Joi.string().uuid()).required(),
      })
    )
    .required()
    .min(1),
});

export const quantityUpdateSchema = Joi.object({
  quantity: Joi.number().integer().min(1).required(),
});
