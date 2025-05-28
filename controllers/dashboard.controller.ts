import { Response } from "express";
import { TypedRequest } from "../types/express";
import errorHandler from "../utils/error";
import dashboardService from "../services/dashboard.service";

class DashboardController {
  async getDashboardData(
    req: TypedRequest<{ TQuery: DashboardRequest }>,
    res: Response
  ) {
    try {
      const response = await dashboardService.getDashboardData(req.query);

      res.status(200).send(response);
    } catch (error) {
      errorHandler(error, res);
    }
  }
}

export const dashboardController = new DashboardController();
