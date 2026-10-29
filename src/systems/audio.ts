export const LOFI_TRACKS = [
  { title: 'Chuva em Kyoto', mood: 'Rhodes · chuva · 72 BPM', bpm: 72, chords: [[50, 57, 60, 64, 69], [43, 53, 59, 64, 69], [48, 55, 59, 62, 67], [45, 55, 61, 64, 71]], melody: [74, null, 72, 69, null, 65, null, 64, 67, null, 69, null, 71, 69, 67, null, 64, null, 67, 71, null, 74, 72, null, 73, null, 71, 69, null, 64, 61, null] },
  { title: 'Luz na janela', mood: 'Jazz suave · vinil · 76 BPM', bpm: 76, chords: [[53, 60, 64, 67, 72], [52, 59, 62, 66, 69], [45, 52, 55, 59, 64], [50, 57, 60, 64, 69]], melody: [76, null, 79, 76, null, 72, 69, null, 74, null, 71, 69, null, 66, 67, null, 71, null, 72, 76, null, 71, 67, null, 69, null, 72, 74, null, 69, 65, null] },
  { title: 'Depois da última tigela', mood: 'Piano elétrico · noite · 66 BPM', bpm: 66, chords: [[48, 55, 59, 62, 67], [47, 54, 57, 62, 66], [45, 52, 55, 59, 64], [43, 53, 57, 60, 64]], melody: [67, null, null, 71, 74, null, 71, null, 66, null, 69, null, 74, null, 71, null, 64, null, 67, null, 71, null, 69, 67, 65, null, null, 64, 62, null, 60, null] },
] as const;
const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);
export class CozyAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private musicOutput: GainNode | null = null;
  private ambienceBus: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private noise: AudioBuffer | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private enabled = true; private track = 0; private step = 0; private nextTime = 0; private scheduled = 0;
  private effectsVolume = .6; private musicVolume = .55; private rainy = true; private ambienceOn = true;
  start(volume: number, music: boolean, musicVolume = this.musicVolume, track = this.track, ambience = this.ambienceOn) {
    this.effectsVolume = volume; this.enabled = music; this.musicVolume = musicVolume; this.ambienceOn = ambience;
    if (!this.ctx) {
      try {
        this.ctx = new AudioContext();
        this.master = this.ctx.createGain(); this.master.gain.value = .65;
        const limiter = this.ctx.createDynamicsCompressor(); limiter.threshold.value = -17; limiter.knee.value = 20; limiter.ratio.value = 3; limiter.attack.value = .01; limiter.release.value = .3;
        this.analyser = this.ctx.createAnalyser(); this.analyser.fftSize = 2048;
        this.master.connect(limiter); limiter.connect(this.analyser); this.analyser.connect(this.ctx.destination);
        this.musicBus = this.ctx.createGain(); this.musicBus.gain.value = musicVolume * .52; this.musicOutput = this.ctx.createGain(); this.musicOutput.gain.value = music && musicVolume > 0 ? 1 : 0; this.musicOutput.connect(this.master);
        const warm = this.ctx.createBiquadFilter(); warm.type = 'lowpass'; warm.frequency.value = 4200; warm.Q.value = .4;
        this.musicBus.connect(warm); warm.connect(this.musicOutput);
        // A short, quiet room echo gives the electric piano space without a remote audio asset.
        const echo = this.ctx.createDelay(1), feedback = this.ctx.createGain(); echo.delayTime.value = .31; feedback.gain.value = .14;
        warm.connect(echo); echo.connect(feedback); feedback.connect(echo); feedback.connect(this.musicOutput);
        this.ambienceBus = this.ctx.createGain(); this.ambienceBus.gain.value = 0; this.ambienceBus.connect(this.master);
        this.noise = this.ctx.createBuffer(1, this.ctx.sampleRate * 4, this.ctx.sampleRate);
        const data = this.noise.getChannelData(0); for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        this.createAmbience(); this.nextTime = this.ctx.currentTime + .08;
        this.timer = setInterval(() => this.schedule(), 30);
      } catch { return; }
    }
    if (this.track !== track) { this.track = Math.max(0, Math.min(2, track)); this.step = 0; this.nextTime = this.ctx.currentTime + .1; }
    void this.ctx.resume().catch(() => {});
    this.update(volume, music, musicVolume, ambience);
  }
  update(volume: number, music: boolean, musicVolume = this.musicVolume, ambience = this.ambienceOn) {
    this.effectsVolume = volume; this.enabled = music; this.musicVolume = musicVolume; this.ambienceOn = ambience;
    if (!this.ctx) return;
    this.musicBus?.gain.setTargetAtTime(musicVolume * .52, this.ctx.currentTime, .18);
    this.musicOutput?.gain.setTargetAtTime(music && musicVolume > 0 ? 1 : 0, this.ctx.currentTime, .03);
    this.ambienceBus?.gain.setTargetAtTime(ambience ? (this.rainy ? .032 : .007) * volume : 0, this.ctx.currentTime, ambience && volume > 0 ? .6 : .04);
  }
  weather(rain: boolean) { this.rainy = rain; this.update(this.effectsVolume, this.enabled); }
  private voice(freq: number, at: number, duration: number, gain: number, bus: AudioNode, type: OscillatorType = 'sine', overtone = 0) {
    if (!this.ctx) return;
    const oscillator = this.ctx.createOscillator(), envelope = this.ctx.createGain();
    oscillator.type = type; oscillator.frequency.setValueAtTime(freq, at); oscillator.detune.value = overtone;
    envelope.gain.setValueAtTime(0, at); envelope.gain.linearRampToValueAtTime(gain, at + .018); envelope.gain.exponentialRampToValueAtTime(.0001, at + duration);
    oscillator.connect(envelope); envelope.connect(bus); oscillator.start(at); oscillator.stop(at + duration + .02);
    oscillator.onended = () => { oscillator.disconnect(); envelope.disconnect(); };
  }
  private rhodes(note: number, at: number, duration: number, gain = .16) {
    if (!this.musicBus) return;
    this.voice(hz(note), at, duration, gain, this.musicBus);
    this.voice(hz(note) * 2.001, at, duration * .5, gain * .19, this.musicBus, 'sine', 1.5);
    this.voice(hz(note) * 3.998, at, duration * .18, gain * .025, this.musicBus);
  }
  private drum(at: number, type: 'kick' | 'snare' | 'hat', gain = 1) {
    if (!this.ctx || !this.musicBus || !this.noise) return;
    const envelope = this.ctx.createGain(); envelope.connect(this.musicBus);
    if (type === 'kick') {
      const o = this.ctx.createOscillator(); o.frequency.setValueAtTime(115, at); o.frequency.exponentialRampToValueAtTime(39, at + .16);
      envelope.gain.setValueAtTime(.34 * gain, at); envelope.gain.exponentialRampToValueAtTime(.0001, at + .3); o.connect(envelope); o.start(at); o.stop(at + .32);
      o.onended = () => { o.disconnect(); envelope.disconnect(); }; return;
    }
    const source = this.ctx.createBufferSource(), filter = this.ctx.createBiquadFilter(); source.buffer = this.noise;
    filter.type = type === 'hat' ? 'highpass' : 'bandpass'; filter.frequency.value = type === 'hat' ? 6600 : 1550; filter.Q.value = .7;
    const duration = type === 'hat' ? .035 : .105;
    envelope.gain.setValueAtTime((type === 'hat' ? .06 : .12) * gain, at); envelope.gain.exponentialRampToValueAtTime(.0001, at + duration);
    source.connect(filter); filter.connect(envelope); source.start(at, Math.random() * 2); source.stop(at + duration + .01);
    source.onended = () => { source.disconnect(); filter.disconnect(); envelope.disconnect(); };
  }
  private schedule() {
    if (!this.ctx || this.ctx.state !== 'running') return;
    const track = LOFI_TRACKS[this.track], beat = 60 / track.bpm;
    if (this.nextTime < this.ctx.currentTime - .2) this.nextTime = this.ctx.currentTime + .05;
    while (this.nextTime < this.ctx.currentTime + .15) {
      const i = this.step % 32, at = this.nextTime, chord = track.chords[Math.floor(i / 8)];
      if (this.enabled) {
        if (i % 8 === 0) chord.slice(1).forEach((n, j) => this.rhodes(n, at + j * .014, beat * 3.4, .115));
        if (i % 4 === 0 && this.musicBus) this.voice(hz(chord[0] - 12), at, beat * 1.7, .21, this.musicBus);
        if ([0, 7, 8, 16, 23, 24].includes(i)) this.drum(at, 'kick', i % 8 === 0 ? .9 : .52);
        if (i % 8 === 4) this.drum(at + .015, 'snare', .65);
        if (i % 2 === 1 || i % 8 === 0) this.drum(at, 'hat', i % 2 ? .65 : .4);
        const melody = track.melody[i]; if (melody !== null) this.rhodes(melody, at + .025, beat * 1.5, .075);
      }
      this.nextTime += beat / 2 * (i % 2 === 0 ? 1.13 : .87); this.step++; this.scheduled++;
    }
  }
  private createAmbience() {
    if (!this.ctx || !this.noise || !this.ambienceBus) return;
    const source = this.ctx.createBufferSource(), filter = this.ctx.createBiquadFilter(); source.buffer = this.noise; source.loop = true;
    filter.type = 'lowpass'; filter.frequency.value = 1100; filter.Q.value = .2; source.connect(filter); filter.connect(this.ambienceBus); source.start();
  }
  effect(name: 'bell' | 'drop' | 'cut' | 'cash' | 'click' | 'sizzle') {
    if (!this.ctx || !this.master) return;
    const t = this.ctx.currentTime, g = this.effectsVolume;
    if (name === 'bell') { this.voice(880, t, 1.1, .09 * g, this.master); this.voice(1320, t + .07, .9, .025 * g, this.master); }
    else if (name === 'cash') { this.voice(659, t, .25, .1 * g, this.master); this.voice(880, t + .12, .5, .08 * g, this.master); }
    else this.voice(name === 'cut' ? 140 : 330, t, name === 'cut' ? .07 : .1, .055 * g, this.master, 'triangle');
  }
  pause(paused: boolean) { if (!this.ctx) return; if (paused) void this.ctx.suspend(); else { this.nextTime = this.ctx.currentTime + .08; void this.ctx.resume().catch(() => {}); } }
  get status() { return { started: !!this.ctx, context: this.ctx?.state ?? 'idle', track: this.track, enabled: this.enabled, scheduled: this.scheduled, musicVolume: this.musicVolume }; }
  sampleEnergy() { if (!this.analyser) return 0; const data = new Float32Array(this.analyser.fftSize); this.analyser.getFloatTimeDomainData(data); return Math.sqrt(data.reduce((s, v) => s + v * v, 0) / data.length); }
  destroy() { if (this.timer) clearInterval(this.timer); void this.ctx?.close(); }
}
export const audio = new CozyAudio();
