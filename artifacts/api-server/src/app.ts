import express, { type Express, type ErrorRequestHandler } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { clerkMiddleware } from "@clerk/express";
import router from "./routes";
import { logger } from "./lib/logger";
import { BookingError } from "./lib/booking-service";
import {
  CLERK_PROXY_PATH,
  clerkProxyMiddleware,
} from "./middlewares/clerkProxyMiddleware";

const app: Express = express();
// Production has exactly one trusted reverse proxy (Caddy). API is not public.
app.set("trust proxy", process.env.NODE_ENV === "production" ? 1 : false);
app.disable("x-powered-by");

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());
app.use(
  cors({
    credentials: true,
    origin: process.env.PUBLIC_ORIGIN || "http://localhost:5173",
  }),
);
app.use(express.json({ limit: "32kb" }));
app.use(express.urlencoded({ extended: true }));
if (process.env.CLERK_SECRET_KEY && process.env.CLERK_PUBLISHABLE_KEY)
  app.use(
    clerkMiddleware({
      publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
      ...(process.env.PUBLIC_ORIGIN
        ? { authorizedParties: [process.env.PUBLIC_ORIGIN] }
        : {}),
    }),
  );
else
  app.use("/api/admin", (_req, res) => {
    res.status(503).json({ error: "Administrator sign-in is not configured." });
  });

app.use("/api", router);
const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof BookingError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  if (err?.type === "entity.parse.failed") {
    res.status(400).json({ error: "Invalid request body." });
    return;
  }
  if (err?.type === "entity.too.large") {
    res.status(413).json({ error: "Request is too large." });
    return;
  }
  logger.error({ code: err?.code || "unknown" }, "Request failed");
  res.status(500).json({
    error:
      "We could not complete that request. Please try again or email Memento.",
  });
};
app.use(errorHandler);

export default app;
