import { hubPool } from "./db";
import type { PendingInvite } from "@/components/invitations";

/** Pending, unexpired invitations for an email, newest first. */
export async function pendingInvitesFor(email: string): Promise<PendingInvite[]> {
	const { rows } = await hubPool.query(
		`select i.id, o.name as "projectName", i.role, u.name as "inviterName"
		   from invitation i
		   join organization o on o.id = i."organizationId"
		   left join "user" u on u.id = i."inviterId"
		  where lower(i.email) = $1 and i.status = 'pending' and i."expiresAt" > now()
		  order by i."createdAt" desc`,
		[email.toLowerCase()],
	);
	return rows;
}
