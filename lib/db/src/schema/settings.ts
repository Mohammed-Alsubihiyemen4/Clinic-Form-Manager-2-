import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const settingsTable = pgTable("settings", {
  id: serial("id").primaryKey(),
  clinicName: text("clinic_name").default("مستوصف العصار الطبي"),
  clinicNameEn: text("clinic_name_en").default("AL-ASSAR MEDICL CENTER"),
  address: text("address"),
  phone: text("phone"),
  email: text("email"),
  managerName: text("manager_name").default("د/ابراهيم عصار"),
  currency: text("currency").default("ريال يمني"),
  dateFormat: text("date_format").default("YYYY/MM/DD"),
  logoUrl: text("logo_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertSettingsSchema = createInsertSchema(settingsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type Settings = typeof settingsTable.$inferSelect;
