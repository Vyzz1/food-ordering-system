import {
  and,
  asc,
  count,
  desc,
  eq,
  inArray,
  isNotNull,
  isNull,
  like,
  ne,
  or,
} from "drizzle-orm";
import { db } from "../db";
import { OrderTable, UserTable } from "../schemas";
import bcrypt from "bcrypt";
import { PagedResult } from "../models/paged-result";
class UserService {
  async changePassword(userId: string, request: ChangePasswordRequest) {
    try {
      const user = await db.query.UserTable.findFirst({
        where: eq(UserTable.id, userId),
      });

      if (!user) {
        throw new Error("User not found");
      }

      const { oldPassword, newPassword } = request;

      const isOldPasswordValid = bcrypt.compareSync(oldPassword, user.password);

      if (!isOldPasswordValid) {
        throw new Error("Old password is incorrect");
      }

      const hashPassword = bcrypt.hashSync(newPassword, 10);

      const updatedUser = await db
        .update(UserTable)
        .set({ password: hashPassword })
        .where(eq(UserTable.id, userId))
        .returning();

      if (updatedUser.length === 0) {
        throw new Error("Failed to update password");
      }

      return {
        message: "Password updated successfully",
      };
    } catch (error) {
      throw error;
    }
  }

  async changePhotoUrl(userId: string, photoUrl: string) {
    try {
      const user = await db.query.UserTable.findFirst({
        where: eq(UserTable.id, userId),
      });

      if (!user) {
        throw new Error("User not found");
      }

      const updatedUser = await db
        .update(UserTable)
        .set({ photoUrl })
        .where(eq(UserTable.id, userId))
        .returning();

      if (updatedUser.length === 0) {
        throw new Error("Failed to update photo URL");
      }

      return {
        photoUrl: updatedUser[0].photoUrl,
      };
    } catch (error) {
      throw error;
    }
  }
  async getUserById(userId: string) {
    try {
      const user = await db.query.UserTable.findFirst({
        where: eq(UserTable.id, userId),
        columns: {
          emailVerified: false,
          role: false,
          password: false,
          createdAt: false,
        },
      });

      if (!user) {
        throw new Error("User not found");
      }

      return user;
    } catch (error) {
      throw error;
    }
  }

  async changeInformation(userId: string, request: ChangeInformationRequest) {
    try {
      const user = await db.query.UserTable.findFirst({
        where: eq(UserTable.id, userId),
      });

      if (!user) {
        throw new Error("User not found");
      }

      const updatedUser = await db
        .update(UserTable)
        .set(request)
        .where(eq(UserTable.id, userId))
        .returning();
      if (updatedUser.length === 0) {
        throw new Error("Failed to update user information");
      }

      return updatedUser[0];
    } catch (error) {
      throw error;
    }
  }

  async getAllUsers(request: AdminFilterUserRequest) {
    try {
      const whereConditions = [];

      whereConditions.push(ne(UserTable.role, "admin"));

      if (request.search && request.search.trim() !== "") {
        const sanitizedSearch = request.search
          .trim()
          .replace(/[%_\\]/g, "\\$&");
        whereConditions.push(
          or(
            like(UserTable.fullName, `%${sanitizedSearch}%`),
            like(UserTable.email, `%${sanitizedSearch}%`)
          )
        );
      }

      if (
        typeof request.emailConfirmed === "boolean" ||
        typeof request.emailConfirmed === "string"
      ) {
        request.emailConfirmed = [request.emailConfirmed];
      }

      if (
        typeof request.isBanned === "boolean" ||
        typeof request.isBanned === "string"
      ) {
        request.isBanned = [request.isBanned];
      }

      if (request.emailConfirmed && request.emailConfirmed.length > 0) {
        whereConditions.push(
          inArray(UserTable.emailVerified, request.emailConfirmed)
        );
      }

      if (request.isBanned && request.isBanned.length > 0) {
        whereConditions.push(inArray(UserTable.lockoutEnd, request.isBanned));
      }

      let orderByClause;
      switch (request.sort) {
        case "name_asc":
          orderByClause = asc(UserTable.fullName);
          break;
        case "name_desc":
          orderByClause = desc(UserTable.fullName);
          break;
        case "email_asc":
          orderByClause = asc(UserTable.email);
          break;
        case "email_desc":
          orderByClause = desc(UserTable.email);
          break;
        case "createdAt_asc":
          orderByClause = asc(UserTable.createdAt);
          break;
        case "createdAt_desc":
          orderByClause = desc(UserTable.createdAt);
          break;
        default:
          orderByClause = desc(UserTable.createdAt);
          break;
      }

      const page = request.page || 0;
      const limit = request.limit || 10;
      const offset = page * limit;

      if (page < 0) {
        throw new Error("Page must be non-negative");
      }
      if (limit <= 0 || limit > 100) {
        throw new Error("Limit must be between 1 and 100");
      }

      const query = db.query.UserTable.findMany({
        where: and(...whereConditions),
        limit: limit,
        offset: offset,
        orderBy: [orderByClause],
        columns: {
          password: false,
        },
      });

      const [results, totalCount] = await Promise.all([
        query,
        db
          .select({ count: count() })
          .from(UserTable)
          .where(and(...whereConditions)),
      ]);

      const total = totalCount[0]?.count || 0;

      return new PagedResult(results, total, page, limit).response;
    } catch (error) {
      console.error("Error getting all users:", error);
      throw error;
    }
  }

  async deleteUser(userId: string) {
    try {
      const user = await db.query.UserTable.findFirst({
        where: eq(UserTable.id, userId),
      });

      if (!user) {
        throw new Error("User not found");
      }

      const deletedUser = await db
        .delete(UserTable)
        .where(eq(UserTable.id, userId))
        .returning();

      if (deletedUser.length === 0) {
        throw new Error("Failed to delete user");
      }

      return {
        message: "User deleted successfully",
      };
    } catch (error) {
      console.error("Error deleting user:", error);
      throw error;
    }
  }
  async banUser(id: string) {
    try {
      const user = await db.query.UserTable.findFirst({
        where: eq(UserTable.id, id),
      });

      if (!user) {
        throw new Error("User not found");
      }

      const updatedUser = await db
        .update(UserTable)
        .set({ lockoutEnd: true })
        .where(eq(UserTable.id, id))
        .returning();

      if (updatedUser.length === 0) {
        throw new Error("Failed to ban user");
      }

      return {
        message: "User banned successfully",
      };
    } catch (error) {
      console.error("Error banning user:", error);
      throw error;
    }
  }

  async unbanUser(id: string) {
    try {
      const user = await db.query.UserTable.findFirst({
        where: eq(UserTable.id, id),
      });

      if (!user) {
        throw new Error("User not found");
      }

      const updatedUser = await db
        .update(UserTable)
        .set({ lockoutEnd: false })
        .where(eq(UserTable.id, id))
        .returning();

      if (updatedUser.length === 0) {
        throw new Error("Failed to unban user");
      }

      return {
        message: "User unbanned successfully",
      };
    } catch (error) {
      console.error("Error unbanning user:", error);
      throw error;
    }
  }
}

export default new UserService();
