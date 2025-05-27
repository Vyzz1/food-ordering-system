import { Router } from "express";
import passwordController from "../controllers/password.controller";

const passwordRouter = Router();

passwordRouter.post("/forgot", passwordController.sendOTP);

passwordRouter.post("/validate", passwordController.validateOTP);

passwordRouter.post("/reset", passwordController.resetPassword);

export default passwordRouter;
