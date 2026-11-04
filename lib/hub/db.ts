import { Pool } from "pg";
import { requireEnv } from "../env";
import { sslFor } from "./pg-ssl";

/** The hub's own database: hub accounts, projects, members, invitations. */
const url = requireEnv("HUB_DATABASE_URL");
export const hubPool = new Pool({
	connectionString: url,
	...sslFor(url),
	max: 2,
	idleTimeoutMillis: 5_000,
	connectionTimeoutMillis: 15_000,
	allowExitOnIdle: true,
});
hubPool.on("error", (error) => console.error("[hub] database connection closed", error.message));
