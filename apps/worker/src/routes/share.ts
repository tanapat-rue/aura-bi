import { Hono } from "hono";
import type { Env } from "../index";

export const shareRoutes = new Hono<{ Bindings: Env }>();

// Create a share link for a dashboard
shareRoutes.post("/", async (c) => {
  const userId = c.get("userId");
  const { dashboardId, expiresInDays } = await c.req.json();

  // Verify ownership
  const dashboard = await c.env.DB.prepare(
    "SELECT id FROM dashboards WHERE id = ? AND user_id = ?"
  )
    .bind(dashboardId, userId)
    .first();

  if (!dashboard) return c.json({ error: "Dashboard not found" }, 404);

  const id = crypto.randomUUID();
  const expiresAt = expiresInDays
    ? new Date(Date.now() + expiresInDays * 86400000).toISOString()
    : null;

  await c.env.DB.prepare(
    "INSERT INTO shared_links (id, dashboard_id, created_by, expires_at) VALUES (?, ?, ?, ?)"
  )
    .bind(id, dashboardId, userId, expiresAt)
    .run();

  return c.json({ shareId: id, expiresAt }, 201);
});

// Get shared dashboard (public - no auth needed on this specific route)
shareRoutes.get("/:id", async (c) => {
  const id = c.req.param("id");

  const link = await c.env.DB.prepare(
    `SELECT sl.*, d.title, d.description, d.config
     FROM shared_links sl
     JOIN dashboards d ON d.id = sl.dashboard_id
     WHERE sl.id = ?`
  )
    .bind(id)
    .first();

  if (!link) return c.json({ error: "Share link not found" }, 404);

  if (link.expires_at && new Date(link.expires_at as string) < new Date()) {
    return c.json({ error: "Share link expired" }, 410);
  }

  return c.json({
    dashboard: {
      title: link.title,
      description: link.description,
      config: JSON.parse(link.config as string),
    },
  });
});
