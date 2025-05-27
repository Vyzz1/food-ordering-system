import bcrypt from "bcrypt";
import mailer from "../utils/mailer";
import { db } from "../db";
import { OTPVertifyTable, UserTable } from "../schemas";
import { eq } from "drizzle-orm";
class OTPService {
  async verfiyOTP(token: string, otp: string) {
    try {
      const otpData = await db.query.OTPVertifyTable.findFirst({
        where: eq(OTPVertifyTable.token, token),
      });

      if (!otpData) {
        throw new Error("Invalid token");
      }

      const otpKey = process.env.OTP_HASH_SECRET_KEY as string;
      const isOtpValid = await bcrypt.compare(otp + "_" + otpKey, otpData.otp);
      if (!isOtpValid) {
        throw new Error("Invalid OTP");
      }

      if (otpData.expiryDate < new Date()) {
        await db
          .delete(OTPVertifyTable)
          .where(eq(OTPVertifyTable.token, token));
        throw new Error("OTP has expired");
      }

      await db.delete(OTPVertifyTable).where(eq(OTPVertifyTable.token, token));
      const user = await db
        .update(UserTable)
        .set({ emailVerified: true })
        .where(eq(UserTable.id, otpData.userId))
        .returning();

      if (!user[0]) {
        throw new Error("User not found");
      }

      return user[0];
    } catch (error) {
      throw error;
    }
  }
  generateOTP(length = 6) {
    let otp = "";
    const characters = "0123456789";
    for (let i = 0; i < length; i++) {
      otp += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return otp;
  }

  async sendVerificationEmail(email: string, userId: string) {
    try {
      await db
        .delete(OTPVertifyTable)
        .where(eq(OTPVertifyTable.userId, userId));
      const otp: string = this.generateOTP();

      const expiryDate = new Date(Date.now() + 3 * 60 * 1000);

      const tokenKey = process.env.TOKEN_HASH_SECRET_KEY as string;

      const otpKey = process.env.OTP_HASH_SECRET_KEY as string;

      const token = bcrypt.hashSync(tokenKey, 10);

      const otpHash = bcrypt.hashSync(otp + "_" + otpKey, 10);

      await db.insert(OTPVertifyTable).values({
        token,
        expiryDate,
        otp: otpHash,
        userId,
      });

      mailer.sendMail(email, "FoodX - One Time Password", "otp-template", {
        otp,
      });

      return {
        token,
        expiryDate: expiryDate,
      };
    } catch (error) {
      throw error;
    }
  }
}

export default new OTPService();
