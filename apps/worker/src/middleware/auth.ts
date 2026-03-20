import { Context, Next } from "hono";
import { jwtVerify } from "jose";
import type { Env } from "../index";

export async function authMiddleware(c: Context<{ Bindings: Env }>, next: Next) {
  // Skip auth for auth routes
  if (c.req.path.startsWith("/api/auth")) {
    return next();
  }

  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const token = authHeader.slice(7);
  try {
    const secret = new TextEncoder().encode(c.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    c.set("userId", payload.sub as string);
    c.set("userTier", payload.tier as string);
    return next();
  } catch {
    return c.json({ error: "Invalid token" }, 401);
  }
}
