import { defineConfig } from "drizzle-kit";

import dotenv from "dotenv";
dotenv.config();

export default defineConfig({
  schema: "./schemas",
  out: "./drizzle",
  dialect: "postgresql",
  verbose: true,
  strict: true,
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
