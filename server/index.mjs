import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";

import bcrypt from "bcryptjs";
import { parse as parseCookie, serialize as serializeCookie } from "cookie";
import dotenv from "dotenv";
import express from "express";

import {
  confirmOrder,
  createMenuItem,
  deleteMenuItem,
  listAllMenuItems,
  listOrders,
  listVisibleMenuItems,
  submitOrder,
  updateMenuItem,
} from "./store.mjs";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const distDir = path.join(projectRoot, "dist");
const OWNER_PASSWORD_HASH = process.env.OWNER_PASSWORD_HASH?.trim();
const COOKIE_NAME = "foodshop_owner_session";
const SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 8;
const LOGIN_WINDOW_MS = 1000 * 60 * 15;
const MAX_LOGIN_ATTEMPTS = 5;

if (!OWNER_PASSWORD_HASH) {
  throw new Error(
    "Missing OWNER_PASSWORD_HASH. Create a .env file and set a bcrypt hash. Run: npm run hash-password -- \"YourStrongPassword\"",
  );
}

const app = express();
const sessions = new Map();
const loginAttempts = new Map();

app.disable("x-powered-by");
app.use(express.json({ limit: "1mb" }));

function getClientIp(req) {
  return req.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim() || req.socket.remoteAddress || "unknown";
}

function readSessionToken(req) {
  const cookies = parseCookie(req.headers.cookie || "");
  return cookies[COOKIE_NAME];
}

function setSessionCookie(res, token) {
  res.setHeader(
    "Set-Cookie",
    serializeCookie(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: Math.floor(SESSION_MAX_AGE_MS / 1000),
    }),
  );
}

function clearSessionCookie(res) {
  res.setHeader(
    "Set-Cookie",
    serializeCookie(COOKIE_NAME, "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    }),
  );
}

function getSession(req) {
  const token = readSessionToken(req);

  if (!token) {
    return null;
  }

  const session = sessions.get(token);

  if (!session) {
    return null;
  }

  if (Date.now() - session.createdAt > SESSION_MAX_AGE_MS) {
    sessions.delete(token);
    return null;
  }

  session.lastSeenAt = Date.now();
  return { token, session };
}

function requireOwner(req, res, next) {
  const current = getSession(req);

  if (!current) {
    res.status(401).json({ message: "Owner login required." });
    return;
  }

  req.ownerSession = current.session;
  req.ownerToken = current.token;
  next();
}

function getLoginStatus(ip) {
  const current = loginAttempts.get(ip);

  if (!current) {
    return { count: 0, lockedUntil: 0, windowStart: Date.now() };
  }

  if (Date.now() - current.windowStart > LOGIN_WINDOW_MS) {
    loginAttempts.delete(ip);
    return { count: 0, lockedUntil: 0, windowStart: Date.now() };
  }

  return current;
}

function recordFailedLogin(ip) {
  const current = getLoginStatus(ip);
  const nextCount = current.count + 1;
  const lockedUntil = nextCount >= MAX_LOGIN_ATTEMPTS ? Date.now() + LOGIN_WINDOW_MS : 0;
  loginAttempts.set(ip, {
    count: nextCount,
    lockedUntil,
    windowStart: current.windowStart,
  });
  return { nextCount, lockedUntil };
}

function clearFailedLogins(ip) {
  loginAttempts.delete(ip);
}

app.get("/api/auth/session", (req, res) => {
  res.json({ authenticated: Boolean(getSession(req)) });
});

app.post("/api/auth/login", async (req, res) => {
  const ip = getClientIp(req);
  const current = getLoginStatus(ip);

  if (current.lockedUntil && current.lockedUntil > Date.now()) {
    res.status(429).json({ message: "Too many failed attempts. Try again later." });
    return;
  }

  const password = String(req.body?.password ?? "");

  if (!password) {
    res.status(400).json({ message: "Password is required." });
    return;
  }

  const valid = await bcrypt.compare(password, OWNER_PASSWORD_HASH);

  if (!valid) {
    const attempt = recordFailedLogin(ip);
    res.status(attempt.lockedUntil ? 429 : 401).json({
      message: attempt.lockedUntil
        ? "Too many failed attempts. Try again later."
        : "Incorrect password.",
    });
    return;
  }

  clearFailedLogins(ip);
  const token = crypto.randomBytes(32).toString("hex");
  sessions.set(token, {
    createdAt: Date.now(),
    lastSeenAt: Date.now(),
    ip,
  });
  setSessionCookie(res, token);
  res.json({ authenticated: true });
});

app.post("/api/auth/logout", (req, res) => {
  const current = getSession(req);

  if (current) {
    sessions.delete(current.token);
  }

  clearSessionCookie(res);
  res.json({ authenticated: false });
});

app.get("/api/menu", async (_req, res, next) => {
  try {
    res.json(await listVisibleMenuItems());
  } catch (error) {
    next(error);
  }
});

app.post("/api/orders", async (req, res, next) => {
  try {
    const order = await submitOrder(req.body?.tableNumber, req.body?.cart ?? {});
    res.status(201).json(order);
  } catch (error) {
    next(error);
  }
});

app.get("/api/owner/menu", requireOwner, async (_req, res, next) => {
  try {
    res.json(await listAllMenuItems());
  } catch (error) {
    next(error);
  }
});

app.post("/api/owner/menu", requireOwner, async (req, res, next) => {
  try {
    res.status(201).json(await createMenuItem(req.body ?? {}));
  } catch (error) {
    next(error);
  }
});

app.put("/api/owner/menu/:itemId", requireOwner, async (req, res, next) => {
  try {
    res.json(await updateMenuItem(req.params.itemId, req.body ?? {}));
  } catch (error) {
    next(error);
  }
});

app.delete("/api/owner/menu/:itemId", requireOwner, async (req, res, next) => {
  try {
    await deleteMenuItem(req.params.itemId);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

app.get("/api/owner/orders", requireOwner, async (req, res, next) => {
  try {
    const status = typeof req.query.status === "string" ? req.query.status : undefined;
    res.json(await listOrders(status));
  } catch (error) {
    next(error);
  }
});

app.post("/api/owner/orders/:orderId/confirm", requireOwner, async (req, res, next) => {
  try {
    res.json(await confirmOrder(req.params.orderId));
  } catch (error) {
    next(error);
  }
});

app.use((error, _req, res, _next) => {
  const message = error instanceof Error ? error.message : "Server error.";
  const status = /required|incorrect|invalid|found|later|least one|before submitting/i.test(message) ? 400 : 500;
  res.status(status).json({ message });
});

if (process.env.NODE_ENV === "production") {
  app.use(express.static(distDir));
  app.get("/{*splat}", async (_req, res) => {
    res.type("html").send(await readFile(path.join(distDir, "index.html"), "utf8"));
  });
}

const port = Number(process.env.PORT || 8787);
app.listen(port, "0.0.0.0", () => {
  console.log(`FoodShop server running on http://localhost:${port}`);
});
