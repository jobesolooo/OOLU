import { PGlite } from "@electric-sql/pglite";
const db = new PGlite("/tmp/claude-0/-home-claude/8e65d5ea-2c97-5332-b112-37697b5649b3/scratchpad/macdb/pglite");
const q = async (s) => console.log(JSON.stringify((await db.query(s)).rows));
await q("select status, count(*) from reviews group by status");
await q("select r.product_id, r.status, r.rating, left(r.title,30) t, r.created_at from reviews r order by created_at desc limit 10");
await q("select role, email, name from users where role='admin'");
await q("select count(*) from users");
