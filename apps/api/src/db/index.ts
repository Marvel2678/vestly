import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";
import { getEnv } from "../utils/getenv";

const pool = new Pool({
  connectionString: getEnv("DATABASE_URL")!,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export const db = drizzle(pool, { schema });
export type DB = typeof db;
