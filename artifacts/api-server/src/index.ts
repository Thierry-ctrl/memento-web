import app from "./app";
import { logger } from "./lib/logger";
import { startNotificationWorker, mailConfigured } from "./lib/notifications";
import { pool } from "@workspace/db";

const rawPort = process.env["PORT"] || "8080";

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

if (process.env.NODE_ENV === "production") {
  for (const name of [
    "CLERK_SECRET_KEY",
    "CLERK_PUBLISHABLE_KEY",
    "ADMIN_EMAIL",
    "PUBLIC_ORIGIN",
  ])
    if (!process.env[name])
      throw new Error(`${name} must be configured before production launch`);
  if (!mailConfigured())
    throw new Error(
      "Configure SMTP_HOST, SMTP_USER, SMTP_PASS and SMTP_FROM before production launch",
    );
}
const stopWorker = startNotificationWorker();
const server = app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});
for (const signal of ["SIGINT", "SIGTERM"] as const)
  process.on(signal, () => {
    stopWorker();
    server.close(() => {
      void pool.end().then(() => process.exit(0));
    });
  });
