import { Response } from "express";
import userService from "../services/user.service";
import { AuthenticatedRequest, AuthenticatedTypedRequest } from "../types/auth";
import errorHandler from "../utils/error";
import { TypedRequestParams } from "../types/express";

class UserController {
  async changePassword(
    req: AuthenticatedTypedRequest<ChangePasswordRequest>,
    res: Response
  ) {
    try {
      await userService.changePassword(req?.user!.userId, req.body);

      res.status(200).send({ message: "Password updated successfully" });
    } catch (error) {
      errorHandler(error, res);
    }
  }

  async changePhotoUrl(
    req: AuthenticatedTypedRequest<ChangePhotoUrlRequest>,
    res: Response
  ) {
    try {
      const { photoUrl } = req.body;

      const result = await userService.changePhotoUrl(
        req?.user!.userId,
        photoUrl
      );

      res.status(200).send({ ...result });
    } catch (error) {
      errorHandler(error, res);
    }
  }

  async getUserInfo(req: AuthenticatedRequest, res: Response) {
    try {
      const user = await userService.getUserById(req?.user!.userId);

      res.status(200).send(user);
    } catch (error) {
      errorHandler(error, res);
    }
  }

  async changeUserInformation(
    req: AuthenticatedTypedRequest<ChangeInformationRequest>,
    res: Response
  ) {
    try {
      const userId = req?.user!.userId;
      const response = await userService.changeInformation(userId, req.body);

      res.status(200).send(response);
    } catch (error) {
      errorHandler(error, res);
    }
  }
  async getAllUsers(
    req: AuthenticatedTypedRequest<{}, AdminFilterUserRequest>,
    res: Response
  ) {
    try {
      const response = await userService.getAllUsers(req.query);

      res.send(response);
    } catch (error) {
      console.error("Error fetching all users:", error);
      errorHandler(error, res);
    }
  }

  async handleBanUser(req: TypedRequestParams<{ id: string }>, res: Response) {
    try {
      const userId = req.params.id;
      const response = await userService.banUser(userId);

      res.status(200).send(response);
    } catch (error) {
      console.error("Error banning user:", error);
      errorHandler(error, res);
    }
  }

  async handleUnBanUser(
    req: TypedRequestParams<{ id: string }>,
    res: Response
  ) {
    try {
      const userId = req.params.id;
      const response = await userService.unbanUser(userId);

      res.status(200).send(response);
    } catch (error) {
      console.error("Error banning user:", error);
      errorHandler(error, res);
    }
  }

  async deleteUser(req: TypedRequestParams<{ id: string }>, res: Response) {
    try {
      const userId = req.params.id;
      await userService.deleteUser(userId);

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting user:", error);
      errorHandler(error, res);
    }
  }
}

export default new UserController();
