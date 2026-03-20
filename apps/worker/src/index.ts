import { Hono } from "hono";
import { cors } from "hono/cors";
import { authRoutes } from "./routes/auth";
import { dashboardRoutes } from "./routes/dashboards";
import { shareRoutes } from "./routes/share";
import { authMiddleware } from "./middleware/auth";

export type Env = {
  DB: D1Database;
  JWT_SECRET: string;
};

const app = new Hono<{ Bindings: Env }>();

// CORS - allow localhost in dev + any pages.dev or custom domain in prod
app.use(
  "*",
  cors({
    origin: (origin) => {
      if (!origin) return "https://aura-bi.pages.dev";
      if (origin.includes("localhost")) return origin;
      if (origin.endsWith(".pages.dev")) return origin;
      // Add your custom domain here:
      // if (origin.endsWith("yourdomain.com")) return origin;
      return "https://aura-bi.pages.dev";
    },
    credentials: true,
  })
);

// Health check
app.get("/api/health", (c) => c.json({ status: "ok", timestamp: new Date().toISOString() }));

// Public routes
app.route("/api/auth", authRoutes);

// Protected routes
app.use("/api/*", authMiddleware);
app.route("/api/dashboards", dashboardRoutes);
app.route("/api/share", shareRoutes);

// 404 fallback
app.notFound((c) => c.json({ error: "Not found" }, 404));

export default app;
