import { Router, type IRouter } from "express";
import { eq, ilike, and, gte, lte, or } from "drizzle-orm";
import { db, invoicesTable, invoiceItemsTable, customersTable, countersTable, auditLogsTable } from "@workspace/db";
import {
  ListInvoicesQueryParams,
  CreateInvoiceBody,
  GetInvoiceParams,
  UpdateInvoiceParams,
  UpdateInvoiceBody,
  DeleteInvoiceParams,
  RestoreInvoiceParams,
  ListInvoicesResponse,
  GetInvoiceResponse,
  UpdateInvoiceResponse,
  RestoreInvoiceResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function nextNumber(): Promise<string> {
  await db.execute({
    sql: `INSERT INTO counters (name, current_value) VALUES ($1, 1)
          ON CONFLICT (name) DO UPDATE SET current_value = counters.current_value + 1`,
    params: ["invoice"],
  } as Parameters<typeof db.execute>[0]);
  const rows = await db.select().from(countersTable).where(eq(countersTable.name, "invoice"));
  const val = rows[0]?.currentValue ?? 1;
  return `INV-${String(val).padStart(5, "0")}`;
}

async function logAudit(action: string, formNumber: string, ip?: string) {
  await db.insert(auditLogsTable).values({ action, formType: "invoice", formNumber, ipAddress: ip ?? null });
}

async function enrichInvoice(invoice: typeof invoicesTable.$inferSelect) {
  // Use inline customerName first, fall back to customer table lookup
  let customerName: string | null = (invoice as any).customerName ?? null;
  let customerCode: string | null = null;
  if (!customerName && invoice.customerId) {
    const [cust] = await db.select().from(customersTable).where(eq(customersTable.id, invoice.customerId));
    customerName = cust?.name ?? null;
    customerCode = cust?.customerCode ?? null;
  }

  const items = await db
    .select()
    .from(invoiceItemsTable)
    .where(eq(invoiceItemsTable.invoiceId, invoice.id));

  return {
    ...invoice,
    customerName,
    customerCode,
    subtotal: parseFloat(invoice.subtotal ?? "0"),
    discount: parseFloat(invoice.discount ?? "0"),
    totalAmount: parseFloat(invoice.totalAmount ?? "0"),
    createdAt: invoice.createdAt.toISOString(),
    updatedAt: invoice.updatedAt?.toISOString() ?? invoice.createdAt.toISOString(),
    items: items.map((i) => ({
      ...i,
      quantity: parseFloat(i.quantity ?? "1"),
      bonus: parseFloat(i.bonus ?? "0"),
      price: parseFloat(i.price ?? "0"),
      total: parseFloat(i.total ?? "0"),
    })),
  };
}

router.get("/invoices", async (req, res): Promise<void> => {
  const params = ListInvoicesQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { search, from, to, customerId, archived } = params.data;
  const conditions = [];

  if (search) {
    conditions.push(
      or(
        ilike(invoicesTable.invoiceNumber, `%${search}%`)
      )
    );
  }
  if (from) conditions.push(gte(invoicesTable.invoiceDate, from));
  if (to) conditions.push(lte(invoicesTable.invoiceDate, to));
  if (customerId) conditions.push(eq(invoicesTable.customerId, customerId));
  conditions.push(eq(invoicesTable.isArchived, archived === "true"));

  const rows = await db
    .select()
    .from(invoicesTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(invoicesTable.createdAt);

  const enriched = await Promise.all(rows.map(enrichInvoice));
  res.json(ListInvoicesResponse.parse(enriched));
});

router.post("/invoices", async (req, res): Promise<void> => {
  const parsed = CreateInvoiceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const invNum = await nextNumber();
  const { items = [], discount = 0, ...invoiceData } = parsed.data;

  const subtotal = items.reduce((sum, i) => sum + (i.quantity * i.price), 0);
  const total = subtotal - discount;

  const [invoice] = await db.insert(invoicesTable).values({
    invoiceNumber: invNum,
    invoiceDate: invoiceData.invoiceDate,
    customerId: invoiceData.customerId ?? null,
    customerName: (invoiceData as any).customerName ?? null,
    branch: invoiceData.branch ?? null,
    section: invoiceData.section ?? null,
    department: invoiceData.department ?? null,
    collector: invoiceData.collector ?? null,
    notes: invoiceData.notes ?? null,
    subtotal: String(subtotal),
    discount: String(discount),
    totalAmount: String(total),
  }).returning();

  if (items.length > 0) {
    await db.insert(invoiceItemsTable).values(
      items.map((item) => ({
        invoiceId: invoice.id,
        itemCode: item.itemCode,
        itemName: item.itemName,
        unit: item.unit,
        quantity: String(item.quantity),
        bonus: String(item.bonus ?? 0),
        price: String(item.price),
        total: String(item.quantity * item.price),
      }))
    );
  }

  await logAudit("create", invNum, req.ip);
  res.status(201).json(GetInvoiceResponse.parse(await enrichInvoice(invoice)));
});

router.get("/invoices/:id", async (req, res): Promise<void> => {
  const params = GetInvoiceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [invoice] = await db
    .select()
    .from(invoicesTable)
    .where(eq(invoicesTable.id, params.data.id));

  if (!invoice) {
    res.status(404).json({ error: "Invoice not found" });
    return;
  }

  res.json(GetInvoiceResponse.parse(await enrichInvoice(invoice)));
});

router.patch("/invoices/:id", async (req, res): Promise<void> => {
  const params = UpdateInvoiceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateInvoiceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { items, discount = 0, ...updateData } = parsed.data;

  const updateFields: Partial<typeof invoicesTable.$inferInsert> = { ...updateData };

  if (items) {
    const subtotal = items.reduce((sum, i) => sum + (i.quantity * i.price), 0);
    const total = subtotal - discount;
    updateFields.subtotal = String(subtotal);
    updateFields.discount = String(discount);
    updateFields.totalAmount = String(total);
  }

  const [invoice] = await db
    .update(invoicesTable)
    .set(updateFields as typeof invoicesTable.$inferInsert)
    .where(eq(invoicesTable.id, params.data.id))
    .returning();

  if (!invoice) {
    res.status(404).json({ error: "Invoice not found" });
    return;
  }

  if (items) {
    await db.delete(invoiceItemsTable).where(eq(invoiceItemsTable.invoiceId, invoice.id));
    if (items.length > 0) {
      await db.insert(invoiceItemsTable).values(
        items.map((item) => ({
          invoiceId: invoice.id,
          itemCode: item.itemCode,
          itemName: item.itemName,
          unit: item.unit,
          quantity: String(item.quantity),
          bonus: String(item.bonus ?? 0),
          price: String(item.price),
          total: String(item.quantity * item.price),
        }))
      );
    }
  }

  await logAudit("update", invoice.invoiceNumber, req.ip);
  res.json(UpdateInvoiceResponse.parse(await enrichInvoice(invoice)));
});

router.delete("/invoices/:id", async (req, res): Promise<void> => {
  const params = DeleteInvoiceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [invoice] = await db
    .update(invoicesTable)
    .set({ isArchived: true })
    .where(eq(invoicesTable.id, params.data.id))
    .returning();

  if (!invoice) {
    res.status(404).json({ error: "Invoice not found" });
    return;
  }

  await logAudit("archive", invoice.invoiceNumber, req.ip);
  res.sendStatus(204);
});

router.patch("/invoices/:id/restore", async (req, res): Promise<void> => {
  const params = RestoreInvoiceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [invoice] = await db
    .update(invoicesTable)
    .set({ isArchived: false })
    .where(eq(invoicesTable.id, params.data.id))
    .returning();

  if (!invoice) {
    res.status(404).json({ error: "Invoice not found" });
    return;
  }

  await logAudit("restore", invoice.invoiceNumber, req.ip);
  res.json(RestoreInvoiceResponse.parse(await enrichInvoice(invoice)));
});

export default router;
