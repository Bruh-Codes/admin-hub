import { betterAuthStudio } from "better-auth-studio/nextjs";
import { studioConfig } from "@/lib/products/onrecord";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const handler = betterAuthStudio(studioConfig);

export {
	handler as GET,
	handler as POST,
	handler as PUT,
	handler as DELETE,
	handler as PATCH,
};
