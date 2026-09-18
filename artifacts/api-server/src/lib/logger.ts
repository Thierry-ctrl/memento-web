import pino from "pino";

const prettyLogs = process.env.NODE_ENV === "development" && process.stdout.isTTY;

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  redact: [
    "req.headers.authorization",
    "req.headers.cookie",
    "res.headers['set-cookie']",
  ],
  ...(prettyLogs
    ? {
        transport: {
          target: "pino-pretty",
          options: { colorize: true },
        },
      } : {}),
});
