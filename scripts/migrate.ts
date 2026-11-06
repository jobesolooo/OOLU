/**
 * Apply database migrations to DATABASE_URL.
 * Usage: npm run db:migrate   (reads .env.local / .env)
 */
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.log("DATABASE_URL not set — local dev uses the embedded database, which migrates itself.");
    return;
  }
  const client = postgres(url, { max: 1 });
  await migrate(drizzle(client), { migrationsFolder: "./drizzle" });
  await client.end();
  console.log("✓ Migrations applied");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
