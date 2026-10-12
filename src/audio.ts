import { narrate } from "./narration";
let context: AudioContext | undefined,
  ambient: GainNode | undefined,
  effects = 0.45,
  wind: GainNode | undefined,
  filter: BiquadFilterNode | undefined,
  tones: OscillatorNode[] = [],
  currentLocation = "street",
  tickTimer: ReturnType<typeof setInterval> | undefined;
export function activateAudio() {
  if (!context) {
    context = new AudioContext();
    ambient = context.createGain();
    ambient.gain.value = 0;
    ambient.connect(context.destination);
    for (const f of [55, 82.4, 110.3]) {
      const o = context.createOscillator(),
        g = context.createGain();
      o.frequency.value = f;
      o.type = "sine";
      g.gain.value = 0.035;
      o.connect(g);
      g.connect(ambient);
      o.start();
      tones.push(o);
    }
    const buffer = context.createBuffer(
        1,
        context.sampleRate * 4,
        context.sampleRate,
      ),
      data = buffer.getChannelData(0);
    let seed = 71;
    for (let i = 0; i < data.length; i++) {
      seed = (seed * 16807) % 2147483647;
      data[i] = (seed / 2147483647 - 0.5) * 0.3;
    }
    const noise = context.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    filter = context.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 420;
    wind = context.createGain();
    wind.gain.value = 0.18;
    noise.connect(filter);
    filter.connect(wind);
    wind.connect(ambient);
    noise.start();
    tickTimer = setInterval(() => {
      if (currentLocation === "clock" && context?.state === "running")
        tone(620, 0.03, 0.045, true);
    }, 1000);
  }
  void context.resume();
  setLocationAudio(currentLocation);
}
function tone(f: number, duration: number, volume: number, isAmbient = false) {
  if (!context) return;
  const o = context.createOscillator(),
    g = context.createGain();
  o.frequency.value = f;
  g.gain.setValueAtTime(
    volume * (isAmbient ? 1 : effects),
    context.currentTime,
  );
  g.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration);
  o.connect(g);
  g.connect(isAmbient ? ambient! : context.destination);
  o.start();
  o.stop(context.currentTime + duration + 0.01);
}
export function setAudio(a: number, e: number) {
  effects = e;
  if (ambient && context)
    ambient.gain.setTargetAtTime(a, context.currentTime, 0.5);
}
export function setLocationAudio(location: string) {
  currentLocation = location;
  if (!context) return;
  const settings: Record<string, number[]> = {
    street: [55, 82.4, 110.3, 450, 0.25],
    police: [65.4, 98, 130.8, 180, 0.06],
    clinic: [73.4, 110, 146.8, 210, 0.08],
    archive: [61.7, 92.5, 123.5, 240, 0.09],
    clock: [55, 110, 165, 320, 0.1],
    power: [60, 120, 180, 170, 0.3],
    radio: [69.3, 103.8, 138.6, 1800, 0.12],
    chamber: [36.7, 55, 73.4, 600, 0.16],
    dawn: [130.8, 164.8, 196, 850, 0.1],
  };
  const v = settings[location] || settings.street;
  tones.forEach((o, i) =>
    o.frequency.setTargetAtTime(v[i], context!.currentTime, 1),
  );
  filter?.frequency.setTargetAtTime(v[3], context.currentTime, 0.5);
  wind?.gain.setTargetAtTime(v[4], context.currentTime, 0.5);
}
export function chime(success = true) {
  if (!context) return;
  [0, 0.16, 0.36].forEach((delay, i) => {
    const o = context!.createOscillator(),
      g = context!.createGain();
    o.frequency.value = (
      success ? [293.66, 440, 587.33] : [146.8, 138.6, 130.8]
    )[i];
    g.gain.setValueAtTime(0, context!.currentTime + delay);
    g.gain.linearRampToValueAtTime(
      effects * 0.1,
      context!.currentTime + delay + 0.015,
    );
    g.gain.exponentialRampToValueAtTime(
      0.001,
      context!.currentTime + delay + 0.85,
    );
    o.connect(g);
    g.connect(context!.destination);
    o.start(context!.currentTime + delay);
    o.stop(context!.currentTime + delay + 1);
  });
}
export function playTranscript(text: string) {
  activateAudio();
  narrate(text, false, undefined, effects);
}
export function stopAudio() {
  clearInterval(tickTimer);
  void context?.suspend();
}

export function playMorningMelody() {
  activateAudio();
  if (!context) return;
  [392, 493.88, 587.33, 783.99, 659.25, 587.33, 493.88, 392].forEach((frequency, i) => {
    const o = context!.createOscillator(), g = context!.createGain();
    const at = context!.currentTime + i * .24;
    o.type = "sine"; o.frequency.value = frequency;
    g.gain.setValueAtTime(0, at); g.gain.linearRampToValueAtTime(effects * .2, at + .015);
    g.gain.exponentialRampToValueAtTime(.001, at + .75);
    o.connect(g); g.connect(context!.destination); o.start(at); o.stop(at + .8);
  });
}
