import { relations, sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  varchar,
  text,
  pgEnum,
  date,
  index,
  boolean,
  timestamp,
  real,
  integer,
} from "drizzle-orm/pg-core";

export const UserRole = pgEnum("user_role", ["admin", "customer"]);

export const UserTable = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    fullName: varchar("fullName", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    dateOfBirth: text("dateOfBirth").notNull(),
    gender: text("gender").notNull(),
    role: UserRole("role").default("customer"),
    photoUrl: text("photoUrl").default(""),
    createdAt: timestamp("createdAt").defaultNow(),
    password: text("password").notNull(),
    emailVerified: boolean("emailVerified").default(false),
    lockoutEnd: boolean("lockoutEnd").default(false),
  },
  (table) => [index("email_index").on(table.email)]
);

export const AddressTable = pgTable("addresses", {
  id: uuid("id").primaryKey().defaultRandom(),
  fullName: varchar("fullName", { length: 255 }).notNull(),
  fullAddress: text("fullAddress").notNull(),
  phoneNumber: varchar("phoneNumber", { length: 15 }).notNull(),
  specificAddress: text("specificAddress").notNull(),
  isDefault: boolean("isDefault").default(false),
  userId: uuid("userId")
    .references(() => UserTable.id)
    .notNull(),
});

export const OTPVertifyTable = pgTable(
  "otp_verify",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    token: text("token").notNull(),
    expiryDate: timestamp("expiryDate").notNull(),
    otp: varchar("otp", { length: 255 }).notNull(),
    userId: uuid("userId")
      .references(() => UserTable.id)
      .notNull(),
  },
  (table) => [index("token_index").on(table.token, table.otp)]
);

export const CategoryTable = pgTable(
  "categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    imageUrl: text("imageUrl").notNull(),
  },
  (table) => [index("category_name_index").on(table.name)]
);

export const FoodTable = pgTable(
  "foods",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    description: text("description").notNull(),
    costPrice: real("costPrice").notNull(),
    sellingPrice: real("sellingPrice").notNull(),
    soldCount: integer("soldCount").default(0).notNull(),
    isActive: boolean("isAvailable").default(true),
    timeEstimate: integer("timeEstimate").default(30).notNull(),
    totalRating: real("totalRating").default(0).notNull(),
    averageRating: integer("averageRating ").default(0).notNull(),
    images: text("imageUrl").array().notNull(),
    categoryId: uuid("categoryId")
      .references(() => CategoryTable.id, {
        onDelete: "set null",
      })
      .notNull(),
  },
  (table) => [
    index("food_name_index").on(table.name),
    index("my_search_index").using(
      "gin",
      sql`to_tsvector('simple', ${table.name})`
    ),
  ]
);

export const OptionGroupTable = pgTable("option_groups", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  required: boolean("required").default(false).notNull(),
  multiple: boolean("multiple").default(false).notNull(),
  freeLimit: integer("freeLimit").default(0).notNull(),
  sequence: integer("sequence").default(0).notNull(),
  foodId: uuid("foodId")
    .references(() => FoodTable.id, {
      onDelete: "cascade",
    })
    .notNull(),
});

export const ItemOptionTable = pgTable("item_options", {
  id: uuid("id").primaryKey().defaultRandom(),
  optionName: varchar("name", { length: 255 }).notNull(),
  additionalPrice: real("price").notNull(),
  sequence: integer("sequence").default(0).notNull(),
  optionGroupId: uuid("optionGroupId")
    .references(() => OptionGroupTable.id, {
      onDelete: "cascade",
    })
    .notNull(),
});

//relationships

export const FoodRelation = relations(FoodTable, ({ one, many }) => {
  return {
    category: one(CategoryTable, {
      fields: [FoodTable.categoryId],
      references: [CategoryTable.id],
    }),
    optionGroups: many(OptionGroupTable),
  };
});

export const OptionGroupRelation = relations(
  OptionGroupTable,
  ({ one, many }) => {
    return {
      food: one(FoodTable, {
        fields: [OptionGroupTable.foodId],
        references: [FoodTable.id],
      }),
      options: many(ItemOptionTable),
    };
  }
);

export const ItemOptionRelation = relations(ItemOptionTable, ({ one }) => {
  return {
    optionGroup: one(OptionGroupTable, {
      fields: [ItemOptionTable.optionGroupId],
      references: [OptionGroupTable.id],
    }),
  };
});

//shopping cart

export const ShoppingCartTable = pgTable("shopping_cart", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("userId")
    .references(() => UserTable.id, {
      onDelete: "cascade",
    })
    .notNull(),
});

export const ShoppingCartItemTable = pgTable("shopping_cart_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  foodId: uuid("foodId")
    .references(() => FoodTable.id, {
      onDelete: "cascade",
    })
    .notNull(),
  shoppingCartId: uuid("shoppingCartId")
    .references(() => ShoppingCartTable.id, {
      onDelete: "cascade",
    })
    .notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  quantity: integer("quantity").default(1).notNull(),
});

export const ShoppingCartItemOptionsTable = pgTable(
  "shopping_cart_item_options",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    shoppingCartItemId: uuid("shoppingCartItemId")
      .references(() => ShoppingCartItemTable.id, {
        onDelete: "cascade",
      })
      .notNull(),
    optionGroupId: uuid("optionGroupId").references(() => OptionGroupTable.id),

    optionId: uuid("optionId").references(() => ItemOptionTable.id),
  }
);

//relationships for shopping cart

export const ShoppingCartRelation = relations(
  ShoppingCartTable,
  ({ one, many }) => {
    return {
      items: many(ShoppingCartItemTable),
      user: one(UserTable, {
        fields: [ShoppingCartTable.userId],
        references: [UserTable.id],
      }),
    };
  }
);

export const ShoppingCartItemRelation = relations(
  ShoppingCartItemTable,
  ({ one, many }) => {
    return {
      menuItem: one(FoodTable, {
        fields: [ShoppingCartItemTable.foodId],
        references: [FoodTable.id],
      }),

      shoppingCart: one(ShoppingCartTable, {
        fields: [ShoppingCartItemTable.shoppingCartId],
        references: [ShoppingCartTable.id],
      }),
      options: many(ShoppingCartItemOptionsTable),
    };
  }
);

export const ShoppingCartItemOptionsRelation = relations(
  ShoppingCartItemOptionsTable,
  ({ one }) => {
    return {
      shoppingCartItem: one(ShoppingCartItemTable, {
        fields: [ShoppingCartItemOptionsTable.shoppingCartItemId],
        references: [ShoppingCartItemTable.id],
      }),
      optionGroup: one(OptionGroupTable, {
        fields: [ShoppingCartItemOptionsTable.optionGroupId],
        references: [OptionGroupTable.id],
      }),
      option: one(ItemOptionTable, {
        fields: [ShoppingCartItemOptionsTable.optionId],
        references: [ItemOptionTable.id],
      }),
    };
  }
);

export const UserRelation = relations(UserTable, ({ one, many }) => {
  return {
    shoppingCart: one(ShoppingCartTable),
  };
});

// Enums
export const orderStatusEnum = pgEnum("order_status", [
  "Pending",
  "Processing",
  "Shipped",
  "Delivered",
  "Cancelled",
]);

export const paymentMethodEnum = pgEnum("payment_method", [
  "cod",
  "stripe",
  "paypal",
]);

export const payStatusEnum = pgEnum("pay_status", ["Failed", "Success"]);

export const OrderTable = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  specificAddress: varchar("specific_address", { length: 300 }),
  fullAddress: varchar("full_address", { length: 500 }),
  fullName: varchar("full_name", { length: 500 }),
  phoneNumber: varchar("phone_number", { length: 200 }),
  note: varchar("note", { length: 500 }),
  orderDate: timestamp("order_date").defaultNow(),
  currentStatus: orderStatusEnum("current_status"),
  shippingFee: real("shipping_fee"),
  payStatus: payStatusEnum("pay_status").default("Failed").notNull(),
  paymentMethod: paymentMethodEnum("payment_method").notNull(),
  total: real("total").default(0),
  subTotal: real("sub_total").default(0),
});

export type OrderSelect = typeof OrderTable.$inferSelect;

export const OrderStatusHistoryTable = pgTable("order_status_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id")
    .references(() => OrderTable.id, {
      onDelete: "cascade",
    })
    .notNull(),
  status: orderStatusEnum("status").notNull(),
  changedAt: timestamp("changed_at").defaultNow(),
});

export const OrderItemTable = pgTable("order_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => OrderTable.id, {
      onDelete: "cascade",
    }),
  menuItemId: uuid("menu_item_id").notNull(),
  menuItemName: varchar("menu_item_name").notNull().default(""),
  quantity: integer("quantity").notNull(),
  unitPrice: real("unit_price").notNull(),
  costPrice: real("cost_price").notNull(),
  avatar: varchar("avatar").notNull().default(""),
  isRated: boolean("is_rated").notNull().default(false),
  optionsPrice: real("options_price").default(0),
  totalPrice: real("total_price").default(0),
});

export type OrderItem = typeof OrderItemTable.$inferSelect;

export const OrderItemOptionTable = pgTable("order_item_options", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderItemId: uuid("order_item_id")
    .notNull()
    .references(() => OrderItemTable.id, {
      onDelete: "cascade",
    }),
  optionGroupName: varchar("option_group_name").notNull().default(""),
  optionItemName: varchar("option_item_name").notNull().default(""),
  additionalPrice: real("additional_price"),
});

export const OrderRelation = relations(OrderTable, ({ one, many }) => {
  return {
    user: one(UserTable, {
      fields: [OrderTable.userId],
      references: [UserTable.id],
    }),
    items: many(OrderItemTable),
    statusHistories: many(OrderStatusHistoryTable),
  };
});

export const OrderItemRelation = relations(OrderItemTable, ({ one, many }) => {
  return {
    order: one(OrderTable, {
      fields: [OrderItemTable.orderId],
      references: [OrderTable.id],
    }),
    orderItemOptions: many(OrderItemOptionTable),
  };
});

export const OrderItemOptionRelation = relations(
  OrderItemOptionTable,
  ({ one }) => {
    return {
      orderItem: one(OrderItemTable, {
        fields: [OrderItemOptionTable.orderItemId],
        references: [OrderItemTable.id],
      }),
    };
  }
);

export const orderStatusHistoryRelation = relations(
  OrderStatusHistoryTable,
  ({ one }) => {
    return {
      order: one(OrderTable, {
        fields: [OrderStatusHistoryTable.orderId],
        references: [OrderTable.id],
      }),
    };
  }
);

export const PaymentTable = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => OrderTable.id, {
      onDelete: "set null",
    }),
  userId: uuid("user_id")
    .notNull()
    .references(() => UserTable.id, {
      onDelete: "set null",
    }),
  amount: real("amount").notNull(),
  paymentMethod: paymentMethodEnum("payment_method").notNull(),
  status: payStatusEnum("status").default("Failed").notNull(),
  paidAt: timestamp("paid_at").notNull().defaultNow(),
  transactionId: varchar("transaction_id").notNull().default(""),
});

export const PaymentRelation = relations(PaymentTable, ({ one }) => {
  return {
    user: one(UserTable, {
      fields: [PaymentTable.userId],
      references: [UserTable.id],
    }),
  };
});

export const RevenueSummaryTable = pgTable("revenue_summaries", {
  id: uuid("id").primaryKey().defaultRandom(),
  totalRevenue: real("total_revenue").notNull(),
  totalCost: real("total_cost").notNull(),
  totalProfit: real("total_profit").notNull(),
  calculatedAt: timestamp("calculated_at").notNull().defaultNow(),
});

export const RatingTable = pgTable("ratings", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => UserTable.id, {
      onDelete: "cascade",
    }),
  content: text("content").notNull(),
  rating: real("rating").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  foodId: uuid("food_id").notNull(),
  images: text("images").array().notNull().default([]),
  optionItemNames: text("option_item_names").array().notNull().default([]),
});

export const RatingRelation = relations(RatingTable, ({ one }) => {
  return {
    user: one(UserTable, {
      fields: [RatingTable.userId],
      references: [UserTable.id],
    }),
    food: one(FoodTable, {
      fields: [RatingTable.foodId],
      references: [FoodTable.id],
    }),
  };
});
