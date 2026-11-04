import { Pool } from "pg";
import { requireEnv } from "../env";

/** The hub's own database: hub accounts, projects, members, invitations. */
export const hubPool = new Pool({
	connectionString: requireEnv("HUB_DATABASE_URL"),
	max: 2,
	idleTimeoutMillis: 5_000,
	connectionTimeoutMillis: 5_000,
	allowExitOnIdle: true,
});
hubPool.on("error", (error) => console.error("[hub] database connection closed", error.message));
