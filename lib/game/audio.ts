// Tiny synthesized sound engine — no audio files, just WebAudio oscillators.
// An AudioContext can only start after a user gesture, so we lazily create it
// on the first play() call (which always follows the "Play" click).

export class Sound {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  muted = false;

  private ensure(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (!Ctor) return null;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.28;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    return this.ctx;
  }

  private blip(
    freq: number,
    duration: number,
    type: OscillatorType,
    slideTo?: number,
    gain = 1,
  ) {
    if (this.muted) return;
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), t + duration);
    }
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(gain, t + 0.008);
    env.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.connect(env);
    env.connect(this.master);
    osc.start(t);
    osc.stop(t + duration + 0.02);
  }

  shoot() {
    this.blip(760, 0.12, "square", 240, 0.5);
  }
  explode() {
    this.blip(180, 0.18, "sawtooth", 60, 0.7);
  }
  powerup() {
    this.blip(440, 0.1, "triangle", 880, 0.8);
    this.blip(660, 0.16, "triangle", 1320, 0.6);
  }
  playerHit() {
    this.blip(220, 0.4, "sawtooth", 40, 0.9);
  }
  waveClear() {
    this.blip(523, 0.12, "square", 784, 0.6);
    this.blip(784, 0.2, "square", 1046, 0.6);
  }

  // Unlock/resume the context from within a user gesture.
  resume() {
    this.ensure();
  }
}
