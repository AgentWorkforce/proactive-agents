import { Hono } from "hono";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import type { AppEnv } from "./env.js";
import { handleError, handleNotFound } from "./middleware/error.js";
import { rateLimitMiddleware } from "./middleware/rate-limit.js";
import { adminRoutes } from "./routes/admin.js";
import { fsRoutes } from "./routes/fs.js";
import { healthRoutes } from "./routes/health.js";
import { importRoutes } from "./routes/import.js";
import { integrationRoutes } from "./routes/integrations.js";
import { opsRoutes } from "./routes/ops.js";
import { syncRoutes } from "./routes/sync.js";
import { webhookSubscriptionRoutes } from "./routes/webhook-subscriptions.js";
import { webhookRoutes } from "./routes/webhooks.js";

export function createApp(): Hono<AppEnv> {
  const app = new Hono<AppEnv>();

  app.use("*", cors());
  app.use("*", secureHeaders());
  // Rate-limit before any other work — must run after CORS/headers
  // (so the 429 carries CORS headers and the secure-headers policy)
  // but before request-id tagging so the limiter's KV reads don't
  // hold a request slot when the rest of the handler isn't going to
  // execute. See packages/router/src/rate-limit.ts for the design.
  app.use("*", rateLimitMiddleware);
  app.use("*", async (c, next) => {
    const requestId = crypto.randomUUID();
    const correlationId = c.req.header("X-Correlation-Id")?.trim() || requestId;

    c.set("requestId", requestId);
    c.set("correlationId", correlationId);

    await next();

    c.header("X-Request-Id", requestId);
    c.header("X-Correlation-Id", correlationId);
  });

  app.route("/", healthRoutes);
  app.route("/", integrationRoutes);
  app.route("/", fsRoutes);
  app.route("/", importRoutes);
  app.route("/", syncRoutes);
  app.route("/", webhookSubscriptionRoutes);
  app.route("/", webhookRoutes);
  app.route("/", opsRoutes);
  app.route("/", adminRoutes);

  app.notFound(handleNotFound);
  app.onError(handleError);

  return app;
}

export const app = createApp();
