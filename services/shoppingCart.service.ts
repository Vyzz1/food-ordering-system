import { eq, inArray } from "drizzle-orm";
import { db } from "../db";
import {
  ShoppingCartItemOptionsTable,
  ShoppingCartItemTable,
  ShoppingCartTable,
} from "../schemas";

class ShoppingCartService {
  async addToCartHandler(email: string, request: ShoppingCartRequest) {
    const user = await db.query.UserTable.findFirst({
      where: (table, { eq }) => eq(table.email, email),
      with: {
        shoppingCart: true,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Ensure shopping cart exists
    let shoppingCart = user.shoppingCart;
    if (!shoppingCart) {
      const [newCart] = await db
        .insert(ShoppingCartTable)
        .values({ userId: user.id })
        .returning();
      shoppingCart = newCart;
    }

    // Validate menu item
    const foodItem = await db.query.FoodTable.findFirst({
      where: (table, { eq }) => eq(table.id, request.menuItemId),
    });

    if (!foodItem) {
      throw new Error("Food item not found");
    }

    const [newItem] = await db
      .insert(ShoppingCartItemTable)
      .values({
        foodId: request.menuItemId,
        shoppingCartId: shoppingCart.id,
        quantity: request.quantity,
      })
      .returning();

    for (const { optionGroupId, optionIds } of request.options) {
      const [optionGroup, validOptions] = await Promise.all([
        db.query.OptionGroupTable.findFirst({
          where: (table, { eq }) => eq(table.id, optionGroupId),
        }),
        db.query.ItemOptionTable.findMany({
          where: (table, { inArray }) => inArray(table.id, optionIds),
        }),
      ]);

      if (!optionGroup) {
        throw new Error(`Option group ${optionGroupId} not found`);
      }

      const validOptionIds = validOptions.map((opt) => opt.id);
      const invalidOptions = optionIds.filter(
        (id) => !validOptionIds.includes(id)
      );
      if (invalidOptions.length > 0) {
        throw new Error(`Invalid options: ${invalidOptions.join(", ")}`);
      }

      const optionInserts = optionIds.map((optionId) => ({
        shoppingCartItemId: newItem.id,
        optionGroupId,
        optionId,
      }));

      await db.insert(ShoppingCartItemOptionsTable).values(optionInserts);
    }

    return newItem;
  }

  async updateQuantity(id: string, quantity: number) {
    const [updatedItem] = await db
      .update(ShoppingCartItemTable)
      .set({ quantity })
      .where(eq(ShoppingCartItemTable.id, id))
      .returning();

    if (!updatedItem) {
      throw new Error("Item not found in cart");
    }

    return updatedItem;
  }

  async removeItem(id: string) {
    await db
      .delete(ShoppingCartItemTable)
      .where(eq(ShoppingCartItemTable.id, id));

    await db
      .delete(ShoppingCartItemOptionsTable)
      .where(eq(ShoppingCartItemOptionsTable.shoppingCartItemId, id));

    return { message: "Item removed from cart successfully" };
  }
  async getCart(email: string) {
    const user = await db.query.UserTable.findFirst({
      where: (table, { eq }) => eq(table.email, email),
    });

    if (!user) {
      throw new Error("User not found");
    }

    const cart = await db.query.ShoppingCartTable.findFirst({
      where: (table, { eq }) => eq(table.userId, user.id),
      with: {
        items: {
          with: {
            menuItem: {
              columns: {
                costPrice: false,
              },
            },
            options: {
              with: {
                optionGroup: true,
                option: true,
              },
            },
          },
        },
      },
    });

    if (!cart || !cart.items || cart.items.length === 0) {
      return [];
    }

    return cart.items.map((item) => {
      const basePrice = item.menuItem.sellingPrice;
      const optionsPrice = item.options.reduce(
        (acc, opt) => acc + (opt.option?.additionalPrice || 0),
        0
      );
      const subTotal = basePrice * item.quantity + optionsPrice;

      const groupedOptions = item.options.reduce((acc: any, curr) => {
        const group = curr.optionGroup;
        if (!group) return acc;

        const groupId = group.id;
        if (!acc[groupId]) {
          acc[groupId] = {
            id: groupId,
            name: group.name,
            selectedOptions: [],
          };
        }

        acc[groupId].selectedOptions.push({
          id: curr.option?.id || null,
          optionName: curr.option?.optionName || "",
          additionalPrice: curr.option?.additionalPrice || 0,
        });

        return acc;
      }, {});

      const selectedOptionGroups = Object.values(groupedOptions);

      return {
        id: item.id,
        quantity: item.quantity,
        menuItem: item.menuItem,
        basePrice,
        optionsPrice,
        subTotal,
        selectedOptionGroups,
      };
    });
  }
}

export default new ShoppingCartService();
