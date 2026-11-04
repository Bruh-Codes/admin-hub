import { toNextJsHandler } from "better-auth/next-js";
import { hubAuth } from "@/lib/hub/auth";

export const runtime = "nodejs";
export const { GET, POST } = toNextJsHandler(hubAuth);
