import crypto from "crypto";
import bcrypt from "bcrypt";
import { OTPVertifyTable, UserTable } from "../schemas";
import { and, eq } from "drizzle-orm";
import { db } from "../db";
import mailer from "../utils/mailer";
class PasswordService {
  async handleSendOTP(email: string) {
    try {
      const findUser = await db.query.UserTable.findFirst({
        where: eq(UserTable.email, email),
      });

      if (!findUser) {
        throw new Error("Your email is not registered");
      }

      await db
        .delete(OTPVertifyTable)
        .where(eq(OTPVertifyTable.userId, findUser.id));

      const token = crypto.randomBytes(32).toString("hex");
      const otp = crypto.randomInt(100000, 999999).toString();

      const hashOtp = await bcrypt.hash(
        otp + "_" + process.env.OTP_HASH_SECRET_KEY,
        10
      );

      await db.insert(OTPVertifyTable).values({
        otp: hashOtp,
        token,
        userId: findUser.id,
        expiryDate: new Date(Date.now() + 3 * 60 * 1000),
      });

      mailer.sendMail(email, "FoodX - One Time Password", "otp-template", {
        otp,
      });

      return {
        token,
      };
    } catch (error) {
      throw error;
    }
  }

  async handleVerifyOTP(token: string, otp: string) {
    try {
      const findExist = await db.query.OTPVertifyTable.findFirst({
        where: and(eq(OTPVertifyTable.token, token)),
      });

      if (!findExist) {
        throw new Error("Invalid OTP or token");
      }

      if (
        !bcrypt.compareSync(
          otp + "_" + process.env.OTP_HASH_SECRET_KEY,
          findExist.otp
        )
      ) {
        throw new Error("Invalid OTP");
      }

      if (findExist.expiryDate < new Date()) {
        throw new Error("OTP has expired");
      }

      const newToken = crypto.randomBytes(32).toString("hex");

      findExist.token = newToken;

      findExist.expiryDate = new Date(Date.now() + 3 * 60 * 1000);

      await db
        .update(OTPVertifyTable)
        .set(findExist)
        .where(eq(OTPVertifyTable.id, findExist.id));

      return {
        token: newToken,
      };
    } catch (error) {
      throw error;
    }
  }

  async handleResetPassword(token: string, newPassword: string) {
    try {
      const findOtp = await db.query.OTPVertifyTable.findFirst({
        where: eq(OTPVertifyTable.token, token),
      });

      if (!findOtp) {
        throw new Error("Invalid token");
      }

      if (findOtp.expiryDate < new Date()) {
        throw new Error("Token has expired");
      }

      const user = await db.query.UserTable.findFirst({
        where: eq(UserTable.id, findOtp.userId),
      });

      if (!user) {
        throw new Error("User not found");
      }

      const hashPassword = await bcrypt.hash(newPassword, 10);

      await db
        .update(UserTable)
        .set({ password: hashPassword })
        .where(eq(UserTable.id, user.id));

      await db
        .delete(OTPVertifyTable)
        .where(eq(OTPVertifyTable.id, findOtp.id));

      return {
        message: "Password reset successfully",
      };
    } catch (error) {
      throw error;
    }
  }
}

export default new PasswordService();
