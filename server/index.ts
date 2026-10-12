import express from "express";
import { loadEnvFile } from "node:process";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  action,
  addPlayer,
  newRoom,
  pair,
  tick,
  view,
  paused,
  type Room,
  type Player,
} from "./game.ts";
import { Store } from "./store.ts";
import { ROLES } from "../shared/world.ts";
export function createGameServer(
  dbPath = process.env.DATABASE_PATH || "./data/last-ten.sqlite",
) {
  const store = new Store(dbPath),
    rooms = new Map(store.load().map((r) => [r.code, r]));
  const app = express(),
    http = createServer(app);
  const origin = process.env.PUBLIC_ORIGIN;
  const io = new Server(http, {
    maxHttpBufferSize: 32000,
    cors: origin ? { origin } : undefined,
    allowRequest: (req, cb) =>
      cb(null, !origin || !req.headers.origin || req.headers.origin === origin),
  });
  app.disable("x-powered-by");
  app.use(express.json({ limit: "8kb" }));
  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "no-referrer");
    if (req.method !== "GET" && origin && req.headers.origin !== origin)
      return void res.status(403).json({ error: "Origin not allowed." });
    next();
  });
  const rates = new Map<string, { n: number; until: number }>();
  function limit(key: string, max: number, ms = 60000) {
    const now = Date.now();
    let v = rates.get(key);
    if (!v || now > v.until) {
      v = { n: 0, until: now + ms };
      rates.set(key, v);
    }
    return ++v.n <= max;
  }
  app.use("/api", (req, res, next) => {
    if (!limit("http:" + req.socket.remoteAddress, 180))
      return void res
        .status(429)
        .json({ error: "Too many requests. Try again in a minute." });
    next();
  });
  const safe =
    (fn: express.RequestHandler): express.RequestHandler =>
    (req, res, next) => {
      try {
        fn(req, res, next);
      } catch (e) {
        res.status(400).json({ error: (e as Error).message });
      }
    };
  const text = (v: unknown, max: number) => {
    if (typeof v !== "string" || !v.trim() || v.length > max)
      throw Error("Please enter a valid name or code.");
    return v.trim();
  };
  const credentials = (r: Room, p: Player, device = "laptop") => ({
    code: r.code,
    player: p.id,
    token: device === "phone" ? p.phoneToken : p.token,
    device,
  });
  function broadcast(r: Room) {
    for (const s of io.sockets.sockets.values()) {
      if (s.data.code !== r.code) continue;
      const p = r.players.find((p) => p.id === s.data.player);
      if (p) {
        const state = view(r, p, s.data.device);
        if (state.report?.eligible) state.report.rank = store.rank(r.code);
        s.emit("state", state);
      }
    }
  }
  app.get("/api/health", (_req, res) =>
    res.json({ ok: true, episode: "bellwether-1.0" }),
  );
  app.get("/api/rooms", (_req, res) =>
    res.json(
      [...rooms.values()]
        .filter((r) => r.public && r.status === "lobby" && r.players.length < 6 && r.players.some(p => p.id === r.host && p.laptop))
        .map((r) => ({
          code: r.code,
          name: r.name,
          seats: r.players.length,
          mode: r.mode,
        })),
    ),
  );
  app.get("/api/leaderboard", (_req, res) => res.json(store.leaderboard()));
  app.get("/api/config", (_req, res) => {
    let iceServers;
    try {
      iceServers = JSON.parse(
        process.env.ICE_SERVERS_JSON ||
          '[{"urls":"stun:stun.l.google.com:19302"}]',
      );
    } catch {
      iceServers = [];
    }
    res.json({
      iceServers,
      devHarness: process.env.ENABLE_DEV_HARNESS === "true",
    });
  });
  app.post(
    "/api/rooms",
    safe((req, res) => {
      if (!limit("create:" + req.socket.remoteAddress, 12))
        throw Error("Room creation limit reached. Try in a minute.");
      const r = newRoom(
        text(req.body.name, 40),
        text(req.body.playerName, 24),
        req.body.public === true,
        req.body.mode === "ranked" ? "ranked" : "casual",
      );
      while (rooms.has(r.code)) r.code = newRoom("x", "x").code;
      rooms.set(r.code, r);
      store.save(r);
      res.json(credentials(r, r.players[0]));
    }),
  );
  app.post(
    "/api/join",
    safe((req, res) => {
      const r = rooms.get(text(req.body.code, 10).toUpperCase());
      if (!r) throw Error("Room not found. Check the invitation code.");
      const p = addPlayer(r, text(req.body.playerName, 24));
      store.save(r);
      broadcast(r);
      res.json(credentials(r, p));
    }),
  );
  app.post(
    "/api/pair",
    safe((req, res) => {
      if (!limit("pair:" + req.socket.remoteAddress, 12))
        throw Error("Too many pairing attempts. Try in a minute.");
      const key = text(req.body.pairCode, 12).toUpperCase();
      const r = [...rooms.values()].find((r) =>
        r.players.some(
          (p) => p.pair.code === key && p.pair.expires > Date.now(),
        ),
      );
      if (!r)
        throw Error(
          "Pairing code expired or invalid. Ask your laptop for a new code.",
        );
      const p = pair(r, key);
      for (const s of io.sockets.sockets.values())
        if (s.data.player === p.id && s.data.device === "phone")
          s.disconnect(true);
      store.save(r);
      res.json(credentials(r, p, "phone"));
      broadcast(r);
    }),
  );
  if (process.env.ENABLE_DEV_HARNESS === "true")
    app.post(
      "/api/dev",
      safe((req, res) => {
        const r = newRoom(
          "DEVELOPMENT · simulated team",
          text(req.body.playerName || "Preview investigator", 24),
        );
        r.simulated = true;
        r.players[0].role = "trace";
        for (let i = 1; i < 6; i++) {
          const p = addPlayer(r, "SIMULATED " + ROLES[i].short);
          p.role = ROLES[i].id;
          p.simulated = true;
          p.laptop = p.phone = p.checked = p.ready = true;
          p.voice = "text";
        }
        rooms.set(r.code, r);
        store.save(r);
        res.json(credentials(r, r.players[0]));
      }),
    );
  io.use((s, next) => {
    const a = s.handshake.auth;
    if (
      !a ||
      typeof a.code !== "string" ||
      typeof a.player !== "string" ||
      typeof a.token !== "string" ||
      !["laptop", "phone"].includes(a.device)
    )
      return next(Error("Reconnect using your saved session."));
    const r = rooms.get(a.code),
      p = r?.players.find((p) => p.id === a.player);
    if (!p || a.token !== (a.device === "phone" ? p.phoneToken : p.token))
      return next(
        Error(
          "Session authorization failed. Re-pair this phone or return to your original laptop.",
        ),
      );
    s.data = { code: r!.code, player: p.id, device: a.device };
    next();
  });
  io.on("connection", (s) => {
    const r = rooms.get(s.data.code)!,
      p = r.players.find((p) => p.id === s.data.player)!,
      device = s.data.device as "laptop" | "phone";
    for (const old of io.sockets.sockets.values())
      if (
        old.id !== s.id &&
        old.data.player === p.id &&
        old.data.device === device
      )
        old.disconnect(true);
    p[device] = true;
    broadcast(r);
    s.on("action", (a, ack) => {
      if (typeof ack !== "function") return;
      if (!limit("action:" + p.id, 90, 10000))
        return ack({
          ok: false,
          error: "Too many actions. Slow down for a moment.",
        });
      try {
        action(r, p, device, a);
        store.save(r);
        broadcast(r);
        ack({ ok: true });
        if (a.type === "endSession" || a.type === "leaveSession") for (const client of io.sockets.sockets.values())
          if (client.data.code === r.code && (a.type === "endSession" || client.data.player === p.id)) client.emit("team:home");
      } catch (e) {
        store.save(r);
        broadcast(r);
        ack({ ok: false, error: (e as Error).message });
      }
    });
    s.on("move", (v) => {
      if (!limit("move:" + p.id, 45, 1000)) return;
      if (r.status === "lobby" || paused(r) || p.panel || device !== (p.controller || "laptop")) return;
      if (!v || !Number.isFinite(v.x) || !Number.isFinite(v.y)) return;
      p.input = {
        x: Math.max(-1, Math.min(1, v.x)),
        y: Math.max(-1, Math.min(1, v.y)),
        at: Date.now(),
      };
    });
    s.on("voice:presence", (speaking) => {
      if (device !== (p.controller || "laptop") || !limit("speaking:" + p.id, 10, 1000)) return;
      p.speaking = speaking === true;
      io.to(r.code + ":voice").emit("voice:presence", {
        id: p.id,
        speaking: p.speaking,
      });
    });
    s.join(r.code + ":voice");
    s.on("voice:signal", (msg) => {
      if (
        device !== (p.controller || "laptop") ||
        !limit("signal:" + p.id, 200, 10000) ||
        !msg ||
        typeof msg.to !== "string" ||
        ![
          "offer",
          "answer",
          "candidate",
          "hello",
          "bye",
          "offer-request",
        ].includes(msg.type)
      )
        return;
      const target = [...io.sockets.sockets.values()].find(
        (t) =>
          t.data.code === r.code &&
          t.data.player === msg.to &&
          t.data.device === (r.players.find(v => v.id === msg.to)?.controller || "laptop"),
      );
      if (target && target.id !== s.id)
        target.emit("voice:signal", {
          from: p.id,
          type: msg.type,
          data: msg.data,
        });
    });
    s.on("disconnect", () => {
      p[device] = false;
      p.input = { x: 0, y: 0, at: 0 };
      if (device === (p.controller || "laptop")) {
        p.speaking = false;
        io.to(r.code + ":voice").emit("voice:presence", {
          id: p.id,
          speaking: false,
        });
      }
      store.save(r);
      broadcast(r);
    });
  });
  let ticks = 0;
  const timer = setInterval(() => {
    for (const r of rooms.values()) {
      const moved = tick(r);
      if (moved || ticks % 20 === 0) broadcast(r);
      if (ticks % 40 === 0 && r.status === "playing") store.save(r);
    }
    ticks++;
    if (ticks % 1200 === 0)
      for (const [key, v] of rates) if (v.until < Date.now()) rates.delete(key);
  }, 50);
  if (existsSync(resolve("dist/index.html"))) {
    app.use(express.static(resolve("dist")));
    app.get("/{*path}", (_req, res) =>
      res.sendFile(resolve("dist/index.html")),
    );
  }
  return {
    app,
    http,
    io,
    store,
    rooms,
    close: async () => {
      clearInterval(timer);
      for (const r of rooms.values()) store.save(r);
      await new Promise<void>((resolve) => io.close(() => resolve()));
      store.close();
    },
  };
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  if (existsSync(".env")) loadEnvFile();
  const game = createGameServer();
  game.http.listen(Number(process.env.PORT) || 3001, "0.0.0.0", () =>
    console.log(
      "Bellwether server listening on port " + (process.env.PORT || 3001),
    ),
  );
  let stopping = false;
  for (const signal of ["SIGINT", "SIGTERM"] as const)
    process.on(signal, () => {
      if (stopping) return;
      stopping = true;
      void game.close().then(() => process.exit(0));
    });
}
