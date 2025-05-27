import { RequestHandler, Router } from "express";
import userController from "../controllers/user.controller";
import validateJWT from "../middlewares/validateJWT";
import validateSchema from "../middlewares/validateSchema";
import { changePasswordSchema, changePhotoUrlSchema } from "../validation/auth";
import validateRole from "../middlewares/validateRole";

const userRouter = Router();

userRouter.use(validateJWT);

userRouter.post(
  "/change-password",
  validateSchema(changePasswordSchema),
  userController.changePassword
);

userRouter.post(
  "/change-avatar",
  validateSchema(changePhotoUrlSchema),
  userController.changePhotoUrl
);

userRouter.get("/me", userController.getUserInfo);

userRouter.get(
  "/get-all-user",
  validateRole("admin"),
  userController.getAllUsers
);

userRouter.delete("/:id", validateRole("admin"), userController.deleteUser);

userRouter.patch(
  "/ban/:id",
  validateRole("admin"),
  userController.handleBanUser
);

userRouter.patch(
  "/unban/:id",
  validateRole("admin"),
  userController.handleUnBanUser
);

userRouter.patch("/change-information", userController.changeUserInformation);

export default userRouter;
