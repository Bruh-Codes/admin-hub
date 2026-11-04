/**
 * Creates or updates the hub's own tables. Runs on every Vercel build
 * (package.json "vercel-build"). Only touches HUB_DATABASE_URL.
 */
import { getMigrations } from "better-auth/db/migration";
import { hubAuth } from "../lib/hub/auth.ts";
import { hubPool } from "../lib/hub/db.ts";

const { runMigrations, toBeCreated, toBeAdded } = await getMigrations(hubAuth.options);
if (toBeCreated.length || toBeAdded.length) {
	console.log("[migrate] Better Auth tables:", [...toBeCreated, ...toBeAdded].map((t) => t.table).join(", "));
	await runMigrations();
}
await hubPool.query(`
	create table if not exists hub_project_connection (
		project_id text primary key references organization(id) on delete cascade,
		config text not null,
		updated_at timestamptz not null default now()
	)`);
console.log("[migrate] hub database is up to date");
await hubPool.end();
