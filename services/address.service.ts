import { eq } from "drizzle-orm";
import { db } from "../db";
import { AddressTable, UserTable } from "../schemas";

class AddressService {
  async creeateAddress(email: string, request: AddressRequest) {
    try {
      const findUser = await db.query.UserTable.findFirst({
        where: eq(UserTable.email, email),
      });

      if (!findUser) {
        throw new Error("User not found");
      }

      const address = await db
        .insert(AddressTable)
        .values({ ...request, userId: findUser.id })
        .returning();

      return address[0];
    } catch (error) {
      throw error;
    }
  }

  async updateAddress(id: string, request: AddressRequest) {
    try {
      const address = await db
        .update(AddressTable)
        .set(request)
        .where(eq(AddressTable.id, id))
        .returning();

      if (address.length === 0) {
        throw new Error("Address not found");
      }

      return address[0];
    } catch (error) {
      throw error;
    }
  }

  async getAllAddresses(userId: string) {
    try {
      const addresses = await db.query.AddressTable.findMany({
        columns: {
          userId: false,
        },
        where: eq(AddressTable.userId, userId),
      });

      return addresses;
    } catch (error) {
      throw error;
    }
  }

  async setDefaultAddress(id: string) {
    try {
      await db
        .update(AddressTable)
        .set({ isDefault: false })
        .where(eq(AddressTable.isDefault, true));

      const address = await db
        .update(AddressTable)
        .set({ isDefault: true })
        .where(eq(AddressTable.id, id))
        .returning();

      if (address.length === 0) {
        throw new Error("Address not found");
      }

      return address[0];
    } catch (error) {
      throw error;
    }
  }

  async deleteAddress(id: string) {
    try {
      const address = await db
        .delete(AddressTable)
        .where(eq(AddressTable.id, id));

      if (!address) {
        throw new Error("Address not found");
      }
    } catch (error) {
      throw error;
    }
  }
}

export const addressService = new AddressService();
