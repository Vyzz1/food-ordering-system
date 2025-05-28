import { db } from "../db";
import redis from "../redis";
import { CategoryTable } from "../schemas";
import { eq } from "drizzle-orm";
class CategoryService {
  async addCategory(request: CategoryRequest) {
    try {
      const findExits = await db.query.CategoryTable.findFirst({
        where: (table, { eq }) => eq(table.name, request.name),
      });

      if (findExits) {
        throw new Error(`Category with name ${name} already exists`);
      }

      const newCategory = await db
        .insert(CategoryTable)
        .values(request)
        .returning();

      await this.invalidateCache();

      return newCategory[0];
    } catch (error) {
      throw error;
    }
  }

  async getAllCategories() {
    try {
      const cachedKey = "categories";

      const cachedCategories = await redis.get(cachedKey);

      if (cachedCategories) {
        return cachedCategories;
      }
      const categories = await db.query.CategoryTable.findMany({
        orderBy: (table, { desc }) => desc(table.name),
      });

      await redis.set(cachedKey, JSON.stringify(categories), {
        ex: 60 * 60 * 24,
      });

      return categories;
    } catch (error) {
      throw error;
    }
  }

  private async invalidateCache() {
    try {
      const cachedKey = "categories";
      await redis.del(cachedKey);
    } catch (error) {
      console.error("Error invalidating cache:", error);
    }
  }

  async updateCategory(id: string, request: CategoryRequest) {
    try {
      const findExits = await db.query.CategoryTable.findFirst({
        where: (table, { and, ne, eq }) =>
          and(eq(table.name, request.name), ne(table.id, id)),
      });

      if (findExits) {
        throw new Error(`Category with name ${name} already exists`);
      }

      const updatedCategory = await db
        .update(CategoryTable)
        .set(request)
        .where(eq(CategoryTable.id, id))
        .returning();

      await this.invalidateCache();

      return updatedCategory[0];
    } catch (error) {
      throw error;
    }
  }

  async deleteCategory(id: string) {
    try {
      const findExits = await db.query.CategoryTable.findFirst({
        where: eq(CategoryTable.id, id),
      });

      if (!findExits) {
        throw new Error(`Category with id ${id} does not exist`);
      }

      const deletedCategory = await db
        .delete(CategoryTable)
        .where(eq(CategoryTable.id, id))
        .returning();

      await this.invalidateCache();

      return deletedCategory[0];
    } catch (error) {
      throw error;
    }
  }
}

export const categoryService = new CategoryService();
