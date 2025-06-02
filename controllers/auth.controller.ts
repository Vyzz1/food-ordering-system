import { Request, Response } from "express";
import authService from "../services/auth.service";
import errorHandler from "../utils/error";
import { TypedRequest } from "../types/express";

class AuthController {
  async register(
    req: TypedRequest<{ TBody: CreateUserRequest }>,
    res: Response
  ) {
    try {
      const response = await authService.register(req.body);

      res.status(201).send(response);
    } catch (error) {
      errorHandler(error, res);
    }
  }

  async login(req: TypedRequest<{ TBody: LoginRequest }>, res: Response) {
    try {
      const response = await authService.login(
        req.body.email,
        req.body.password
      );

      if ("user" in response) {
        res.cookie("refreshToken", response.refreshToken, {
          httpOnly: true,
          secure: true,
          path: "/",
          sameSite: "none",
        });

        response.user.password = "";

        res.status(200).send({
          ...response.user,
          accessToken: response.accessToken,
        });
      } else {
        res.send(response);
      }
    } catch (error) {
      errorHandler(error, res);
    }
  }

  async verifyAccount(req: Request, res: Response) {
    try {
      const response = await authService.verifyAccount(req.body);

      if (!response) {
        return res.status(400).send({ message: "Invalid token or OTP" });
      }

      response.user.password = "";

      res.cookie("refreshToken", response.refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        path: "/",
      });

      res.status(200).send({
        ...response.user,
        accessToken: response.accessToken,
      });
    } catch (error) {
      errorHandler(error, res);
    }
  }

  async refreshToken(req: Request, res: Response) {
    try {
      const refreshToken = req.cookies.refreshToken;

      const response = await authService.refreshToken(refreshToken);

      res.status(200).send({
        accessToken: response.accessToken,
      });
    } catch (error) {
      errorHandler(error, res);
    }
  }
  async logout(req: Request, res: Response) {
    try {
      const refreshToken = req.cookies.refreshToken;

      await authService.logout(refreshToken);

      res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        path: "/",
      });

      res.status(200).send({ message: "Logged out successfully" });
    } catch (error) {
      errorHandler(error, res);
    }
  }

  async resendOTP(req: Request, res: Response) {
    try {
      const { email } = req.body;

      const response = await authService.resendOTP(email);

      res.status(200).send(response);
    } catch (error) {
      errorHandler(error, res);
    }
  }
}

export default new AuthController();
