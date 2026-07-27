import { Router, type IRouter } from "express";
import { eq, and, gte, lte } from "drizzle-orm";
import { db, auditLogsTable } from "@workspace/db";
import {
  ListAuditLogsQueryParams,
  ListAuditLogsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/audit-logs", async (req, res): Promise<void> => {
  const params = ListAuditLogsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { from, to, formType, userId } = params.data;
  const conditions = [];

  if (from) conditions.push(gte(auditLogsTable.createdAt, new Date(from)));
  if (to) conditions.push(lte(auditLogsTable.createdAt, new Date(to)));
  if (formType) conditions.push(eq(auditLogsTable.formType, formType));
  if (userId) conditions.push(eq(auditLogsTable.userId, userId));

  const rows = await db
    .select()
    .from(auditLogsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(auditLogsTable.createdAt);

  res.json(ListAuditLogsResponse.parse(
    rows.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
    }))
  ));
});

export default router;
