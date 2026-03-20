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

// CORS for the frontend
app.use(
  "*",
  cors({
    origin: ["http://localhost:5173", "https://aura-bi.pages.dev"],
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
