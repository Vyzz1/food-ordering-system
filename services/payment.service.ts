import Stripe from "stripe";
import { db } from "../db";
import { OrderTable, PaymentTable, UserTable } from "../schemas";
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
import { PagedResult } from "../models/paged-result";

class PaymentService {
  private stripe: Stripe;
  private stripeSettings: {
    successUrl: string;
    cancelUrl: string;
  };
  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);
    this.stripeSettings = {
      successUrl:
        process.env.STRIPE_SUCCESS_URL || "http://localhost:3000/success",
      cancelUrl:
        process.env.STRIPE_CANCEL_URL || "http://localhost:3000/cancel",
    };
  }

  async createInitPayment(
    transactionId: string,
    email: string,
    orderId: string,
    amount: number
  ) {
    const order = await db.query.OrderTable.findFirst({
      where: (table, { eq }) => eq(table.id, orderId),
      with: {
        user: true,
      },
    });

    if (!order) {
      throw new Error("Order not found");
    }

    await db.insert(PaymentTable).values({
      transactionId,
      orderId,
      amount,
      userId: order.user.id,
      paymentMethod: "stripe",
    });
  }

  async createPayment(order: any, email: string) {
    try {
      const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

      for (const item of order.items) {
        const unitOptionsPrice =
          item.quantity > 0 ? item.optionsPrice / item.quantity : 0;

        lineItems.push({
          price_data: {
            unit_amount: Math.round((item.unitPrice + unitOptionsPrice) * 100),
            currency: "usd",
            product_data: {
              name: item.menuItemName,
              description: this.getOptionsDescription(item),
              ...(item.avatar && { images: [item.avatar] }),
            },
          },
          quantity: item.quantity,
        });
      }

      if (order.shippingFee && order.shippingFee > 0) {
        lineItems.push({
          price_data: {
            unit_amount: Math.round(order.shippingFee * 100),
            currency: "usd",
            product_data: {
              name: "Shipping Fee",
            },
          },
          quantity: 1,
        });
      }

      const sessionOptions: Stripe.Checkout.SessionCreateParams = {
        payment_method_types: ["card"],
        line_items: lineItems,
        mode: "payment",
        success_url: `${this.stripeSettings.successUrl}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${this.stripeSettings.cancelUrl}?order_id=${order.id}`,
        client_reference_id: order.id,
        customer_email: email,
        metadata: {
          OrderId: order.id,
          UserEmail: email,
        },
      };

      const session =
        await this.stripe.checkout.sessions.create(sessionOptions);

      await this.createInitPayment(session.id, email, order.id, order.total);

      return {
        payUrl: session.url,
      };
    } catch (error) {
      throw error;
    }
  }

  private getOptionsDescription(item: any): string {
    if (!item.orderItemOptions || item.orderItemOptions.length === 0) {
      return "";
    }

    const options = item.orderItemOptions
      .map((option: any) => option.optionItemName)
      .join(", ");

    return `Options: ${options}`;
  }

  async handleRepay(orderId: string) {
    try {
      const order = await db.query.OrderTable.findFirst({
        where: (table, { eq }) => eq(table.id, orderId),
        with: {
          user: true,
          items: {
            with: {
              orderItemOptions: true,
            },
          },
        },
      });

      if (!order) {
        throw new Error("Order not found");
      }

      const email = order.user.email;

      if (order.payStatus === "Success") {
        throw new Error("Order already paid");
      }

      return await this.createPayment(order, email);
    } catch (error) {
      throw error;
    }
  }
  async handleWebhook(rawBody: string, signature: string) {
    const event = this.stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      if (!session.id) {
        throw new Error("Missing session ID in event data");
      }

      const payment = await db
        .update(PaymentTable)
        .set({ status: "Success" })
        .where(eq(PaymentTable.transactionId, session.id))
        .returning();

      if (payment.length === 0) {
        throw new Error("Payment not found");
      }
      if (!session.client_reference_id) {
        throw new Error("Missing client_reference_id in session");
      }
      const orderId = session.client_reference_id;

      const order = await db
        .update(OrderTable)
        .set({ payStatus: "Success" })
        .where(eq(OrderTable.id, orderId!))
        .returning();

      if (order.length === 0) {
        throw new Error("Order not found");
      }

      return {
        success: true,
        message: "Payment successful",
      };
    }

    return {
      success: false,
      message: "Unhandled event type",
    };
  }
  async getAllPayments(
    query: PaymentFilterRequest,
    isAdmin: boolean,
    userId?: string
  ) {
    try {
      const whereConditions = [];

      if (!isAdmin) {
        whereConditions.push(eq(PaymentTable.userId, userId!));
      }

      // if (isAdmin) {
      //   if (query.keyword && query.keyword.trim() !== "") {
      //     whereConditions.push(
      //       or(
      //         like(PaymentTable.userId, `%${query.keyword}%`),
      //         like(PaymentTable.amount, `%${query.keyword}%`)
      //       )
      //     );
      //   }
      // }

      if (!!query.methods?.length) {
        if (typeof query.methods === "string") {
          query.methods = [query.methods];
        }

        whereConditions.push(
          inArray(PaymentTable.paymentMethod, query.methods as PaymentMethod[])
        );
      }

      if (!!query.statuses?.length) {
        if (typeof query.statuses === "string") {
          query.statuses = [query.statuses];
        }

        whereConditions.push(
          inArray(PaymentTable.status, query.statuses as PaymentStatus[])
        );
      }

      if (query.fromDate && query.toDate) {
        const fromDate = new Date(query.fromDate);
        fromDate.setHours(0, 0, 0, 0);

        const toDate = new Date(query.toDate);
        toDate.setHours(23, 59, 59, 999);

        whereConditions.push(
          and(
            gte(PaymentTable.paidAt, fromDate),
            lte(PaymentTable.paidAt, toDate)
          )
        );
      } else {
        const last60Days = new Date();
        last60Days.setDate(last60Days.getDate() - 60);
        last60Days.setHours(0, 0, 0, 0);

        whereConditions.push(gte(PaymentTable.paidAt, last60Days));
      }

      let orderByClause = asc(PaymentTable.paidAt);

      if (query.sort) {
        switch (query.sort) {
          case "amount_asc":
            orderByClause = asc(PaymentTable.amount);
            break;
          case "amount_desc":
            orderByClause = desc(PaymentTable.amount);
            break;

          case "paid_asc":
            orderByClause = asc(PaymentTable.paidAt);
            break;
          case "paid_desc":
            orderByClause = desc(PaymentTable.paidAt);
            break;
          default:
            orderByClause = asc(PaymentTable.paidAt);
            break;
        }
      }

      const page = query.page || 0;
      const limit = query.limit || 10;
      const offset = page * limit;

      const payments = db.query.PaymentTable.findMany({
        where: whereConditions.length > 0 ? and(...whereConditions) : undefined,
        with: {
          user: isAdmin
            ? {
                columns: {
                  password: false,
                },
              }
            : undefined,
        },
        orderBy: [orderByClause],
        limit,
        offset,
      });
      const [results, totalCountResult] = await Promise.all([
        payments,
        db
          .select({ count: count() })
          .from(PaymentTable)
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

  async deletePayment(paymentId: string) {
    try {
      const payment = await db.query.PaymentTable.findFirst({
        where: (table, { eq }) => eq(table.id, paymentId),
      });

      if (!payment) {
        throw new Error("Payment not found");
      }

      await db.delete(PaymentTable).where(eq(PaymentTable.id, paymentId));

      return { message: "Payment deleted successfully" };
    } catch (error) {
      throw error;
    }
  }
}

export default new PaymentService();
