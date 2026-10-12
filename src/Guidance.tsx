import { narrate, stopNarration } from "./narration";
import { useEffect, useRef, useState } from "react";
import { HOTSPOTS, LOCATIONS, ROLES, ownedRoles, type GameView } from "../shared/world";

export function nextStep(game: GameView) {
  const me = game.players.find(p => p.id === game.you)!;
  if (game.status === "complete") return "The town is safe. Open the case report, or explore Bellwether in daylight.";
  const leads = game.puzzles.filter(q => !q.solved);
  const q = leads.find(q => q.needs.some(n => !n.shared && ownedRoles(me).includes(n.role))) || leads[0];
  if (!q) return "Open your case journal and compare the team's findings.";
  const need = q.needs.find(n => !n.shared && ownedRoles(me).includes(n.role)) || q.needs.find(n => !n.shared);
  if (!need) return q.kind === "finale"
    ? "All evidence is shared. Open Return stations, configure your assigned stations, and switch roles to finish each one. Each latch stays armed."
    : `Evidence ready: go to ${LOCATIONS.find(l => l.id === q.location)?.name}, open the case journal, and reconstruct “${q.title}”.`;
  if (game.evidence.some(e => e.id === need.id)) return `Share “${need.label}” with your team in the case journal. Private observations cannot unlock deductions until shared.`;
  const specialist = ROLES.find(r => r.id === need.role)!;
  const owner = game.players.find(p => ownedRoles(p).includes(need.role));
  const object = HOTSPOTS.find(h => h.location === need.location && h.roles.includes(need.role));
  const place = LOCATIONS.find(l => l.id === need.location)!.name;
  return `${owner?.id === me.id ? (me.role === need.role ? `Use ${specialist.tool}` : `Switch to ${specialist.name}, then use ${specialist.tool}`) : `Ask ${owner?.name || "the " + specialist.name} to investigate`} at ${object?.name || place} in ${place}. Inspect, use the specialist tool, then share the observation.`;
}

export function Guidance({ game, onJournal }: { game: GameView; onJournal: () => void }) {
  const [enabled, setEnabled] = useState(() => localStorage.getItem("ltt-narration") === "true");
  const [message, setMessage] = useState("");
  const previous = useRef("");
  const step = nextStep(game);
  const intro = game.panel === "onboarding" ? "Welcome to Bellwether. Move with W A S D or the arrow keys, or use your phone joystick. Press E to inspect a gold marker. Use your specialist tool, share the evidence, and compare it in the case journal. " : "";
  const text = intro + step;
  useEffect(() => {
    if (!enabled || game.panel || game.paused) return;
    const timer = setTimeout(() => {
      if (previous.current !== step) {
        previous.current = step;
        narrate(step, true, setMessage);
      }
    }, 1200);
    return () => clearTimeout(timer);
  }, [step, enabled, game.panel, game.paused]);
  useEffect(() => () => stopNarration(true), []);
  return <aside className="next-step" aria-label="Investigation guidance">
    <span className="eyebrow">YOUR NEXT STEP</span>
    <p aria-live="polite">{step}</p>
    <div className="button-row">
      <button className="text-btn" onClick={onJournal}>Open case journal →</button>
      <button className="text-btn" onClick={() => narrate(text, false, setMessage)}>Read aloud</button>
      <button className="text-btn" onClick={() => { stopNarration(); }}>Stop reading</button>
      <label><input type="checkbox" checked={enabled} onChange={e => {
        setEnabled(e.target.checked); localStorage.setItem("ltt-narration", String(e.target.checked));
        previous.current = "";
        if (e.target.checked) { previous.current = step; narrate(step, false, setMessage); }
        else stopNarration();
      }} /> Spoken guidance</label>
    </div>
    {message && <small role="status">{message}</small>}
  </aside>;
}

export function Joystick({ onMove }: { onMove: (v: {x: number; y: number}) => void }) {
  const [position, setPosition] = useState({x: 0, y: 0});
  const pointer = useRef<number | null>(null);
  const send = useRef(onMove); send.current = onMove;
  const stop = () => { pointer.current = null; setPosition({x:0,y:0}); send.current({x:0,y:0}); };
  useEffect(() => {
    window.addEventListener("blur", stop); document.addEventListener("visibilitychange", stop);
    return () => { window.removeEventListener("blur", stop); document.removeEventListener("visibilitychange", stop); send.current({x:0,y:0}); };
  }, []);
  const update = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) / 52;
    const y = (e.clientY - rect.top - rect.height / 2) / 52;
    const length = Math.hypot(x, y), scale = Math.max(1, length);
    const v = length < .12 ? {x:0,y:0} : {x:x/scale,y:y/scale};
    setPosition(v); send.current(v);
  };
  return <div className="joystick" role="group" aria-label="Movement joystick" tabIndex={0}
    onPointerDown={e => { if (pointer.current !== null) return; e.preventDefault(); pointer.current=e.pointerId; e.currentTarget.setPointerCapture(e.pointerId); update(e); }}
    onPointerMove={e => { if (pointer.current === e.pointerId) update(e); }}
    onPointerUp={e => { if (pointer.current === e.pointerId) stop(); }}
    onPointerCancel={e => { if (pointer.current === e.pointerId) stop(); }}
    onLostPointerCapture={e => { if (pointer.current === e.pointerId) stop(); }}
    onKeyDown={e => { const v: Record<string, {x:number;y:number}> = {ArrowUp:{x:0,y:-1},ArrowDown:{x:0,y:1},ArrowLeft:{x:-1,y:0},ArrowRight:{x:1,y:0}}; if(v[e.key]) {e.preventDefault(); setPosition(v[e.key]);send.current(v[e.key]);} }}
    onKeyUp={stop} onBlur={stop}>
    <span className="joystick-directions" aria-hidden="true">↑<br/>←　　→<br/>↓</span>
    <span className="joystick-knob" style={{transform:`translate(${position.x*52}px, ${position.y*52}px)`}} />
    <span className="sr-only">Drag to walk. Release to stop. Arrow keys also work.</span>
  </div>;
}
