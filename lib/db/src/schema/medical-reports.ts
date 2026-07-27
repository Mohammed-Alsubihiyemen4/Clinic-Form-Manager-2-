import { pgTable, text, serial, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const medicalReportsTable = pgTable("medical_reports", {
  id: serial("id").primaryKey(),
  reportNumber: text("report_number").notNull().unique(),
  patientName: text("patient_name").notNull(),
  age: integer("age").notNull(),
  gender: text("gender").notNull(), // 'male' | 'female'
  diagnosis: text("diagnosis").notNull(),
  reportText: text("report_text").notNull(),
  doctorId: integer("doctor_id"),
  reportDate: text("report_date").notNull(), // YYYY-MM-DD
  isArchived: boolean("is_archived").notNull().default(false),
  createdByUserId: integer("created_by_user_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertMedicalReportSchema = createInsertSchema(medicalReportsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertMedicalReport = z.infer<typeof insertMedicalReportSchema>;
export type MedicalReport = typeof medicalReportsTable.$inferSelect;
