import { createCipheriv, createHmac, randomBytes } from "node:crypto";

/**
 * Mints the studio's own session cookie value. Same format as
 * better-auth-studio's dist/utils/session.js (AES-256-GCM, key =
 * HMAC-SHA256(secret, "studio-session-key"), iv|tag|data in base64url),
 * which the package does not export. The hub mints one per request after
 * checking project membership, so the studio's login page is never used.
 */
export const STUDIO_COOKIE = "better_auth_studio_session";

export function mintStudioSession(
	user: { id: string; email: string; name: string },
	secret: string,
	ttlMs = 10 * 60 * 1000,
): string {
	const session = {
		userId: user.id,
		email: user.email.slice(0, 255),
		name: (user.name || "").slice(0, 100),
		role: "hub",
		issuedAt: Date.now(),
		expiresAt: Date.now() + ttlMs,
	};
	const key = createHmac("sha256", secret).update("studio-session-key").digest();
	const iv = randomBytes(16);
	const cipher = createCipheriv("aes-256-gcm", key, iv);
	const data = Buffer.concat([cipher.update(JSON.stringify(session), "utf8"), cipher.final()]);
	return Buffer.concat([iv, cipher.getAuthTag(), data]).toString("base64url");
}

/** Replace (or add) the studio cookie in a Cookie header. */
export function withStudioCookie(cookieHeader: string | null, value: string): string {
	const others = (cookieHeader ?? "")
		.split(";")
		.map((c) => c.trim())
		.filter((c) => c && !c.startsWith(`${STUDIO_COOKIE}=`));
	return [...others, `${STUDIO_COOKIE}=${value}`].join("; ");
}
