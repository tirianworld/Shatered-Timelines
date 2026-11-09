// Sound service for CDD Gacha 2
// Authentic Gacha RPG Sound Design (Genshin, Honkai: Star Rail style)
// Plays the authentic instrumental combat soundtrack "Blades of the Astral Gate"
// High-fidelity crystal glass chimes, kinetic blade slashes, critical shatter impacts, and celestial buffs

class SoundService {
  private bgm: HTMLAudioElement | null = null;
  private isMuted: boolean = false;
  private volume: number = 0.65;
  private audioCtx: AudioContext | null = null;
  private currentBgmTrack: string = '/assets/audio/blades_of_the_astral_gate.mp3';
  private hasInteracted: boolean = false;
  private shouldPlayBgm: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      const handleFirstInteraction = () => {
        this.hasInteracted = true;
        if (this.audioCtx && this.audioCtx.state === 'suspended') {
          this.audioCtx.resume().catch(() => {});
        }
        if (this.shouldPlayBgm && this.bgm && !this.isMuted && this.bgm.paused) {
          this.bgm.play().catch(() => {});
        }
        window.removeEventListener('click', handleFirstInteraction);
        window.removeEventListener('keydown', handleFirstInteraction);
        window.removeEventListener('touchstart', handleFirstInteraction);
      };
      window.addEventListener('click', handleFirstInteraction);
      window.addEventListener('keydown', handleFirstInteraction);
      window.addEventListener('touchstart', handleFirstInteraction);
    }
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.audioCtx = new AudioCtx();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  /**
   * Initializes and plays the combat instrumental soundtrack:
   * "Blades of the Astral Gate" (/assets/audio/blades_of_the_astral_gate.mp3)
   */
  public initBGM(src: string = '/assets/audio/blades_of_the_astral_gate.mp3') {
    if (typeof window === 'undefined') return;
    try {
      this.currentBgmTrack = src;
      if (!this.bgm) {
        this.bgm = new Audio(src);
        this.bgm.loop = true;
        this.bgm.volume = this.isMuted ? 0 : this.volume * 0.45;
      } else if (this.bgm.src !== src && !this.bgm.src.endsWith(src)) {
        this.bgm.src = src;
        this.bgm.loop = true;
        this.bgm.volume = this.isMuted ? 0 : this.volume * 0.45;
      }
    } catch {
      // Audio instantiation restricted
    }
  }

  public playBGM() {
    this.shouldPlayBgm = true;
    if (!this.bgm) {
      this.initBGM(this.currentBgmTrack);
    }
    if (this.bgm && !this.isMuted) {
      this.bgm.volume = this.volume * 0.45;
      const promise = this.bgm.play();
      if (promise !== undefined) {
        promise.catch(() => {
          // Autoplay policy prevented playback before interaction; handled by user click listeners
        });
      }
    }
  }

  public pauseBGM() {
    this.shouldPlayBgm = false;
    if (this.bgm) {
      this.bgm.pause();
    }
  }

  public stopBGM() {
    this.shouldPlayBgm = false;
    if (this.bgm) {
      try {
        this.bgm.pause();
        this.bgm.currentTime = 0;
      } catch {}
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.bgm) {
      this.bgm.volume = this.isMuted ? 0 : this.volume * 0.45;
      if (this.isMuted) {
        this.bgm.pause();
      } else if (this.shouldPlayBgm) {
        this.bgm.play().catch(() => {});
      }
    }
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public setVolume(val: number) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.bgm) {
      this.bgm.volume = this.isMuted ? 0 : this.volume * 0.45;
    }
  }

  /**
   * Main Gacha SFX Player:
   * Combines authentic audio track playback with synthesized high-energy Gacha audio:
   * - Crisp crystal/glass UI clicks
   * - Kinetic heavy blade slashes with sub-bass impact
   * - Critical hit crystal shatter & golden bell chime
   * - Celestial card rank-up arpeggio
   * - Ethereal mystical siphon (zero whispers!)
   */
  public playSFX(name: string) {
    if (this.isMuted) return;

    // Special authentic asset tracks
    if (name === 'necrotic') {
      this.playAssetAudioWithFallback('/assets/audio/rayo_necrotico.mp3', 'necrotic');
      return;
    }

    if (name === 'dark_god') {
      this.playAssetAudioWithFallback('/assets/audio/fragmento_dios_oscuro.mp3', 'dark_god');
      return;
    }

    if (name === 'baron') {
      this.playAssetAudioWithFallback('/assets/audio/baron_intro.wav', 'upgrade');
      return;
    }

    // High-fidelity Gacha Sound Synthesis
    this.playGachaSFX(name);
  }

  private playAssetAudioWithFallback(src: string, fallbackType: string) {
    try {
      const audio = new Audio(src);
      audio.volume = Math.min(1, this.volume * 0.85);
      const promise = audio.play();
      if (promise !== undefined) {
        promise.catch(() => {
          this.playGachaSFX(fallbackType);
        });
      }
    } catch {
      this.playGachaSFX(fallbackType);
    }
  }

  /**
   * Authentic Gacha RPG Sound Design Synthesis
   */
  private playGachaSFX(type: string) {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const vol = this.volume;

      switch (type) {
        // 1. GACHA UI CLICK / CARD SELECT: Crisp Glass/Crystal Chime (Genshin / Honkai style)
        case 'click':
        case 'card': {
          // High-frequency crystal strike
          const osc1 = ctx.createOscillator();
          const gain1 = ctx.createGain();
          osc1.type = 'sine';
          osc1.frequency.setValueAtTime(2640, now);
          osc1.frequency.exponentialRampToValueAtTime(1400, now + 0.05);
          gain1.gain.setValueAtTime(0.26 * vol, now);
          gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
          osc1.connect(gain1);
          gain1.connect(ctx.destination);
          osc1.start(now);
          osc1.stop(now + 0.05);

          // Crystalline harmonic bell
          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.type = 'sine';
          osc2.frequency.setValueAtTime(3960, now);
          gain2.gain.setValueAtTime(0.18 * vol, now);
          gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
          osc2.connect(gain2);
          gain2.connect(ctx.destination);
          osc2.start(now);
          osc2.stop(now + 0.08);
          break;
        }

        // 2. GACHA BLADE SLASH / ATTACK: Aerodynamic steel slice + kinetic sub-thud
        case 'attack': {
          // Sharp razor blade whoosh
          const oscSlash = ctx.createOscillator();
          const gainSlash = ctx.createGain();
          oscSlash.type = 'sawtooth';
          oscSlash.frequency.setValueAtTime(1600, now);
          oscSlash.frequency.exponentialRampToValueAtTime(280, now + 0.11);
          gainSlash.gain.setValueAtTime(0.22 * vol, now);
          gainSlash.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
          oscSlash.connect(gainSlash);
          gainSlash.connect(ctx.destination);
          oscSlash.start(now);
          oscSlash.stop(now + 0.11);

          // Kinetic impact sub-bass slam
          const oscSub = ctx.createOscillator();
          const gainSub = ctx.createGain();
          oscSub.type = 'triangle';
          oscSub.frequency.setValueAtTime(190, now + 0.02);
          oscSub.frequency.exponentialRampToValueAtTime(45, now + 0.14);
          gainSub.gain.setValueAtTime(0.35 * vol, now + 0.02);
          gainSub.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
          oscSub.connect(gainSub);
          gainSub.connect(ctx.destination);
          oscSub.start(now + 0.02);
          oscSub.stop(now + 0.14);
          break;
        }

        // 3. GACHA CRITICAL HIT: Glass shatter shockwave + golden bell chime
        case 'critical': {
          // Shatter high transient
          const oscGlass = ctx.createOscillator();
          const gainGlass = ctx.createGain();
          oscGlass.type = 'triangle';
          oscGlass.frequency.setValueAtTime(3200, now);
          oscGlass.frequency.exponentialRampToValueAtTime(800, now + 0.12);
          gainGlass.gain.setValueAtTime(0.3 * vol, now);
          gainGlass.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
          oscGlass.connect(gainGlass);
          gainGlass.connect(ctx.destination);
          oscGlass.start(now);
          oscGlass.stop(now + 0.12);

          // Massive critical impact earthquake sub
          const oscBoom = ctx.createOscillator();
          const gainBoom = ctx.createGain();
          oscBoom.type = 'sine';
          oscBoom.frequency.setValueAtTime(150, now);
          oscBoom.frequency.exponentialRampToValueAtTime(35, now + 0.35);
          gainBoom.gain.setValueAtTime(0.45 * vol, now);
          gainBoom.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
          oscBoom.connect(gainBoom);
          gainBoom.connect(ctx.destination);
          oscBoom.start(now);
          oscBoom.stop(now + 0.35);

          // Resonant golden chime
          const oscBell = ctx.createOscillator();
          const gainBell = ctx.createGain();
          oscBell.type = 'sine';
          oscBell.frequency.setValueAtTime(1760, now + 0.04);
          gainBell.gain.setValueAtTime(0.2 * vol, now + 0.04);
          gainBell.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
          oscBell.connect(gainBell);
          gainBell.connect(ctx.destination);
          oscBell.start(now + 0.04);
          oscBell.stop(now + 0.3);
          break;
        }

        // 4. GACHA DAMAGE / HURT: Solid tactical armor strike
        case 'hurt': {
          // Heavy armor thud
          const oscArmor = ctx.createOscillator();
          const gainArmor = ctx.createGain();
          oscArmor.type = 'triangle';
          oscArmor.frequency.setValueAtTime(180, now);
          oscArmor.frequency.exponentialRampToValueAtTime(50, now + 0.15);
          gainArmor.gain.setValueAtTime(0.32 * vol, now);
          gainArmor.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
          oscArmor.connect(gainArmor);
          gainArmor.connect(ctx.destination);
          oscArmor.start(now);
          oscArmor.stop(now + 0.15);

          // Metallic deflection click
          const oscDeflect = ctx.createOscillator();
          const gainDeflect = ctx.createGain();
          oscDeflect.type = 'sine';
          oscDeflect.frequency.setValueAtTime(1150, now);
          oscDeflect.frequency.exponentialRampToValueAtTime(450, now + 0.06);
          gainDeflect.gain.setValueAtTime(0.18 * vol, now);
          gainDeflect.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
          oscDeflect.connect(gainDeflect);
          gainDeflect.connect(ctx.destination);
          oscDeflect.start(now);
          oscDeflect.stop(now + 0.06);
          break;
        }

        // 5. GACHA DRAIN (DRENAR MALDICIONES): Mystical Ethereal Siphon & Celestial Shimmer (ZERO WHISPERS)
        case 'drain': {
          // Mystical vacuum suction frequency sweep
          const oscVac = ctx.createOscillator();
          const gainVac = ctx.createGain();
          oscVac.type = 'sine';
          oscVac.frequency.setValueAtTime(320, now);
          oscVac.frequency.exponentialRampToValueAtTime(1280, now + 0.22);
          gainVac.gain.setValueAtTime(0.24 * vol, now);
          gainVac.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
          oscVac.connect(gainVac);
          gainVac.connect(ctx.destination);
          oscVac.start(now);
          oscVac.stop(now + 0.22);

          // Crystalline celestial shimmer
          const harmonics = [880, 1174, 1568];
          harmonics.forEach((freq, i) => {
            const oscH = ctx.createOscillator();
            const gainH = ctx.createGain();
            oscH.type = 'sine';
            const t = now + 0.08 + i * 0.05;
            oscH.frequency.setValueAtTime(freq, t);
            gainH.gain.setValueAtTime(0.16 * vol, t);
            gainH.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
            oscH.connect(gainH);
            gainH.connect(ctx.destination);
            oscH.start(t);
            oscH.stop(t + 0.25);
          });
          break;
        }

        // 6. GACHA SKILL / FORTALECER MARIONETA: Kinetic Cross-Slash + Golden Aura Shimmer
        case 'skill': {
          // Kinetic cross blade trail
          const oscTrail = ctx.createOscillator();
          const gainTrail = ctx.createGain();
          oscTrail.type = 'sawtooth';
          oscTrail.frequency.setValueAtTime(1400, now);
          oscTrail.frequency.exponentialRampToValueAtTime(340, now + 0.15);
          gainTrail.gain.setValueAtTime(0.22 * vol, now);
          gainTrail.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
          oscTrail.connect(gainTrail);
          gainTrail.connect(ctx.destination);
          oscTrail.start(now);
          oscTrail.stop(now + 0.15);

          // Radiant golden chime arpeggio
          const skillNotes = [784, 1046.5, 1318.5]; // G5, C6, E6
          skillNotes.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            const t = now + 0.04 + idx * 0.05;
            osc.frequency.setValueAtTime(freq, t);
            gain.gain.setValueAtTime(0.2 * vol, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(t);
            osc.stop(t + 0.22);
          });
          break;
        }

        // 7. GACHA CARD RANK-UP MERGE: Luminous Celestial Star Chime
        case 'upgrade': {
          // Radiant star chord: C6, E6, G6, C7
          const rankChimes = [1046.5, 1318.51, 1567.98, 2093.0];
          rankChimes.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            const t = now + idx * 0.06;
            osc.frequency.setValueAtTime(freq, t);
            gain.gain.setValueAtTime(0.24 * vol, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(t);
            osc.stop(t + 0.35);
          });

          // Golden resonance sweep
          const oscSweep = ctx.createOscillator();
          const gainSweep = ctx.createGain();
          oscSweep.type = 'triangle';
          oscSweep.frequency.setValueAtTime(523, now);
          oscSweep.frequency.exponentialRampToValueAtTime(1046.5, now + 0.24);
          gainSweep.gain.setValueAtTime(0.18 * vol, now);
          gainSweep.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
          oscSweep.connect(gainSweep);
          gainSweep.connect(ctx.destination);
          oscSweep.start(now);
          oscSweep.stop(now + 0.24);
          break;
        }

        // 8. GACHA NECROTIC (RAYO NECRÓTICO): High-voltage electric arc zap & ionized pulse
        case 'necrotic': {
          const oscArc = ctx.createOscillator();
          const gainArc = ctx.createGain();
          oscArc.type = 'sawtooth';
          oscArc.frequency.setValueAtTime(950, now);
          oscArc.frequency.exponentialRampToValueAtTime(140, now + 0.18);
          gainArc.gain.setValueAtTime(0.28 * vol, now);
          gainArc.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
          oscArc.connect(gainArc);
          gainArc.connect(ctx.destination);
          oscArc.start(now);
          oscArc.stop(now + 0.18);
          break;
        }

        // 9. GACHA DARK GOD / ASH DISSOLVE: Abyssal Void Shockwave & Celestial Dissipation
        case 'dark_god': {
          // Low dark void sub-frequency
          const oscVoid = ctx.createOscillator();
          const gainVoid = ctx.createGain();
          oscVoid.type = 'sine';
          oscVoid.frequency.setValueAtTime(135, now);
          oscVoid.frequency.exponentialRampToValueAtTime(32, now + 0.45);
          gainVoid.gain.setValueAtTime(0.38 * vol, now);
          gainVoid.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
          oscVoid.connect(gainVoid);
          gainVoid.connect(ctx.destination);
          oscVoid.start(now);
          oscVoid.stop(now + 0.45);

          // Ethereal dispersion shimmer
          const oscDisp = ctx.createOscillator();
          const gainDisp = ctx.createGain();
          oscDisp.type = 'triangle';
          oscDisp.frequency.setValueAtTime(440, now + 0.05);
          oscDisp.frequency.exponentialRampToValueAtTime(1760, now + 0.35);
          gainDisp.gain.setValueAtTime(0.14 * vol, now + 0.05);
          gainDisp.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
          oscDisp.connect(gainDisp);
          gainDisp.connect(ctx.destination);
          oscDisp.start(now + 0.05);
          oscDisp.stop(now + 0.35);
          break;
        }

        // 10. GACHA VICTORY: Grand Celestial Orchestral Fanfare
        case 'victory': {
          const victoryChords = [
            { f: 523.25, d: 0.1 },
            { f: 659.25, d: 0.1 },
            { f: 783.99, d: 0.12 },
            { f: 1046.5, d: 0.18 },
            { f: 1318.51, d: 0.45 },
          ];
          let off = 0;
          victoryChords.forEach((c) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            const t = now + off;
            osc.frequency.setValueAtTime(c.f, t);
            gain.gain.setValueAtTime(0.28 * vol, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + c.d);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(t);
            osc.stop(t + c.d);
            off += 0.07;
          });
          break;
        }

        // 11. GACHA DEFEAT: Somber Abyssal Bell
        case 'defeat': {
          const oscDef = ctx.createOscillator();
          const gainDef = ctx.createGain();
          oscDef.type = 'sine';
          oscDef.frequency.setValueAtTime(220, now);
          oscDef.frequency.exponentialRampToValueAtTime(65, now + 0.6);
          gainDef.gain.setValueAtTime(0.28 * vol, now);
          gainDef.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
          oscDef.connect(gainDef);
          gainDef.connect(ctx.destination);
          oscDef.start(now);
          oscDef.stop(now + 0.6);
          break;
        }

        // 12. GACHA COIN: Dual Crystal Clink
        case 'coin': {
          const osc1 = ctx.createOscillator();
          const gain1 = ctx.createGain();
          osc1.type = 'sine';
          osc1.frequency.setValueAtTime(1318.51, now); // E6
          gain1.gain.setValueAtTime(0.22 * vol, now);
          gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
          osc1.connect(gain1);
          gain1.connect(ctx.destination);
          osc1.start(now);
          osc1.stop(now + 0.22);

          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.type = 'sine';
          osc2.frequency.setValueAtTime(1975.53, now + 0.06); // B6
          gain2.gain.setValueAtTime(0.25 * vol, now + 0.06);
          gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
          osc2.connect(gain2);
          gain2.connect(ctx.destination);
          osc2.start(now + 0.06);
          osc2.stop(now + 0.28);
          break;
        }

        // 13. GACHA POWERUP: Soaring Celestial Energy Surge
        case 'powerup': {
          const oscP = ctx.createOscillator();
          const gainP = ctx.createGain();
          oscP.type = 'sine';
          oscP.frequency.setValueAtTime(330, now);
          oscP.frequency.exponentialRampToValueAtTime(1320, now + 0.28);
          gainP.gain.setValueAtTime(0.24 * vol, now);
          gainP.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
          oscP.connect(gainP);
          gainP.connect(ctx.destination);
          oscP.start(now);
          oscP.stop(now + 0.28);
          break;
        }

        default: {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(1400, now);
          osc.frequency.exponentialRampToValueAtTime(700, now + 0.04);
          gain.gain.setValueAtTime(0.18 * vol, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.04);
          break;
        }
      }
    } catch {
      // Audio context restricted or disabled
    }
  }
}

export const sound = new SoundService();
