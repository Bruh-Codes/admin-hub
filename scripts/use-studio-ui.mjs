// Puts the hub's build of the studio frontend (studio-ui/, a fork of
// better-auth-studio's frontend) where the studio package serves its UI from.
import { cpSync, existsSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const built = join(root, "studio-ui", "dist");
const target = join(root, "node_modules", "better-auth-studio", "dist", "public");

if (!existsSync(join(built, "index.html"))) {
	console.error("studio-ui/dist is missing: run `npm run studio-ui:build` first.");
	process.exit(1);
}
rmSync(target, { recursive: true, force: true });
cpSync(built, target, { recursive: true });
console.log("[admin-hub] studio UI installed from studio-ui/dist");
