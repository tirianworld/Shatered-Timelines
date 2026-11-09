class AudioManager {
  private bgmAudio: HTMLAudioElement | null = null;
  private isMuted: boolean = false;
  private bgmPlaying: boolean = false;
  private volume: number = 0.5;
  private audioCtx: AudioContext | null = null;

  constructor() {
    // Lazy audio context creation upon interaction
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  public initBGM() {
    if (typeof window === 'undefined') return;
    if (!this.bgmAudio) {
      this.bgmAudio = new Audio('/assets/audio/blades_of_the_astral_gate.mp3');
      this.bgmAudio.loop = true;
      this.bgmAudio.volume = this.volume * 0.4;
    }
  }

  public toggleBGM(): boolean {
    this.initBGM();
    if (!this.bgmAudio) return false;

    if (this.bgmPlaying) {
      this.bgmAudio.pause();
      this.bgmPlaying = false;
    } else {
      this.bgmAudio.play().then(() => {
        this.bgmPlaying = true;
      }).catch(err => {
        console.warn('Autoplay restricted:', err);
      });
    }
    return this.bgmPlaying;
  }

  public isBgmActive(): boolean {
    return this.bgmPlaying;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.bgmAudio) {
      this.bgmAudio.muted = muted;
    }
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public playSound(soundPath: string, volMultiplier: number = 1.0) {
    if (this.isMuted) return;

    try {
      const audio = new Audio(soundPath);
      audio.volume = Math.min(1.0, this.volume * volMultiplier);
      audio.play().catch(() => {
        // Fallback to synthetic beep if file playback is blocked or missing
        this.playSyntheticBeep(440, 0.1);
      });
    } catch {
      this.playSyntheticBeep(440, 0.1);
    }
  }

  // Pre-configured sound shortcuts
  public playClick() {
    this.playSound('/assets/audio/blip1.wav', 0.6);
  }

  public playCoin() {
    this.playSound('/assets/audio/coin1.wav', 0.8);
  }

  public playSummonCharge() {
    this.playSound('/assets/audio/powerup1.wav', 0.9);
  }

  public playSummonReveal() {
    this.playSound('/assets/audio/coin2.wav', 0.9);
  }

  public playSSRReveal() {
    this.playSound('/assets/audio/powerup5.wav', 1.0);
  }

  public playAttack() {
    this.playSound('/assets/audio/laser1.wav', 0.7);
  }

  public playMagic() {
    this.playSound('/assets/audio/rayo_necrotico.mp3', 0.8);
  }

  public playHurt() {
    this.playSound('/assets/audio/hurt1.wav', 0.8);
  }

  public playBaronVoice() {
    this.playSound('/assets/audio/baron_intro.wav', 0.9);
  }

  // Web Audio synth fallback generator for crisp responsive clicks
  private playSyntheticBeep(freq: number, duration: number) {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Ignore
    }
  }
}

export const soundManager = new AudioManager();
