import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, settingsTable } from "@workspace/db";
import {
  UpdateSettingsBody,
  GetSettingsResponse,
  UpdateSettingsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function ensureSettings() {
  const rows = await db.select().from(settingsTable);
  if (rows.length === 0) {
    const [s] = await db.insert(settingsTable).values({}).returning();
    return s;
  }
  return rows[0]!;
}

function formatSettings(s: typeof settingsTable.$inferSelect) {
  return {
    id: s.id,
    clinicName: s.clinicName ?? null,
    clinicNameEn: s.clinicNameEn ?? null,
    address: s.address ?? null,
    phone: s.phone ?? null,
    email: s.email ?? null,
    managerName: s.managerName ?? null,
    currency: s.currency ?? null,
    dateFormat: s.dateFormat ?? null,
    logoUrl: s.logoUrl ?? null,
  };
}

router.get("/settings", async (_req, res): Promise<void> => {
  const settings = await ensureSettings();
  res.json(GetSettingsResponse.parse(formatSettings(settings)));
});

router.patch("/settings", async (req, res): Promise<void> => {
  const parsed = UpdateSettingsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const settings = await ensureSettings();

  const [updated] = await db
    .update(settingsTable)
    .set(parsed.data)
    .where(eq(settingsTable.id, settings.id))
    .returning();

  if (!updated) {
    res.status(500).json({ error: "Failed to update settings" });
    return;
  }

  res.json(UpdateSettingsResponse.parse(formatSettings(updated)));
});

export default router;
