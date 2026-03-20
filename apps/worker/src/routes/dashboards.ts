import { Hono } from "hono";
import type { Env } from "../index";

export const dashboardRoutes = new Hono<{ Bindings: Env }>();

// List dashboards
dashboardRoutes.get("/", async (c) => {
  const userId = c.get("userId");
  const result = await c.env.DB.prepare(
    "SELECT id, title, description, is_public, created_at, updated_at FROM dashboards WHERE user_id = ? ORDER BY updated_at DESC"
  )
    .bind(userId)
    .all();

  return c.json({ dashboards: result.results });
});

// Get single dashboard
dashboardRoutes.get("/:id", async (c) => {
  const userId = c.get("userId");
  const id = c.req.param("id");

  const dashboard = await c.env.DB.prepare(
    "SELECT * FROM dashboards WHERE id = ? AND (user_id = ? OR is_public = 1)"
  )
    .bind(id, userId)
    .first();

  if (!dashboard) return c.json({ error: "Dashboard not found" }, 404);

  return c.json({
    dashboard: {
      ...dashboard,
      config: JSON.parse(dashboard.config as string),
    },
  });
});

// Create dashboard
dashboardRoutes.post("/", async (c) => {
  const userId = c.get("userId");
  const { title, description, config } = await c.req.json();

  if (!title) return c.json({ error: "Title is required" }, 400);

  const id = crypto.randomUUID();
  await c.env.DB.prepare(
    "INSERT INTO dashboards (id, user_id, title, description, config) VALUES (?, ?, ?, ?, ?)"
  )
    .bind(id, userId, title, description || null, JSON.stringify(config || {}))
    .run();

  return c.json({ id, title, description, config: config || {} }, 201);
});

// Update dashboard
dashboardRoutes.put("/:id", async (c) => {
  const userId = c.get("userId");
  const id = c.req.param("id");
  const { title, description, config, isPublic } = await c.req.json();

  const result = await c.env.DB.prepare(
    `UPDATE dashboards SET
      title = COALESCE(?, title),
      description = COALESCE(?, description),
      config = COALESCE(?, config),
      is_public = COALESCE(?, is_public),
      updated_at = datetime('now')
    WHERE id = ? AND user_id = ?`
  )
    .bind(
      title || null,
      description || null,
      config ? JSON.stringify(config) : null,
      isPublic != null ? (isPublic ? 1 : 0) : null,
      id,
      userId
    )
    .run();

  if (!result.meta.changes) return c.json({ error: "Dashboard not found" }, 404);
  return c.json({ success: true });
});

// Delete dashboard
dashboardRoutes.delete("/:id", async (c) => {
  const userId = c.get("userId");
  const id = c.req.param("id");

  const result = await c.env.DB.prepare(
    "DELETE FROM dashboards WHERE id = ? AND user_id = ?"
  )
    .bind(id, userId)
    .run();

  if (!result.meta.changes) return c.json({ error: "Dashboard not found" }, 404);
  return c.json({ success: true });
});
