// Prints the SQL for whatever the auth setup (worker/auth.ts) needs that migrations/ doesn't create yet:
//   npm run db:schema
//
// Nothing printed means the migrations are up to date. After upgrading better-auth or changing
// worker/auth.ts, save any output as the next file in migrations/ and apply it (npm run db:migrate:*).
//
// It replays migrations/ into an in-memory SQLite database (D1 is SQLite) and asks Better Auth to diff
// against it. Node runs worker/auth.ts directly by stripping its types.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { getMigrations } from "better-auth/db/migration";
import { createAuth } from "../worker/auth.ts";

const db = new DatabaseSync(":memory:");
for (const file of readdirSync("migrations").filter((f) => f.endsWith(".sql")).sort()) {
  db.exec(readFileSync(join("migrations", file), "utf8"));
}

const env = { DB: db, SITE_URL: "http://localhost", BETTER_AUTH_SECRET: "schema-generation-only-not-a-real-secret" };
const auth = createAuth(env, { waitUntil() {} });
const plan = await getMigrations(auth.options);
if (plan.toBeCreated.length || plan.toBeAdded.length || plan.toBeAddedIndexes.length) {
  console.log((await plan.compileMigrations()).trim());
}
