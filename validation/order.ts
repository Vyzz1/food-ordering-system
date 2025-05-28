import Joi from "joi";
import { orderStatusEnum } from "../schemas";

const orderItemOptionsRequestSchema = Joi.object({
  optionGroupId: Joi.string().uuid().required(),
  optionItemId: Joi.string().uuid().required(),
});

const orderItemRequestSchema = Joi.object({
  menuItemId: Joi.string().uuid().required(),
  quantity: Joi.number().integer().min(1).required(),
  unitPrice: Joi.number().precision(2).min(0).required(),
  orderItemsOptions: Joi.array()
    .items(orderItemOptionsRequestSchema)
    .required(),
});

export const orderRequestSchema = Joi.object<OrderRequest>({
  addressId: Joi.string().uuid().required(),
  shippingFee: Joi.number().precision(2).min(0).required(),
  paymentMethod: Joi.string().valid("stripe", "cod", "paypal").required(),
  orderItems: Joi.array().items(orderItemRequestSchema).min(1).required(),
});

export const updateOrderStatusSchema = Joi.object({
  currentStatus: Joi.string().valid(orderStatusEnum).required(),
  note: Joi.string().trim().max(500).optional().allow(""),
});

export const userOrderFilterSchema = Joi.object<UserOrderFilterRequest>({
  page: Joi.number().integer().min(0).default(1),
  limit: Joi.number().integer().min(1).max(100).default(3),
  status: Joi.string().optional(),
  sort: Joi.string().optional(),
  keyword: Joi.string().trim().max(100).optional().allow(""),
});
