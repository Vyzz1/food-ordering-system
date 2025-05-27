import { Response } from "express";
import { TypedRequestBody } from "../types/express";
import errorHandler from "../utils/error";
import passwordService from "../services/password.service";

class PasswordController {
  async sendOTP(req: TypedRequestBody<ForgotPasswordRequest>, res: Response) {
    try {
      const response = await passwordService.handleSendOTP(req.body.email);

      res.status(200).send(response);
    } catch (error) {
      errorHandler(error, res);
    }
  }

  async validateOTP(
    req: TypedRequestBody<ForgotPasswordRequest>,
    res: Response
  ) {
    try {
      const { token, otp } = req.body;

      const response = await passwordService.handleVerifyOTP(token, otp);

      res.status(200).send(response);
    } catch (error) {
      errorHandler(error, res);
    }
  }

  async resetPassword(
    req: TypedRequestBody<ForgotPasswordRequest>,
    res: Response
  ) {
    try {
      const { token, password } = req.body;

      await passwordService.handleResetPassword(token, password);

      res.status(200).send({ message: "Password reset successfully" });
    } catch (error) {
      errorHandler(error, res);
    }
  }
}

export default new PasswordController();
