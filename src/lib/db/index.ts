import "server-only";
import path from "node:path";
import { mkdir } from "node:fs/promises";
import { drizzle as drizzlePg, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

export type DB = PostgresJsDatabase<typeof schema>;

const globalForDb = globalThis as unknown as { __oolu_db?: Promise<DB> };

async function connect(): Promise<DB> {
  const url = process.env.DATABASE_URL;

  if (url) {
    const postgres = (await import("postgres")).default;
    const client = postgres(url, { prepare: false, max: 5 });
    return drizzlePg(client, { schema });
  }

  if (process.env.VERCEL) {
    throw new Error(
      "DATABASE_URL is not set. Add a Postgres connection string (Neon, Supabase, Vercel Postgres…) in your Vercel project settings.",
    );
  }

  // Local development: embedded Postgres stored in ./.data, migrated automatically.
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle: drizzlePglite } = await import("drizzle-orm/pglite");
  const { migrate } = await import("drizzle-orm/pglite/migrator");

  const dataDir = path.join(process.cwd(), ".data", "pglite");
  await mkdir(dataDir, { recursive: true });
  const client = new PGlite(dataDir);
  const db = drizzlePglite(client, { schema });
  await migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });
  return db as unknown as DB;
}

export function getDb(): Promise<DB> {
  if (!globalForDb.__oolu_db) {
    globalForDb.__oolu_db = connect().catch((err) => {
      globalForDb.__oolu_db = undefined;
      throw err;
    });
  }
  return globalForDb.__oolu_db;
}

export { schema };
