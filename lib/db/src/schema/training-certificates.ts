import { pgTable, text, serial, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const trainingCertificatesTable = pgTable("training_certificates", {
  id: serial("id").primaryKey(),
  certificateNumber: text("certificate_number").notNull().unique(),
  traineeName: text("trainee_name").notNull(),
  gender: text("gender").notNull(), // 'male' | 'female'
  department: text("department").notNull(),
  startDate: text("start_date").notNull(), // YYYY-MM-DD
  endDate: text("end_date").notNull(),     // YYYY-MM-DD
  trainingOrg: text("training_org"),
  issuedAt: text("issued_at").notNull(),   // YYYY-MM-DD
  isArchived: boolean("is_archived").notNull().default(false),
  createdByUserId: integer("created_by_user_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertTrainingCertificateSchema = createInsertSchema(trainingCertificatesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertTrainingCertificate = z.infer<typeof insertTrainingCertificateSchema>;
export type TrainingCertificate = typeof trainingCertificatesTable.$inferSelect;
