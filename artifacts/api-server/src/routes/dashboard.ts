import { Router, type IRouter } from "express";
import { eq, desc, count, sql } from "drizzle-orm";
import { db, trainingCertificatesTable, medicalReportsTable, invoicesTable, auditLogsTable } from "@workspace/db";
import {
  GetDashboardStatsResponse,
  GetRecentActivityResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/dashboard/stats", async (_req, res): Promise<void> => {
  const [tcCount] = await db
    .select({ count: count() })
    .from(trainingCertificatesTable)
    .where(eq(trainingCertificatesTable.isArchived, false));

  const [mrCount] = await db
    .select({ count: count() })
    .from(medicalReportsTable)
    .where(eq(medicalReportsTable.isArchived, false));

  const [invCount] = await db
    .select({ count: count() })
    .from(invoicesTable)
    .where(eq(invoicesTable.isArchived, false));

  const [totalAmountRow] = await db
    .select({ total: sql<string>`COALESCE(SUM(total_amount), 0)` })
    .from(invoicesTable)
    .where(eq(invoicesTable.isArchived, false));

  const today = new Date().toISOString().slice(0, 10);
  const [todayCountRow] = await db
    .select({ count: count() })
    .from(auditLogsTable)
    .where(sql`DATE(created_at) = ${today}::date AND action = 'create'`);

  const [lastTC] = await db
    .select()
    .from(trainingCertificatesTable)
    .where(eq(trainingCertificatesTable.isArchived, false))
    .orderBy(desc(trainingCertificatesTable.createdAt))
    .limit(1);

  const [lastMR] = await db
    .select()
    .from(medicalReportsTable)
    .where(eq(medicalReportsTable.isArchived, false))
    .orderBy(desc(medicalReportsTable.createdAt))
    .limit(1);

  const [lastInv] = await db
    .select()
    .from(invoicesTable)
    .where(eq(invoicesTable.isArchived, false))
    .orderBy(desc(invoicesTable.createdAt))
    .limit(1);

  res.json(GetDashboardStatsResponse.parse({
    trainingCertificates: Number(tcCount?.count ?? 0),
    medicalReports: Number(mrCount?.count ?? 0),
    invoices: Number(invCount?.count ?? 0),
    totalInvoiceAmount: parseFloat(totalAmountRow?.total ?? "0"),
    todayCount: Number(todayCountRow?.count ?? 0),
    lastTrainingCertificate: lastTC?.createdAt.toISOString() ?? null,
    lastMedicalReport: lastMR?.createdAt.toISOString() ?? null,
    lastInvoice: lastInv?.createdAt.toISOString() ?? null,
  }));
});

router.get("/dashboard/recent-activity", async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(auditLogsTable)
    .orderBy(desc(auditLogsTable.createdAt))
    .limit(20);

  res.json(GetRecentActivityResponse.parse(
    rows.map((r) => ({
      id: r.id,
      formType: r.formType,
      formNumber: r.formNumber,
      action: r.action,
      userName: r.userName ?? null,
      createdAt: r.createdAt.toISOString(),
    }))
  ));
});

export default router;
