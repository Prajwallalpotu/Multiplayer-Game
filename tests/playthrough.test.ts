import { test } from "node:test";
import assert from "node:assert/strict";
import { io, type Socket } from "socket.io-client";
import { createGameServer } from "../server/index.ts";
import {
  HOTSPOTS,
  LOCATIONS,
  ROLES,
  type GameView,
  type LocationId,
} from "../shared/world.ts";
import { clues, puzzles, finale } from "../server/episode.ts";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
test(
  "complete episode over real sockets using ordinary travel, movement, discovery, sharing and six phone controllers",
  { timeout: 120000 },
  async () => {
    const server = createGameServer(":memory:");
    await new Promise<void>((r) => server.http.listen(0, "127.0.0.1", r));
    const url = "http://127.0.0.1:" + (server.http.address() as any).port;
    const sockets: Socket[] = [];
    type Client = { socket: Socket; state?: GameView };
    const players: { laptop: Client; phone: Client }[] = [];
    let seq = 0;
    const request = async (path: string, body: any) => {
      const response = await fetch(url + "/api/" + path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const value: any = await response.json();
      assert(response.ok, JSON.stringify(value));
      return value;
    };
    async function connect(credential: any) {
      const socket = io(url, {
          auth: credential,
          forceNew: true,
          reconnection: false,
        }),
        client: Client = { socket };
      sockets.push(socket);
      socket.on("state", (state) => (client.state = state));
      await new Promise<void>((r, j) => {
        socket.on("connect", r);
        socket.on("connect_error", j);
      });
      for (let i = 0; !client.state && i < 100; i++) await sleep(10);
      assert(client.state);
      return client;
    }
    async function send(client: Client, type: string, data: any = {}) {
      const result = await client.socket
        .timeout(3000)
        .emitWithAck("action", { id: "walkthrough-" + ++seq, type, ...data });
      assert(result.ok, `${type}: ${result.error}`);
      return result;
    }
    async function travel(client: Client, target: LocationId) {
      await send(client, "panel", { value: "" });
      const g = client.state!,
        me = g.players.find((p) => p.id === g.you)!;
      if (me.location === target) return;
      const queue: { id: LocationId; path: LocationId[] }[] = [
          { id: me.location, path: [] },
        ],
        visited = new Set<string>();
      let path: LocationId[] | undefined;
      while (queue.length) {
        const n = queue.shift()!;
        if (n.id === target) {
          path = n.path;
          break;
        }
        if (visited.has(n.id)) continue;
        visited.add(n.id);
        const l = LOCATIONS.find((l) => l.id === n.id)!;
        for (const id of l.links) {
          const d = LOCATIONS.find((l) => l.id === id)!;
          if (d.requires.every((p) => g.solved.includes(p)))
            queue.push({ id, path: [...n.path, id] });
        }
      }
      assert(path, `A path to ${target} exists`);
      for (const id of path) await send(client, "travel", { location: id });
    }
    async function approach(client: Client, hotspot: string) {
      const h = HOTSPOTS.find((h) => h.id === hotspot)!;
      await travel(client, h.location);
      for (let i = 0; i < 100; i++) {
        const g = client.state!,
          me = g.players.find((p) => p.id === g.you)!;
        if (Math.hypot(me.x - h.x, me.y - h.y) < 16) {
          client.socket.emit("move", { x: 0, y: 0 });
          return;
        }
        const dx = h.x - me.x,
          dy = h.y - me.y,
          n = Math.hypot(dx, dy);
        client.socket.emit("move", { x: dx / n, y: dy / n });
        await sleep(80);
      }
      assert.fail("Could not approach " + hotspot);
    }
    try {
      let room = "";
      for (let i = 0; i < 6; i++) {
        const cred = await request(
          i ? "join" : "rooms",
          i
            ? { code: room, playerName: ROLES[i].short }
            : {
                name: "AUTOMATED VALIDATION · NOT A HUMAN TEAM",
                playerName: ROLES[i].short,
                public: false,
              },
        );
        room = cred.code;
        const laptop = await connect(cred);
        const phone = await connect(
          await request("pair", { pairCode: laptop.state!.pair!.code }),
        );
        players.push({ laptop, phone });
        await send(phone, "role", { role: ROLES[i].id });
        await send(phone, "voice", { value: "text" });
        await send(phone, "checked");
        await send(phone, "ready");
      }
      await send(players[0].phone, "start");
      for (const { phone } of players)
        await send(phone, "panel", { value: "" });
      for (const puzzle of puzzles.filter((q) => q.id !== "p14")) {
        for (const id of puzzle.needs) {
          if (
            players[0].phone.state!.evidence.some(
              (e) => e.id === id && e.shared,
            )
          )
            continue;
          const c = clues.find((c) => c.id === id)!,
            client = players[ROLES.findIndex((r) => r.id === c.role)].phone;
          await approach(client, c.hotspot);
          await send(client, "ability", { hotspot: c.hotspot });
          assert(client.state!.evidence.some((e) => e.id === id));
          await send(client, "share", { clue: id });
        }
        const submitter = players[puzzle.act % 6].phone;
        await travel(submitter, puzzle.location);
        await send(submitter, "panel", { value: "puzzle:" + puzzle.id });
        for (let i = 0; i < puzzle.answer.length; i++)
          await send(submitter, "draft", {
            puzzle: puzzle.id,
            slot: i,
            value: puzzle.answer[i],
          });
        await send(submitter, "solve", {
          puzzle: puzzle.id,
          answers: submitter.state!.drafts[puzzle.id],
        });
        assert(submitter.state!.solved.includes(puzzle.id));
      }
      for (const f of finale) {
        const client = players[ROLES.findIndex((r) => r.id === f.role)].phone;
        await approach(client, f.hotspot);
        await send(client, "arm", { answer: f.answer });
      }
      for (const { laptop, phone } of players) {
        assert.equal(laptop.state!.status, "complete");
        assert.equal(phone.state!.status, "complete");
        assert.equal(phone.state!.report.major, clues.length);
        assert.equal(phone.state!.solved.length, 14);
        assert.equal(phone.state!.report.eligible, false);
      }
    } finally {
      for (const s of sockets) s.disconnect();
      await sleep(30);
      await server.close();
    }
  },
);
