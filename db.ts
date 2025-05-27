import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
import * as schemas from "./schemas/index";
config();

const sql = neon(process.env.DATABASE_URL!);

export const db = drizzle(sql, { schema: schemas });
