/**
 * Apply database migrations to DATABASE_URL.
 * Usage: npm run db:migrate   (reads .env.local / .env)
 */
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";

async function main() {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!url) {
    if (process.env.VERCEL) {
      console.error("✗ DATABASE_URL is missing or empty on Vercel. Add a Postgres database (Storage → Neon) to the project, then redeploy.");
      process.exit(1);
    }
    console.log("DATABASE_URL not set — local dev uses the embedded database, which migrates itself.");
    return;
  }
  const client = postgres(url, { max: 1 });
  await migrate(drizzle(client), { migrationsFolder: "./drizzle" });

  // One-time: accounts that became staff only because their email was in ADMIN_EMAILS
  // (e.g. signing in on the store with Google) go back to being customers.
  const legacy = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  const flag = "migration:admin-emails-to-customers";
  const [done] = await client`select 1 from settings where key = ${flag}`;
  if (!done) {
    const moved = legacy.length
      ? await client`update users set role = 'customer' where role = 'admin' and lower(email) in ${client(legacy)} and email not like '%@staff.oolu' returning email`
      : [];
    await client`insert into settings (key, value) values (${flag}, ${client.json({ at: new Date().toISOString(), moved: moved.length })}) on conflict (key) do nothing`;
    if (moved.length) console.log(`✓ ${moved.length} account(s) from ADMIN_EMAILS are customers again`);
  }
  await client.end();
  console.log("✓ Migrations applied");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
