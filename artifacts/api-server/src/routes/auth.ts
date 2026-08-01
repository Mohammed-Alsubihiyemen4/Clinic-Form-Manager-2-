import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { z } from "zod";

const router: IRouter = Router();

const LoginBody = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "بيانات غير صحيحة" });
    return;
  }

  const { username, password } = parsed.data;
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, username));

  if (!user) {
    res.status(401).json({ error: "اسم المستخدم أو كلمة المرور غير صحيحة" });
    return;
  }

  if (!user.isActive) {
    res.status(403).json({ error: "هذا الحساب موقوف. تواصل مع مدير النظام." });
    return;
  }

  const passwordHash = Buffer.from(password).toString("base64");
  if (passwordHash !== user.passwordHash) {
    res.status(401).json({ error: "اسم المستخدم أو كلمة المرور غير صحيحة" });
    return;
  }

  // Update last login
  await db
    .update(usersTable)
    .set({ lastLogin: new Date() })
    .where(eq(usersTable.id, user.id));

  res.json({
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    role: user.role,
    permissions: user.permissions ? JSON.parse(user.permissions) : null,
  });
});

export default router;
