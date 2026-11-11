import { db } from "@/db";
import { auditLog } from "@/db/schema";

export async function audit(
  actor: { id: string | null; email: string },
  action: string,
  targetType: string,
  targetId = "",
  details: Record<string, unknown> = {},
) {
  await db.insert(auditLog).values({ actorId: actor.id, actorEmail: actor.email, action, targetType, targetId, details });
}
