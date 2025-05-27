import { and, asc, count, desc, eq, sql } from "drizzle-orm";
import { db } from "../db";
import {
  FoodTable,
  OrderItemTable,
  OrderTable,
  RatingTable,
  UserTable,
} from "../schemas";
import { foodService } from "./food.service";
import { PagedResult } from "../models/paged-result";

class RatingService {
  async createRating(userId: string, request: RatingRequest) {
    try {
      const user = await db.query.UserTable.findFirst({
        where: eq(UserTable.id, userId),
      });

      if (!user) {
        throw new Error("User not found");
      }

      const menuItem = await db.query.FoodTable.findFirst({
        where: eq(FoodTable.id, request.menuItemId),
      });

      if (!menuItem) {
        throw new Error("Menu item not found");
      }

      var order = await db.query.OrderItemTable.findFirst({
        where: eq(OrderItemTable.id, request.orderItemId),
        with: {
          orderItemOptions: true,
        },
      });

      const newRating = await db
        .insert(RatingTable)
        .values({
          ...request,
          userId: user.id,
          optionItemNames: order?.orderItemOptions.map(
            (option) => option.optionItemName
          ),
          foodId: menuItem.id,
        })
        .returning();

      await db
        .update(OrderItemTable)
        .set({ isRated: true })
        .where(eq(OrderItemTable.id, request.orderItemId));

      foodService.calculateRating(menuItem.id, request.rating);

      return newRating;
    } catch (error) {
      throw error;
    }
  }

  async getStatis(foodId: string) {
    try {
      const food = await db.query.FoodTable.findFirst({
        where: eq(FoodTable.id, foodId),
      });

      if (!food) {
        throw new Error("Food not found");
      }

      return {
        totalRating: food?.totalRating || 0,
        averageRating: food?.averageRating || 0,
      };
    } catch (error) {
      throw error;
    }
  }

  async getReviewForFood(foodId: string, request: FilterRatingRequest) {
    try {
      const whereConditions = [];

      whereConditions.push(eq(RatingTable.foodId, foodId));

      if (request.filterBy && request.filterBy !== "all") {
        switch (request.filterBy) {
          case "1_STAR":
            whereConditions.push(eq(RatingTable.rating, 1));
            break;

          case "2_STAR":
            whereConditions.push(eq(RatingTable.rating, 2));
            break;
          case "3_STAR":
            whereConditions.push(eq(RatingTable.rating, 3));
            break;
          case "4_STAR":
            whereConditions.push(eq(RatingTable.rating, 4));
            break;
          case "5_STAR":
            whereConditions.push(eq(RatingTable.rating, 5));
            break;

          case "HAS_IMAGES":
            whereConditions.push(
              sql`array_length(${RatingTable.images}, 1) > 0`
            );
            break;

          default:
            break;
        }
      }

      let orderByClause;

      if (request.sortBy) {
        switch (request.sortBy) {
          case "CREATE_AT_ASC":
            orderByClause = asc(RatingTable.createdAt);

            break;
          case "CREATE_AT_DESC":
            orderByClause = desc(RatingTable.createdAt);
            break;

          default:
            orderByClause = desc(RatingTable.createdAt);
            break;
        }
      }

      const page = request.page || 0;
      const limit = request.limit || 10;
      const offset = page * limit;

      const query = db.query.RatingTable.findMany({
        where: whereConditions.length > 0 ? and(...whereConditions) : undefined,
        limit: limit,
        offset: offset,
        orderBy: [orderByClause || desc(RatingTable.createdAt)],
        with: {
          user: {
            columns: {
              fullName: true,
              photoUrl: true,
            },
          },
        },
      });

      const [results, totalCountResult] = await Promise.all([
        query,
        db
          .select({ count: count() })
          .from(RatingTable)
          .where(
            whereConditions.length > 0 ? and(...whereConditions) : undefined
          ),
      ]);

      const totalCount = totalCountResult[0]?.count || 0;

      return new PagedResult(results, totalCount, page, limit).response;
    } catch (error) {
      throw error;
    }
  }
}

export default new RatingService();
