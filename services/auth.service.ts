import { db } from "../db";

import { eq } from "drizzle-orm";
import { AddressTable, OTPVertifyTable, UserTable } from "../schemas";
import jwt from "jsonwebtoken";

import bcrypt from "bcrypt";
import otpService from "./otp.service";
import { v4 as uuidv4 } from "uuid";
import redis from "../redis";

class AuthService {
  private getLoginResponse(user: typeof UserTable.$inferInsert) {
    const refreshJTI = uuidv4();

    const accessToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.ACCESS_TOKEN_SECRET as string,
      { expiresIn: "30m" }
    );

    const refreshToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.REFRESH_TOKEN_SECRET as string,
      { expiresIn: "1d", jwtid: refreshJTI }
    );

    redis.setex(`rt:${user.id}:${refreshJTI}`, 24 * 60 * 60, "valid");

    return {
      user,
      accessToken,
      refreshToken,
    };
  }

  async login(email: string, password: string) {
    try {
      const user = await db.query.UserTable.findFirst({
        where: eq(UserTable.email, email),
        columns: {
          createdAt: false,
        },
      }).execute();

      if (!user) {
        throw new Error("User not found");
      }

      if (user.lockoutEnd) {
        throw new Error("Account is locked. Please try again later.");
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        throw new Error("Invalid password");
      }

      if (!user.emailVerified) {
        return await otpService.sendVerificationEmail(email, user.id);
      }

      return this.getLoginResponse(user);
    } catch (error) {
      throw error;
    }
  }

  async register(request: CreateUserRequest) {
    try {
      const {
        email,
        password,
        dateOfBirth,
        fullName,
        phoneNumber,
        gender,
        address,
      } = request;

      const findExistingEmail = await db.query.UserTable.findFirst({
        where: eq(UserTable.email, email),
      });
      if (findExistingEmail) {
        throw new Error("This email already exists");
      }

      const hashPassword = await bcrypt.hash(password, 10);

      const newUser = await db
        .insert(UserTable)
        .values({
          email,
          fullName,
          role: "customer",
          dateOfBirth,
          gender,
          password: hashPassword,
        })
        .returning({
          id: UserTable.id,
        });

      await db.insert(AddressTable).values({
        fullAddress: address,
        fullName,
        phoneNumber,
        userId: newUser[0].id,
        isDefault: true,
        specificAddress: "",
      });

      return await otpService.sendVerificationEmail(email, newUser[0].id);
    } catch (error) {
      throw error;
    }
  }

  async logout(refreshToken?: string) {
    try {
      const now = Math.floor(Date.now() / 1000);

      if (refreshToken) {
        try {
          const decodedRefresh = jwt.verify(
            refreshToken,
            process.env.REFRESH_TOKEN_SECRET as string
          ) as any;

          if (decodedRefresh && decodedRefresh.jti) {
            await redis.del(
              `rt:${decodedRefresh.userId}:${decodedRefresh.jti}`
            );

            const refreshTTL = decodedRefresh.exp - now;
            if (refreshTTL > 0) {
              await redis.setex(
                `bl:jti:${decodedRefresh.jti}`,
                refreshTTL,
                "revoked"
              );
            }
          }
        } catch (error) {
          throw new Error("Invalid refresh token");
        }
      }

      return {
        message: "Logout successful",
      };
    } catch (error) {
      throw error;
    }
  }

  async refreshToken(refreshToken: string) {
    try {
      if (!refreshToken) {
        throw new Error("Refresh token is required");
      }

      const decodedRefresh = jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET as string
      ) as any;

      if (!decodedRefresh || !decodedRefresh.jti) {
        throw new Error("Invalid refresh token");
      }

      const isRevoked = await redis.get(`bl:jti:${decodedRefresh.jti}`);

      if (isRevoked) {
        throw new Error("Refresh token has been revoked");
      }

      const user = await db.query.UserTable.findFirst({
        where: eq(UserTable.id, decodedRefresh.userId),
      });

      if (!user) {
        throw new Error("User not found");
      }

      const accessToken = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.ACCESS_TOKEN_SECRET as string,
        { expiresIn: "30m" }
      );

      return {
        accessToken,
      };
    } catch (error) {
      throw error;
    }
  }

  async verifyAccount(request: VerifyAccountRequest) {
    try {
      const { token, otp } = request;

      const user = await otpService.verfiyOTP(token, otp);

      return this.getLoginResponse(user);
    } catch (error) {
      throw error;
    }
  }

  async resendOTP(email: string) {
    try {
      const user = await db.query.UserTable.findFirst({
        where: eq(UserTable.email, email),
        columns: {
          id: true,
          email: true,
        },
      }).execute();

      if (!user) {
        throw new Error("User not found");
      }

      await db
        .delete(OTPVertifyTable)
        .where(eq(OTPVertifyTable.userId, user.id));

      return await otpService.sendVerificationEmail(email, user.id);
    } catch (error) {
      throw error;
    }
  }
}

export default new AuthService();
