import { Router, type IRouter } from "express";
import { eq, asc } from "drizzle-orm";
import { db, productsTable } from "@workspace/db";
import { z } from "zod";

const router: IRouter = Router();

const ProductBody = z.object({
  name: z.string().min(1),
  unit: z.string().optional().default("عام"),
  price: z.number().min(0).optional().default(0),
  isActive: z.boolean().optional().default(true),
});

function formatProduct(p: typeof productsTable.$inferSelect) {
  return {
    id: p.id,
    name: p.name,
    unit: p.unit,
    price: parseFloat(p.price as string),
    isActive: p.isActive,
    createdAt: p.createdAt.toISOString(),
  };
}

router.get("/products", async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(productsTable)
    .orderBy(asc(productsTable.name));
  res.json(rows.map(formatProduct));
});

router.post("/products", async (req, res): Promise<void> => {
  const parsed = ProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [product] = await db
    .insert(productsTable)
    .values({
      name: parsed.data.name,
      unit: parsed.data.unit,
      price: String(parsed.data.price),
      isActive: parsed.data.isActive,
    })
    .returning();
  res.status(201).json(formatProduct(product));
});

router.patch("/products/:id", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!id) { res.status(400).json({ error: "Invalid id" }); return; }

  const parsed = ProductBody.partial().safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const updateData: Partial<typeof productsTable.$inferInsert> = {};
  if (parsed.data.name != null) updateData.name = parsed.data.name;
  if (parsed.data.unit != null) updateData.unit = parsed.data.unit;
  if (parsed.data.price != null) updateData.price = String(parsed.data.price);
  if (parsed.data.isActive != null) updateData.isActive = parsed.data.isActive;

  const [product] = await db
    .update(productsTable)
    .set(updateData)
    .where(eq(productsTable.id, id))
    .returning();

  if (!product) { res.status(404).json({ error: "Product not found" }); return; }
  res.json(formatProduct(product));
});

router.delete("/products/:id", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!id) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(productsTable).where(eq(productsTable.id, id));
  res.status(204).end();
});

export default router;
