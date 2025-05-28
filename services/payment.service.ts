import Stripe from "stripe";
import { db } from "../db";
import { OrderTable, PaymentTable } from "../schemas";
import { eq } from "drizzle-orm";

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
}

export default new PaymentService();
