import { Request, Response } from "express";
import { categoryService } from "../services/category.service";
import errorHandler from "../utils/error";
import { TypedRequestBody } from "../types/express";

class CategoryController {
  async getAllCategories(req: Request, res: Response) {
    try {
      const categories = await categoryService.getAllCategories();
      res.status(200).json(categories);
    } catch (error) {
      errorHandler(error, res);
    }
  }

  async createCategory(req: TypedRequestBody<CategoryRequest>, res: Response) {
    try {
      const newCategory = await categoryService.addCategory(req.body);
      res.status(201).json(newCategory);
    } catch (error) {
      errorHandler(error, res);
    }
  }

  async deleteCategory(req: Request, res: Response) {
    try {
      const { id } = req.params;

      await categoryService.deleteCategory(id);
      res.status(204).send();
    } catch (error) {
      errorHandler(error, res);
    }
  }

  async updateCategory(req: TypedRequestBody<CategoryRequest>, res: Response) {
    try {
      const { id } = req.params;
      const updatedCategory = await categoryService.updateCategory(
        id,
        req.body
      );
      res.status(200).json(updatedCategory);
    } catch (error) {
      errorHandler(error, res);
    }
  }
}

export const categoryController = new CategoryController();
