import { Router, type IRouter } from "express";
import { eq, ilike, and, gte, lte, or } from "drizzle-orm";
import { db, medicalReportsTable, doctorsTable, countersTable, auditLogsTable } from "@workspace/db";
import {
  ListMedicalReportsQueryParams,
  CreateMedicalReportBody,
  GetMedicalReportParams,
  UpdateMedicalReportParams,
  UpdateMedicalReportBody,
  DeleteMedicalReportParams,
  RestoreMedicalReportParams,
  ListMedicalReportsResponse,
  GetMedicalReportResponse,
  UpdateMedicalReportResponse,
  RestoreMedicalReportResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function nextNumber(): Promise<string> {
  await db.execute({
    sql: `INSERT INTO counters (name, current_value) VALUES ($1, 1)
          ON CONFLICT (name) DO UPDATE SET current_value = counters.current_value + 1`,
    params: ["medical_report"],
  } as Parameters<typeof db.execute>[0]);
  const rows = await db.select().from(countersTable).where(eq(countersTable.name, "medical_report"));
  const val = rows[0]?.currentValue ?? 1;
  return `MR-${String(val).padStart(6, "0")}`;
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

async function logAudit(action: string, formNumber: string, ip?: string) {
  await db.insert(auditLogsTable).values({ action, formType: "medical_report", formNumber, ipAddress: ip ?? null });
}

async function enrichReport(report: typeof medicalReportsTable.$inferSelect) {
  let doctorName: string | null = null;
  let doctorSpecialty: string | null = null;
  if (report.doctorId) {
    const [doc] = await db.select().from(doctorsTable).where(eq(doctorsTable.id, report.doctorId));
    doctorName = doc?.name ?? null;
    doctorSpecialty = doc?.specialty ?? null;
  }
  return {
    ...report,
    doctorName,
    doctorSpecialty,
    createdAt: report.createdAt.toISOString(),
    updatedAt: report.updatedAt?.toISOString() ?? report.createdAt.toISOString(),
  };
}

router.get("/medical-reports", async (req, res): Promise<void> => {
  const params = ListMedicalReportsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { search, from, to, doctorId, archived } = params.data;
  const conditions = [];

  if (search) {
    conditions.push(
      or(
        ilike(medicalReportsTable.patientName, `%${search}%`),
        ilike(medicalReportsTable.reportNumber, `%${search}%`),
        ilike(medicalReportsTable.diagnosis, `%${search}%`)
      )
    );
  }
  if (from) conditions.push(gte(medicalReportsTable.reportDate, from));
  if (to) conditions.push(lte(medicalReportsTable.reportDate, to));
  if (doctorId) conditions.push(eq(medicalReportsTable.doctorId, doctorId));
  conditions.push(eq(medicalReportsTable.isArchived, archived === "true"));

  const rows = await db
    .select()
    .from(medicalReportsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(medicalReportsTable.createdAt);

  const enriched = await Promise.all(rows.map(enrichReport));
  res.json(ListMedicalReportsResponse.parse(enriched));
});

router.post("/medical-reports", async (req, res): Promise<void> => {
  const parsed = CreateMedicalReportBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const reportNum = await nextNumber();

  const [report] = await db.insert(medicalReportsTable).values({
    reportNumber: reportNum,
    patientName: parsed.data.patientName,
    age: parsed.data.age,
    gender: parsed.data.gender,
    diagnosis: parsed.data.diagnosis,
    reportText: parsed.data.reportText,
    doctorId: parsed.data.doctorId ?? null,
    reportDate: parsed.data.reportDate ?? todayStr(),
  }).returning();

  await logAudit("create", reportNum, req.ip);
  res.status(201).json(GetMedicalReportResponse.parse(await enrichReport(report)));
});

router.get("/medical-reports/:id", async (req, res): Promise<void> => {
  const params = GetMedicalReportParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [report] = await db
    .select()
    .from(medicalReportsTable)
    .where(eq(medicalReportsTable.id, params.data.id));

  if (!report) {
    res.status(404).json({ error: "Medical report not found" });
    return;
  }

  res.json(GetMedicalReportResponse.parse(await enrichReport(report)));
});

router.patch("/medical-reports/:id", async (req, res): Promise<void> => {
  const params = UpdateMedicalReportParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateMedicalReportBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [report] = await db
    .update(medicalReportsTable)
    .set({ ...parsed.data })
    .where(eq(medicalReportsTable.id, params.data.id))
    .returning();

  if (!report) {
    res.status(404).json({ error: "Medical report not found" });
    return;
  }

  await logAudit("update", report.reportNumber, req.ip);
  res.json(UpdateMedicalReportResponse.parse(await enrichReport(report)));
});

router.delete("/medical-reports/:id", async (req, res): Promise<void> => {
  const params = DeleteMedicalReportParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [report] = await db
    .update(medicalReportsTable)
    .set({ isArchived: true })
    .where(eq(medicalReportsTable.id, params.data.id))
    .returning();

  if (!report) {
    res.status(404).json({ error: "Medical report not found" });
    return;
  }

  await logAudit("archive", report.reportNumber, req.ip);
  res.sendStatus(204);
});

router.patch("/medical-reports/:id/restore", async (req, res): Promise<void> => {
  const params = RestoreMedicalReportParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [report] = await db
    .update(medicalReportsTable)
    .set({ isArchived: false })
    .where(eq(medicalReportsTable.id, params.data.id))
    .returning();

  if (!report) {
    res.status(404).json({ error: "Medical report not found" });
    return;
  }

  await logAudit("restore", report.reportNumber, req.ip);
  res.json(RestoreMedicalReportResponse.parse(await enrichReport(report)));
});

export default router;
