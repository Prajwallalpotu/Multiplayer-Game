import { useEffect, useRef, useState, type ReactNode } from "react";
import { io, type Socket } from "socket.io-client";
import QRCode from "qrcode";
import {
  ACTS,
  ownedRoles,
  entrances,
  HOTSPOTS,
  LOCATIONS,
  ROLES,
  type GameView,
  type PuzzleView,
} from "../shared/world";
import Scene from "./Scene";
import HandsOn, { TeamInventory } from "./HandsOn";
import { narrate, stopNarration } from "./narration";
import { Guidance, Joystick, nextStep } from "./Guidance";
import {
  activateAudio,
  chime,
  playTranscript,
  playMorningMelody,
  setAudio,
  setLocationAudio,
} from "./audio";
import { Voice } from "./voice";
type Credential = {
  code: string;
  player: string;
  token: string;
  device: "phone" | "laptop";
};
const isPhone = location.pathname.startsWith("/controller");
const clock = (ms: number) =>
  `${Math.floor(ms / 3600000)
    .toString()
    .padStart(
      2,
      "0",
    )}:${Math.floor(ms / 60000) % 60 < 10 ? "0" : ""}${Math.floor(ms / 60000) % 60}:${Math.floor(ms / 1000) % 60 < 10 ? "0" : ""}${Math.floor(ms / 1000) % 60}`;
const getRole = (id?: string) => ROLES.find((r) => r.id === id);
const place = (id: string) => LOCATIONS.find((l) => l.id === id)?.name || id;
async function api(path: string, body?: unknown) {
  const res = await fetch(
    "/api/" + path,
    body
      ? {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      : undefined,
  );
  const data = await res.json();
  if (!res.ok) throw Error(data.error || "Unable to reach the town.");
  return data;
}
function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const paths: Record<string, ReactNode> = {
    arrow: <path d="M4 12h15m-6-6 6 6-6 6" />,
    signal: (
      <>
        <path d="M4 18v-3m5 3v-7m5 7V7m5 11V3" />
      </>
    ),
    book: (
      <>
        <path d="M3 4h7l2 2 2-2h7v15h-7l-2 2-2-2H3zM12 6v15" />
      </>
    ),
    map: (
      <>
        <path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2zM9 3v16M15 5v16" />
      </>
    ),
    mic: (
      <>
        <rect x="9" y="2" width="6" height="13" rx="3" />
        <path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3M8 22h8" />
      </>
    ),
    close: <path d="m5 5 14 14M19 5 5 19" />,
    check: <path d="m4 12 5 5L20 6" />,
    phone: (
      <>
        <rect x="6" y="2" width="12" height="20" rx="2" />
        <path d="M10 18h4" />
      </>
    ),
    gear: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="m12 2 2 3 4-1 1 4 3 2-2 4 0 4-4 1-4 3-2-3-4 1-1-4-3-2 2-4V6l4-1z" />
      </>
    ),
    eye: (
      <>
        <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
    compass: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m16 8-2 6-6 2 2-6z" />
      </>
    ),
    pause: <path d="M8 4v16M16 4v16" />,
    chat: <path d="M3 4h18v13H8l-5 4z" />,
    sound: (
      <>
        <path d="m3 9 5 0 5-5v16l-5-5H3zM17 8q5 4 0 8" />
      </>
    ),
    finger: (
      <>
        <path d="M9 12V4a2 2 0 0 1 4 0v7l2-1 2 2 2-1 2 3-3 7H9l-6-7a2 2 0 0 1 3-2l3 3" />
      </>
    ),
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name] || paths.compass}
    </svg>
  );
}
function Brand({ small = false, onHome }: { small?: boolean; onHome?: () => void }) {
  return (
    <button type="button" aria-label="The Last Ten Minutes — home" onClick={onHome} className={"brand " + (small ? "small" : "")}>
      <span className="brand-symbol">
        <Icon name="compass" size={small ? 25 : 31} />
      </span>
      <span>
        THE LAST
        <br />
        <b>TEN MINUTES</b>
      </span>
    </button>
  );
}
function Button({
  children,
  onClick,
  primary = false,
  disabled = false,
  className = "",
  ...props
}: {
  children: ReactNode;
  onClick?: () => void;
  primary?: boolean;
  disabled?: boolean;
  className?: string;
  [key: string]: any;
}) {
  return (
    <button
      className={(primary ? "btn primary" : "btn") + " " + className}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
function Modal({
  eyebrow,
  title,
  children,
  onClose,
  wide = false,
}: {
  eyebrow?: string;
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const el = ref.current!;
    el.querySelector<HTMLElement>("button,input,select")?.focus();
    const trap = (e: KeyboardEvent) => {
      if (
        document
          .querySelectorAll(".modal")
          .item(document.querySelectorAll(".modal").length - 1) !== el
      )
        return;
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
      if (e.key === "Tab") {
        const nodes = [
          ...el.querySelectorAll<HTMLElement>(
            'button:not(:disabled),input:not(:disabled),select:not(:disabled),[tabindex="0"]',
          ),
        ].filter((n) => n.offsetParent !== null);
        const first = nodes[0],
          last = nodes.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", trap);
    return () => {
      document.removeEventListener("keydown", trap);
      previous?.focus();
    };
  }, []);
  return (
    <div className="veil">
      <section
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={"modal " + (wide ? "wide" : "")}
      >
        <header>
          <div>
            <span className="eyebrow">{eyebrow}</span>
            <h2>{title}</h2>
          </div>
          <button
            className="icon-btn"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <Icon name="close" />
          </button>
        </header>
        <div className="modal-body">{children}</div>
      </section>
    </div>
  );
}
export default function App() {
  const [credential, setCredential] = useState<Credential | null>(() => {
    try {
      const s = JSON.parse(localStorage.getItem("ltt-session") || "null");
      return s?.device === (isPhone ? "phone" : "laptop") ? s : null;
    } catch {
      return null;
    }
  });
  const [game, setGame] = useState<GameView>(),
    [connected, setConnected] = useState(false),
    [error, setError] = useState(""),
    [screen, setScreen] = useState(""),
    [name, setName] = useState(""),
    [team, setTeam] = useState("The night shift"),
    [roomCode, setRoomCode] = useState(""),
    [pairCode, setPairCode] = useState(
      new URLSearchParams(location.hash.slice(1)).get("pair") || "",
    ),
    [publicRoom, setPublicRoom] = useState(false),
    [mode, setMode] = useState("casual"),
    [rooms, setRooms] = useState<any[]>([]),
    [board, setBoard] = useState<any[]>([]),
    [config, setConfig] = useState<any>({ iceServers: [], devHarness: false }),
    [busy, setBusy] = useState(false);
  const [settings, setSettings] = useState(() => {
    try {
      return (
        JSON.parse(localStorage.getItem("ltt-settings") || "null") || {
          reduced: matchMedia("(prefers-reduced-motion: reduce)").matches,
          large: false,
          ambient: 0.25,
          effects: 0.5,
        }
      );
    } catch {
      return { reduced: false, large: false, ambient: 0.25, effects: 0.5 };
    }
  });
  const [qr, setQr] = useState(""),
    [voiceStatus, setVoiceStatus] = useState("Microphone not enabled"),
    [speaking, setSpeaking] = useState<Record<string, boolean>>({}),
    [muted, setMuted] = useState(false),
    [ptt, setPtt] = useState(false),
    [padTest, setPadTest] = useState(false),
    [chat, setChat] = useState(""),
    [journalTab, setJournalTab] = useState("leads");
  const socket = useRef<Socket | null>(null),
    voice = useRef<Voice | null>(null),
    movement = useRef({ x: 0, y: 0 }),
    gameRef = useRef(game);
  const soundProgress = useRef<{code:string;solved:number;rewards:number;complete:boolean} | undefined>(undefined);
  useEffect(() => {
    if (!game) { soundProgress.current = undefined; return; }
    const next = {code:game.code,solved:game.solved.length,rewards:game.handsOn?.opened.filter(x=>x!=="key").length || 0,complete:game.status==="complete"};
    const old = soundProgress.current; soundProgress.current = next;
    if (!isPhone && old?.code === next.code) {
      if (!old.complete && next.complete) playMorningMelody();
      else if (next.solved > old.solved || next.rewards > old.rewards) chime();
    }
  }, [game?.code, game?.status, game?.solved.length, game?.handsOn?.opened.length]);
  gameRef.current = game;
  const me = game?.players.find((p) => p.id === game.you),
    role = getRole(me?.role),
    nearby = HOTSPOTS.filter(
      (h) =>
        h.location === me?.location && Math.hypot(h.x - me.x, h.y - me.y) < 19,
    ),
    loc = LOCATIONS.find((l) => l.id === me?.location);
  const selectedDevice = me?.controller || "laptop";
  const ownsVoice = selectedDevice === (isPhone ? "phone" : "laptop");
  const doors = me ? entrances(me.location).filter(d => Math.hypot(d.x-me.x, d.y-me.y) < 12) : [];
  const coverage = game ? new Set(game.players.flatMap(ownedRoles)).size : 0;
  const startBlockers = game ? [
    ...(game.players.length < 2 ? ["At least two players are required. Share the room invitation with a friend to continue."] : []),
    ...(!connected ? ["Connection lost — reconnect to the server before entering."] : []),
    ...(coverage < 6 ? [`Assign the missing specialties: ${ROLES.filter(r => !game.players.some(p => ownedRoles(p).includes(r.id))).map(r => r.name).join(", ")}. In Casual, one player can take several roles.`] : []),
    ...(game.mode === "ranked" && (game.players.length !== 6 || game.players.some(p => ownedRoles(p).length !== 1)) ? ["Ranked needs six investigators with one specialty each. Use Casual for a smaller team."] : []),
    ...game.players.flatMap(p => {
      const missing = [
        ...(!p.laptop ? ["reconnect the game screen"] : []),
        ...(!p.role ? ["choose a specialty"] : []),
        ...(p.controller === "phone" && !p.phone ? ["pair your phone or choose laptop controls"] : []),
        ...(!p.checked ? [p.voice === "unchecked" ? "choose an audio option (voice or text), then confirm the equipment check" : "confirm the equipment check"] : []),
        ...(!p.ready ? ["select I’m ready"] : []),
      ];
      return missing.length ? [`${p.name}: ${missing.join("; ")}.`] : [];
    }),
  ] : [];
  useEffect(() => {
    if (screen !== "rooms" || credential) return;
    let disposed = false;
    const refresh = () => api("rooms").then(v => { if (!disposed) setRooms(v); }).catch(() => { if (!disposed) setError("Room list could not refresh. Check your connection."); });
    void refresh();
    const timer = setInterval(refresh, 2000);
    window.addEventListener("focus", refresh);
    return () => { disposed = true; clearInterval(timer); window.removeEventListener("focus", refresh); };
  }, [screen, credential]);
  useEffect(() => {
    movement.current = {x:0,y:0};
    if (!ownsVoice) { voice.current?.stop(); voice.current = null; }
  }, [selectedDevice, ownsVoice, game?.panel]);
  useEffect(() => {
    const toolbar = document.querySelector<HTMLElement>(".game-toolbar");
    const scene = toolbar?.closest<HTMLElement>(".investigation");
    if (!toolbar || !scene) return;
    const update = () => scene.style.setProperty("--toolbar-height", `${toolbar.getBoundingClientRect().height}px`);
    const observer = new ResizeObserver(update); observer.observe(toolbar); update();
    return () => observer.disconnect();
  }, [game?.status]);
  useEffect(() => {
    document.querySelectorAll("main").forEach((m) => {
      m.inert = !!(screen || game?.panel);
    });
    if (screen || game?.panel) movement.current = {x:0,y:0};
  }, [screen, game?.panel, game?.status, credential]);
  useEffect(() => {
    if (!isPhone)
      setLocationAudio(
        game?.status === "complete" ? "dawn" : me?.location || "street",
      );
  }, [me?.location, game?.status]);
  useEffect(() => {
    if (isPhone) return;
    const start = () => {
      activateAudio();
      setAudio(settings.ambient, settings.effects);
    };
    window.addEventListener("pointerdown", start, { once: true });
    return () => window.removeEventListener("pointerdown", start);
  }, []);
  const act = game
    ? Math.max(0, ...game.puzzles.filter((p) => !p.solved).map((p) => p.act))
    : 0;
  useEffect(() => {
    api("config")
      .then(setConfig)
      .catch(() =>
        setError(
          "The server is unavailable. Start the game server and refresh.",
        ),
      );
  }, []);
  useEffect(() => {
    localStorage.setItem("ltt-settings", JSON.stringify(settings));
    document.documentElement.dataset.large = String(settings.large);
    document.documentElement.dataset.reduced = String(settings.reduced);
    if (!isPhone) setAudio(settings.ambient, settings.effects);
  }, [settings]);
  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(""), 11000);
    return () => clearTimeout(t);
  }, [error]);
  useEffect(() => {
    if (!credential) return;
    localStorage.setItem("ltt-session", JSON.stringify(credential));
    const s = io({ auth: credential });
    socket.current = s;
    s.on("connect", () => setConnected(true));
    s.on("disconnect", () => {
      setConnected(false);
      movement.current = { x: 0, y: 0 };
      voice.current?.stop();
      voice.current = null;
      setVoiceStatus("Disconnected. Reconnect, then retry voice.");
    });
    s.on("connect_error", (e) => setError(e.message));
    s.on("team:home", returnHome);
    s.on("state", (v: GameView) => setGame(v));
    return () => {
      voice.current?.stop();
      s.disconnect();
      socket.current = null;
    };
  }, [credential]);
  useEffect(() => {
    const p = game?.pair;
    if (p?.expires && p.expires > Date.now()) {
      const link = location.origin + "/controller#pair=" + p.code;
      QRCode.toDataURL(link, {
        width: 210,
        margin: 2,
        color: { dark: "#173234", light: "#e6ddc6" },
      }).then(setQr);
    } else setQr("");
  }, [game?.pair?.code, game?.pair?.expires]);
  const actOn = async (type: string, data: any = {}) => {
    const s = socket.current;
    if (!s?.connected) {
      setError("Connection lost. Your place and evidence are saved.");
      return false;
    }
    try {
      const r: any = await s
        .timeout(6000)
        .emitWithAck("action", {
          type,
          ...data,
          id:
            typeof crypto.randomUUID === "function"
              ? crypto.randomUUID()
              : Array.from(crypto.getRandomValues(new Uint8Array(16)), (byte) =>
                  byte.toString(16).padStart(2, "0"),
                ).join(""),
        });
      if (!r.ok) {
        setError(r.error);
        if (!isPhone) chime(false);
        return false;
      }
      return true;
    } catch {
      setError(
        "No response yet. Reconnect and retry; duplicate progress is prevented.",
      );
      return false;
    }
  };
  const pDevice = (g: GameView) => g.players.find(p => p.id === g.you)?.controller || "laptop";
  const panel = (value: string) => void actOn("panel", { value });
  useEffect(() => {
    let wasMoving = false;
    const timer = setInterval(() => {
      const moving = movement.current.x !== 0 || movement.current.y !== 0;
      if (socket.current?.connected && (moving || wasMoving))
        socket.current.emit("move", movement.current);
      wasMoving = moving;
    }, 80);
    const stop = () => {
      movement.current = { x: 0, y: 0 };
      socket.current?.emit("move", movement.current);
      if (voice.current) {
        voice.current.held = false;
        voice.current.apply();
      }
    };
    const key = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).matches('input:not([type="checkbox"]):not([type="radio"]),textarea,select,[contenteditable="true"]')) return;
      const g = gameRef.current;
      if (!g || (g.status !== "playing" && g.status !== "complete")) return;
      const down = e.type === "keydown",
        k = e.key.toLowerCase();
      if (
        [
          "arrowup",
          "arrowdown",
          "arrowleft",
          "arrowright",
          "w",
          "a",
          "s",
          "d",
        ].includes(k)
      ) {
        e.preventDefault();
        if (g.panel || (pDevice(g) !== (isPhone ? "phone" : "laptop"))) return;
        const v = down ? 1 : 0;
        if (["w", "arrowup"].includes(k)) movement.current.y = -v;
        if (["s", "arrowdown"].includes(k)) movement.current.y = v;
        if (["a", "arrowleft"].includes(k)) movement.current.x = -v;
        if (["d", "arrowright"].includes(k)) movement.current.x = v;
      }
      if (!down || e.repeat) return;
      if (g.panel && k !== "escape") return;
      const p = g.players.find((p) => p.id === g.you)!;
      const h = HOTSPOTS.find(
        (h) =>
          h.location === p.location && Math.hypot(h.x - p.x, h.y - p.y) < 19,
      );
      if (k === "enter" && !g.panel) {
        const door = entrances(p.location).find(d => Math.hypot(d.x-p.x,d.y-p.y) < 12);
        if (door) void actOn("travel", {location: door.id, entrance: true});
      }
      if (k === "e" && h) void actOn("inspect", { hotspot: h.id });
      if (k === "q" && h) void actOn("ability", { hotspot: h.id });
      if (k === "j") panel("journal");
      if (k === "m") panel("map");
      if (k === "escape") panel("");
    };
    window.addEventListener("keydown", key);
    window.addEventListener("keyup", key);
    window.addEventListener("blur", stop);
    document.addEventListener("visibilitychange", stop);
    return () => {
      clearInterval(timer);
      window.removeEventListener("keydown", key);
      window.removeEventListener("keyup", key);
      window.removeEventListener("blur", stop);
      document.removeEventListener("visibilitychange", stop);
    };
  }, []);
  async function enter(type: string) {
    setBusy(true);
    setError("");
    if (!isPhone) activateAudio();
    try {
      const data =
        type === "pair"
          ? await api("pair", { pairCode })
          : type === "join"
            ? await api("join", { code: roomCode, playerName: name })
            : type === "dev"
              ? await api("dev", { playerName: name || "Preview investigator" })
              : await api("rooms", {
                  name: team,
                  playerName: name,
                  public: publicRoom,
                  mode,
                });
      setCredential(data);
      setScreen("");
      if (type === "pair") history.replaceState(null, "", "/controller");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function browse() {
    setScreen("rooms");
    try {
      setRooms(await api("rooms"));
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function leaderboard() {
    setScreen("leaderboard");
    try {
      setBoard(await api("leaderboard"));
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function startVoice() {
    if (!socket.current || !game) return;
    voice.current?.stop();
    const v = new Voice(
      socket.current,
      game.you,
      config.iceServers,
      setVoiceStatus,
      (id, s) => setSpeaking((prev) => ({ ...prev, [id]: s })),
    );
    voice.current = v;
    try {
      await v.start(game.players.filter((p) => p.controller === "phone" ? p.phone : p.laptop).map((p) => p.id));
      v.setMute(muted);
      v.ptt = ptt;
      v.apply();
      await actOn("voice", { value: muted ? "muted" : "ready" });
    } catch {
      /* Permission guidance is shown by Voice. */
    }
  }
  async function logout() {
    if (socket.current?.connected) {
      if (!(await actOn("leaveSession"))) return;
    }
    returnHome();
  }
  function returnHome() {
    stopNarration();
    movement.current = {x:0,y:0};
    voice.current?.stop();
    socket.current?.disconnect();
    setCredential(null);
    setGame(undefined);
    setScreen("");
    if (isPhone) location.assign("/");
  }
  const roleSwitcher = me && ownedRoles(me).length > 1 ? <label className="role-switch">Active specialty
    <select aria-label="Active specialty" value={me.role} onChange={e => void actOn("role", {role:e.target.value})}>
      {ownedRoles(me).map(r => <option key={r} value={r}>{getRole(r)?.name}</option>)}
    </select>
  </label> : null;
  const pad = <Joystick onMove={v => {
    movement.current = v;
    if (v.x || v.y) setPadTest(true);
    if (!v.x && !v.y) socket.current?.emit("move", v);
  }} />;
  const voiceControls = (
    <div className="voice-controls">
      <div className="section-title">
        <Icon name="mic" />
        <span>Team radio</span>
        <span className="pill">THIS DEVICE</span>
      </div>
      <p className="muted small-text" role="status">
        {voiceStatus}
      </p>
      <div className="button-row">
        <Button onClick={() => void startVoice()}>
          {voice.current?.stream ? "Retry voice" : "Enable microphone"}
        </Button>
        <Button
          onClick={() => {
            const m = !muted;
            setMuted(m);
            voice.current?.setMute(m);
            void actOn("voice", { value: m ? "muted" : "ready" });
          }}
          disabled={!voice.current?.stream}
        >
          {muted ? "Unmute" : "Mute"}
        </Button>
      </div>
      <label className="checkline">
        <input
          type="checkbox"
          checked={ptt}
          onChange={(e) => {
            setPtt(e.target.checked);
            if (voice.current) {
              voice.current.ptt = e.target.checked;
              voice.current.apply();
            }
          }}
        />
        Push to talk
      </label>
      {ptt && (
        <button
          className="btn primary"
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            if (voice.current) {
              voice.current.held = true;
              voice.current.apply();
            }
          }}
          onPointerUp={() => {
            if (voice.current) {
              voice.current.held = false;
              voice.current.apply();
            }
          }}
          onPointerCancel={() => {
            if (voice.current) {
              voice.current.held = false;
              voice.current.apply();
            }
          }}
        >
          Hold to speak
        </button>
      )}
      <button className="text-btn" onClick={() => voice.current?.resume()}>
        Resume voice playback
      </button>
      <button
        className="text-btn"
        onClick={() => {
          voice.current?.stop();
          voice.current = null;
          setVoiceStatus("Text communication selected. Use Team messages.");
          void actOn("voice", { value: "text" });
        }}
      >
        Use text communication
      </button>
      <p className="fine">
        Use headphones. Voice input and playback use your selected controller.
        Conversations are not recorded.
      </p>
      {game?.players
        .filter((p) => p.id !== game.you)
        .map((p) => (
          <label className="participant" key={p.id}>
            <span className={speaking[p.id] ? "speaking" : ""}>{p.name}</span>
            <input
              aria-label={p.name + " voice volume"}
              type="range"
              min="0"
              max="1"
              step="0.05"
              defaultValue="1"
              onChange={(e) =>
                voice.current?.volume(p.id, Number(e.target.value))
              }
            />
          </label>
        ))}
    </div>
  );
  function renderPuzzle(q: PuzzleView) {
    return (
      <Puzzle
        key={q.id}
        q={q}
        game={game!}
        onAction={actOn}
        onClose={() => panel("")}
        onJournal={() => {
          setJournalTab("evidence");
          panel("journal");
        }}
      />
    );
  }
  function renderPanel() {
    if (!game || !game.panel) return null;
    const close = () => panel("");
    const h = HOTSPOTS.find((h) => "inspect:" + h.id === game.panel),
      q = game.puzzles.find((q) => "puzzle:" + q.id === game.panel);
    if (game.panel === "inventory") return <Modal title="Things worth bringing back" eyebrow="TEAM INVENTORY / SMALL WONDERS" onClose={close}><TeamInventory game={game}/></Modal>;
    if (h?.id.startsWith("play-")) return <Modal wide title={h.name} eyebrow={place(h.location) + " / HANDS-ON PUZZLE"} onClose={close}>
      <HandsOn key={h.id} game={game} puzzle={h.id.slice(5)} act={actOn}/>
      <Button onClick={() => panel("inventory")}>Open Team inventory</Button>
    </Modal>;
    if (h)
      return (
        <Modal
          eyebrow={place(h.location) + " / field observation"}
          title={h.name}
          onClose={close}
        >
          <p className="narrative">{h.description}</p>
          {roleSwitcher}
          <p className="fine">Use a matching specialty below, then share its observation. If you own another listed specialty, switch and investigate again.</p>
          <div className="role-chips">
            {h.roles.map((r) => (
              <span key={r} className="pill">
                {getRole(r)?.name}
              </span>
            ))}
          </div>
          {h.roles.includes(me?.role!) && (
            <Button
              primary
              onClick={() => void actOn("ability", { hotspot: h.id })}
            >
              <Icon name="eye" />
              {role?.tool}
            </Button>
          )}
          {game.evidence
            .filter(
              (e) =>
                e.location === h.location &&
                (e.role === me?.role || e.id === h.id),
            )
            .map((e) => (
              <article className="evidence-card" key={e.id}>
                <span className="eyebrow">
                  {e.shared ? "IN THE SHARED CASE" : "YOUR PRIVATE OBSERVATION"}
                </span>
                <h3>{e.title}</h3>
                <p>{e.text}</p>
                {e.role === "audio" && (
                  <>
                    <div
                      className="wave"
                      aria-label="Signal transcript above is the accessible equivalent"
                    >
                      {Array.from({ length: 42 }, (_, i) => (
                        <i
                          key={i}
                          style={{
                            height: 8 + Math.abs(Math.sin(i * 2.7)) * 32,
                          }}
                        />
                      ))}
                    </div>
                    <button
                      className="text-btn"
                      onClick={() => playTranscript(e.text)}
                    >
                      Play synthesized transcript
                    </button>
                  </>
                )}
                {!e.shared && (
                  <Button onClick={() => void actOn("share", { clue: e.id })}>
                    <Icon name="book" />
                    Share with the team
                  </Button>
                )}
              </article>
            ))}
          <div className="related">
            <span className="eyebrow">DEDUCTIONS AT THIS LOCATION</span>
            {game.puzzles
              .filter((p) => p.location === h.location && !p.solved)
              .map((p) => (
                <button
                  key={p.id}
                  className="list-link"
                  onClick={() => panel("puzzle:" + p.id)}
                >
                  {p.title}
                  <Icon name="arrow" />
                </button>
              ))}
          </div>
          {game.finale.some(
            (f) => f.role === me?.role && f.hotspot === h.id,
          ) && (
            <Button primary onClick={() => panel("finale")}>
              Configure return station
              <Icon name="arrow" />
            </Button>
          )}
        </Modal>
      );
    if (q) return renderPuzzle(q);
    if (game.panel === "pairing")
      return (
        <Modal
          eyebrow="PRIVATE DEVICE LINK"
          title="Reconnect your phone"
          onClose={close}
        >
          {isPhone ? (
            <p>
              Generate a new pairing code from the laptop’s settings. Your
              investigator keeps their role and evidence.
            </p>
          ) : (
            <>
              <p className="muted">
                Scan this private QR with your replacement phone. Pairing it
                disconnects the previous controller. Your role and evidence stay
                with you.
              </p>
              {qr ? (
                <>
                  <img
                    className="qr"
                    src={qr}
                    alt="Replacement phone pairing QR"
                  />
                  <div className="pair-code">{game.pair?.code}</div>
                  <p className="fine">
                    {location.origin}/controller · expires in ten minutes
                  </p>
                </>
              ) : (
                <p className="fine">Generate a fresh credential below.</p>
              )}
              <Button primary onClick={() => void actOn("renewPair")}>
                Generate pairing credential
              </Button>
            </>
          )}
        </Modal>
      );
    if (game.panel === "onboarding")
      return (
        <Modal
          eyebrow="ACT I / ARRIVAL"
          title="Stay curious. Stay together."
          onClose={close}
        >
          <p className="narrative">
            The town has been silent for eleven days. Its clocks disagree. Its
            windows are warm. Find out who is still here.
          </p>
          <Button onClick={() => {
            narrate("Move with W A S D or arrow keys, or your phone joystick. Inspect a gold marker. Use the matching specialist tool, then share your evidence. Open the case journal to compare the clues and solve the deduction. " + nextStep(game), false, setError);
          }}>Read instructions aloud</Button>
          <ol className="steps">
            <li>
              Use WASD / arrow keys on your laptop, or drag the phone joystick, to walk toward a gold marker.
            </li>
            <li>
              Inspect it, then use your role’s instrument to reveal a private
              observation.
            </li>
            <li>
              Share useful evidence in the case journal. Talk through what it
              means.
            </li>
            <li>
              Open the location’s deduction and submit an evidence-supported
              explanation.
            </li>
          </ol>
          <p className="muted">
            Begin at the boundary marker. The Trace Analyst and Field Engineer
            can find a safe way through. Keyboard alternative: WASD / arrows, E
            inspect, Q ability, J journal, M map.
          </p>
          <Button primary onClick={close}>
            Step into Bellwether
            <Icon name="arrow" />
          </Button>
        </Modal>
      );
    if (game.panel === "map")
      return (
        <Modal
          wide
          eyebrow="BELLWETHER / FIELD MAP"
          title="Follow the next lead."
          onClose={close}
        >
          <p className="muted">
            Paths connect neighboring locations. Your current position:{" "}
            {loc?.name}. Locked paths open as the team makes deductions.
          </p>
          <div className="map-layout">
            <div className="town-map">
              <svg viewBox="0 0 100 90" aria-hidden="true">
                {LOCATIONS.flatMap((l) =>
                  l.links.map((id) => {
                    const d = LOCATIONS.find((n) => n.id === id)!;
                    return (
                      <line
                        key={l.id + id}
                        x1={l.x}
                        y1={l.y}
                        x2={d.x}
                        y2={d.y}
                      />
                    );
                  }),
                )}
              </svg>
              {LOCATIONS.map((l) => (
                <div
                  key={l.id}
                  className={
                    "map-pin " + (l.id === me?.location ? "current" : "")
                  }
                  style={{ left: l.x + "%", top: l.y + "%" }}
                >
                  <i />
                  {l.name}
                  <small>
                    {game.players
                      .filter((p) => p.location === l.id)
                      .map((p) => getRole(p.role)?.short)
                      .join(" · ")}
                  </small>
                </div>
              ))}
            </div>
            <div className="map-paths">
              {LOCATIONS.filter((l) =>
                (loc?.links as readonly string[])?.includes(l.id),
              ).map((l) => {
                const open = l.requires.every((id) => game.solved.includes(id));
                return (
                  <button
                    className="destination"
                    key={l.id}
                    disabled={!open || game.paused}
                    onClick={() => void actOn("travel", { location: l.id })}
                  >
                    <span>
                      <strong>{l.name}</strong>
                      <small>
                        {open ? l.subtitle : "Closed · follow current leads"}
                      </small>
                    </span>
                    <Icon name={open ? "arrow" : "compass"} />
                  </button>
                );
              })}
            </div>
          </div>
        </Modal>
      );
    if (game.panel === "journal")
      return (
        <Modal
          wide
          eyebrow={
            "CASE 001 / " +
            game.evidence.filter((e) => e.shared).length +
            " SHARED OBSERVATIONS"
          }
          title="The Bellwether case"
          onClose={close}
        >
          <div className="tabs">
            {["leads", "evidence", "timeline"].map((t) => (
              <button
                key={t}
                className={journalTab === t ? "active" : ""}
                onClick={() => setJournalTab(t)}
              >
                {t}
              </button>
            ))}
          </div>
          {journalTab === "leads" ? (
            <div className="lead-list">
              {game.puzzles.map((p) => (
                <button
                  key={p.id}
                  className={"lead " + (p.solved ? "solved" : "")}
                  onClick={() => panel("puzzle:" + p.id)}
                >
                  <span className="lead-number">
                    {p.solved ? <Icon name="check" /> : p.id.slice(1)}
                  </span>
                  <span>
                    <small>
                      ACT {p.act + 1} · {place(p.location)}
                    </small>
                    <strong>{p.title}</strong>
                    <small>
                      {p.solved
                        ? "Recorded in the case"
                        : p.ready
                          ? "Evidence assembled · ready to reason"
                          : `${p.needs.filter((n) => n.shared).length} / ${p.needs.length} observations shared`}
                    </small>
                  </span>
                  <Icon name="arrow" />
                </button>
              ))}
            </div>
          ) : journalTab === "evidence" ? (
            <div className="evidence-grid">
              {game.evidence.length === 0 && (
                <p className="empty">
                  No evidence yet. Approach a marked object and use your role’s
                  instrument.
                </p>
              )}
              {game.evidence.map((e) => (
                <article className="evidence-card" key={e.id}>
                  <span className="eyebrow">
                    {e.shared ? "SHARED" : "PRIVATE"} / {place(e.location)}
                  </span>
                  <h3>{e.title}</h3>
                  <p>{e.text}</p>
                  {!e.shared && (
                    <Button onClick={() => void actOn("share", { clue: e.id })}>
                      Share with the team
                    </Button>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <ol className="event-list">
              {game.events.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ol>
          )}
        </Modal>
      );
    if (game.panel === "chat")
      return (
        <Modal
          eyebrow="PRIVATE TO YOUR TEAM"
          title="Team messages"
          onClose={close}
        >
          <div className="chat-log">
            {game.chat.length === 0 && (
              <p className="muted">
                Use messages when voice is unavailable, or leave a thought for
                the whole team.
              </p>
            )}
            {game.chat.map((m, i) => (
              <p key={i}>
                <b>{m.name}</b>
                <span>{m.text}</span>
              </p>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (chat.trim())
                void actOn("chat", { text: chat }).then((ok) => {
                  if (ok) setChat("");
                });
            }}
          >
            <label>
              Message
              <input
                maxLength={280}
                value={chat}
                onChange={(e) => setChat(e.target.value)}
                placeholder="What have you found?"
              />
            </label>
            <Button primary type="submit">
              Send to team
              <Icon name="arrow" />
            </Button>
          </form>
        </Modal>
      );
    if (game.panel === "radio")
      return (
        <Modal
          eyebrow="VOICE / SELECTED CONTROLLER"
          title="Keep in touch."
          onClose={close}
        >
          {ownsVoice ? (
            voiceControls
          ) : (
            <p className="narrative">
              Open Team radio on your selected controller to enable its microphone or use push to talk. You can change controllers in Settings.
            </p>
          )}
          <Button onClick={() => panel("chat")}>
            <Icon name="chat" />
            Team messages
          </Button>
        </Modal>
      );
    if (game.panel === "finale")
      return (
        <Modal
          eyebrow="ACT V / SIX STABLE RETURN PATHS"
          title="Let morning come."
          onClose={close}
        >
          <p className="narrative">
            The latches will hold. Find your station, compare what you know, and
            carry the town home.
          </p>
          {roleSwitcher}
          <p className="fine">Each configured station stays armed. If you own multiple specialties, switch roles and visit each station in turn.</p>
          <div className="station-list">
            {game.finale.map((f) => (
              <div
                key={f.role}
                className={
                  "station " + (game.armed.includes(f.role) ? "armed" : "")
                }
              >
                <span className="role-number">{getRole(f.role)?.mark}</span>
                <div>
                  <h3>{f.title}</h3>
                  <p>
                    {getRole(f.role)?.name} · {place(f.location)}
                  </p>
                  {f.role === me?.role && !game.armed.includes(f.role) && (
                    <>
                      <p>{f.prompt}</p>
                      {f.options.map((o: string) => (
                        <Button
                          key={o}
                          disabled={
                            me?.location !== f.location ||
                            !nearby.some((h) => h.id === f.hotspot)
                          }
                          onClick={() => void actOn("arm", { answer: o })}
                        >
                          {o}
                        </Button>
                      ))}
                      {me?.location !== f.location && (
                        <p className="fine">
                          Travel to {place(f.location)} and approach the
                          instrument.
                        </p>
                      )}
                    </>
                  )}
                  {game.armed.includes(f.role) && (
                    <span className="pill">RETURN ARMED · HOLDING</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Modal>
      );
    if (game.panel === "report" && game.report) {
      const r = game.report;
      return (
        <Modal
          wide
          eyebrow="CASE CLOSED / BELLWETHER, AT DAWN"
          title="And then, morning."
          onClose={close}
        >
          <p className="narrative">
            Mara reaches the top of the stairs. “I told you I’d come.” Kit opens
            his eyes. Somewhere outside, a paper boat begins to move.
          </p>
          <button
            className="text-btn"
            onClick={() =>
              playTranscript(
                "Kit? I told you I would come. Keep the light on. We are home now.",
              )
            }
          >
            Hear Mara’s return · synthesized reading
            <Icon name="sound" size={16} />
          </button>
          <div className="report-stats">
            <div>
              <b>187</b>
              <span>residents returned</span>
            </div>
            <div>
              <b>{clock(r.elapsed)}</b>
              <span>
                {game.mode === "ranked" ? "wall-clock time" : "active time"}
              </span>
            </div>
            <div>
              <b>{r.hints}</b>
              <span>hints requested</span>
            </div>
          </div>
          <div className="victory-memento"><span aria-hidden="true">☀</span><h3>You gave Bellwether its morning.</h3><p>187 people. One shared case. Every discovery mattered.</p>
            {game.handsOn?.opened.includes("music") && <p>♫ Inez’s morning melody recovered — hear it in Team inventory.</p>}
          </div>
          <div className="report-columns">
            <div>
              <h3>The person responsible</h3>
              <p>{r.motive}</p>
              <h3>The people who came home</h3>
              <p>{r.outcome}</p>
              <p>
                {r.major} / {r.majorTotal} major observations · {r.optional} / 3
                resident keepsakes
              </p>
              <p className="fine">
                {r.eligible
                  ? `Validated ranked result · ${r.assisted ? "assisted" : "unassisted"} category · position ${r.rank ? "#" + r.rank : "pending"}.`
                  : "Casual or simulated session: this case is not ranked."}{" "}
                Episode {r.version}.
              </p>
            </div>
            <ol className="event-list">
              {r.chronology.map((e: string) => (
                <li key={e}>{e}</li>
              ))}
            </ol>
          </div>
          <div className="button-row">
            <Button primary onClick={close}>
              Walk into the morning
              <Icon name="arrow" />
            </Button>
            <Button onClick={() => void leaderboard()}>Team records</Button>
            <Button onClick={logout}>Save & return home</Button>
          </div>
        </Modal>
      );
    }
    return null;
  }
  const globalModal =
    screen === "leave" && game ? <Modal title="Call it a night?" eyebrow="YOUR CASE IS SAVED" onClose={() => setScreen("")}>
      <p className="narrative">Your clues, puzzles and roles stay saved. Return using “Resume saved investigation” on this browser. Leaving pauses the case while the team waits for you.</p>
      <div className="button-row"><Button primary onClick={logout}>Save & return home</Button>
        {game.host === game.you && <Button onClick={() => void actOn("endSession")}>Save & exit for everyone</Button>}
        <Button onClick={() => setScreen("")}>Keep investigating</Button>
      </div>
    </Modal> :
    screen === "settings" ? (
      <Modal
        eyebrow="MAKE YOURSELF COMFORTABLE"
        title="Field settings"
        onClose={() => setScreen("")}
      >
        {game && !isPhone && <label className="control-choice">Play using
          <select aria-label="Controller preference" value={selectedDevice} onChange={e => void actOn("controller", {value:e.target.value})}>
            <option value="laptop">Laptop keyboard & mouse</option><option value="phone">Phone joystick</option>
          </select>
          <small>Changing controls stops voice. Enable it again on the selected device.</small>
        </label>}

        <label className="checkline">
          <input
            type="checkbox"
            checked={settings.reduced}
            onChange={(e) =>
              setSettings({ ...settings, reduced: e.target.checked })
            }
          />
          Reduced motion & effects
        </label>
        <label className="checkline">
          <input
            type="checkbox"
            checked={settings.large}
            onChange={(e) =>
              setSettings({ ...settings, large: e.target.checked })
            }
          />
          Larger text
        </label>
        {!isPhone && (
          <>
            <label>
              Atmosphere volume
              <input
                type="range"
                min="0"
                max="1"
                step=".05"
                value={settings.ambient}
                onChange={(e) => {
                  activateAudio();
                  setSettings({ ...settings, ambient: Number(e.target.value) });
                }}
              />
            </label>
            <label>
              Effects & synthesized transcript volume
              <input
                type="range"
                min="0"
                max="1"
                step=".05"
                value={settings.effects}
                onChange={(e) => {
                  activateAudio();
                  setSettings({ ...settings, effects: Number(e.target.value) });
                }}
              />
            </label>
          </>
        )}
        {game && !isPhone && (
          <Button
            onClick={() => {
              setScreen("");
              panel("pairing");
            }}
          >
            <Icon name="phone" />
            Reconnect or replace phone
          </Button>
        )}
        <p className="fine">
          Important dialogue is always transcribed. Audio evidence includes text
          equivalents. Roles have names and numbers as well as colors. There are
          no flashing effects.
        </p>
      </Modal>
    ) : screen === "leaderboard" ? (
      <Modal
        wide
        eyebrow="VALIDATED TEAM RESULTS / EPISODE 1"
        title="Those who found the morning"
        onClose={() => setScreen("")}
      >
        <p className="muted">
          Ranked time includes every pause and disconnect. Assisted and
          unassisted teams have separate standings. Casual and development
          sessions never appear. Rankings do not establish a first playthrough.
        </p>
        {[false, true].map((assisted) => (
          <section key={String(assisted)}>
            <h3>{assisted ? "With assistance" : "Without hints"}</h3>
            {board.filter((r) => !!r.assisted === assisted).length === 0 ? (
              <p className="empty">
                No completed teams yet. No invented records.
              </p>
            ) : (
              <ol className="records">
                {board
                  .filter((r) => !!r.assisted === assisted)
                  .map((r) => (
                    <li
                      key={r.code}
                      value={r.rank}
                      className={r.code === game?.code ? "current-result" : ""}
                    >
                      <strong>
                        {r.name}
                        {r.code === game?.code ? " · YOUR TEAM" : ""}
                      </strong>
                      <span>
                        {clock(r.elapsed)} · {r.hints} hints
                      </span>
                    </li>
                  ))}
              </ol>
            )}
          </section>
        ))}
      </Modal>
    ) : null;
  return (
    <div className={"app " + (isPhone ? "phone-app" : "")}>
      {!credential && !isPhone && (
        <main className="title-page">
          <div className="hero-scene">
            <Scene title reduced={settings.reduced} />
          </div>
          <div className="hero-shade" />
          <header className="title-nav">
            <Brand onHome={logout} />
            <nav>
              <button onClick={() => setScreen("about")}>
                The investigation
              </button>
              <button onClick={() => void leaderboard()}>Team records</button>
              <button
                className="icon-btn"
                aria-label="Settings"
                onClick={() => setScreen("settings")}
              >
                <Icon name="gear" />
              </button>
            </nav>
          </header>
          <section className="hero-copy">
            <div className="eyebrow case-label">
              <span /> A COOPERATIVE MYSTERY · CASE 001
            </div>
            <h1>
              Some nights
              <br />
              never <em>end.</em>
            </h1>
            <p className="hero-intro">
              A town without its people.
              <br />A voice that knows your name.
              <br />
              Ten minutes that refuse to pass.
            </p>
            <div className="hero-actions">
              <Button
                primary
                onClick={() => {
                  activateAudio();
                  setAudio(settings.ambient, settings.effects);
                  setScreen("create");
                }}
              >
                Begin an investigation
                <Icon name="arrow" />
              </Button>
              <Button onClick={() => setScreen("join")}>Join your team</Button>
            </div>
            <button className="public-link" onClick={() => void browse()}>
              <span className="status-dot" />
              Find a public investigation
              <Icon name="arrow" size={16} />
            </button>
            {localStorage.getItem("ltt-session") && (
              <button
                className="text-btn"
                onClick={() => {
                  try {
                    const saved = JSON.parse(
                      localStorage.getItem("ltt-session")!,
                    );
                    if (saved.device === "laptop") setCredential(saved);
                    else if (saved.device === "phone") location.assign("/controller");
                  } catch {
                    setError("Saved session is invalid.");
                  }
                }}
              >
                Resume saved investigation
                <Icon name="arrow" size={15} />
              </button>
            )}
            <div className="hero-details">
              <span>
                <b>06</b> INVESTIGATORS
              </span>
              <span>
                <Icon name="phone" size={16} /> KEYBOARD / OPTIONAL PHONE
              </span>
              <span>
                <Icon name="mic" size={16} /> SHARED VOICE
              </span>
            </div>
          </section>
          <div className="scene-caption">
            <span className="crosshair">+</span>
            <div>
              BELLWETHER, COUNTY OF ASH
              <small>23:59 · THE NIGHT OF THE DISAPPEARANCE</small>
            </div>
          </div>
          <footer className="title-footer">
            <span>Six perspectives. One truth.</span>
            <span>
              HEADPHONES RECOMMENDED <Icon name="sound" size={14} />
            </span>
            <span>
              EPISODE 01 <i>—</i> THE LAST TEN MINUTES
            </span>
          </footer>
        </main>
      )}
      {!credential && isPhone && (
        <main className="pair-page">
          <Brand onHome={logout} />
          <span className="eyebrow">YOUR FIELD CONTROLLER</span>
          <h1>
            A line to
            <br />
            <em>the outside.</em>
          </h1>
          <p>Scan the QR on your laptop, or enter its private pairing code.</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void enter("pair");
            }}
          >
            <label>
              Private device-pairing code
              <input
                autoCapitalize="characters"
                autoComplete="off"
                value={pairCode}
                onChange={(e) => setPairCode(e.target.value.toUpperCase())}
                placeholder="10-character code"
                maxLength={10}
              />
            </label>
            <Button
              primary
              type="submit"
              disabled={busy || pairCode.length !== 10}
            >
              Connect to my laptop
              <Icon name="arrow" />
            </Button>
          </form>
          <p className="fine">
            This is different from your team’s six-character invitation code.
            Pairing makes this phone and your laptop one investigator.
          </p>
        </main>
      )}
      {!credential && ["create", "join", "rooms", "about"].includes(screen) && (
        <Modal
          eyebrow="THE LAST TEN MINUTES / CASE 001"
          title={
            screen === "create"
              ? "Assemble your team."
              : screen === "join"
                ? "Your team is waiting."
                : screen === "rooms"
                  ? "Find your investigators."
                  : "One town. Six perspectives."
          }
          onClose={() => setScreen("")}
        >
          {screen === "about" ? (
            <>
              <p className="narrative">
                Every resident of Bellwether vanished overnight. Explore a
                living illustration of the empty town, uncover private
                observations, and make sense of them together.
              </p>
              <div className="how-grid">
                <div>
                  <b>01</b>
                  <h3>Bring your investigators</h3>
                  <p>
                    Play with 2–6 investigators on laptops. Phones are optional. Share all six investigative roles between your group.
                  </p>
                </div>
                <div>
                  <b>02</b>
                  <h3>Compare what you see</h3>
                  <p>
                    Your instruments reveal different evidence. Share it
                    deliberately. The thinking belongs to everyone.
                  </p>
                </div>
                <div>
                  <b>03</b>
                  <h3>Find a way home</h3>
                  <p>
                    Fourteen connected deductions across five acts. No combat,
                    no reflex tests. Optional layered hints.
                  </p>
                </div>
              </div>
              <p className="fine">
                Plan a long evening; approximately 90 minutes is a playtesting
                target, not a verified duration. Casual sessions pause safely
                and can resume. Ranked sessions count all elapsed time; hints
                place your team in the assisted category.
              </p>
              <Button primary onClick={() => setScreen("create")}>
                Create an investigation
                <Icon name="arrow" />
              </Button>
            </>
          ) : screen === "rooms" ? (
            <>
              <p className="muted">
                Joinable public rooms, with real reserved seats.
              </p>
              {rooms.length === 0 ? (
                <p className="empty">
                  No public investigations are waiting. Start one and invite
                  your team.
                </p>
              ) : (
                rooms.map((r) => (
                  <button
                    key={r.code}
                    className="destination"
                    onClick={() => {
                      setRoomCode(r.code);
                      setScreen("join");
                    }}
                  >
                    <span>
                      <strong>{r.name}</strong>
                      <small>
                        {r.seats} / 6 seats · {r.mode}
                      </small>
                    </span>
                    <Icon name="arrow" />
                  </button>
                ))
              )}
              <Button onClick={() => setScreen("create")}>Create a room</Button>
            </>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void enter(screen);
              }}
            >
              <label>
                Your investigator name
                <input
                  autoFocus
                  maxLength={24}
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="What should your team call you?"
                />
              </label>
              {screen === "create" ? (
                <>
                  <label>
                    Team name
                    <input
                      required
                      maxLength={40}
                      value={team}
                      onChange={(e) => setTeam(e.target.value)}
                    />
                  </label>
                  <label>
                    Investigation format
                    <select
                      value={mode}
                      onChange={(e) => setMode(e.target.value)}
                    >
                      <option value="casual">Casual · pause and resume</option>
                      <option value="ranked">
                        Ranked · continuous elapsed time
                      </option>
                    </select>
                  </label>
                  <label className="checkline">
                    <input
                      type="checkbox"
                      checked={publicRoom}
                      onChange={(e) => setPublicRoom(e.target.checked)}
                    />
                    List this room publicly
                  </label>
                  <p className="fine">
                    {mode === "casual"
                      ? "Active time excludes pauses and disconnected-device waits. Your case is saved; it does not enter the leaderboard."
                      : "Server time includes pauses, disconnections and server downtime. Hints create a separate assisted result. Six players with one specialty each are required; phones are optional."}
                  </p>
                </>
              ) : (
                <label>
                  Room invitation code
                  <input
                    required
                    maxLength={6}
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    placeholder="6-character room code"
                  />
                </label>
              )}
              <Button primary type="submit" disabled={busy || !name.trim()}>
                {busy
                  ? "Connecting…"
                  : screen === "create"
                    ? "Create investigation"
                    : "Join investigation"}
                <Icon name="arrow" />
              </Button>
              {config.devHarness && screen === "create" && (
                <button
                  className="text-btn"
                  type="button"
                  onClick={() => void enter("dev")}
                >
                  Development harness · five explicitly simulated seats
                </button>
              )}
            </form>
          )}
        </Modal>
      )}
      {credential && !game && (
        <main className="connecting">
          <Brand onHome={logout} />
          <h2>Finding your signal…</h2>
          <p>Your seat and discovered evidence are saved on the server.</p>
          <Button onClick={logout}>Return to the title</Button>
        </main>
      )}
      {game && game.status === "lobby" && (
        <main className={"lobby " + (isPhone ? "mobile-lobby" : "")}>
          <header className="game-header">
            <Brand small onHome={logout} />
            <div className="connection">
              <span className={"status-dot " + (!connected ? "off" : "")} />
              {connected ? "CONNECTED" : "RECONNECTING"}
            </div>
            <Button onClick={() => setScreen("settings")} aria-label="Settings">
              <Icon name="gear" />
            </Button>
          </header>
          <div className="lobby-heading">
            <span className="eyebrow">
              PREPARING THE INVESTIGATION
              {game.simulated ? " / DEVELOPMENT SIMULATION" : ""}
            </span>
            <h1>{isPhone ? "You’re on the line." : game.name}</h1>
            <p>Six ways of seeing. One shared truth.</p>
          </div>
          <div className="lobby-grid">
            <section className="role-selection">
              <div className="section-title">
                <span>01</span>
                <h2>Choose your roles</h2>
              </div>
              <p className="muted">Claim one or more specialties. Click a selected role to release it. All six must be covered; you can switch between your roles during the investigation.</p>
              {game.host === game.you && <Button onClick={() => void actOn("assignRoles")}>Distribute unclaimed roles</Button>}
              <p className="fine">{coverage}/6 specialties assigned · {game.players.length} investigator{game.players.length === 1 ? "" : "s"}</p>
              <div className="role-grid">
                {ROLES.map((r) => {
                  const owner = game.players.find((p) => ownedRoles(p).includes(r.id)),
                    mine = owner?.id === game.you;
                  return (
                    <button
                      key={r.id}
                      className={"role-card " + (mine ? "selected" : "")}
                      disabled={!!owner && !mine}
                      onClick={() => void actOn("claimRole", { role: r.id })}
                      style={{ "--role": r.color } as any}
                    >
                      <span className="role-number">{r.mark}</span>
                      <h3>{r.name}</h3>
                      <p>{r.description}</p>
                      <small>
                        {mine
                          ? "YOUR PERSPECTIVE"
                          : owner
                            ? "RESERVED · " + owner.name
                            : "AVAILABLE"}
                        {mine && <Icon name="check" size={16} />}
                      </small>
                    </button>
                  );
                })}
              </div>
            </section>
            <aside className="pair-card">
              <div className="section-title">
                <span>02</span>
                <h2>
                  {isPhone ? "Check your equipment" : "Choose your controls"}
                </h2>
              </div>
              {isPhone ? (
                <>
                  <p className="muted">
                    This phone controls {me?.name}’s laptop. Drag the joystick, then choose voice or text communication.
                  </p>
                  {pad}
                  <p className="fine">
                    {padTest
                      ? "Movement input received."
                      : "Drag the joystick to test the controls."}
                  </p>
                  {voiceControls}
                  <Button
                    primary
                    disabled={!padTest || me?.voice === "unchecked"}
                    onClick={() => void actOn("checked")}
                  >
                    {me?.checked
                      ? "Controller check complete"
                      : "Confirm controller & audio check"}
                    <Icon name="check" />
                  </Button>
                </>
              ) : (
                <>
                  <label className="control-choice">Play using
                    <select aria-label="Controller preference" value={selectedDevice} onChange={e => void actOn("controller", {value:e.target.value})}>
                      <option value="laptop">Laptop keyboard & mouse</option><option value="phone">Phone joystick</option>
                    </select>
                  </label>
                  {selectedDevice === "laptop" ? <>
                    <p>WASD / arrows to walk · E inspect · Q specialist tool · Enter nearby doorway · J journal · M map.</p>
                    {voiceControls}
                    <Button primary disabled={me?.voice === "unchecked"} onClick={() => void actOn("checked")}>{me?.checked ? "Equipment check complete" : "Confirm keyboard & audio check"}</Button>
                  </> : <>
                  {me?.phone && !qr ? (
                    <div className="paired">
                      <Icon name="check" size={34} />
                      <h3>Phone connected</h3>
                      <p>
                        {me.checked
                          ? "Controller and communication checks complete."
                          : "Finish the controller and communication checks on your phone."}
                      </p>
                    </div>
                  ) : (
                    <>
                      <p>Scan with your phone’s camera. Keep this private.</p>
                      {qr && (
                        <img
                          className="qr"
                          src={qr}
                          alt="QR code to pair your phone"
                        />
                      )}
                      <div className="pair-code">
                        {game.pair?.expires && game.pair.expires > Date.now()
                          ? game.pair.code
                          : "Code expired"}
                      </div>
                      <p className="fine">
                        Or open <strong>{location.host}/controller</strong> and
                        enter this code. Valid for 10 minutes.
                      </p>
                    </>
                  )}
                  <button
                    className="text-btn"
                    onClick={() => void actOn("renewPair")}
                  >
                    Generate a new private pairing code
                  </button>
                  </>}
                  <div className="invite">
                    <span className="eyebrow">
                      SHARE WITH YOUR TEAM · ROOM CODE
                    </span>
                    <b>{game.code}</b>
                    <button
                      className="text-btn"
                      onClick={() =>
                        void navigator.clipboard
                          ?.writeText(game.code)
                          .then(() => setError("Room invitation copied."))
                      }
                    >
                      Copy invitation code
                    </button>
                  </div>
                </>
              )}
            </aside>
          </div>
          <section className="lobby-bottom">
            <div className="team-seats">
              {Array.from({ length: 6 }, (_, i) => {
                const p = game.players[i];
                return (
                  <div key={i} className={"seat " + (p?.ready ? "ready" : "")}>
                    <span>
                      {p?.role
                        ? getRole(p.role)?.mark
                        : String(i + 1).padStart(2, "0")}
                    </span>
                    <strong>{p?.name || "Open investigator seat"}</strong>
                    <small>
                      {!p
                        ? "OPEN · 2 PLAYERS MINIMUM"
                        : p.simulated
                          ? "SIMULATED"
                          : p.ready
                            ? "READY"
                            : p.controller === "phone" && !p.phone
                              ? "PAIR PHONE"
                              : !p.checked
                                ? "CHECK EQUIPMENT"
                                : !p.role
                                  ? "CHOOSE ROLE"
                                  : "NOT READY"}
                    </small>
                  </div>
                );
              })}
            </div>
            <div className="launch-checklist" id="launch-checklist" role="status" aria-live="polite">
              <strong>{startBlockers.length ? "Before you enter Bellwether" : "Your team is ready to enter Bellwether"}</strong>
              {startBlockers.length > 0 && <ul>{startBlockers.map(item => <li key={item}>{item}</li>)}</ul>}
              {game.host !== game.you && <p>When everyone is ready, the room creator selects Enter Bellwether.</p>}
            </div>
            <div className="start-row">
              <span className="fine">
                {game.players.filter((p) => p.ready).length} / {game.players.length} ready ·{" "}
                {game.mode === "ranked"
                  ? "Ranked / pauses count"
                  : "Casual / resumable"}
                <br />
                All players must be ready and all six specialties assigned.
              </span>
              <div className="button-row">
                <Button
                  aria-describedby="launch-checklist"
                  disabled={!connected || !me?.laptop || !me?.role || (me.controller === "phone" && !me.phone) || !me.checked}
                  onClick={() => void actOn("ready")}
                >
                  {me?.ready ? "Not ready" : "I’m ready"}
                  <Icon name="check" />
                </Button>
                {game.host === game.you && (
                  <Button
                    primary
                    aria-describedby="launch-checklist"
                    disabled={startBlockers.length > 0}
                    onClick={() => {
                      activateAudio();
                      void actOn("start");
                    }}
                  >
                    Enter Bellwether
                    <Icon name="arrow" />
                  </Button>
                )}
              </div>
            </div>
          </section>
          <button className="text-btn leave" onClick={logout}>
            Return to title (seat stays reserved)
          </button>
        </main>
      )}
      {game && game.status !== "lobby" && (
        <main className={"investigation " + (isPhone ? "controller" : "")}>
          {!isPhone && (
            <Scene
              game={game}
              reduced={settings.reduced}
              onObject={(id) => void actOn("inspect", { hotspot: id })}
            />
          )}
          <header className="game-header">
            <Brand small onHome={logout} />
            <div className="chapter">
              <span className="eyebrow">
                {game.status === "complete"
                  ? "CASE CLOSED"
                  : `ACT ${act + 1} / ${ACTS[act]}`}
              </span>
              <span>
                {game.status === "complete"
                  ? "Morning has arrived"
                  : loc?.subtitle}
              </span>
            </div>
            <div className="connection">
              <span className={"status-dot " + (!connected ? "off" : "")} />
              {isPhone ? "CONTROLLER" : game.code}
            </div>
            <button
              className="icon-btn"
              aria-label="Settings"
              onClick={() => setScreen("settings")}
            >
              <Icon name="gear" />
            </button>
          </header>
          {game.simulated && (
            <div className="dev-banner">
              DEVELOPMENT HARNESS · SIMULATED TEAM · NOT ELIGIBLE FOR RANKING
            </div>
          )}
          <div className="location-title">
            <span className="eyebrow">
              {game.status === "complete"
                ? "06:01 · A NEW DAY"
                : "23:59 · BELLWETHER"}
            </span>
            <h1>{loc?.name}</h1>
            {isPhone && (
              <p>
                {role?.name} · {me?.name}
              </p>
            )}
          </div>
          {!isPhone && (
            <aside className="team-hud">
              {game.players.map((p) => (
                <div
                  key={p.id}
                  className={
                    "team-member " + (!p.laptop || (p.controller === "phone" && !p.phone) ? "absent" : "")
                  }
                  style={{ "--role": getRole(p.role)?.color } as any}
                >
                  <span>{getRole(p.role)?.mark}</span>
                  <div>
                    <strong>{p.name}</strong>
                    <small>{place(p.location)}</small>
                  </div>
                  <i className={p.speaking ? "talking" : ""} />
                </div>
              ))}
            </aside>
          )}
          {!isPhone && (
            <div className="radio-caption">
              <span className="eyebrow">
                FIELD NOTES / {String(game.events.length).padStart(2, "0")}
              </span>
              <p>{game.events.at(-1)}</p>
            </div>
          )}
          {!isPhone && <Guidance game={game} onJournal={() => panel("journal")} />}
          {doors.length > 0 && <div className="entrance-prompt">{doors.map(d => {
            const open = LOCATIONS.find(l => l.id === d.id)!.requires.every(id => game.solved.includes(id));
            return <button key={d.id} disabled={!open || game.paused} onClick={() => void actOn("travel", {location:d.id, entrance:true})}>
              {open ? `Enter ${d.name} ↵` : `${d.name} · closed — follow your current lead`}
            </button>;
          })}</div>}
          {isPhone ? (
            <section className="controller-body">
              <div className="controller-context">
                <span className="eyebrow">
                  {nearby.length ? "WITHIN REACH" : "EXPLORE"}
                </span>
                <h2>{nearby[0]?.name || "Follow the gold markers"}</h2>
                <p>
                  {game.paused
                    ? game.pauseReason
                    : nextStep(game)}
                </p>
              </div>
              <div className="control-deck">
                {pad}
                <div className="action-stack">
                  <Button
                    primary
                    disabled={!nearby.length || game.paused}
                    onClick={() =>
                      void actOn("inspect", { hotspot: nearby[0].id })
                    }
                  >
                    <Icon name="finger" size={26} />
                    Inspect
                  </Button>
                  <Button
                    disabled={
                      !nearby.some((h) => h.roles.includes(me?.role!)) ||
                      game.paused
                    }
                    onClick={() =>
                      void actOn("ability", {
                        hotspot: nearby.find((h) =>
                          h.roles.includes(me?.role!),
                        )!.id,
                      })
                    }
                  >
                    <Icon name="eye" />
                    {role?.tool || "Ability"}
                  </Button>
                </div>
              </div>
              <p className="controller-status">
                <span className={"status-dot " + (!connected ? "off" : "")} />
                {connected
                  ? "Paired to " + me?.name + "’s laptop"
                  : "Reconnecting · movement stopped"}
              </p>
            </section>
          ) : (
            <div className="interaction-prompt">
              {nearby.length ? (
                <>
                  <kbd>E</kbd>
                  <button
                    onClick={() =>
                      void actOn("inspect", { hotspot: nearby[0].id })
                    }
                  >
                    Inspect {nearby[0].name}
                  </button>
                  <span> / </span>
                  <kbd>Q</kbd>
                  <button
                    onClick={() =>
                      void actOn("ability", { hotspot: nearby[0].id })
                    }
                  >
                    {role?.tool}
                  </button>
                </>
              ) : (
                <>
                  <Icon name="compass" />
                  <span>WASD / arrows to move · E inspect · Q specialist tool</span>
                </>
              )}
            </div>
          )}
          <footer className="game-toolbar">
            <div className="identity">
              <span className="role-number">{role?.mark}</span>
              <div>
                <strong>{role?.name}</strong>
                <small>{me?.name}</small>
              </div>
            </div>
            <nav>
              <button onClick={() => setScreen("leave")}><Icon name="arrow"/><span>Save & exit</span></button>
              <button onClick={() => panel("inventory")}><Icon name="book"/><span>Team inventory</span></button>
              {me && ownedRoles(me).length > 1 && <label className="role-switch">Active role
                <select aria-label="Active role" value={me.role} onChange={e => void actOn("role", {role:e.target.value})}>
                  {ownedRoles(me).map(r => <option key={r} value={r}>{getRole(r)?.name}</option>)}
                </select>
              </label>}
              <button onClick={() => panel("map")}>
                <Icon name="map" />
                <span>Town map</span>
                <kbd>M</kbd>
              </button>
              <button onClick={() => panel("journal")}>
                <Icon name="book" />
                <span>Case journal</span>
                <kbd>J</kbd>
              </button>
              <button onClick={() => panel("radio")}>
                <Icon name="mic" />
                <span>Team radio</span>
              </button>
              <button onClick={() => panel("chat")}>
                <Icon name="chat" />
                <span>Messages</span>
              </button>
              {game.finale.length > 0 && (
                <button
                  onClick={() =>
                    panel(game.status === "complete" ? "report" : "finale")
                  }
                >
                  <Icon name="compass" />
                  <span>
                    {game.status === "complete"
                      ? "Case report"
                      : `Return ${game.armed.length}/6`}
                  </span>
                </button>
              )}
              <button
                aria-label={game.manualPause ? "Resume game" : "Pause game"}
                onClick={() => void actOn("pause")}
                disabled={game.status === "complete"}
              >
                <Icon name="pause" />
              </button>
            </nav>
            <span className="elapsed">{clock(game.elapsed)}</span>
          </footer>
          {(game.paused || !connected) && (
            <div className="pause-banner">
              <Icon name="pause" />
              <span>
                {!connected
                  ? "Signal lost. Movement stopped; reconnecting to your saved case."
                  : game.pauseReason}
              </span>
              {game.manualPause && (
                <Button onClick={() => void actOn("pause")}>Resume</Button>
              )}
            </div>
          )}
        </main>
      )}
      {game && renderPanel()}
      {globalModal}
      {error && (
        <div role="alert" className="toast">
          <span>{error}</span>
          <button
            aria-label="Dismiss notification"
            onClick={() => setError("")}
          >
            <Icon name="close" size={17} />
          </button>
        </div>
      )}
    </div>
  );
}
function Puzzle({
  q,
  game,
  onAction,
  onClose,
  onJournal,
}: {
  q: PuzzleView;
  game: GameView;
  onAction: (t: string, d?: any) => Promise<boolean>;
  onClose: () => void;
  onJournal: () => void;
}) {
  const answers = game.drafts[q.id] || q.slots.map(() => "");
  const me = game.players.find((p) => p.id === game.you)!;
  return (
    <Modal
      wide
      eyebrow={`ACT ${q.act + 1} / DEDUCTION ${q.id.slice(1)} / ${q.kind.toUpperCase()}`}
      title={q.title}
      onClose={onClose}
    >
      <p className="narrative">{q.solved ? q.result : q.prompt}</p>
      {q.solved ? (
        <div className="solved-stamp">
          <Icon name="check" />
          ENTERED INTO THE CASE
        </div>
      ) : (
        <div className="puzzle-layout">
          <div>
            {q.kind === "finale" ? (
              <Button
                primary
                onClick={() => void onAction("panel", { value: "finale" })}
              >
                Open the six return stations
                <Icon name="arrow" />
              </Button>
            ) : (
              <>
                {q.slots.length > 2 &&
                q.slots.every(
                  (s) =>
                    JSON.stringify(s.options) ===
                    JSON.stringify(q.slots[0].options),
                ) ? (
                  <OrderBoard q={q} answers={answers} onAction={onAction} />
                ) : (
                  <div className={"puzzle-slots " + q.kind}>
                    {q.slots.map((s, i) => (
                      <fieldset key={s.label}>
                        <legend>
                          <span>{String(i + 1).padStart(2, "0")}</span>
                          {s.label}
                        </legend>
                        {s.options.map((o) => (
                          <button
                            key={o}
                            className={
                              "choice " + (answers[i] === o ? "chosen" : "")
                            }
                            onClick={() =>
                              void onAction("draft", {
                                puzzle: q.id,
                                slot: i,
                                value: o,
                              })
                            }
                          >
                            <span className="radio-dot" />
                            {o}
                            {answers[i] === o && (
                              <Icon name="check" size={17} />
                            )}
                          </button>
                        ))}
                      </fieldset>
                    ))}
                  </div>
                )}
                <Button
                  primary
                  disabled={
                    !q.ready ||
                    answers.some((a) => !a) ||
                    me.location !== q.location ||
                    game.paused
                  }
                  onClick={() =>
                    void onAction("solve", { puzzle: q.id, answers })
                  }
                >
                  Commit the reconstruction
                  <Icon name="arrow" />
                </Button>
                {me.location !== q.location && (
                  <p className="fine">
                    Submit this deduction at {place(q.location)}. Use the town
                    map to travel.
                  </p>
                )}
                {!q.ready && (
                  <p className="fine">
                    Assemble and share the required observations before
                    committing.
                  </p>
                )}
              </>
            )}
          </div>
          <aside className="clue-checklist">
            <span className="eyebrow">EVIDENCE TO COMPARE</span>
            {q.needs.map((n) => (
              <div key={n.id} className={n.shared ? "found" : ""}>
                <span>
                  {n.shared ? (
                    <Icon name="check" size={16} />
                  ) : (
                    getRole(n.role)?.mark
                  )}
                </span>
                <div>
                  <strong>{n.label}</strong>
                  <small>
                    {getRole(n.role)?.short} · {place(n.location)}
                  </small>
                </div>
              </div>
            ))}
            <button className="text-btn" onClick={onJournal}>
              Read your shared evidence
              <Icon name="arrow" size={15} />
            </button>
            <div className="hint-box">
              <span className="eyebrow">A LITTLE DIRECTION</span>
              {q.hints.map((h, i) => (
                <p key={i}>
                  <b>{i + 1}.</b> {h}
                </p>
              ))}
              {q.hintLevel < 3 && (
                <Button onClick={() => void onAction("hint", { puzzle: q.id })}>
                  Request hint {q.hintLevel + 1} / 3
                </Button>
              )}
              <p className="fine">
                Hints are always requested by the team. The first hint places a
                ranked result in the assisted category.
              </p>
            </div>
          </aside>
        </div>
      )}
    </Modal>
  );
}

function OrderBoard({
  q,
  answers,
  onAction,
}: {
  q: PuzzleView;
  answers: string[];
  onAction: (t: string, d?: any) => Promise<boolean>;
}) {
  const move = async (i: number, dir: number) => {
    const j = i + dir;
    if (j < 0 || j >= answers.length) return;
    const a = answers[i],
      b = answers[j];
    if (!a || !b) return;
    await onAction("draft", { puzzle: q.id, slot: j, value: a });
    await onAction("draft", { puzzle: q.id, slot: i, value: b });
  };
  return (
    <div className="order-board">
      <p className="fine">
        Place the event cards in order. Use the arrows to compare another
        sequence; your laptop and phone stay in sync.
      </p>
      {answers.map((a, i) => (
        <div className="order-slot" key={i}>
          <span className="order-index">{i + 1}</span>
          <div>{a || <em>Choose the next event below</em>}</div>
          <button
            aria-label={"Move event " + (i + 1) + " earlier"}
            disabled={!a || i === 0 || !answers[i - 1]}
            onClick={() => void move(i, -1)}
          >
            ↑
          </button>
          <button
            aria-label={"Move event " + (i + 1) + " later"}
            disabled={!a || i === answers.length - 1 || !answers[i + 1]}
            onClick={() => void move(i, 1)}
          >
            ↓
          </button>
        </div>
      ))}
      <div className="event-tray">
        {q.slots[0].options
          .filter((o) => !answers.includes(o))
          .map((o) => (
            <button
              key={o}
              onClick={() =>
                void onAction("draft", {
                  puzzle: q.id,
                  slot: answers.findIndex((a) => !a),
                  value: o,
                })
              }
            >
              {o}
              <Icon name="arrow" size={16} />
            </button>
          ))}
      </div>
    </div>
  );
}
