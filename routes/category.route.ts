import { Router } from "express";
import { categoryController } from "../controllers/category.controller";
import validateJWT from "../middlewares/validateJWT";
import validateSchema from "../middlewares/validateSchema";
import { categorySchema } from "../validation/category";
import validateRole from "../middlewares/validateRole";

const categoryRouter = Router();

categoryRouter.get("/", categoryController.getAllCategories);

categoryRouter.use(validateJWT);
categoryRouter.use(validateRole("admin"));
categoryRouter.post(
  "/",
  validateSchema(categorySchema),
  categoryController.createCategory
);

categoryRouter.delete("/:id", categoryController.deleteCategory);

categoryRouter.put(
  "/:id",
  validateSchema(categorySchema),
  categoryController.updateCategory
);

export default categoryRouter;
