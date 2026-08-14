import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

// Next.js loads .env for us; a standalone script run via tsx (e.g. seed.ts)
// doesn't get that for free, so load it ourselves. No-ops if the file
// doesn't exist - e.g. on Vercel, where env vars come from the platform.
if (!process.env.DATABASE_URL && !process.env.POSTGRES_URL) {
  try {
    process.loadEnvFile();
  } catch {
    // ignore - no .env file present
  }
}

const connectionString = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL (or POSTGRES_URL) must be set to connect to Postgres");
}

// max: 1 - serverless functions get their own short-lived process per
// invocation, so there's no benefit to a larger local pool and it avoids
// exhausting the database's connection limit under concurrent invocations.
const client = postgres(connectionString, { max: 1 });

export const db = drizzle(client, { schema });
export { client };
