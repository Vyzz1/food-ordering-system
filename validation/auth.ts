import Joi from "joi";

export const createUserSchema = Joi.object({
  fullName: Joi.string().min(6).max(255).required(),
  email: Joi.string().email().required(),
  address: Joi.string().min(10).max(500).required(),
  phoneNumber: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .messages({
      "string.pattern.base": "Phone number must be 10 digits",
    })
    .required(),
  password: Joi.string().min(6).max(255).required(),
  confirmPassword: Joi.string().valid(Joi.ref("password")).required().messages({
    "any.only": "Confirm password must match the password",
  }),
  gender: Joi.string().required(),
  dateOfBirth: Joi.date().iso().required(),
});

export const loginUserSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(255).required(),
});

export const changePasswordSchema = Joi.object({
  oldPassword: Joi.string().min(6).max(255).required(),
  newPassword: Joi.string()
    .min(6)
    .max(255)
    .invalid(Joi.ref("oldPassword"))
    .messages({
      "any.invalid": "New password must be different from old password",
    })
    .required(),
  confirmPassword: Joi.string()
    .valid(Joi.ref("newPassword"))
    .required()
    .messages({
      "any.only": "Confirm  password must match the new password",
    }),
}).messages({
  "object.unknown": "Invalid field(s) provided",
  "object.base": "Invalid request format",
  "string.min": "Password must be at least 6 characters long",
  "string.max": "Password must not exceed 255 characters",
});

export const changePhotoUrlSchema = Joi.object({
  photoUrl: Joi.string().uri().required(),
});
