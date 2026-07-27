import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";

export const countersTable = pgTable("counters", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(), // 'training_certificate', 'medical_report', 'invoice'
  currentValue: integer("current_value").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});
