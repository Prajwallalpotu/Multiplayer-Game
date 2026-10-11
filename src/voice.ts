import type { Socket } from "socket.io-client";
export class Voice {
  stream?: MediaStream;
  peers = new Map<string, RTCPeerConnection>();
  audio = new Map<string, HTMLAudioElement>();
  volumes = new Map<string, number>();
  pending = new Map<string, RTCIceCandidateInit[]>();
  ctx?: AudioContext;
  timer?: number;
  muted = false;
  ptt = false;
  held = false;
  destroyed = false;
  constructor(
    public socket: Socket,
    public id: string,
    public ice: RTCIceServer[],
    public status: (s: string) => void,
    public presence: (id: string, s: boolean) => void,
  ) {
    socket.on("voice:signal", this.signal);
    socket.on("voice:presence", this.onPresence);
  }
  onPresence = (m: any) => this.presence(m.id, m.speaking);
  async start(ids: string[]) {
    try {
      if (!window.isSecureContext)
        throw Error(
          "Microphone access needs HTTPS (or localhost). Open the secure game address on this device.",
        );
      if (!navigator.mediaDevices)
        throw Error(
          "This browser cannot access a microphone. Use a current browser over HTTPS or choose text communication.",
        );
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });
      if (this.destroyed) {
        this.stream.getTracks().forEach((t) => t.stop());
        return;
      }
      this.ctx = new AudioContext();
      await this.ctx.resume();
      const analyser = this.ctx.createAnalyser();
      analyser.fftSize = 256;
      this.ctx.createMediaStreamSource(this.stream).connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      this.timer = window.setInterval(() => {
        analyser.getByteFrequencyData(data);
        const speaking =
          !this.muted &&
          (!this.ptt || this.held) &&
          data.reduce((a, b) => a + b, 0) / data.length > 15;
        this.presence(this.id, speaking);
        this.socket.emit("voice:presence", speaking);
      }, 250);
      this.status("Microphone ready · listening on this device");
      for (const id of ids)
        if (id !== this.id)
          this.socket.emit("voice:signal", { to: id, type: "hello" });
    } catch (e) {
      this.status(
        (e as Error).name === "NotAllowedError"
          ? "Microphone denied. Allow it in this site’s browser settings, then retry. Text communication is always available."
          : (e as Error).message,
      );
      throw e;
    }
  }
  async peer(id: string) {
    let p = this.peers.get(id);
    if (p) return p;
    p = new RTCPeerConnection({ iceServers: this.ice });
    this.peers.set(id, p);
    this.stream?.getTracks().forEach((t) => p!.addTrack(t, this.stream!));
    p.onicecandidate = (e) => {
      if (e.candidate)
        this.socket.emit("voice:signal", {
          to: id,
          type: "candidate",
          data: e.candidate.toJSON(),
        });
    };
    p.ontrack = (e) => {
      let a = this.audio.get(id);
      if (!a) {
        a = new Audio();
        a.autoplay = true;
        a.volume = this.volumes.get(id) ?? 1;
        this.audio.set(id, a);
      }
      a.srcObject = e.streams[0];
      a.play().catch(() =>
        this.status("Tap “Resume voice playback” to hear your team."),
      );
    };
    p.onconnectionstatechange = () => {
      if (p!.connectionState === "failed")
        this.status(
          "Voice connection failed. Retry voice; different networks may need configured TURN.",
        );
      if (p!.connectionState === "connected")
        this.status("Voice connected · headphones recommended");
    };
    return p;
  }
  signal = async (m: any) => {
    if (!this.stream || this.destroyed) return;
    try {
      if (m.type === "bye") {
        this.peers.get(m.from)?.close();
        this.peers.delete(m.from);
        this.audio.get(m.from)?.pause();
        this.audio.delete(m.from);
        this.pending.delete(m.from);
        return;
      }
      if (m.type === "hello" || m.type === "offer-request") {
        // A deterministic offerer avoids simultaneous offer glare.
        const existing = this.peers.get(m.from);
        if (existing?.signalingState === "have-local-offer") return;
        if (m.type === "hello") {
          existing?.close();
          this.peers.delete(m.from);
          this.pending.delete(m.from);
        }
        if (this.id < m.from) {
          const p = await this.peer(m.from);
          const offer = await p.createOffer();
          await p.setLocalDescription(offer);
          this.socket.emit("voice:signal", {
            to: m.from,
            type: "offer",
            data: p.localDescription,
          });
        } else
          this.socket.emit("voice:signal", {
            to: m.from,
            type: "offer-request",
          });
        return;
      }
      const p = await this.peer(m.from);
      if (m.type === "candidate") {
        if (p.remoteDescription) await p.addIceCandidate(m.data);
        else
          this.pending.set(m.from, [
            ...(this.pending.get(m.from) || []),
            m.data,
          ]);
        return;
      }
      if (m.type === "offer") {
        await p.setRemoteDescription(m.data);
        const answer = await p.createAnswer();
        await p.setLocalDescription(answer);
        this.socket.emit("voice:signal", {
          to: m.from,
          type: "answer",
          data: p.localDescription,
        });
      } else if (m.type === "answer") await p.setRemoteDescription(m.data);
      if (p.remoteDescription) {
        for (const c of this.pending.get(m.from) || [])
          await p.addIceCandidate(c);
        this.pending.delete(m.from);
      }
    } catch {
      this.status(
        "Voice negotiation interrupted. Tap retry voice to reconnect.",
      );
    }
  };
  setMute(value: boolean) {
    this.muted = value;
    this.apply();
  }
  apply() {
    this.stream
      ?.getAudioTracks()
      .forEach((t) => (t.enabled = !this.muted && (!this.ptt || this.held)));
  }
  volume(id: string, v: number) {
    this.volumes.set(id, v);
    const a = this.audio.get(id);
    if (a) a.volume = v;
  }
  resume() {
    void this.ctx?.resume();
    for (const a of this.audio.values())
      void a
        .play()
        .catch(() =>
          this.status(
            "Playback is blocked by the browser. Check site audio permissions.",
          ),
        );
  }
  stop() {
    this.destroyed = true;
    clearInterval(this.timer);
    for (const id of this.peers.keys())
      this.socket.emit("voice:signal", { to: id, type: "bye" });
    for (const p of this.peers.values()) p.close();
    for (const a of this.audio.values()) {
      a.pause();
      a.srcObject = null;
    }
    this.stream?.getTracks().forEach((t) => t.stop());
    void this.ctx?.close();
    this.socket.off("voice:signal", this.signal);
    this.socket.off("voice:presence", this.onPresence);
    this.socket.emit("voice:presence", false);
  }
}
