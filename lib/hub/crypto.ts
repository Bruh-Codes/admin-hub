import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes } from "node:crypto";
import { requireEnv } from "../env";

/**
 * Encryption for secrets stored in the hub database (project connection
 * strings). AES-256-GCM, key derived from HUB_ENCRYPTION_KEY. Losing or
 * changing that key makes stored connections unreadable; re-enter them in
 * each project's Settings.
 */
function key(purpose: string): Buffer {
	return createHash("sha256").update(`${purpose}:${requireEnv("HUB_ENCRYPTION_KEY")}`).digest();
}

export function encrypt(plain: string): string {
	const iv = randomBytes(12);
	const cipher = createCipheriv("aes-256-gcm", key("connection"), iv);
	const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
	return ["v1", iv.toString("base64url"), cipher.getAuthTag().toString("base64url"), data.toString("base64url")].join(".");
}

export function decrypt(token: string): string {
	const [version, iv, tag, data] = token.split(".");
	if (version !== "v1" || !iv || !tag || !data) throw new Error("Unreadable stored secret.");
	const decipher = createDecipheriv("aes-256-gcm", key("connection"), Buffer.from(iv, "base64url"));
	decipher.setAuthTag(Buffer.from(tag, "base64url"));
	return Buffer.concat([decipher.update(Buffer.from(data, "base64url")), decipher.final()]).toString("utf8");
}

/** A stable per-project secret (studio sessions, the product auth instance). */
export function projectSecret(projectId: string): string {
	return createHmac("sha256", key("project")).update(projectId).digest("base64url");
}
