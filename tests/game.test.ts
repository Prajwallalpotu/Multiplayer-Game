import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  action,
  newRoom,
  addPlayer,
  pair,
  view,
  tick,
  paused,
  unlocked,
  elapsed,
  type Room,
  type Player,
} from "../server/game.ts";
import { clues, puzzles, finale } from "../server/episode.ts";
import { ROLES, HOTSPOTS, LOCATIONS } from "../shared/world.ts";
import { Store } from "../server/store.ts";
let seq = 0;
const send = (
  r: Room,
  p: Player,
  type: string,
  data: any = {},
  device: "phone" | "laptop" = "laptop",
) => action(r, p, device, { id: "test-" + ++seq, type, ...data });
function ready() {
  const r = newRoom("Test team", "One");
  for (let i = 1; i < 6; i++) addPlayer(r, "Player " + i);
  for (let i = 0; i < 6; i++) {
    const p = r.players[i];
    p.laptop = true;
    pair(r, p.pair.code);
    p.phone = true;
    send(r, p, "role", { role: ROLES[i].id });
    send(r, p, "voice", { value: "text" }, "phone");
    send(r, p, "checked", {}, "phone");
    send(r, p, "ready");
  }
  return r;
}
function discover(r: Room, id: string) {
  const c = clues.find((c) => c.id === id)!;
  const p = r.players.find((p) => p.role === c.role)!;
  assert(
    unlocked(r, c.location),
    `Evidence ${id} must be reachable before it is needed`,
  );
  const h = HOTSPOTS.find((h) => h.id === c.hotspot)!;
  p.location = c.location;
  p.x = h.x;
  p.y = h.y;
  send(r, p, "ability", { hotspot: h.id });
  send(r, p, "share", { clue: id });
}
test("exactly six seats, atomic roles, private pairing and readiness", () => {
  const r = newRoom("Team", "A"),
    a = r.players[0],
    b = addPlayer(r, "B");
  send(r, a, "role", { role: "trace" });
  assert.throws(() => send(r, b, "role", { role: "trace" }), /already has/);
  assert.throws(() => send(r, a, "start"), /Every investigator/);
  assert.throws(() => send(r, a, "ready"), /controller\/audio check/);
  const key = a.pair.code;
  const paired = pair(r, key);
  assert.equal(paired.id, a.id);
  assert.notEqual(a.token, a.phoneToken);
  assert.throws(() => pair(r, key), /invalid or expired/);
  b.pair.expires = 1;
  assert.throws(() => pair(r, b.pair.code), /invalid or expired/);
  for (let i = 0; i < 4; i++) addPlayer(r, "C");
  assert.throws(() => addPlayer(r, "extra"), /six seats/);
});
test("role and proximity are authoritative, unshared observations and answers remain private", () => {
  const r = ready(),
    a = r.players[0],
    b = r.players[1];
  send(r, a, "start");
  a.panel = "";
  b.panel = "";
  assert.throws(() => send(r, a, "ability", { hotspot: "array" }), /closer/);
  a.location = "street";
  a.x = 45;
  a.y = 62;
  b.x = 45;
  b.y = 62;
  assert.throws(
    () => send(r, b, "ability", { hotspot: "boundary" }),
    /different specialist/,
  );
  send(r, a, "ability", { hotspot: "boundary" });
  assert(view(r, a, "laptop").evidence.some((e) => e.id === "perimeter"));
  assert(!view(r, b, "laptop").evidence.some((e) => e.id === "perimeter"));
  const v = JSON.stringify(view(r, b, "phone"));
  assert(!v.includes("answer"));
  assert(!v.includes(a.token));
  assert(!v.includes("YOUR PRIVATE"));
  assert(!v.includes("final rehearsal"));
  assert.equal(view(r, b, "phone").pair, undefined);
  send(r, a, "share", { clue: "perimeter" });
  assert(view(r, b, "laptop").evidence.some((e) => e.id === "perimeter"));
  assert.throws(() => send(r, b, "share", { clue: "living" }), /not observed/);
});
test("every required clue is reachable; complete deterministic episode; all six finale roles required", () => {
  const r = ready();
  send(r, r.players[0], "start");
  for (const p of r.players) p.panel = "";
  for (const q of puzzles.filter((q) => q.id !== "p14")) {
    assert(q.prerequisites.every((id) => r.solved.includes(id)));
    for (const id of q.needs) discover(r, id);
    const p = r.players[0];
    p.location = q.location;
    if (q.id === "p11") {
      assert.throws(
        () =>
          send(r, p, "solve", {
            puzzle: q.id,
            answers: [
              "Restart the experiment",
              "The original recorded residents",
            ],
          }),
        /six new silhouettes/i,
      );
      assert.equal(r.restartTrip, true);
      assert.equal(r.solved.length, 10);
    }
    send(r, p, "solve", { puzzle: q.id, answers: q.answer });
    assert(r.solved.includes(q.id));
    const n = r.solved.length;
    send(r, p, "solve", { puzzle: q.id, answers: q.answer });
    assert.equal(r.solved.length, n);
  }
  for (const id of puzzles.at(-1)!.needs) discover(r, id);
  for (let i = 0; i < finale.length; i++) {
    const f = finale[i],
      p = r.players.find((p) => p.role === f.role)!,
      h = HOTSPOTS.find((h) => h.id === f.hotspot)!;
    p.location = f.location;
    p.x = h.x;
    p.y = h.y;
    assert.throws(
      () => send(r, p, "arm", { answer: "not a configuration" }),
      /contradicts/,
    );
    send(r, p, "arm", { answer: f.answer });
    if (i < 5) assert.equal(r.status, "playing");
  }
  assert.equal(r.status, "complete");
  assert.equal(new Set(r.armed).size, 6);
  const report = view(r, r.players[0], "laptop").report;
  assert.match(report.outcome, /187/);
  assert.match(report.outcome, /Ada does not return/);
  assert.equal(report.eligible, false);
  assert.equal(r.solved.length, 14);
});
test("puzzle validation requires evidence, prerequisites, location; hints stop at three", () => {
  const r = ready(),
    p = r.players[0];
  send(r, p, "start");
  assert.throws(
    () => send(r, p, "solve", { puzzle: "p08", answers: [] }),
    /prerequisite/,
  );
  assert.throws(
    () => send(r, p, "solve", { puzzle: "p01", answers: puzzles[0].answer }),
    /Share/,
  );
  for (const id of puzzles[0].needs) discover(r, id);
  p.location = "clinic";
  assert.throws(
    () => send(r, p, "solve", { puzzle: "p01", answers: puzzles[0].answer }),
    /Visit/,
  );
  p.location = "street";
  assert.throws(
    () => send(r, p, "solve", { puzzle: "p01", answers: [] }),
    /Complete every/,
  );
  assert.throws(
    () =>
      send(r, p, "solve", {
        puzzle: "p01",
        answers: ["The recording ring", "The gate motor"],
      }),
    /separate systems/,
  );
  for (let i = 0; i < 6; i++) send(r, p, "hint", { puzzle: "p01" });
  assert.equal(r.hints.p01, 3);
  assert.equal(view(r, p, "laptop").puzzles[0].hints.length, 3);
  assert.equal(view(r, p, "laptop").puzzles.length, 1);
});
test("movement watchdog, pause, reconnect and idempotent drafts", () => {
  const r = ready(),
    p = r.players[0];
  send(r, p, "start");
  p.panel = "";
  const now = Date.now();
  r.lastTick = now;
  p.input = { x: 1, y: 0, at: now };
  const x = p.x;
  tick(r, now + 50);
  assert(p.x > x);
  const x2 = p.x;
  tick(r, now + 1000);
  assert.equal(p.x, x2);
  p.phone = false;
  assert(paused(r));
  const ms = r.activeMs;
  tick(r, now + 1500);
  assert.equal(r.activeMs, ms);
  assert.throws(() => send(r, p, "travel", { location: "police" }), /paused/);
  p.phone = true;
  assert(!paused(r));
  const a = { id: "same-action", type: "pause" };
  action(r, p, "laptop", a);
  action(r, p, "laptop", a);
  assert.equal(r.manualPause, true);
  send(r, p, "pause");
  send(
    r,
    p,
    "draft",
    { puzzle: "p01", slot: 0, value: "The municipal battery" },
    "phone",
  );
  assert.equal(view(r, p, "laptop").drafts.p01[0], "The municipal battery");
  assert.throws(
    () => send(r, p, "draft", { puzzle: "p01", slot: 4, value: "arbitrary" }),
    /Invalid/,
  );
});
test("SQLite restart preserves discoveries, choices and seats but disconnects devices; ranked results unique", () => {
  const dir = mkdtempSync(join(tmpdir(), "bellwether-")),
    path = join(dir, "test.sqlite");
  try {
    const r = ready(),
      p = r.players[0];
    send(r, p, "start");
    discover(r, "perimeter");
    send(r, p, "draft", {
      puzzle: "p01",
      slot: 0,
      value: "The municipal battery",
    });
    let store = new Store(path);
    store.save(r);
    store.close();
    store = new Store(path);
    const restored = store.load()[0];
    assert.equal(restored.players[0].token, p.token);
    assert.equal(restored.players[0].phoneToken, p.phoneToken);
    assert.deepEqual(restored.shared, ["perimeter"]);
    assert.equal(restored.players[0].drafts.p01[0], "The municipal battery");
    assert.equal(restored.players.length, 6);
    assert(paused(restored));
    restored.mode = "ranked";
    restored.status = "complete";
    restored.endedAt = restored.startedAt + 123456;
    store.save(restored);
    store.save(restored);
    assert.equal(store.leaderboard().length, 1);
    assert.equal(elapsed(restored), 123456);
    restored.code = "SIMTEST";
    restored.simulated = true;
    store.save(restored);
    assert.equal(store.leaderboard().length, 1);
    store.close();
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
test("dependency graph is acyclic and every role contributes to multiple acts and finale", () => {
  const resolved = new Set<string>();
  for (const p of puzzles) {
    assert(
      p.prerequisites.every((id) => resolved.has(id)),
      p.id,
    );
    resolved.add(p.id);
    assert.equal(p.hints.length, 3);
    assert(p.needs.every((id) => clues.some((c) => c.id === id)));
    assert(p.answer.every((a, i) => p.slots[i].options.includes(a)));
  }
  for (const role of ROLES) {
    const qs = puzzles.filter((p) =>
      p.needs.some((id) => clues.find((c) => c.id === id)?.role === role.id),
    );
    assert(qs.length >= 5, role.id + " meaningful involvement");
    assert(new Set(qs.map((q) => q.act)).size >= 4);
    assert.equal(finale.filter((f) => f.role === role.id).length, 1);
  }
  for (const l of LOCATIONS)
    for (const target of l.links)
      assert(LOCATIONS.some((n) => n.id === target));
});

test("restored town remains explorable without changing completion time or score", () => {
  const r = ready(),
    p = r.players[0];
  send(r, p, "start");
  r.status = "complete";
  r.solved = puzzles.map((q) => q.id);
  r.endedAt = r.startedAt + 1000;
  r.activeMs = 800;
  p.panel = "";
  const recorded = elapsed(r);
  send(r, p, "travel", { location: "police" });
  assert.equal(p.location, "police");
  const now = Date.now();
  r.lastTick = now;
  p.input = { x: 1, y: 0, at: now };
  const x = p.x;
  tick(r, now + 100);
  assert(p.x > x);
  assert.equal(elapsed(r), recorded);
  assert.throws(
    () => send(r, p, "hint", { puzzle: "p01" }),
    /Start an investigation/,
  );
});

test("two keyboard players cover all specialties, share every clue and complete six latched stations", () => {
  const r = newRoom("Duo case", "A"), host = r.players[0];
  const partner = addPlayer(r,"B");
  let p = host;
  p.laptop = true;
  send(r, p, "assignRoles");
  assert.equal(p.roles?.length, 3);
  partner.laptop=true;
  send(r,partner,"voice",{value:"text"}); send(r,partner,"checked"); send(r,partner,"ready");
  send(r, p, "voice", {value:"text"});
  send(r, p, "checked");
  send(r, p, "ready");
  send(r, p, "start");
  assert.equal(p.phone, false);
  assert.equal(paused(r), false);
  p.panel = "";
  for (const q of puzzles) {
    for (const id of q.needs) {
      const c = clues.find(c => c.id === id)!;
      const h = HOTSPOTS.find(h => h.id === c.hotspot)!;
      assert(unlocked(r, c.location));
      p = r.players.find(player => player.roles?.includes(c.role))!;
      send(r, p, "role", {role:c.role});
      p.location = c.location; p.x=h.x; p.y=h.y;
      send(r, p, "ability", {hotspot:h.id});
      send(r, p, "share", {clue:id});
    }
    if (q.kind !== "finale") {
      p.location = q.location;
      send(r, p, "solve", {puzzle:q.id, answers:q.answer});
    }
  }
  for (const f of finale) {
    p = r.players.find(player => player.roles?.includes(f.role))!;
    send(r, p, "role", {role:f.role});
    const h = HOTSPOTS.find(h => h.id === f.hotspot)!;
    p.location = f.location; p.x=h.x; p.y=h.y;
    send(r, p, "arm", {answer:f.answer});
  }
  assert.equal(r.status, "complete");
  assert.equal(r.armed.length, 6);
  assert.equal(view(r,p,"laptop").report.eligible, false);
});

test("shared roles stay exclusive, ranked needs six humans, and keyboard fallback resumes a lost phone", () => {
  const r = newRoom("Small group", "A"), a = r.players[0], b = addPlayer(r,"B");
  send(r,a,"claimRole",{role:"trace"});
  assert.throws(() => send(r,b,"claimRole",{role:"trace"}), /already has/);
  send(r,a,"assignRoles");
  assert.equal(a.roles?.length,3); assert.equal(b.roles?.length,3);
  for(const p of r.players) {
    p.laptop=true;
    send(r,p,"voice",{value:"text"}); send(r,p,"checked"); send(r,p,"ready");
  }
  r.mode="ranked";
  assert.throws(() => send(r,a,"start"), /Ranked games require six/);
  r.mode="casual"; send(r,a,"start");
  const otherRole = b.role, otherRoles = [...b.roles!];
  send(r,a,"role",{role:a.roles![1]});
  assert.equal(b.role,otherRole); assert.deepEqual(b.roles,otherRoles);
  assert.throws(() => send(r,a,"role",{role:b.role}), /assigned roles/);
  assert.throws(() => send(r,a,"claimRole",{role:b.role}), /assigned roles/);
  assert.equal(b.role,otherRole); assert.deepEqual(b.roles,otherRoles);
  send(r,a,"controller",{value:"phone"}); assert(paused(r));
  send(r,a,"controller",{value:"laptop"}); assert(!paused(r));
  assert.throws(() => send(r,a,"checked",{},"phone"), /selected controller/);
  r.solved.push("p01"); a.x=80; a.y=80;
  assert.throws(() => send(r,a,"travel",{location:"police",entrance:true}), /closer to this entrance/);
  a.x=23;a.y=56;send(r,a,"travel",{location:"police",entrance:true});
  assert.equal(a.location,"police");
});

 test("a fully prepared solo player cannot start", () => {
  const r=newRoom("Solo rejected","A"), p=r.players[0]; p.laptop=true;
  send(r,p,"assignRoles"); send(r,p,"voice",{value:"text"}); send(r,p,"checked"); send(r,p,"ready");
  assert.throws(()=>send(r,p,"start"), /At least two players/);
  assert.equal(r.status,"lobby");
});
