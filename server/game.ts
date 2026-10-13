import { newHandsOn, pipesSolved, type HandsOnState } from "../shared/handsOn.ts";
import { randomBytes } from "node:crypto";
import {
  ACTS,
  ownedRoles,
  entrances,
  HOTSPOTS,
  LOCATIONS,
  ROLES,
  VERSION,
  type Role,
  type LocationId,
  type GameView,
} from "../shared/world.ts";
import { clues, puzzles, finale } from "./episode.ts";
export const secret = () => randomBytes(24).toString("hex");
const code = () => randomBytes(5).toString("hex").toUpperCase();
export type Player = {
  id: string;
  name: string;
  token: string;
  phoneToken?: string;
  pair: { code: string; expires: number };
  role?: Role;
  roles?: Role[];
  controller?: "laptop" | "phone";
  ready: boolean;
  checked: boolean;
  voice: string;
  laptop: boolean;
  phone: boolean;
  speaking: boolean;
  location: LocationId;
  x: number;
  y: number;
  observations: string[];
  panel: string;
  drafts: Record<string, string[]>;
  simulated?: boolean;
  input: { x: number; y: number; at: number };
  seen: string[];
};
export type Room = {
  handsOn?: HandsOnState;
  code: string;
  name: string;
  host: string;
  public: boolean;
  mode: "casual" | "ranked";
  version: string;
  status: "lobby" | "playing" | "complete";
  players: Player[];
  solved: string[];
  shared: string[];
  armed: Role[];
  hints: Record<string, number>;
  events: string[];
  chat: { name: string; text: string }[];
  startedAt: number;
  endedAt: number;
  activeMs: number;
  lastTick: number;
  manualPause: boolean;
  restartTrip: boolean;
  simulated: boolean;
  createdAt: number;
};
const assert = (ok: unknown, msg: string) => {
  if (!ok) throw new Error(msg);
};
export function newPlayer(name: string): Player {
  return {
    id: randomBytes(6).toString("hex"),
    name: name.trim().slice(0, 24) || "Investigator",
    token: secret(),
    pair: { code: code(), expires: Date.now() + 600000 },
    controller: "laptop",
    ready: false,
    checked: false,
    voice: "unchecked",
    laptop: false,
    phone: false,
    speaking: false,
    location: "street",
    x: 50,
    y: 78,
    observations: [],
    panel: "",
    drafts: {},
    input: { x: 0, y: 0, at: 0 },
    seen: [],
  };
}
export function newRoom(
  name: string,
  playerName: string,
  isPublic = false,
  mode: "casual" | "ranked" = "casual",
): Room {
  const p = newPlayer(playerName);
  return {
    code: code().slice(0, 6),
    name: name.trim().slice(0, 40) || "The night shift",
    host: p.id,
    public: isPublic,
    mode,
    version: VERSION,
    status: "lobby",
    players: [p],
    solved: [],
    shared: [],
    armed: [],
    hints: {},
    events: [
      "Bellwether has been silent for eleven days. Six investigators arrive from outside the recording boundary.",
    ],
    chat: [],
    startedAt: 0,
    endedAt: 0,
    activeMs: 0,
    lastTick: Date.now(),
    manualPause: false,
    restartTrip: false,
    simulated: false,
    createdAt: Date.now(),
  };
}
export function addPlayer(r: Room, name: string) {
  assert(
    r.status === "lobby",
    "This investigation has already begun. Reconnect with your original device.",
  );
  assert(r.players.length < 6, "All six seats are reserved.");
  const p = newPlayer(name);
  p.x = 40 + r.players.length * 4;
  r.players.push(p);
  return p;
}
export function pair(r: Room, credential: string, now = Date.now()) {
  const p = r.players.find(
    (p) => p.pair.code === credential && p.pair.expires > now,
  );
  assert(
    p,
    "Pairing code invalid or expired. Generate another on your laptop.",
  );
  p!.phoneToken = secret();
  p!.pair.expires = 0;
  p!.checked = false;
  p!.controller = "phone";
  p!.ready = false;
  return p!;
}
export function missing(r: Room) {
  return r.players
    .filter((p) => !p.simulated && (!p.laptop || (p.controller === "phone" && !p.phone)))
    .map((p) => p.name);
}
export function paused(r: Room) {
  return r.status === "playing" && (r.manualPause || missing(r).length > 0);
}
export function elapsed(r: Room, now = Date.now()) {
  return r.startedAt
    ? r.mode === "ranked"
      ? Math.max(0, (r.endedAt || now) - r.startedAt)
      : r.activeMs
    : 0;
}
export function unlocked(r: Room, id: string) {
  return (
    LOCATIONS.find((l) => l.id === id)?.requires.every((p) =>
      r.solved.includes(p),
    ) ?? false
  );
}
export function near(p: Player, id: string) {
  const h = HOTSPOTS.find((h) => h.id === id);
  return (
    h && h.location === p.location && Math.hypot(p.x - h.x, p.y - h.y) < 19
  );
}
export function available(r: Room, id: string) {
  const q = puzzles.find((q) => q.id === id);
  return q && q.prerequisites.every((p) => r.solved.includes(p));
}
function event(r: Room, s: string) {
  r.events = [...r.events, s].slice(-30);
}
export function tick(r: Room, now = Date.now()) {
  const dt = Math.max(0, Math.min(now - r.lastTick, 1000));
  r.lastTick = now;
  if (r.status === "lobby" || paused(r)) return false;
  if (r.status === "playing") r.activeMs += dt;
  let moved = false;
  for (const p of r.players) {
    if (now - p.input.at > 350 || p.panel) continue;
    const n = Math.max(1, Math.hypot(p.input.x, p.input.y));
    const x = p.input.x / n,
      y = p.input.y / n;
    if (x || y) {
      p.x = Math.max(16, Math.min(84, p.x + x * dt * 0.018));
      p.y = Math.max(40, Math.min(83, p.y + y * dt * 0.018));
      moved = true;
    }
  }
  return moved;
}
export function action(
  r: Room,
  p: Player,
  device: "phone" | "laptop",
  a: any,
  now = Date.now(),
) {
  assert(a && typeof a.type === "string", "Invalid action.");
  assert(
    typeof a.id === "string" && a.id.length < 100,
    "A message identity is required.",
  );
  if (p.seen.includes(a.id)) return;
  // Rejected commands may be corrected and resent under a new identity; successful commands are idempotent.
  const done = () => {
    p.seen.push(a.id);
    if (p.seen.length > 256) p.seen.shift();
  };
  const type = a.type;
  if (type === "panel") {
    assert(
      typeof a.value === "string" && a.value.length < 80,
      "Invalid panel.",
    );
    p.panel = a.value;
    p.input = { x: 0, y: 0, at: 0 };
    done();
    return;
  }
  if (type === "chat") {
    assert(
      typeof a.text === "string" &&
        a.text.trim().length > 0 &&
        a.text.length <= 280,
      "Message must be 1–280 characters.",
    );
    r.chat = [...r.chat, { name: p.name, text: a.text.trim() }].slice(-60);
    done();
    return;
  }
  if (type === "voice") {
    assert(
      device === (p.controller || "laptop") || p.simulated,
      "Use your selected controller for voice.",
    );
    assert(
      ["ready", "text", "unchecked", "muted"].includes(a.value),
      "Unknown voice state.",
    );
    p.voice = a.value;
    done();
    return;
  }
  if (type === "checked") {
    assert(device === (p.controller || "laptop"), "Complete the check on your selected controller.");
    assert(
      ["ready", "text", "muted"].includes(p.voice),
      "Enable the microphone or select text communication.",
    );
    p.checked = true;
    done();
    return;
  }
  if (type === "renewPair") {
    assert(
      device === "laptop",
      "Only the laptop can issue pairing credentials.",
    );
    p.pair = { code: code(), expires: now + 600000 };
    done();
    return;
  }
  if (type === "controller") {
    assert(device === "laptop", "Change controls on your laptop.");
    assert(a.value === "phone" || a.value === "laptop", "Unknown controller.");
    p.controller = a.value;
    p.checked = false;
    p.ready = false;
    p.voice = "unchecked";
    p.input = { x: 0, y: 0, at: 0 };
    done(); return;
  }
  if (type === "assignRoles") {
    assert(r.status === "lobby" && p.id === r.host, "Only the host can distribute roles in the lobby.");
    for (const role of ROLES) {
      if (r.players.some(v => ownedRoles(v).includes(role.id))) continue;
      const target = [...r.players].sort((a, b) => ownedRoles(a).length - ownedRoles(b).length)[0];
      target.roles = [...ownedRoles(target), role.id];
      target.role ??= role.id;
      target.ready = false;
    }
    done(); return;
  }
  if (type === "role" || type === "claimRole") {
    assert(ROLES.some(v => v.id === a.role), "Unknown role.");
    if (r.status !== "lobby") {
      assert(type === "role" && ownedRoles(p).includes(a.role), "You can only switch to one of your assigned roles.");
      p.role = a.role;
      p.input = { x: 0, y: 0, at: 0 };
      done(); return;
    }
    assert(!r.players.some(v => v.id !== p.id && ownedRoles(v).includes(a.role)), "Another investigator already has this role.");
    if (type === "claimRole") {
      const roles = ownedRoles(p);
      p.roles = roles.includes(a.role) ? roles.filter(v => v !== a.role) : [...roles, a.role];
      if (!p.role || !p.roles.includes(p.role)) p.role = p.roles[0];
    } else {
      p.roles = [a.role];
      p.role = a.role;
    }
    p.ready = false;
    done(); return;
  }
  if (type === "ready") {
    assert(r.status === "lobby", "The investigation has begun.");
    assert(
      p.role && p.laptop && (p.controller !== "phone" || p.phone) && p.checked,
      "Choose a role and complete your controller/audio check. If using a phone, pair it first.",
    );
    p.ready = !p.ready;
    done();
    return;
  }
  if (type === "start") {
    assert(p.id === r.host, "The room creator begins the investigation.");
    assert(r.status === "lobby", "Already started.");
    assert(r.players.length >= 2, "At least two players are required. Invite a friend before entering Bellwether.");
    assert(r.players.every(p => p.ready && p.role && p.checked && p.laptop && (p.controller !== "phone" || p.phone)),
      "Every investigator must choose a role, check their controls and be ready.");
    assert(new Set(r.players.flatMap(ownedRoles)).size === 6, "All six roles must be assigned. The host can distribute unclaimed roles.");
    assert(r.mode !== "ranked" || (r.players.length === 6 && r.players.every(p => ownedRoles(p).length === 1)),
      "Ranked games require six players with one role each. Use Casual for a smaller group.");
    r.status = "playing";
    r.startedAt = now;
    r.lastTick = now;
    r.players.forEach((p) => (p.panel = "onboarding"));
    event(r, "ACT I · " + ACTS[0]);
    done();
    return;
  }
  if (type === "leaveSession") { done(); return; }
  if (type === "endSession") {
    assert(p.id === r.host, "Only the room creator can save and exit for everyone.");
    r.manualPause = r.status === "playing";
    r.public = false;
    event(r, "The team saved the investigation for another evening.");
    done(); return;
  }
  if (type === "pause") {
    assert(r.status === "playing", "No active investigation.");
    r.manualPause = !r.manualPause;
    event(
      r,
      r.manualPause
        ? `${p.name} paused the investigation.`
        : `${p.name} resumed the investigation.`,
    );
    done();
    return;
  }
  assert(
    r.status === "playing" ||
      (r.status === "complete" &&
        ["travel", "inspect", "ability", "share", "handsOn"].includes(type)),
    "Start an investigation first.",
  );
  assert(
    !paused(r),
    "The team is paused. Reconnect missing devices or resume.",
  );
  if (type === "handsOn") {
    const objects: Record<string,string> = {frame:"play-frame",cupboard:"play-cupboard",music:"play-music"};
    assert(objects[a.puzzle] && near(p, objects[a.puzzle]) && unlocked(r,p.location), "Approach the puzzle in its room first.");
    const state = r.handsOn ??= newHandsOn();
    if (state.opened.includes(a.puzzle)) { done(); return; }
    if (a.puzzle === "frame" || a.puzzle === "music") {
      if (a.puzzle === "music") {
        assert(state.opened.includes("cupboard"), "Find the winding key in the clinic cupboard first.");
        if (a.operation === "insertKey") { if (!state.opened.includes("key")) state.opened.push("key"); done(); return; }
        assert(state.opened.includes("key"), "Insert the winding key first.");
      }
      const tiles = a.puzzle === "frame" ? state.frame : state.pipes;
      assert(Number.isInteger(a.tile) && a.tile >= 0 && a.tile < tiles.length, "Choose a puzzle tile.");
      tiles[a.tile] = (tiles[a.tile] + 1) % 4;
      if (a.puzzle === "frame" ? tiles.every(v => v === 0) : pipesSolved(tiles)) {
        state.opened.push(a.puzzle);
        event(r, a.puzzle === "frame" ? "The restored picture reveals the clinic cupboard combination: 3142. It is saved in Team inventory." : "Inez’s music box plays again. A small wooden sunrise rises from the lid. The team recovered the morning melody.");
      }
    } else {
      assert(state.opened.includes("frame"), "Restore the archive picture to discover the combination first.");
      assert(a.code === "3142", "The latch stays shut. Compare the four wheels with the combination in Team inventory.");
      state.opened.push("cupboard");
      event(r, "The cupboard clicks open. Inside is a brass winding key for Inez’s music box in the clock tower. Added to Team inventory.");
    }
    done(); return;
  }
  if (type === "travel") {
    const dest = LOCATIONS.find((l) => l.id === a.location),
      from = LOCATIONS.find((l) => l.id === p.location);
    assert(
      dest && from && (from.links as readonly string[]).includes(dest.id),
      "Choose a connected path from this location.",
    );
    assert(
      unlocked(r, a.location),
      "This path is still closed. Follow the current leads.",
    );
    if (a.entrance) {
      const door = entrances(p.location).find(d => d.id === a.location);
      assert(door && Math.hypot(p.x - door.x, p.y - door.y) < 12, "Walk closer to this entrance.");
    }
    p.location = a.location;
    p.x = 50;
    p.y = 78;
    p.panel = "";
    p.input = { x: 0, y: 0, at: 0 };
    done();
    return;
  }
  if (type === "inspect" || type === "ability") {
    assert(near(p, a.hotspot), "Move closer to the marked object.");
    const h = HOTSPOTS.find((h) => h.id === a.hotspot)!;
    p.panel = "inspect:" + h.id;
    if (!h.roles.length && !h.id.startsWith("play-") && !p.observations.includes(h.id))
      p.observations.push(h.id);
    if (type === "ability") {
      assert(
        p.role && h.roles.includes(p.role),
        "This object needs a different specialist. Compare roles on the object label.",
      );
      for (const c of clues.filter(
        (c) => c.hotspot === h.id && c.role === p.role,
      ))
        if (!p.observations.includes(c.id)) p.observations.push(c.id);
    }
    done();
    return;
  }
  if (type === "share") {
    assert(
      p.observations.includes(a.clue),
      "You have not observed this evidence.",
    );
    if (!r.shared.includes(a.clue)) {
      r.shared.push(a.clue);
      event(
        r,
        `${p.name} shared: ${clues.find((c) => c.id === a.clue)?.title || HOTSPOTS.find((h) => h.id === a.clue)?.name}.`,
      );
    }
    done();
    return;
  }
  const q = puzzles.find((q) => q.id === a.puzzle);
  if (type === "draft") {
    assert(q && available(r, q.id), "That deduction is not available.");
    assert(
      Number.isInteger(a.slot) &&
        a.slot >= 0 &&
        a.slot < q!.slots.length &&
        q!.slots[a.slot].options.includes(a.value),
      "Invalid choice.",
    );
    p.drafts[q!.id] ??= q!.slots.map(() => "");
    p.drafts[q!.id][a.slot] = a.value;
    done();
    return;
  }
  if (type === "hint") {
    assert(q && available(r, q.id), "That deduction is not available yet.");
    assert(!r.solved.includes(q!.id), "That deduction is already complete.");
    r.hints[q!.id] = Math.min(3, (r.hints[q!.id] || 0) + 1);
    done();
    return;
  }
  if (type === "solve") {
    assert(q && available(r, q.id), "Follow the prerequisite leads first.");
    assert(
      q!.kind !== "finale",
      "The finale needs all six configured stations.",
    );
    assert(
      p.location === q!.location,
      "Visit this deduction’s location to submit.",
    );
    if (r.solved.includes(q!.id)) {
      done();
      return;
    }
    assert(
      q!.needs.every((id) => r.shared.includes(id)),
      "Share the required specialist observations in the journal first.",
    );
    assert(
      Array.isArray(a.answers) &&
        a.answers.length === q!.answer.length &&
        a.answers.every(
          (v: unknown, i: number) =>
            typeof v === "string" && q!.slots[i].options.includes(v),
        ),
      "Complete every part of the reconstruction.",
    );
    if (JSON.stringify(a.answers) !== JSON.stringify(q!.answer)) {
      if (q!.id === "p11" && a.answers[0] === "Restart the experiment") {
        r.restartTrip = true;
        event(
          r,
          "SAFETY TRIP · Six new silhouettes appear in the capture preview. The ring isolates before it can record you. All evidence is safe.",
        );
      }
      throw new Error(q!.wrong);
    }
    r.solved.push(q!.id);
    event(r, q!.result);
    done();
    return;
  }
  if (type === "arm") {
    assert(
      available(r, "p14"),
      "Prepare the return path and living address first.",
    );
    const f = finale.find((f) => f.role === p.role)!;
    assert(f, "A specialist role is required.");
    assert(
      near(p, f.hotspot),
      "Go to your return station and approach its instrument.",
    );
    assert(
      puzzles
        .find((q) => q.id === "p14")!
        .needs.every((id) => r.shared.includes(id)),
      "Share all finale evidence first.",
    );
    assert(
      a.answer === f.answer,
      "That configuration contradicts an earlier finding. Review your station’s evidence and compare with the team.",
    );
    if (!r.armed.includes(p.role!)) {
      r.armed.push(p.role!);
      event(
        r,
        `${p.name} armed ${f.title.toLowerCase()}. The latch will hold.`,
      );
    }
    if (r.armed.length === 6) {
      r.solved.push("p14");
      r.status = "complete";
      r.endedAt = now;
      r.players.forEach((p) => (p.panel = "report"));
      event(
        r,
        "Mara reaches Kit. Inez finishes winding the clock. The paper boat moves with the water. Morning arrives.",
      );
    }
    done();
    return;
  }
  throw new Error("Unknown action.");
}
export function report(r: Room) {
  return {
    title: "The Bellwether disappearance",
    responsible: "Dr. Elian Voss",
    motive:
      "Voss tried to recover his daughter Ada, who died eight months before recording began. He cut the safety return and overrode Inez’s abort. He then misled the investigators into attempting another capture.",
    chronology: [
      "23:50 · Recording begins; 187 living residents are inside.",
      "23:52 · Mara prepares Kit’s insulin.",
      "23:56 · Mara reports a pulse to dispatch.",
      "23:57 · Voss severs the safety return.",
      "23:58 · Inez opens the outward gate.",
      "23:59 · Voss overrides the abort (00:03 radio time).",
      "00:00 · The town is captured in the interval.",
      "Dawn · Six investigators restore the return and release the town.",
    ],
    outcome:
      "All 187 recorded residents return alive, including Voss. Mara keeps her promise to Kit. Inez’s second cup finally has company. Ada does not return; she was never recorded. The evidence against Voss is preserved.",
    major: r.shared.filter((id) => clues.some((c) => c.id === id)).length,
    majorTotal: clues.length,
    optional: r.shared.filter((id) =>
      HOTSPOTS.some((h) => h.id === id && !h.roles.length),
    ).length,
    elapsed: elapsed(r),
    hints: Object.values(r.hints).reduce((a, b) => a + b, 0),
    assisted: Object.values(r.hints).some((v) => v > 0),
    eligible: r.mode === "ranked" && !r.simulated,
    version: r.version,
    rank: null,
  };
}
export function view(r: Room, p: Player, device: "laptop" | "phone"): GameView {
  const evidence = [...new Set([...p.observations, ...r.shared])].map((id) => {
    const c = clues.find((c) => c.id === id);
    if (c)
      return {
        id,
        title: c.title,
        text: c.text,
        role: c.role,
        location: c.location,
        shared: r.shared.includes(id),
      };
    const h = HOTSPOTS.find((h) => h.id === id)!;
    return {
      id,
      title: h.name,
      text: h.description,
      location: h.location,
      shared: r.shared.includes(id),
      optional: true,
    };
  });
  return {
    handsOn: r.handsOn || newHandsOn(),
    code: r.code,
    name: r.name,
    mode: r.mode,
    public: r.public,
    status: r.status,
    version: r.version,
    you: p.id,
    device,
    host: r.host,
    players: r.players.map(
      ({
        id,
        name,
        role,
        roles,
        controller,
        ready,
        laptop,
        phone,
        checked,
        voice,
        speaking,
        location,
        x,
        y,
        simulated,
      }) => ({
        id,
        name,
        role,
        roles,
        controller,
        ready,
        laptop,
        phone,
        checked,
        voice,
        speaking,
        location,
        x,
        y,
        simulated,
      }),
    ),
    solved: r.solved,
    evidence,
    puzzles: puzzles
      .filter((q) => available(r, q.id))
      .map((q) => ({
        id: q.id,
        title: q.title,
        location: q.location,
        act: q.act,
        prompt: q.prompt,
        kind: q.kind,
        slots: q.slots,
        needs: q.needs.map((id) => {
          const c = clues.find((c) => c.id === id)!;
          return {
            id,
            label: c.title,
            role: c.role,
            location: c.location,
            shared: r.shared.includes(id),
          };
        }),
        solved: r.solved.includes(q.id),
        result: r.solved.includes(q.id) ? q.result : undefined,
        hintLevel: r.hints[q.id] || 0,
        hints: q.hints.slice(0, r.hints[q.id] || 0),
        ready: q.needs.every((id) => r.shared.includes(id)),
      })),
    finale: available(r, "p14") ? finale.map(({ answer, ...f }) => f) : [],
    armed: r.armed,
    hints: Object.values(r.hints).reduce((a, b) => a + b, 0),
    elapsed: elapsed(r),
    paused: paused(r),
    pauseReason: r.manualPause
      ? "The team has paused. Anyone can resume."
      : missing(r).length
        ? "Waiting for investigators or selected controllers: " + missing(r).join(", ")
        : "",
    manualPause: r.manualPause,
    restartTrip: r.restartTrip,
    events: r.events,
    chat: r.chat,
    panel: p.panel,
    drafts: p.drafts,
    pair: device === "laptop" ? p.pair : undefined,
    report: r.status === "complete" ? report(r) : undefined,
    simulated: r.simulated,
  };
}
