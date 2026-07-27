import { Router, type IRouter } from "express";
import { eq, ilike, and, gte, lte, or } from "drizzle-orm";
import { db, trainingCertificatesTable, countersTable, auditLogsTable } from "@workspace/db";
import {
  ListTrainingCertificatesQueryParams,
  CreateTrainingCertificateBody,
  GetTrainingCertificateParams,
  UpdateTrainingCertificateParams,
  UpdateTrainingCertificateBody,
  DeleteTrainingCertificateParams,
  RestoreTrainingCertificateParams,
  ListTrainingCertificatesResponse,
  GetTrainingCertificateResponse,
  UpdateTrainingCertificateResponse,
  RestoreTrainingCertificateResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function nextNumber(prefix: string, counterName: string, pad = 6): Promise<string> {
  await db.execute(
    { sql: `INSERT INTO counters (name, current_value) VALUES ('${counterName}', 1) ON CONFLICT (name) DO UPDATE SET current_value = counters.current_value + 1` } as Parameters<typeof db.execute>[0]
  );
  const rows = await db.select().from(countersTable).where(eq(countersTable.name, counterName));
  const val = rows[0]?.currentValue ?? 1;
  return `${prefix}-${String(val).padStart(pad, "0")}`;
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

async function logAudit(action: string, formType: string, formNumber: string, ip?: string) {
  await db.insert(auditLogsTable).values({ action, formType, formNumber, ipAddress: ip ?? null });
}

function format(r: typeof trainingCertificatesTable.$inferSelect) {
  return {
    ...r,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt?.toISOString() ?? r.createdAt.toISOString(),
  };
}

router.get("/training-certificates", async (req, res): Promise<void> => {
  const params = ListTrainingCertificatesQueryParams.safeParse(req.query);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const { search, from, to, archived } = params.data;
  const conditions = [];
  if (search) conditions.push(or(ilike(trainingCertificatesTable.traineeName, `%${search}%`), ilike(trainingCertificatesTable.certificateNumber, `%${search}%`), ilike(trainingCertificatesTable.department, `%${search}%`)));
  if (from) conditions.push(gte(trainingCertificatesTable.issuedAt, from));
  if (to) conditions.push(lte(trainingCertificatesTable.issuedAt, to));
  conditions.push(eq(trainingCertificatesTable.isArchived, archived === "true"));

  const rows = await db.select().from(trainingCertificatesTable)
    .where(and(...conditions))
    .orderBy(trainingCertificatesTable.createdAt);

  res.json(ListTrainingCertificatesResponse.parse(rows.map(format)));
});

router.post("/training-certificates", async (req, res): Promise<void> => {
  const parsed = CreateTrainingCertificateBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const certNum = await nextNumber("TR", "training_certificate");
  const [cert] = await db.insert(trainingCertificatesTable).values({
    certificateNumber: certNum,
    traineeName: parsed.data.traineeName,
    gender: parsed.data.gender,
    department: parsed.data.department,
    startDate: parsed.data.startDate,
    endDate: parsed.data.endDate,
    trainingOrg: parsed.data.trainingOrg ?? null,
    issuedAt: todayStr(),
  }).returning();

  await logAudit("create", "training_certificate", certNum, req.ip);
  res.status(201).json(GetTrainingCertificateResponse.parse(format(cert)));
});

router.get("/training-certificates/:id", async (req, res): Promise<void> => {
  const params = GetTrainingCertificateParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [cert] = await db.select().from(trainingCertificatesTable).where(eq(trainingCertificatesTable.id, params.data.id));
  if (!cert) { res.status(404).json({ error: "Not found" }); return; }

  res.json(GetTrainingCertificateResponse.parse(format(cert)));
});

router.patch("/training-certificates/:id", async (req, res): Promise<void> => {
  const params = UpdateTrainingCertificateParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const parsed = UpdateTrainingCertificateBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [cert] = await db.update(trainingCertificatesTable).set(parsed.data).where(eq(trainingCertificatesTable.id, params.data.id)).returning();
  if (!cert) { res.status(404).json({ error: "Not found" }); return; }

  await logAudit("update", "training_certificate", cert.certificateNumber, req.ip);
  res.json(UpdateTrainingCertificateResponse.parse(format(cert)));
});

router.delete("/training-certificates/:id", async (req, res): Promise<void> => {
  const params = DeleteTrainingCertificateParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [cert] = await db.update(trainingCertificatesTable).set({ isArchived: true }).where(eq(trainingCertificatesTable.id, params.data.id)).returning();
  if (!cert) { res.status(404).json({ error: "Not found" }); return; }

  await logAudit("archive", "training_certificate", cert.certificateNumber, req.ip);
  res.sendStatus(204);
});

router.patch("/training-certificates/:id/restore", async (req, res): Promise<void> => {
  const params = RestoreTrainingCertificateParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [cert] = await db.update(trainingCertificatesTable).set({ isArchived: false }).where(eq(trainingCertificatesTable.id, params.data.id)).returning();
  if (!cert) { res.status(404).json({ error: "Not found" }); return; }

  await logAudit("restore", "training_certificate", cert.certificateNumber, req.ip);
  res.json(RestoreTrainingCertificateResponse.parse(format(cert)));
});

export default router;
