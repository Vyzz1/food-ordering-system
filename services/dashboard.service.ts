import { and, desc, gte, lte, ne } from "drizzle-orm";
import { db } from "../db";
import {
  OrderTable,
  PaymentTable,
  RevenueSummaryTable,
  UserTable,
} from "../schemas";

class DashboardService {
  async getDashboardData(request: DashboardRequest): Promise<any> {
    try {
      let fromDate: Date;
      let toDate: Date;

      if (request.fromDate && request.toDate) {
        fromDate = new Date(request.fromDate);
        fromDate.setHours(0, 0, 0, 0);

        toDate = new Date(request.toDate);
        toDate.setHours(23, 59, 59, 999);
      } else {
        fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - 60);
        fromDate.setHours(0, 0, 0, 0);

        toDate = new Date();
      }

      const totalUsers = await db.$count(
        UserTable,
        and(
          gte(UserTable.createdAt, fromDate),
          lte(UserTable.createdAt, toDate),
          ne(UserTable.role, "admin")
        )
      );

      const totalOrders = await db.$count(
        OrderTable,
        and(
          gte(OrderTable.orderDate, fromDate),
          lte(OrderTable.orderDate, toDate)
        )
      );

      var revenueSummaryChart = await db.query.RevenueSummaryTable.findMany({
        where: and(
          gte(RevenueSummaryTable.calculatedAt, fromDate),
          lte(RevenueSummaryTable.calculatedAt, toDate)
        ),
        orderBy: [desc(RevenueSummaryTable.calculatedAt)],
      });

      const totalRevenue = revenueSummaryChart.reduce(
        (sum, item) => sum + item.totalRevenue,
        0
      );

      const totalCost = revenueSummaryChart.reduce(
        (sum, item) => sum + item.totalCost,
        0
      );
      const totalProfit = totalRevenue - totalCost;

      const paymentsCharts = await db.query.PaymentTable.findMany({
        where: and(
          gte(PaymentTable.paidAt, fromDate),
          lte(PaymentTable.paidAt, toDate)
        ),
        orderBy: [desc(PaymentTable.paidAt)],
      });

      return {
        totalCost,
        totalProfit,
        totalRevenue,
        totalUsers,
        totalOrders,
        revenueSummaryChart,
        paymentsChart: paymentsCharts,
      };
    } catch (error) {
      console.error("Error in getDashboardData:", error);
      throw error;
    }
  }
}

export default new DashboardService();
