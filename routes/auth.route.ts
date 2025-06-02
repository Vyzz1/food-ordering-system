import { Router, RequestHandler } from "express";
import validateSchema from "../middlewares/validateSchema";
import { createUserSchema, loginUserSchema } from "../validation/auth";
import authController from "../controllers/auth.controller";

const authRouter = Router();

authRouter.post(
  "/register",
  validateSchema(createUserSchema),
  authController.register as RequestHandler
);

authRouter.post(
  "/login",
  validateSchema(loginUserSchema),
  authController.login as RequestHandler
);
authRouter.post(
  "/verify-account",
  authController.verifyAccount as RequestHandler
);

authRouter.post("/resend-otp", authController.resendOTP as RequestHandler);

authRouter.get("/refresh", authController.refreshToken);

authRouter.get("/logout", authController.logout as RequestHandler);

export default authRouter;
