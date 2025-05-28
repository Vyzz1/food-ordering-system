import { db } from "../db";
import { PagedResult } from "../models/paged-result";
import redis from "../redis";
import {
  CategoryTable,
  FoodTable,
  ItemOptionTable,
  OptionGroupTable,
} from "../schemas";
import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  inArray,
  like,
  lte,
  or,
} from "drizzle-orm";
import uploadService from "./upload.service";
class FoodService {
  async getHomePageFood() {
    const bestSellings = await db.query.FoodTable.findMany({
      where: eq(FoodTable.isActive, true),
      orderBy: desc(FoodTable.soldCount),
      limit: 6,
      with: {
        category: true,
      },
    });

    const mostRated = await db.query.FoodTable.findMany({
      where: eq(FoodTable.isActive, true),
      orderBy: desc(FoodTable.averageRating),
      limit: 6,
      with: {
        category: true,
      },
    });

    return {
      bestSellings,
      mostRated,
    };
  }
  async createFood(food: FoodItemRequest) {
    const category = await db.query.CategoryTable.findFirst({
      where: (categoryTable, { eq }) => eq(categoryTable.id, food.categoryId),
    });

    if (!category) {
      throw new Error("Category not found");
    }

    if (food.optionGroups && food.optionGroups.length > 0) {
      this.validateOptionGroups(food.optionGroups);
    }

    const [menuItem] = await db.insert(FoodTable).values(food).returning();

    if (!food.optionGroups || food.optionGroups.length === 0) {
      return {
        ...menuItem,
        optionGroups: [],
      };
    }

    const optionGroups = [];

    for (const optionGroupData of food.optionGroups) {
      const [optionGroup] = await db
        .insert(OptionGroupTable)
        .values({ ...optionGroupData, foodId: menuItem.id })
        .returning();

      const optionPromises = optionGroupData.options!.map((option) =>
        db
          .insert(ItemOptionTable)
          .values({
            ...option,
            optionGroupId: optionGroup.id,
          })
          .returning()
      );

      const insertedOptions = await Promise.all(optionPromises);
      const flattenedOptions = insertedOptions.map(([option]) => option);

      optionGroups.push({
        ...optionGroup,
        options: flattenedOptions,
      });
    }

    return {
      ...menuItem,
      optionGroups,
    };
  }

  private validateOptionGroups(optionGroups: any[]) {
    for (const og of optionGroups) {
      if (!og.options || og.options.length === 0) {
        throw new Error("Option group must have at least one option");
      }

      if (og.required && og.multiple) {
        throw new Error(
          "Required option group cannot have multiple selections"
        );
      }

      if (og.multiple) {
        if (og.freeLimit <= 0 || og.freeLimit > og.options.length) {
          throw new Error(
            "Free limit must be greater than 0 and less than or equal to the number of options"
          );
        }
      }

      if (og.required && og.freeLimit > 0) {
        throw new Error("Required option groups cannot have a free limit");
      }
    }
  }

  async getFoodById(foodId: string) {
    try {
      const cacheKey = `food:${foodId}`;

      const cachedFood = await redis.get<string | null>(cacheKey);

      if (cachedFood) {
        console.log(`Cache hit for food ID: ${foodId}`);

        return cachedFood;
      }

      const food = await db.query.FoodTable.findFirst({
        where: (foodTable, { eq }) => eq(foodTable.id, foodId),
        with: {
          category: true,
          optionGroups: {
            orderBy: (optionGroupTable, { asc }) =>
              asc(optionGroupTable.sequence),
            with: {
              options: {
                orderBy: (itemOptionTable, { asc }) =>
                  asc(itemOptionTable.sequence),
              },
            },
          },
        },
      });

      if (!food) {
        throw new Error("Food item not found");
      }

      await redis.set(cacheKey, JSON.stringify(food), { ex: 3600 });

      return food;
    } catch (error) {
      console.error(`Error fetching food with ID ${foodId}:`, error);
      throw error;
    }
  }

  async invalidateFoodCache(foodId: string): Promise<void> {
    const cacheKey = `food:${foodId}`;
    await redis.del(cacheKey);
  }

  async deleteFood(foodId: string) {
    const food = await db.query.FoodTable.findFirst({
      where: (foodTable, { eq }) => eq(foodTable.id, foodId),
    });

    if (!food) {
      throw new Error("Food item not found");
    }

    await this.invalidateFoodCache(foodId);

    await db.delete(FoodTable).where(eq(FoodTable.id, foodId));

    return { message: "Food item deleted successfully" };
  }
  async updateMenuItem(menuItemId: string, menuItemRequest: FoodItemRequest) {
    const menuItem = await db.query.FoodTable.findFirst({
      where: eq(FoodTable.id, menuItemId),
      with: {
        category: true,
        optionGroups: {
          with: {
            options: true,
          },
        },
      },
    });

    if (!menuItem) {
      throw new Error("Menu item not found");
    }

    // Update basic menu item fields including images
    await db
      .update(FoodTable)
      .set({
        name: menuItemRequest.name,
        description: menuItemRequest.description,
        costPrice: menuItemRequest.costPrice,
        sellingPrice: menuItemRequest.sellingPrice,
        timeEstimate: menuItemRequest.timeEstimate,
        images: menuItemRequest.images,
      })
      .where(eq(FoodTable.id, menuItemId));

    // Handle category update
    if (menuItemRequest.categoryId !== menuItem.categoryId) {
      const category = await db.query.CategoryTable.findFirst({
        where: eq(CategoryTable.id, menuItemRequest.categoryId),
      });

      if (!category) {
        throw new Error("Category not found");
      }

      await db
        .update(FoodTable)
        .set({ categoryId: menuItemRequest.categoryId })
        .where(eq(FoodTable.id, menuItemId));
    }

    if (menuItemRequest.optionGroups) {
      await this.updateOptionGroups(
        menuItemId,
        menuItem,
        menuItemRequest.optionGroups
      );
    }

    return {
      message: "Menu item updated successfully",
    };
  }

  private async updateOptionGroups(
    menuItemId: string,
    existingMenuItem: any,
    requestOptionGroups: OptionGroupRequest[]
  ) {
    const existingOptionIds =
      existingMenuItem.optionGroups?.flatMap(
        (og: any) => og.options?.map((o: any) => o.id) || []
      ) || [];

    const requestOptionIds = requestOptionGroups.flatMap(
      (og) => og.options?.filter((o) => o.id).map((o) => o.id!) || []
    );

    const optionsToRemove = existingOptionIds.filter(
      (id: string) => !requestOptionIds.includes(id)
    );

    if (optionsToRemove.length > 0) {
      await db
        .delete(ItemOptionTable)
        .where(inArray(ItemOptionTable.id, optionsToRemove));
    }

    const existingOptionGroupIds =
      existingMenuItem.optionGroups?.map((og: any) => og.id) || [];
    const requestOptionGroupIds = requestOptionGroups
      .filter((og) => og.id)
      .map((og) => og.id!);

    const optionGroupsToRemove = existingOptionGroupIds.filter(
      (id: string) => !requestOptionGroupIds.includes(id)
    );

    if (optionGroupsToRemove.length > 0) {
      await db
        .delete(OptionGroupTable)
        .where(inArray(OptionGroupTable.id, optionGroupsToRemove));
    }

    for (const optionGroupRequest of requestOptionGroups) {
      let optionGroupId: string;

      if (optionGroupRequest.id) {
        const existingOptionGroup = existingMenuItem.optionGroups?.find(
          (og: any) => og.id === optionGroupRequest.id
        );

        if (!existingOptionGroup) {
          throw new Error(
            `Option Group with ID ${optionGroupRequest.id} not found`
          );
        }

        await db
          .update(OptionGroupTable)
          .set({
            name: optionGroupRequest.name,
            required: optionGroupRequest.required,
            multiple: optionGroupRequest.multiple,
            freeLimit: optionGroupRequest.freeLimit,
            sequence: optionGroupRequest.sequence,
          })
          .where(eq(OptionGroupTable.id, optionGroupRequest.id));

        optionGroupId = optionGroupRequest.id;
      } else {
        const [newOptionGroup] = await db
          .insert(OptionGroupTable)
          .values({
            name: optionGroupRequest.name,
            required: optionGroupRequest.required,
            multiple: optionGroupRequest.multiple,
            freeLimit: optionGroupRequest.freeLimit,
            sequence: optionGroupRequest.sequence,
            foodId: menuItemId,
          })
          .returning();

        optionGroupId = newOptionGroup.id;
      }

      if (optionGroupRequest.options) {
        await this.updateOptions(optionGroupId, optionGroupRequest.options);
      }
    }

    await this.invalidateFoodCache(menuItemId);
  }

  private async updateOptions(
    optionGroupId: string,
    requestOptions: ItemOptionRequest[]
  ) {
    for (const optionRequest of requestOptions) {
      if (optionRequest.id) {
        await db
          .update(ItemOptionTable)
          .set({
            optionName: optionRequest.optionName,
            additionalPrice: optionRequest.additionalPrice,
            sequence: optionRequest.sequence,
          })
          .where(eq(ItemOptionTable.id, optionRequest.id));
      } else {
        await db.insert(ItemOptionTable).values({
          optionName: optionRequest.optionName,
          additionalPrice: optionRequest.additionalPrice,
          sequence: optionRequest.sequence,
          optionGroupId: optionGroupId,
        });
      }
    }
  }

  async getFoodTableList(request: AdminFilterRequest) {
    const whereConditions = [];

    if (request.search) {
      whereConditions.push(
        or(
          like(FoodTable.name, `%${request.search}%`),
          like(FoodTable.description, `%${request.search}%`)
        )
      );
    }

    if (typeof request.categoriesIds === "string") {
      request.categoriesIds = [request.categoriesIds];
    }
    if (request.categoriesIds && request.categoriesIds.length > 0) {
      whereConditions.push(
        inArray(FoodTable.categoryId, request.categoriesIds)
      );
    }

    if (request.rating && request.rating !== "default") {
      switch (request.rating) {
        case "BELOW_3":
          whereConditions.push(lte(FoodTable.averageRating, 3));
          break;
        case "BETWEEN_3_AND_4":
          whereConditions.push(
            and(
              gte(FoodTable.averageRating, 3),
              lte(FoodTable.averageRating, 4)
            )
          );
          break;
        case "BETWEEN_4_AND_5":
          whereConditions.push(
            and(
              gte(FoodTable.averageRating, 4),
              lte(FoodTable.averageRating, 5)
            )
          );
          break;
      }
    }

    if (request.fromPrice !== undefined && request.toPrice !== undefined) {
      whereConditions.push(
        and(
          gte(FoodTable.sellingPrice, request.fromPrice),
          lte(FoodTable.sellingPrice, request.toPrice)
        )
      );
    }
    if (!!request.isActives) {
      if (
        typeof request.isActives === "boolean" ||
        typeof request.isActives === "string"
      ) {
        request.isActives = [request.isActives];
      }
      whereConditions.push(inArray(FoodTable.isActive, request.isActives));
    }

    const whereClause =
      whereConditions.length > 0 ? and(...whereConditions) : undefined;

    let orderByClause;
    if (request.sort && request.sort !== "default") {
      switch (request.sort) {
        case "selling_asc":
          orderByClause = asc(FoodTable.sellingPrice);
          break;
        case "selling_desc":
          orderByClause = desc(FoodTable.sellingPrice);
          break;
        case "cost_asc":
          orderByClause = asc(FoodTable.costPrice);
          break;
        case "cost_desc":
          orderByClause = desc(FoodTable.costPrice);
          break;
        case "rating_desc":
          orderByClause = desc(FoodTable.averageRating);
          break;
        case "rating_asc":
          orderByClause = asc(FoodTable.averageRating);
          break;
        case "sold_asc":
          orderByClause = asc(FoodTable.soldCount);
          break;
        case "sold_desc":
          orderByClause = desc(FoodTable.soldCount);
          break;
        case "time_asc":
          orderByClause = asc(FoodTable.timeEstimate);
          break;
        case "time_desc":
          orderByClause = desc(FoodTable.timeEstimate);
          break;

        case "rating":
          orderByClause = desc(FoodTable.averageRating);
          break;
        case "price_asc":
          orderByClause = asc(FoodTable.sellingPrice);
          break;
        case "price_desc":
          orderByClause = desc(FoodTable.sellingPrice);
          break;

        case "sold":
          orderByClause = desc(FoodTable.soldCount);
          break;
        default:
          orderByClause = undefined;
          break;
      }
    }

    const page = request.page ?? 0;
    const limit = request.limit ?? 6;
    const offset = limit * page;

    try {
      const query = db
        .select({
          id: FoodTable.id,
          name: FoodTable.name,
          description: FoodTable.description,
          sellingPrice: FoodTable.sellingPrice,
          costPrice: FoodTable.costPrice,
          averageRating: FoodTable.averageRating,
          soldCount: FoodTable.soldCount,
          timeEstimate: FoodTable.timeEstimate,
          isActive: FoodTable.isActive,
          images: FoodTable.images,
          category: {
            id: CategoryTable.id,
            name: CategoryTable.name,
          },
        })
        .from(FoodTable)
        .leftJoin(CategoryTable, eq(FoodTable.categoryId, CategoryTable.id))
        .where(whereClause)
        .limit(limit)
        .offset(offset);

      if (orderByClause) {
        query.orderBy(orderByClause);
      }

      const [results, totalCountResult] = await Promise.all([
        query,
        db
          .select({ count: count() })
          .from(FoodTable)
          .leftJoin(CategoryTable, eq(FoodTable.categoryId, CategoryTable.id))
          .where(whereClause),
      ]);

      const totalCount = totalCountResult[0]?.count ?? 0;

      return new PagedResult(results, totalCount, page, limit).response;
    } catch (error) {
      console.error("Error fetching menu items:", error);
      throw new Error("Failed to fetch menu items");
    }
  }

  async changeFoodStatus(foodId: string, isActive: boolean) {
    const food = await db.query.FoodTable.findFirst({
      where: eq(FoodTable.id, foodId),
    });
    if (!food) {
      throw new Error("Food item not found");
    }

    await db
      .update(FoodTable)
      .set({ isActive })
      .where(eq(FoodTable.id, foodId));

    return {
      message: `Food item ${isActive ? "activated" : "deactivated"} successfully`,
    };
  }

  async calculateRating(foodId: string, newRating: number) {
    try {
      const food = await db.query.FoodTable.findFirst({
        where: eq(FoodTable.id, foodId),
      });

      if (!food) {
        throw new Error("Food item not found");
      }

      const updatedTotalRating = food.totalRating + 1;

      const updatedAverageRating =
        (food.averageRating * food.totalRating + newRating) /
        updatedTotalRating;

      await db
        .update(FoodTable)
        .set({
          averageRating: updatedAverageRating,
          totalRating: updatedTotalRating,
        })
        .where(eq(FoodTable.id, foodId));

      await this.invalidateFoodCache(foodId);
    } catch (error) {
      throw error;
    }
  }

  async updateSoldCount(foodId: string, quantity: number) {
    try {
      const food = await db.query.FoodTable.findFirst({
        where: eq(FoodTable.id, foodId),
      });

      if (!food) {
        throw new Error("Food item not found");
      }

      const updatedSoldCount = food.soldCount + quantity;

      await db
        .update(FoodTable)
        .set({ soldCount: updatedSoldCount })
        .where(eq(FoodTable.id, foodId));

      await this.invalidateFoodCache(foodId);
    } catch (error) {
      throw error;
    }
  }

  async uploadImage(foodId: string, imageUrl: string[]) {
    try {
      const food = await db.query.FoodTable.findFirst({
        where: eq(FoodTable.id, foodId),
      });

      if (!food) {
        throw new Error("Food item not found");
      }

      const newImages = [];

      for (const url of imageUrl) {
        const response = await uploadService.uploadFromUrl(url);
        newImages.push(response.publicUrl);
      }

      const updatedImages = [...(food.images || []), ...newImages];

      await db
        .update(FoodTable)
        .set({ images: updatedImages })
        .where(eq(FoodTable.id, foodId));

      await this.invalidateFoodCache(foodId);

      return {
        message: "Image uploaded successfully",
        images: updatedImages,
      };
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    }
  }
}

export const foodService = new FoodService();
