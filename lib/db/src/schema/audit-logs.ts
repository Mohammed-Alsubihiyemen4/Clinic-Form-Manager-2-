import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";

export const auditLogsTable = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  userName: text("user_name"),
  action: text("action").notNull(), // 'create', 'update', 'delete', 'restore', 'print'
  formType: text("form_type").notNull(), // 'training_certificate', 'medical_report', 'invoice'
  formNumber: text("form_number").notNull(),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
