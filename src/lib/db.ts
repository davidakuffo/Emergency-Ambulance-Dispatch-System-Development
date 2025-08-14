import { config } from "dotenv";
config();
import { Pool } from "pg";

const useDb = (process.env.USE_DB || "").toLowerCase() === "true";
const databaseUrl = process.env.DATABASE_URL;

export const isDbEnabled = !!useDb && !!databaseUrl;

export let pool: Pool | null = null;
if (isDbEnabled) {
  pool = new Pool({ connectionString: databaseUrl });
}

export async function query<T = any>(text: string, params?: any[]): Promise<{ rows: T[] }> {
  if (!pool) throw new Error("Database not configured. Set USE_DB=true and DATABASE_URL in .env");
  return pool.query(text, params);
}

