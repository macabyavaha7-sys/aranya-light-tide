/**
 * Synthesised seashore. No audio files are shipped: brown noise shaped by a
 * slow swell, a brighter wash layer and a gentle low-pass. Inside the hall the
 * whole thing gets quieter and duller; when the tab is hidden it fades out.
 */
export class SeaAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private surfGain: GainNode | null = null;
  private washGain: GainNode | null = null;
  private lowpass: BiquadFilterNode | null = null;
  private started = false;
  private indoor = false;
  private hidden = false;
  enabled = false;

  private build() {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return false;
    const ctx: AudioContext = new Ctx();
    this.ctx = ctx;

    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
    this.master = master;

    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 720;
    lowpass.Q.value = 0.4;
    lowpass.connect(master);
    this.lowpass = lowpass;

    const surfGain = ctx.createGain();
    surfGain.gain.value = 0.55;
    surfGain.connect(lowpass);
    this.surfGain = surfGain;

    // ---- brown-ish noise buffer
    const seconds = 8;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < data.length; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.2;
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    src.connect(surfGain);
    src.start();

    // ---- swell: slow amplitude modulation
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.085;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.32;
    lfo.connect(lfoGain);
    lfoGain.connect(surfGain.gain);
    lfo.start();

    // ---- brighter wash, offset so crests do not line up
    const wash = ctx.createBufferSource();
    wash.buffer = buffer;
    wash.loop = true;
    const washFilter = ctx.createBiquadFilter();
    washFilter.type = 'bandpass';
    washFilter.frequency.value = 1400;
    washFilter.Q.value = 0.7;
    const washGain = ctx.createGain();
    washGain.gain.value = 0.12;
    wash.connect(washFilter);
    washFilter.connect(washGain);
    washGain.connect(lowpass);
    this.washGain = washGain;
    wash.start();

    const lfo2 = ctx.createOscillator();
    lfo2.type = 'sine';
    lfo2.frequency.value = 0.052;
    const lfo2Gain = ctx.createGain();
    lfo2Gain.gain.value = 0.08;
    lfo2.connect(lfo2Gain);
    lfo2Gain.connect(washGain.gain);
    lfo2.start();

    this.started = true;
    return true;
  }

  async toggle(): Promise<boolean> {
    if (!this.ctx && !this.build()) return false;
    const ctx = this.ctx!;
    if (ctx.state === 'suspended') await ctx.resume();
    this.enabled = !this.enabled;
    this.apply();
    return this.enabled;
  }

  setSpace(indoor: boolean) {
    this.indoor = indoor;
    this.apply();
  }

  setHidden(hidden: boolean) {
    this.hidden = hidden;
    this.apply();
  }

  private apply() {
    if (!this.ctx || !this.master || !this.lowpass) return;
    const t = this.ctx.currentTime;
    const on = this.enabled && !this.hidden;
    const level = on ? (this.indoor ? 0.055 : 0.16) : 0;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setTargetAtTime(level, t, on ? 1.4 : 0.8);
    const cutoff = this.indoor ? 300 : 760;
    this.lowpass.frequency.setTargetAtTime(cutoff, t, 1.2);
    if (this.surfGain) this.surfGain.gain.setTargetAtTime(this.indoor ? 0.42 : 0.55, t, 1.2);
    if (this.washGain) this.washGain.gain.setTargetAtTime(this.indoor ? 0.04 : 0.12, t, 1.2);
  }
}
