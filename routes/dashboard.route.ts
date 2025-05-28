import { Router } from "express";
import { dashboardController } from "../controllers/dashboard.controller";
import validateJWT from "../middlewares/validateJWT";
import validateRole from "../middlewares/validateRole";

const dashboardRoute = Router();

dashboardRoute.use(validateJWT);

dashboardRoute.use(validateRole("admin"));

dashboardRoute.get("/data", dashboardController.getDashboardData);

export default dashboardRoute;
