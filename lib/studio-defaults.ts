import type { StudioConfig } from "better-auth-studio";

/**
 * Tools that write to the database or touch credentials. They are hidden from
 * the UI on every product: schema changes go through each product's own
 * migrations, never through the hub.
 */
export const BLOCKED_TOOLS: NonNullable<StudioConfig["tools"]>["exclude"] = [
	"run-migration",
	"test-oauth",
	"oauth-credentials",
	"plugin-generator",
	"token-generator",
	"secret-generator",
];

/** Studio session length: 12 hours, so a lost laptop is not a week-long key. */
export const SESSION_SECONDS = 12 * 60 * 60;
