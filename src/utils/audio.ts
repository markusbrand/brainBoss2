// Web Audio API Synthesizer for rich, responsive, kid-friendly game sounds
class SoundEffectsEngine {
  private ctx: AudioContext | null = null;
  private soundEnabled: boolean = true;

  constructor() {
    // Lazy AudioContext initialization
    const stored = localStorage.getItem('brainboss_sound_enabled');
    if (stored !== null) {
      this.soundEnabled = stored === 'true';
    }
  }

  private initCtx(): AudioContext | null {
    if (!this.soundEnabled) return null;
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public isEnabled(): boolean {
    return this.soundEnabled;
  }

  public isMuted(): boolean {
    return !this.soundEnabled;
  }

  public toggleSound(): boolean {
    this.soundEnabled = !this.soundEnabled;
    localStorage.setItem('brainboss_sound_enabled', String(this.soundEnabled));
    if (this.soundEnabled) {
      this.playCorrect();
    }
    return this.soundEnabled;
  }

  public toggleMute(): boolean {
    this.soundEnabled = !this.soundEnabled;
    localStorage.setItem('brainboss_sound_enabled', String(this.soundEnabled));
    if (this.soundEnabled) {
      this.playCorrect();
    }
    return !this.soundEnabled;
  }

  // Quick tactile pop on button clicks
  public playPop(frequency = 580) {
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch {
      // Audio context might be restricted
    }
  }

  // Cheerful ascending arpeggio on correct answers
  public playCorrect() {
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.06);

        gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.06);
        gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + idx * 0.06 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.06 + 0.22);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + idx * 0.06);
        osc.stop(ctx.currentTime + idx * 0.06 + 0.22);
      });
    } catch {}
  }

  // Gentle, soft low boop on wrong answer (encouraging, kid-friendly)
  public playWrong() {
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(260, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(180, ctx.currentTime + 0.18);

      gain.gain.setValueAtTime(0.14, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } catch {}
  }

  // Exciting fanfare for Level Up / Quest Completion
  public playLevelUp() {
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const chord = [
        { f: 523.25, d: 0.0 }, // C5
        { f: 659.25, d: 0.08 }, // E5
        { f: 783.99, d: 0.16 }, // G5
        { f: 1046.5, d: 0.24 }, // C6
        { f: 1318.5, d: 0.36 }, // E6
      ];

      chord.forEach(({ f, d }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, ctx.currentTime + d);

        gain.gain.setValueAtTime(0.18, ctx.currentTime + d);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + d + 0.4);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + d);
        osc.stop(ctx.currentTime + d + 0.4);
      });
    } catch {}
  }

  // Magical sparkling chest opening
  public playChestOpen() {
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      for (let i = 0; i < 8; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        const freq = 600 + i * 140;
        const time = ctx.currentTime + i * 0.05;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, time);

        gain.gain.setValueAtTime(0.1, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(time);
        osc.stop(time + 0.2);
      }
    } catch {}
  }

  // Power-up activation sound
  public playPowerUp() {
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.3);

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch {}
  }

  // Streak combo chime
  public playStreak(multiplier: number) {
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const baseFreq = Math.min(600 + multiplier * 100, 1600);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(baseFreq * 1.3, ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } catch {}
  }
}

export const soundFx = new SoundEffectsEngine();
