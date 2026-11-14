// Sound service for CDD Gacha 2
// Todos los efectos vienen del pack cartoon CC0 de /public/assets/audio/cartoon.
// Ya no hay motor de síntesis ni archivos de audio antiguos: si un sonido no existe,
// simplemente no suena.

class SoundService {
  private bgm: HTMLAudioElement | null = null;
  private isMuted: boolean = false;
  private volume: number = 0.65;
  private currentBgmTrack: string = '/assets/audio/blades_of_the_astral_gate.mp3';
  private hasInteracted: boolean = false;
  private shouldPlayBgm: boolean = false;

  /**
   * SFX cartoon de cada acción (mp3 en /public/assets/audio/cartoon).
   * Pack CC0 1.0 de spritepilot.com/free-game-assets/sound-effects: uso libre, incluso comercial.
   * Cada acción tiene sus archivos propios y variantes aleatorias para que no suene repetitivo.
   */
  private readonly ASSET_SFX: Record<string, string[]> = {
    // Interfaz, cartas y selección
    click: ['click.mp3'],
    card: ['tap.mp3', 'click.mp3'],
    tap: ['tap.mp3'],
    toggle: ['toggle.mp3'],
    blip: ['tap.mp3', 'click.mp3'],
    draw: ['tap.mp3', 'menu-open.mp3'],
    notification: ['notification.mp3'],
    chime: ['notification.mp3'],
    lockpick: ['key.mp3'],
    // Golpes y armas
    attack: ['sword-swing.mp3'],
    critical: ['sword-clash.mp3', 'glass-shatter.mp3'],
    hurt: ['punch.mp3', 'kick.mp3'],
    enemy_attack: ['kick.mp3', 'punch.mp3'],
    impact: ['metal-impact.mp3', 'heavy-thud.mp3'],
    explosion: ['explosion-small.mp3', 'explosion-big.mp3'],
    // Habilidades y magia
    skill: ['spell-cast.mp3'],
    fire: ['fireball.mp3'],
    ice: ['ice.mp3'],
    lightning: ['lightning.mp3'],
    laser: ['laser-shot.mp3', 'ray-gun.mp3'],
    laser1: ['laser-shot.mp3'],
    laser2: ['laser-heavy.mp3', 'ray-gun.mp3'],
    drain: ['teleport.mp3'],
    necrotic: ['lightning.mp3', 'laser-shot.mp3'],
    dark_god: ['explosion-big.mp3'],
    ultimate: ['energy-charge.mp3'],
    enemy_ultimate: ['laser-heavy.mp3', 'dragon-roar.mp3'],
    gacha_pull: ['portal.mp3', 'energy-charge.mp3'],
    // Curación, buffs y escudos
    heal: ['heal.mp3', 'health.mp3'],
    buff: ['gem.mp3', 'power-up.mp3'],
    powerup: ['power-up.mp3', 'gem.mp3'],
    upgrade: ['power-up.mp3', 'gem.mp3'],
    merge: ['power-up.mp3', 'gem.mp3'],
    sparkle: ['gem.mp3'],
    shield: ['shield-block.mp3', 'force-field.mp3'],
    // Debuffs y esquivas
    debuff: ['monster-growl.mp3', 'error.mp3'],
    miss: ['dash.mp3'],
    // Botín
    coin: ['coin-bell.mp3', 'coin-glockenspiel.mp3', 'coin-drop.mp3'],
    loot: ['chest-open.mp3', 'coin-drop.mp3'],
    // Resultado del combate
    victory: ['victory.mp3', 'level-complete.mp3'],
    defeat: ['game-over.mp3'],
    // Cortina de escena
    baron: ['levelup.mp3'],

    // Nombres individuales del pack: dan a cada héroe y a cada ataque su propio sonido
    sword: ['sword-swing.mp3'],
    slash: ['sword-swing.mp3', 'sword-clash.mp3'],
    clash: ['sword-clash.mp3'],
    punch: ['punch.mp3'],
    kick: ['kick.mp3'],
    bow: ['bow-shot.mp3'],
    arrow: ['arrow-hit.mp3'],
    thud: ['heavy-thud.mp3'],
    metal: ['metal-impact.mp3'],
    spear: ['heavy-thud.mp3', 'metal-impact.mp3'],
    shatter: ['glass-shatter.mp3'],
    pop: ['explosion-small.mp3'],
    boom: ['explosion-big.mp3'],
    zap: ['laser-shot.mp3'],
    beam: ['laser-heavy.mp3'],
    raygun: ['ray-gun.mp3'],
    charge: ['energy-charge.mp3'],
    field: ['force-field.mp3'],
    block: ['shield-block.mp3'],
    fall: ['body-fall.mp3'],
    bell: ['coin-bell.mp3'],
    gong: ['coin-glockenspiel.mp3'],
    crystal: ['gem.mp3'],
    hp: ['health.mp3'],
    potion: ['potion.mp3'],
    teleport: ['teleport.mp3'],
    portal: ['portal.mp3'],
    spell: ['spell-cast.mp3'],
    flame: ['fireball.mp3'],
    flame2: ['fireball.mp3', 'explosion-small.mp3'],
    frost: ['ice.mp3'],
    storm: ['lightning.mp3'],
    mend: ['heal.mp3'],
    growl: ['monster-growl.mp3'],
    roar: ['dragon-roar.mp3'],
    slime: ['slime.mp3'],
    jump: ['jump.mp3'],
    land: ['land.mp3'],
    dash: ['dash.mp3'],
    key: ['key.mp3'],
    chest: ['chest-open.mp3'],
    levelup: ['level-complete.mp3'],
  };

  constructor() {
    if (typeof window !== 'undefined') {
      const handleFirstInteraction = () => {
        this.hasInteracted = true;
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

  /** Reproduce el efecto cartoon de una acción. Si el nombre no existe, no suena nada. */
  public playSFX(name: string) {
    if (this.isMuted) return;
    const variants = this.ASSET_SFX[name];
    if (!variants || variants.length === 0) return;
    const file = variants[Math.floor(Math.random() * variants.length)];
    this.playAssetAudio(`/assets/audio/cartoon/${file}`);
  }

  private playAssetAudio(src: string) {
    try {
      const audio = new Audio(src);
      audio.volume = Math.min(1, this.volume * 0.85);
      const promise = audio.play();
      if (promise !== undefined) {
        promise.catch(() => {
          // Sin respaldo sintetizado: el navegador bloqueó el audio o el archivo no cargó
        });
      }
    } catch {
      // Audio restringido
    }
  }
}

export const sound = new SoundService();
