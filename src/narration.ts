// One narrator owns browser speech. Automatic updates never cut off a sentence.
type Reading = { text: string; automatic: boolean; volume?: number; onError?: (message: string) => void };
let current: SpeechSynthesisUtterance | undefined;
let active: Reading | undefined;
let chunks: string[] = [];
let pending: Reading | undefined;
let generation = 0;
function supported() { return typeof window !== "undefined" && "speechSynthesis" in window; }
export function stopNarration(automaticOnly = false) {
  if (pending?.automatic) pending = undefined;
  if (automaticOnly && !active?.automatic) return;
  generation++; current = undefined; active = undefined; chunks = []; pending = undefined;
  if (supported()) speechSynthesis.cancel();
}
function advance(token: number) {
  if (token !== generation || !active) return;
  const text = chunks.shift();
  if (!text) {
    active = undefined; current = undefined;
    if (pending) { const next = pending; pending = undefined; begin(next); }
    return;
  }
  const utterance = new SpeechSynthesisUtterance(text);
  current = utterance; // Retain the utterance until its end event (Safari/Chrome).
  utterance.lang = "en-US"; utterance.rate = .94; utterance.pitch = 1;
  utterance.volume = active.volume ?? 1;
  const voices = speechSynthesis.getVoices();
  utterance.voice = voices.find(v => v.localService && /^en[-_]/i.test(v.lang)) || voices.find(v => /^en[-_]/i.test(v.lang)) || null;
  utterance.onend = () => advance(token);
  utterance.onerror = e => {
    if (token !== generation || e.error === "canceled" || e.error === "interrupted") return;
    const notify = active?.onError;
    stopNarration();
    notify?.("Speech could not play. The instructions remain on screen; use Read aloud to retry.");
  };
  speechSynthesis.speak(utterance);
}
function begin(reading: Reading) {
  active = reading;
  // Short phrases avoid long-utterance truncation on some browser engines.
  chunks = reading.text.match(/[^.!?]+[.!?]*/g)?.flatMap(sentence => sentence.match(/.{1,150}(?:\s|$)|.{1,150}/g) || []) || [reading.text];
  advance(++generation);
}
export function narrate(text: string, automatic = false, onError?: Reading["onError"], volume = 1) {
  if (!supported()) { onError?.("Speech is unavailable in this browser. Instructions remain on screen."); return; }
  const reading = {text, automatic, onError, volume};
  if (automatic && active) {
    if (active.text !== text) pending = reading; // Only the latest update is useful.
    return;
  }
  if (!automatic) stopNarration();
  begin(reading);
}
