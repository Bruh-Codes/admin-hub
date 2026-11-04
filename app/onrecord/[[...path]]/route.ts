import { betterAuthStudio } from "better-auth-studio/nextjs";
import { guardStudioRequest } from "@/lib/role-guard";
import { BASE_PATH, ROLE_RULES, studioConfig } from "@/lib/products/onrecord";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const studio = betterAuthStudio(studioConfig);

async function handler(request: Request): Promise<Response> {
	const guarded = await guardStudioRequest(request, BASE_PATH, ROLE_RULES);
	return guarded instanceof Response ? guarded : studio(guarded);
}

export {
	handler as GET,
	handler as POST,
	handler as PUT,
	handler as DELETE,
	handler as PATCH,
};
