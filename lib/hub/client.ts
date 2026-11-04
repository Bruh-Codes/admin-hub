"use client";

import { organizationClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const hubClient = createAuthClient({ plugins: [organizationClient()] });
