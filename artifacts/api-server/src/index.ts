import app from "./app";
import { logger } from "./lib/logger";
import { db, usersTable } from "@workspace/db";
import { count } from "drizzle-orm";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

/** Create the default admin account if no users exist yet */
async function seedAdminIfEmpty() {
  try {
    const [{ value }] = await db.select({ value: count() }).from(usersTable);
    if (value === 0) {
      await db.insert(usersTable).values({
        username: "admin",
        fullName: "مدير النظام",
        passwordHash: Buffer.from("admin123").toString("base64"),
        role: "administrator",
        isActive: true,
      });
      logger.info("Default admin user created (username: admin, password: admin123)");
    }
  } catch (err) {
    logger.error({ err }, "Failed to seed admin user");
  }
}

app.listen(port, async (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
  await seedAdminIfEmpty();
});
