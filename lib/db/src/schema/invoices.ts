import { pgTable, text, serial, timestamp, boolean, integer, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const invoicesTable = pgTable("invoices", {
  id: serial("id").primaryKey(),
  invoiceNumber: text("invoice_number").notNull().unique(),
  invoiceDate: text("invoice_date").notNull(), // YYYY-MM-DD
  customerId: integer("customer_id"),
  branch: text("branch"),
  section: text("section"),
  department: text("department"),
  collector: text("collector"),
  notes: text("notes"),
  subtotal: numeric("subtotal", { precision: 12, scale: 3 }).notNull().default("0"),
  discount: numeric("discount", { precision: 12, scale: 3 }).notNull().default("0"),
  totalAmount: numeric("total_amount", { precision: 12, scale: 3 }).notNull().default("0"),
  isArchived: boolean("is_archived").notNull().default(false),
  createdByUserId: integer("created_by_user_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const invoiceItemsTable = pgTable("invoice_items", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").notNull(),
  itemCode: text("item_code").notNull(),
  itemName: text("item_name").notNull(),
  unit: text("unit").notNull().default("عام"),
  quantity: numeric("quantity", { precision: 12, scale: 3 }).notNull().default("1"),
  bonus: numeric("bonus", { precision: 12, scale: 3 }).notNull().default("0"),
  price: numeric("price", { precision: 12, scale: 3 }).notNull().default("0"),
  total: numeric("total", { precision: 12, scale: 3 }).notNull().default("0"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertInvoiceSchema = createInsertSchema(invoicesTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertInvoiceItemSchema = createInsertSchema(invoiceItemsTable).omit({ id: true, createdAt: true });
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type InsertInvoiceItem = z.infer<typeof insertInvoiceItemSchema>;
export type Invoice = typeof invoicesTable.$inferSelect;
export type InvoiceItem = typeof invoiceItemsTable.$inferSelect;
