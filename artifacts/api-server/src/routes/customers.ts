import { Router, type IRouter } from "express";
import { eq, ilike, or } from "drizzle-orm";
import { db, customersTable } from "@workspace/db";
import {
  ListCustomersQueryParams,
  CreateCustomerBody,
  GetCustomerParams,
  UpdateCustomerParams,
  UpdateCustomerBody,
  DeleteCustomerParams,
  ListCustomersResponse,
  GetCustomerResponse,
  UpdateCustomerResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function getNextCustomerCode(): Promise<string> {
  const count = await db.$count(customersTable);
  return String(count + 1000001).slice(1); // e.g. 1000001 -> "000001", then 2000001...
}

function formatCustomer(c: typeof customersTable.$inferSelect) {
  return {
    ...c,
    createdAt: c.createdAt.toISOString(),
  };
}

router.get("/customers", async (req, res): Promise<void> => {
  const params = ListCustomersQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { search } = params.data;
  let rows;

  if (search) {
    rows = await db
      .select()
      .from(customersTable)
      .where(or(
        ilike(customersTable.name, `%${search}%`),
        ilike(customersTable.customerCode, `%${search}%`)
      ))
      .orderBy(customersTable.createdAt);
  } else {
    rows = await db.select().from(customersTable).orderBy(customersTable.createdAt);
  }

  res.json(ListCustomersResponse.parse(rows.map(formatCustomer)));
});

router.post("/customers", async (req, res): Promise<void> => {
  const parsed = CreateCustomerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const count = await db.$count(customersTable);
  const code = String(count + 1000001).slice(1);

  const [customer] = await db.insert(customersTable).values({
    customerCode: code,
    name: parsed.data.name,
    phone: parsed.data.phone ?? null,
    address: parsed.data.address ?? null,
    notes: parsed.data.notes ?? null,
  }).returning();

  res.status(201).json(GetCustomerResponse.parse(formatCustomer(customer)));
});

router.get("/customers/:id", async (req, res): Promise<void> => {
  const params = GetCustomerParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [customer] = await db.select().from(customersTable).where(eq(customersTable.id, params.data.id));
  if (!customer) {
    res.status(404).json({ error: "Customer not found" });
    return;
  }

  res.json(GetCustomerResponse.parse(formatCustomer(customer)));
});

router.patch("/customers/:id", async (req, res): Promise<void> => {
  const params = UpdateCustomerParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateCustomerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [customer] = await db
    .update(customersTable)
    .set(parsed.data)
    .where(eq(customersTable.id, params.data.id))
    .returning();

  if (!customer) {
    res.status(404).json({ error: "Customer not found" });
    return;
  }

  res.json(UpdateCustomerResponse.parse(formatCustomer(customer)));
});

router.delete("/customers/:id", async (req, res): Promise<void> => {
  const params = DeleteCustomerParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [customer] = await db.delete(customersTable).where(eq(customersTable.id, params.data.id)).returning();
  if (!customer) {
    res.status(404).json({ error: "Customer not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
