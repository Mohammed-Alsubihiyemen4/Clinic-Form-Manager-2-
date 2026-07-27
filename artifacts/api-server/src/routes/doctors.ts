import { Router, type IRouter } from "express";
import { eq, ilike } from "drizzle-orm";
import { db, doctorsTable } from "@workspace/db";
import {
  ListDoctorsQueryParams,
  CreateDoctorBody,
  GetDoctorParams,
  UpdateDoctorParams,
  UpdateDoctorBody,
  DeleteDoctorParams,
  ListDoctorsResponse,
  GetDoctorResponse,
  UpdateDoctorResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function formatDoctor(d: typeof doctorsTable.$inferSelect) {
  return {
    ...d,
    createdAt: d.createdAt.toISOString(),
  };
}

router.get("/doctors", async (req, res): Promise<void> => {
  const params = ListDoctorsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { search } = params.data;
  const rows = search
    ? await db.select().from(doctorsTable).where(ilike(doctorsTable.name, `%${search}%`)).orderBy(doctorsTable.createdAt)
    : await db.select().from(doctorsTable).orderBy(doctorsTable.createdAt);

  res.json(ListDoctorsResponse.parse(rows.map(formatDoctor)));
});

router.post("/doctors", async (req, res): Promise<void> => {
  const parsed = CreateDoctorBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [doctor] = await db.insert(doctorsTable).values({
    name: parsed.data.name,
    specialty: parsed.data.specialty ?? null,
  }).returning();

  res.status(201).json(GetDoctorResponse.parse(formatDoctor(doctor)));
});

router.get("/doctors/:id", async (req, res): Promise<void> => {
  const params = GetDoctorParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [doctor] = await db.select().from(doctorsTable).where(eq(doctorsTable.id, params.data.id));
  if (!doctor) {
    res.status(404).json({ error: "Doctor not found" });
    return;
  }

  res.json(GetDoctorResponse.parse(formatDoctor(doctor)));
});

router.patch("/doctors/:id", async (req, res): Promise<void> => {
  const params = UpdateDoctorParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateDoctorBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [doctor] = await db
    .update(doctorsTable)
    .set(parsed.data)
    .where(eq(doctorsTable.id, params.data.id))
    .returning();

  if (!doctor) {
    res.status(404).json({ error: "Doctor not found" });
    return;
  }

  res.json(UpdateDoctorResponse.parse(formatDoctor(doctor)));
});

router.delete("/doctors/:id", async (req, res): Promise<void> => {
  const params = DeleteDoctorParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [doctor] = await db.delete(doctorsTable).where(eq(doctorsTable.id, params.data.id)).returning();
  if (!doctor) {
    res.status(404).json({ error: "Doctor not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
