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
import { db } from "../db";
import {
  FoodTable,
  ItemOptionTable,
  OptionGroupTable,
  OrderItemOptionTable,
  OrderItemTable,
  OrderStatusHistoryTable,
  OrderTable,
} from "../schemas";
import { PagedResult } from "../models/paged-result";
import revenueService from "./revenue.service";
import { foodService } from "./food.service";

class OrderService {
  async updateOrderStatus(id: string, status: string) {
    try {
      const order = await db.query.OrderTable.findFirst({
        where: eq(OrderTable.id, id),
        with: {
          items: true,
        },
      });

      if (!order) {
        throw new Error("Order not found");
      }

      const orderId = order.id;

      await db
        .update(OrderTable)
        .set({
          currentStatus: status as OrderStatus,
        })
        .where(eq(OrderTable.id, orderId));

      await db.insert(OrderStatusHistoryTable).values({
        status: status as OrderStatus,
        orderId: orderId,
      });

      if (status.toLowerCase() === "delivered") {
        revenueService.addRevenueFromOrder(order.items);

        for (const it of order.items) {
          foodService.updateSoldCount(it.menuItemId, it.quantity);
        }
      }

      return await this.getOrderById(orderId);
    } catch (error) {
      throw error;
    }
  }
  async createOrder(request: OrderRequest, email: string) {
    try {
      const user = await db.query.UserTable.findFirst({
        where: (user, { eq }) => eq(user.email, email),
      });

      if (!user) {
        throw new Error("User not found");
      }

      const address = await db.query.AddressTable.findFirst({
        where: (address, { eq }) => eq(address.id, request.addressId),
      });

      if (!address) {
        throw new Error("Address not found");
      }

      // Tạo order trước
      const newOrder = await db
        .insert(OrderTable)
        .values({
          ...request,
          fullAddress: address.fullAddress,
          fullName: address.fullName,
          phoneNumber: address.phoneNumber,
          specificAddress: address.specificAddress,
          userId: user.id,
          payStatus: "Failed",
          currentStatus: "Pending",
        })
        .returning({ insertedId: OrderTable.id });

      const orderId = newOrder[0].insertedId;

      // Lấy thông tin menu items
      const menuItemsIds = request.orderItems.map((item) => item.menuItemId);
      const findMenuItems = await db.query.FoodTable.findMany({
        where: inArray(FoodTable.id, menuItemsIds),
      });

      const menuItemMap = new Map();
      for (const item of findMenuItems) {
        menuItemMap.set(item.id, item);
      }

      // Lấy thông tin option groups
      const optionGroupsIds = request.orderItems
        .map((v) => v.orderItemsOptions)
        .flatMap((v) => v.map((op) => op.optionGroupId));

      const findOptionGroups = await db.query.OptionGroupTable.findMany({
        where: inArray(OptionGroupTable.id, optionGroupsIds),
      });

      const optionGroupMap = new Map();
      for (const op of findOptionGroups) {
        optionGroupMap.set(op.id, op);
      }

      let orderSubTotal = 0;

      // Xử lý từng order item
      for (const orderItemRequest of request.orderItems) {
        const menuItem = menuItemMap.get(orderItemRequest.menuItemId);

        if (!menuItem) {
          throw new Error(
            `Cannot find food with id: ${orderItemRequest.menuItemId}`
          );
        }

        // Tính options price cho order item
        let optionsPrice = 0;
        const orderItemOptions = [];

        for (const optionRequest of orderItemRequest.orderItemsOptions) {
          const optionGroup = optionGroupMap.get(optionRequest.optionGroupId);

          if (!optionGroup) {
            throw new Error(
              `Cannot find option group with id: ${optionRequest.optionGroupId}`
            );
          }

          const itemOption = await db.query.ItemOptionTable.findFirst({
            where: eq(ItemOptionTable.id, optionRequest.optionItemId),
          });

          if (!itemOption) {
            throw new Error(
              `Cannot find item option with id: ${optionRequest.optionItemId}`
            );
          }

          optionsPrice += itemOption.additionalPrice;

          // Lưu thông tin option để insert sau
          orderItemOptions.push({
            additionalPrice: itemOption.additionalPrice,
            optionGroupName: optionGroup.name,
            optionItemName: itemOption.optionName,
          });
        }

        // Tính total price cho order item
        const unitPrice = menuItem.sellingPrice ?? 0;
        const quantity = orderItemRequest.quantity;
        const totalPrice = unitPrice * quantity + optionsPrice;

        // Tạo order item
        const orderItem = await db
          .insert(OrderItemTable)
          .values({
            menuItemId: menuItem.id,
            menuItemName: menuItem.name,
            avatar: menuItem.images[0] || "",
            quantity: quantity,
            unitPrice: unitPrice,
            costPrice: menuItem.costPrice ?? 0,
            orderId: orderId,
            optionsPrice: optionsPrice,
            totalPrice: totalPrice,
          })
          .returning({
            insertedId: OrderItemTable.id,
          });

        const orderItemId = orderItem[0].insertedId;

        // Tạo order item options
        for (const option of orderItemOptions) {
          await db.insert(OrderItemOptionTable).values({
            ...option,
            orderItemId: orderItemId,
          });
        }

        // Cộng vào subtotal của order
        orderSubTotal += totalPrice;
      }

      // Tính total cho order (subtotal + shipping fee)
      const shippingFee = request.shippingFee || 0;
      const orderTotal = orderSubTotal + shippingFee;

      // Cập nhật order với calculated values
      await db
        .update(OrderTable)
        .set({
          subTotal: orderSubTotal,
          total: orderTotal,
          shippingFee: shippingFee,
        })
        .where(eq(OrderTable.id, orderId));

      await db.insert(OrderStatusHistoryTable).values({
        status: "Pending",
        orderId,
      });

      return await this.getOrderById(orderId);
    } catch (error) {
      console.error("Error creating order:", error);
      throw error;
    }
  }

  async getOrderById(orderId: string) {
    const order = await db.query.OrderTable.findFirst({
      where(fields, operators) {
        return operators.eq(fields.id, orderId);
      },

      with: {
        statusHistories: true,
        items: {
          columns: {
            costPrice: false,
          },
          with: {
            orderItemOptions: true,
          },
        },
      },
    });

    if (order == null) {
      throw new Error("Cannot find order");
    }

    return order;
  }

  async getUserOrder(userId: string, request: UserOrderFilterRequest) {
    try {
      const whereConditions = [];

      whereConditions.push(eq(OrderTable.userId, userId));

      if (request.status != null && request.status !== "All") {
        whereConditions.push(
          eq(OrderTable.currentStatus, request.status as OrderStatus)
        );
      }
      if (request.keyword && request.keyword.trim() !== "") {
        const sanitizedKeyword = request.keyword
          .trim()
          .replace(/[%_]/g, "\\$&");
        whereConditions.push(
          or(
            like(OrderTable.fullName, `%${sanitizedKeyword}%`),
            like(OrderTable.phoneNumber, `%${sanitizedKeyword}%`),
            like(OrderTable.fullAddress, `%${sanitizedKeyword}%`),
            like(OrderTable.specificAddress, `%${sanitizedKeyword}%`)
          )
        );
      }

      let orderByClause;
      switch (request.sort) {
        case "newest":
          orderByClause = desc(OrderTable.orderDate);
          break;
        case "oldest":
          orderByClause = asc(OrderTable.orderDate);
          break;
        case "highest":
          orderByClause = desc(OrderTable.total);
          break;
        case "lowest":
          orderByClause = asc(OrderTable.total);
          break;
        default:
          orderByClause = asc(OrderTable.orderDate);
          break;
      }

      const page = request.page || 0;

      const limit = request.limit || 3;

      const offset = page * limit;

      const query = db.query.OrderTable.findMany({
        where: and(...whereConditions),
        limit: limit,
        offset: offset,
        orderBy: [orderByClause],
        with: {
          items: {
            columns: {
              costPrice: false,
            },
            with: {
              orderItemOptions: true,
            },
          },
          statusHistories: true,
        },
      });

      const [results, totalCount] = await Promise.all([
        query,
        db
          .select({ count: count() })
          .from(OrderTable)
          .where(and(...whereConditions)),
      ]);

      const total = totalCount[0]?.count || 0;

      return new PagedResult(results, total, page, limit).response;
    } catch (error) {
      console.error("Error getting user orders:", error);
      throw error;
    }
  }

  async getAllOrders(request: AdminOrderFilterRequest) {
    try {
      const whereConditions = [];

      if (request.keyword && request.keyword.trim() !== "") {
        const sanitizedKeyword = request.keyword.trim();
        whereConditions.push(
          or(
            like(OrderTable.fullName, `%${sanitizedKeyword}%`),
            like(OrderTable.phoneNumber, `%${sanitizedKeyword}%`),
            like(OrderTable.fullAddress, `%${sanitizedKeyword}%`)
          )
        );
      }

      if (!!request.orderStatuses?.length) {
        whereConditions.push(
          inArray(
            OrderTable.currentStatus,
            request.orderStatuses as OrderStatus[]
          )
        );
      }

      if (request.paymentMethod && request.paymentMethod.trim() !== "") {
        whereConditions.push(
          eq(OrderTable.paymentMethod, request.paymentMethod as PaymentMethod)
        );
      }

      if (request.fromDate && request.toDate) {
        const fromDate = new Date(request.fromDate);
        fromDate.setHours(0, 0, 0, 0);

        const toDate = new Date(request.toDate);
        toDate.setHours(23, 59, 59, 999);

        whereConditions.push(
          and(
            gte(OrderTable.orderDate, fromDate),
            lte(OrderTable.orderDate, toDate)
          )
        );
      } else {
        const last60Days = new Date();
        last60Days.setDate(last60Days.getDate() - 60);
        last60Days.setHours(0, 0, 0, 0);

        whereConditions.push(gte(OrderTable.orderDate, last60Days));
      }

      let orderByClause;
      switch (request.sort) {
        case "orderDate_asc":
          orderByClause = asc(OrderTable.orderDate);
          break;
        case "orderDate_desc":
          orderByClause = desc(OrderTable.orderDate);
          break;
        case "total_asc":
          orderByClause = asc(OrderTable.total);
          break;
        case "total_desc":
          orderByClause = desc(OrderTable.total);
          break;
        case "currentStatus_asc":
          orderByClause = asc(OrderTable.currentStatus);
          break;
        case "currentStatus_desc":
          orderByClause = desc(OrderTable.currentStatus);
          break;
        default:
          orderByClause = desc(OrderTable.orderDate);
          break;
      }

      const page = request.page || 0;
      const limit = request.limit || 10;
      const offset = page * limit;

      const query = db.query.OrderTable.findMany({
        where: whereConditions.length > 0 ? and(...whereConditions) : undefined,
        limit: limit,
        offset: offset,
        orderBy: [orderByClause],
        with: {
          items: {
            columns: {
              costPrice: false,
            },
            with: {
              orderItemOptions: true,
            },
          },
          statusHistories: true,
        },
      });

      const [results, totalCountResult] = await Promise.all([
        query,
        db
          .select({ count: count() })
          .from(OrderTable)
          .where(
            whereConditions.length > 0 ? and(...whereConditions) : undefined
          ),
      ]);

      const totalCount = totalCountResult[0]?.count || 0;

      return new PagedResult(results, totalCount, page, limit).response;
    } catch (error) {
      console.error("Error getting all orders:", error);
      throw error;
    }
  }
}

export default new OrderService();
