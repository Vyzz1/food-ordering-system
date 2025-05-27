import { db } from "../db";
import { OrderItem, RevenueSummaryTable } from "../schemas/index";
class RevenueService {
  async addRevenueFromOrder(orderItems: OrderItem[]) {
    for (const orderItem of orderItems) {
      let revenue = 0;

      let cost = 0;

      revenue = orderItem.unitPrice * orderItem.quantity;
      cost = orderItem.costPrice * orderItem.quantity;

      const profit = revenue - cost;

      let data = {
        totalRevenue: revenue,
        totalCost: cost,
        totalProfit: profit,
      };

      try {
        await db.insert(RevenueSummaryTable).values(data).returning();
      } catch (error) {
        console.error("Error updating revenue for order item:", error);
        throw error;
      }
    }
  }
}

export default new RevenueService();
