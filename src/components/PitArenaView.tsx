import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Hero } from '../types/game';
import { useGame } from '../context/GameContext';
import { sound } from '../services/soundService';
import { pvpCardArt, pvpCardsForHero, pvpUltimateArt } from '../data/pvpCards';
import {

  PVP_MAX_ORBS,
  PVP_RANKS,
  PVP_ULTIMATE_SKILL_ID,
  rankFor,
  type PvpCard,
  type PvpFighterPayload,
  type PvpFighterView,
  type PvpHeroInput,
  type PvpHeroView,
  type PvpRankTier,
  type PvpRoomView,
} from '../types/pvp';
import { pvpSkillCastSprite } from '../data/pvpCards';
import { CombatView, type PvpCombatBridge } from './CombatView';
import { DEFAULT_ENEMY_FRAME, type EnemyVfxFrame } from '../utils/enemyVfxFrame';
import { ArlemSkillVfxOverlay } from './ArlemSkillVfxOverlay';
import { BarledSkillVfxOverlay } from './BarledSkillVfxOverlay';
import { EdacornSkillVfxOverlay } from './EdacornSkillVfxOverlay';
import { GiovaniSkillVfxOverlay } from './GiovaniSkillVfxOverlay';
import { KaironSkillVfxOverlay } from './KaironSkillVfxOverlay';
import { MagorditoSkillVfxOverlay } from './MagorditoSkillVfxOverlay';
import { PepeSkillVfxOverlay } from './PepeSkillVfxOverlay';
import { PrometeoSkillVfxOverlay } from './PrometeoSkillVfxOverlay';
import { RagnavaldrSkillVfxOverlay } from './RagnavaldrSkillVfxOverlay';
import { RaxxarSkillVfxOverlay } from './RaxxarSkillVfxOverlay';
import { RoxanneSkillVfxOverlay } from './RoxanneSkillVfxOverlay';
import { SmurphSkillVfxOverlay } from './SmurphSkillVfxOverlay';

const PLAYER_ID_KEY = 'cdd_pvp_player_id';
const RANK_KEY = 'cdd_pvp_rank_v1';
const SQUAD_KEY = 'cdd_pvp_squad_v1';
const APPLIED_KEY = 'cdd_pvp_applied_rooms_v1';

interface RankSave {
  rating: number;
  wins: number;
  losses: number;
  bestTier: string;
}

const loadRank = (): RankSave => {
  try {
    const raw = window.localStorage.getItem(RANK_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<RankSave>;
      return {
        rating: Math.max(0, Number(parsed.rating) || 0),
        wins: Math.max(0, Number(parsed.wins) || 0),
        losses: Math.max(0, Number(parsed.losses) || 0),
        bestTier: parsed.bestTier || rankFor(Number(parsed.rating) || 0).tier.id,
      };
    }
  } catch {
    // Sin guardado previo.
  }
  return { rating: 0, wins: 0, losses: 0, bestTier: PVP_RANKS[0].id };
};

/** Salas cuyo resultado ya se cobró: evita pagar dos veces si se recarga la página. */
const loadAppliedRooms = (): Set<string> => {
  try {
    const raw = window.localStorage.getItem(APPLIED_KEY);
    const parsed = raw ? (JSON.parse(raw) as string[]) : [];
    return new Set(Array.isArray(parsed) ? parsed.slice(-40) : []);
  } catch {
    return new Set();
  }
};

const saveAppliedRooms = (rooms: Set<string>) => {
  try {
    window.localStorage.setItem(APPLIED_KEY, JSON.stringify([...rooms].slice(-40)));
  } catch {
    // Ignorado.
  }
};

const getPlayerId = (): string => {
  try {
    const stored = window.sessionStorage.getItem(PLAYER_ID_KEY);
    if (stored) return stored;
    const id = `pvp_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-6)}`;
    window.sessionStorage.setItem(PLAYER_ID_KEY, id);
    return id;
  } catch {
    return `pvp_${Math.random().toString(36).slice(2, 12)}`;
  }
};

/** Sprites de combate disponibles en /assets/combat (los que usa la campaña). */
const PVP_BATTLE_SPRITES = new Set([
  'arlem',
  'barled',
  'chispo',
  'durnik',
  'edacorn',
  'edacorn_alas',
  'giovani',
  'kairon',
  'magordito',
  'pepe_loux',
  'prometeo',
  'ragnavaldr',
  'raxxar',
  'roxanne',
  'smurph',
]);

/** Algunos héroes usan el sprite de combate de otro id, como en la historia. */
const PVP_SPRITE_ALIAS: Record<string, string> = {
  arlem_diaz: 'arlem',
  chispo_deez: 'chispo',
  giovani_vazquez: 'giovani',
  smurph_draco: 'smurph',
};

const heroSpriteId = (heroId: string): string | null => {
  const candidate = PVP_SPRITE_ALIAS[heroId] ?? heroId;
  return PVP_BATTLE_SPRITES.has(candidate) ? candidate : null;
};

const heroIdleSprite = (heroId: string) => `/assets/combat/${heroId}_idle.webp`;
const heroAttackSprite = (heroId: string) => `/assets/combat/${heroId}_attack.webp`;

const heroInput = (hero: Hero, squadMaxHp = 0): PvpHeroInput => {
  const spriteId = heroSpriteId(hero.id);
  return {
    heroId: hero.id,
    heroName: hero.name,
    // Sin sprite de combate se pinta el retrato en un marco, como en las fichas del coliseo.
    spriteUrl: spriteId ? heroIdleSprite(spriteId) : hero.portrait,
    attackSpriteUrl: spriteId ? heroAttackSprite(spriteId) : '',
    portraitUrl: hero.portrait,
    cards: pvpCardsForHero(hero.id, { attack: hero.stats?.attack, squadMaxHp }),
  };
};

const mirrorTextureCache = new Map<string, string>();

/** Voltea un sprite para que el rival mire hacia ti, como los enemigos de la campaña. */
const mirrorTexture = (url: string): Promise<string> =>
  new Promise((resolve) => {
    if (!url) {
      resolve('');
      return;
    }
    const cached = mirrorTextureCache.get(url);
    if (cached) {
      resolve(cached);
      return;
    }
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx || !canvas.width || !canvas.height) {
          resolve(url);
          return;
        }
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(img, 0, 0);
        const out = canvas.toDataURL('image/png');
        mirrorTextureCache.set(url, out);
        resolve(out);
      } catch {
        resolve(url);
      }
    };
    img.onerror = () => resolve(url);
    img.src = url;
  });

type Phase = 'lobby' | 'searching' | 'duel' | 'result';

/** Overlay de VFX de la habilidad, el mismo que usa la campana para cada heroe. */
const skillVfxOverlay = (
  heroId: string,
  props: { skillType: string | null; tier?: 1 | 2 | 3; vfxKey?: number; enemyFrame?: EnemyVfxFrame }
): React.ReactNode => {
  switch (heroId) {
    case 'pepe_loux':
      return <PepeSkillVfxOverlay {...props} />;
    case 'arlem':
    case 'arlem_diaz':
      return <ArlemSkillVfxOverlay {...props} />;
    case 'edacorn':
      return <EdacornSkillVfxOverlay {...props} />;
    case 'magordito':
      return <MagorditoSkillVfxOverlay {...props} />;
    case 'kairon':
      return <KaironSkillVfxOverlay {...props} />;
    case 'prometeo':
      return <PrometeoSkillVfxOverlay {...props} />;
    case 'giovani':
    case 'giovani_vazquez':
      return <GiovaniSkillVfxOverlay {...props} />;
    case 'smurph':
    case 'smurph_draco':
      return <SmurphSkillVfxOverlay {...props} />;
    case 'roxanne':
      return <RoxanneSkillVfxOverlay {...props} />;
    case 'barled':
    case 'chispo':
    case 'chispo_deez':
      return <BarledSkillVfxOverlay {...props} />;
    case 'ragnavaldr':
      return <RagnavaldrSkillVfxOverlay {...props} />;
    case 'raxxar':
      return <RaxxarSkillVfxOverlay {...props} />;
    default:
      return null;
  }
};

interface HitFx {
  key: number;
  seat: 0 | 1;
  damage?: number;
  heal?: number;
  crit?: boolean;
  ultimate?: boolean;
  /** Habilidad lanzada: elige pose de casteo y VFX. */
  skillId?: string;
  tier?: 1 | 2 | 3;
  /** Marcos normalizados de los dos sprites dentro de la arena (para apuntar el VFX). */
  foeFrame?: EnemyVfxFrame;
  meFrame?: EnemyVfxFrame;
}

export const PitArenaView: React.FC = () => {
  const { heroes, team, playerName, addGold, goBack } = useGame();

  const playerId = useMemo(getPlayerId, []);
  const [phase, setPhase] = useState<Phase>('lobby');
  const [room, setRoom] = useState<PvpRoomView | null>(null);
  const [seat, setSeat] = useState<0 | 1>(0);
  const [waiting, setWaiting] = useState(0);
  const [online, setOnline] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [busy, setBusy] = useState(false);
  const [rank, setRank] = useState<RankSave>(loadRank);
  const [promotion, setPromotion] = useState<PvpRankTier | null>(null);
  const [fx, setFx] = useState<HitFx | null>(null);
  const appliedRooms = useRef<Set<string>>(loadAppliedRooms());

  const roster = useMemo(() => {
    const inTeam = team
      .map((id) => heroes.find((h) => h.id === id))
      .filter((h): h is Hero => Boolean(h));
    return inTeam.length > 0 ? inTeam : heroes;
  }, [heroes, team]);

  const [squadIds, setSquadIds] = useState<string[]>(() => {
    try {
      const stored = window.localStorage.getItem(SQUAD_KEY);
      const parsed = stored ? (JSON.parse(stored) as string[]) : null;
      if (Array.isArray(parsed) && parsed.length > 0) return parsed.slice(0, 3);
    } catch {
      // Sin escuadrón guardado.
    }
    const initial = [team[0], team[1], team[2]].filter((id): id is string => Boolean(id));
    return initial.length > 0 ? initial.slice(0, 3) : [];
  });

  const squadHeroes = useMemo(() => {
    const picked = squadIds
      .map((id) => heroes.find((h) => h.id === id))
      .filter((h): h is Hero => Boolean(h));
    const fallback = roster.slice(0, 3);
    return picked.length > 0 ? picked : fallback;
  }, [heroes, squadIds, roster]);

  const squadInputs = useMemo(() => {
    // Mismo cálculo de vida que la campaña: se suma el 75 % de la vida de cada héroe del escuadrón.
    const squadMaxHp = Math.round(
      squadHeroes.reduce((sum, hero) => sum + (hero.stats?.maxHp ?? 0), 0) * 0.75
    );
    return squadHeroes.map((hero) => heroInput(hero, squadMaxHp));
  }, [squadHeroes]);
  const rankInfo = rankFor(rank.rating);

  useEffect(() => {
    try {
      window.localStorage.setItem(SQUAD_KEY, JSON.stringify(squadHeroes.map((h) => h.id)));
    } catch {
      // Ignorado.
    }
  }, [squadHeroes]);

  useEffect(() => {
    try {
      window.localStorage.setItem(RANK_KEY, JSON.stringify(rank));
    } catch {
      // Ignorado.
    }
  }, [rank]);

  const toggleSquad = (heroId: string) => {
    sound.playSFX('tap');
    setSquadIds(() => {
      const current = squadHeroes.map((h) => h.id);
      if (current.includes(heroId)) {
        if (current.length === 1) return current;
        return current.filter((id) => id !== heroId);
      }
      if (current.length >= 3) return [...current.slice(1), heroId];
      return [...current, heroId];
    });
  };

  // --- SSE ---
  useEffect(() => {
    const es = new EventSource(`/api/pvp/stream?playerId=${encodeURIComponent(playerId)}`);

    es.addEventListener('hello', () => setConnected(true));
    es.addEventListener('queue', (event) => {
      try {
        const data = JSON.parse((event as MessageEvent).data) as { waiting?: number };
        setWaiting(Math.max(0, Number(data.waiting) || 0));
      } catch {
        // Ignorado.
      }
    });
    es.addEventListener('matched', () => {
      setNotice('¡Rival encontrado!');
      sound.playSFX('gong');
    });
    es.addEventListener('bot', () => {
      setNotice('Nadie respondió: entra un escuadrón bot.');
    });
    es.addEventListener('state', (event) => {
      try {
        const data = JSON.parse((event as MessageEvent).data) as { state: PvpRoomView; seat: 0 | 1 };
        if (!data?.state) return;
        setRoom(data.state);
        setSeat(data.seat ?? 0);
        // Una sala cuyo resultado ya se cobró no vuelve a mostrar la pantalla de premios
        // al recargar: se cae al vestíbulo de los Pozos.
        if (data.state.status === 'finished' && appliedRooms.current.has(data.state.roomId)) {
          setPhase('lobby');
          return;
        }
        setPhase(data.state.status === 'finished' ? 'result' : 'duel');
      } catch {
        // Ignorado.
      }
    });
    es.onerror = () => setConnected(false);
    es.onopen = () => setConnected(true);

    return () => es.close();
  }, [playerId]);

  useEffect(() => {
    let cancelled = false;
    const ping = async () => {
      try {
        const res = await fetch('/api/pvp/status');
        const data = await res.json();
        if (cancelled) return;
        setOnline(Number(data.online) || 0);
        if (phase !== 'duel') setWaiting(Number(data.waiting) || 0);
      } catch {
        if (!cancelled) setOnline(0);
      }
    };
    ping();
    const interval = setInterval(ping, 6000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [phase]);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 2400);
    return () => clearTimeout(timer);
  }, [notice]);

  // Golpes: número flotante + sonido de la carta, igual que en la campaña.
  const lastActionAt = room?.lastAction?.at ?? 0;
  useEffect(() => {
    const action = room?.lastAction;
    if (!action) return;
    if (action.switched || action.kind === 'switch') {
      sound.playSFX('powerup');
      return;
    }
    // Fusionar o reordenar cartas no lanza la habilidad: suena la campanilla de fusión.
    if (action.kind === 'merge') {
      sound.playSFX('celestial');
      return;
    }
    if (action.kind === 'move') {
      sound.playSFX('click');
      return;
    }
    setFx({
      key: action.at,
      seat: action.seat,
      damage: action.damage,
      heal: action.heal,
      crit: action.crit,
      ultimate: action.ultimate,
      skillId: action.skillId,
      tier: action.tier,
      foeFrame: vfxFrameOf(foeSpriteRef.current),
      meFrame: vfxFrameOf(meSpriteRef.current),
    });
    if (action.status?.length) {
      setNotice(`${action.heroName}: ${action.status.join(' · ')}`);
      sound.playSFX('debuff');
    }
    if (action.missed) sound.playSFX('miss');
    if (action.ultimate) sound.playSFX('ultimate');
    else if (action.crit) sound.playSFX('critical');
    else if (action.heal) sound.playSFX('heal');
    else sound.playSFX('attack');
    const timer = setTimeout(() => setFx(null), 1600);
    return () => clearTimeout(timer);
  }, [lastActionAt, room?.lastAction]);

  // Rango: aplica el Elo del servidor una sola vez por sala y paga el ascenso.
  useEffect(() => {
    if (!room || room.status !== 'finished' || !room.roomId) return;
    if (appliedRooms.current.has(room.roomId)) return;
    appliedRooms.current.add(room.roomId);
    saveAppliedRooms(appliedRooms.current);

    const won = room.winnerSeat === seat;
    const delta = room.ratingDelta?.[seat] ?? 0;
    const before = rank.rating;
    const after = Math.max(0, before + delta);
    const tierBefore = rankFor(before).tier;
    const tierAfter = rankFor(after).tier;
    const beforeIndex = PVP_RANKS.findIndex((r) => r.id === tierBefore.id);
    const afterIndex = PVP_RANKS.findIndex((r) => r.id === tierAfter.id);
    const bestIndex = Math.max(0, PVP_RANKS.findIndex((r) => r.id === rank.bestTier));

    setRank((prev) => ({
      rating: after,
      wins: prev.wins + (won ? 1 : 0),
      losses: prev.losses + (won ? 0 : 1),
      // bestTier guarda el techo histórico: bajar de rango no debe volver a pagar la mejora.
      bestTier: PVP_RANKS[Math.max(bestIndex, afterIndex)]?.id ?? tierAfter.id,
    }));

    const isPromotion = afterIndex > beforeIndex && afterIndex > bestIndex;
    addGold(won ? 250 : 60);
    if (isPromotion) {
      addGold(tierAfter.reward);
      setPromotion(tierAfter);
      sound.playSFX('victory');
    } else {
      setPromotion(null);
      sound.playSFX(won ? 'victory' : 'defeat');
    }
  }, [room, seat, rank.rating, rank.bestTier, addGold]);

  const findMatch = async () => {
    if (squadInputs.length === 0) return;
    setBusy(true);
    setNotice(null);
    setPromotion(null);
    const payload: PvpFighterPayload = {
      playerId,
      name: playerName || 'Gladiador',
      rating: rank.rating,
      heroes: squadInputs,
      botPool: [...roster]
        .sort((a, b) => Number(Boolean(heroSpriteId(b.id))) - Number(Boolean(heroSpriteId(a.id))))
        .slice(0, 12)
        .map(heroInput),
    };
    try {
      const res = await fetch('/api/pvp/find', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setNotice(data.message || 'No se pudo entrar en los Pozos.');
        return;
      }
      setPhase('searching');
      setWaiting(Number(data.waiting) || 1);
      sound.playSFX('portal');
    } catch {
      setNotice('No hay conexión con los Pozos.');
    } finally {
      setBusy(false);
    }
  };

  const cancelSearch = async () => {
    sound.playSFX('click');
    setPhase('lobby');
    setWaiting(0);
    try {
      await fetch('/api/pvp/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId }),
      });
    } catch {
      // Ignorado.
    }
  };

  const sendAction = useCallback(
    async (payload: { type: 'card' | 'switch' | 'merge'; uid?: string; targetUid?: string; heroIndex?: number }) => {
      if (busy) return;
      setBusy(true);
      try {
        const res = await fetch('/api/pvp/action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ playerId, ...payload }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          setNotice(data.message || 'Acción rechazada.');
          sound.playSFX('debuff');
        } else if (data.state) {
          setRoom(data.state as PvpRoomView);
        }
      } catch {
        setNotice('Se perdió la conexión con el pozo.');
      } finally {
        setBusy(false);
      }
    },
    [busy, playerId]
  );

  const leaveArena = async () => {
    sound.playSFX('click');
    try {
      await fetch('/api/pvp/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId }),
      });
    } catch {
      // Ignorado.
    }
    setRoom(null);
    setPhase('lobby');
    goBack();
  };

  const rematch = async () => {
    sound.playSFX('click');
    setPromotion(null);
    setRoom(null);
    setPhase('searching');
    try {
      const res = await fetch('/api/pvp/rematch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId }),
      });
      const data = await res.json();
      if (!data.success) {
        setPhase('lobby');
        setNotice(data.message || 'Vuelve a buscar rival.');
      }
    } catch {
      setPhase('lobby');
      setNotice('No hay conexión con los Pozos.');
    }
  };

  const me = room?.fighters.find((f) => f.seat === seat) ?? null;
  const foe = room?.fighters.find((f) => f.seat !== seat) ?? null;
  const myHero: PvpHeroView | null = me ? me.heroes[me.activeIndex] ?? me.heroes[0] ?? null : null;
  const foeHero: PvpHeroView | null = foe ? foe.heroes[foe.activeIndex] ?? foe.heroes[0] ?? null : null;
  // Quien lanzo la ultima carta: su heroe activo decide pose de casteo y VFX.
  const attackerFighter = fx && room ? room.fighters[fx.seat] : null;
  const attackerHero = attackerFighter
    ? attackerFighter.heroes[attackerFighter.activeIndex] ?? attackerFighter.heroes[0] ?? null
    : null;
  const attackerCast = fx?.skillId && attackerHero ? pvpSkillCastSprite(attackerHero.heroId, fx.skillId) : null;
  const myTurn = Boolean(room && room.status === 'playing' && room.turnSeat === seat);
  const turnMsLeft = room && room.deadline ? Math.max(0, room.deadline - now) : 0;
  const turnRatio = room ? Math.min(1, turnMsLeft / (room.turnMs || 25000)) : 0;

  // La carta de definitiva la añade el servidor a la mano al llegar a 5 orbes.
  const hand: PvpCard[] = useMemo(() => myHero?.hand ?? [], [myHero]);

  const fighterArt = (hero: PvpHeroView | null, overrideUrl: string | null, mirrored: boolean) => {
    const url = overrideUrl || hero?.spriteUrl || hero?.portraitUrl || '';
    if (url.includes('/assets/portraits/')) {
      return (
        <img
          src={url}
          alt={hero?.heroName}
          className="h-[176px] w-[118px] object-cover object-top rounded-lg drop-shadow-[0_10px_18px_rgba(0,0,0,0.85)]"
          style={mirrored ? { transform: 'scaleX(-1)' } : undefined}
        />
      );
    }
    return (
      <img
        src={url}
        alt={hero?.heroName}
        className="h-[176px] object-contain drop-shadow-[0_10px_18px_rgba(0,0,0,0.85)]"
        style={mirrored ? { transform: 'scaleX(-1)' } : undefined}
      />
    );
  };

  const arenaRef = useRef<HTMLDivElement | null>(null);
  const meSpriteRef = useRef<HTMLDivElement | null>(null);
  const foeSpriteRef = useRef<HTMLDivElement | null>(null);

  /** Marco del sprite normalizado dentro de la arena, como el que usa la campana. */
  const vfxFrameOf = (el: HTMLElement | null): EnemyVfxFrame => {
    const arena = arenaRef.current;
    if (!el || !arena) return DEFAULT_ENEMY_FRAME;
    const a = arena.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    const w = a.width || 1;
    const h = a.height || 1;
    const cx = (r.left - a.left + r.width / 2) / w;
    return {
      x: cx,
      y: (r.top - a.top + r.height * 0.58) / h,
      headX: cx,
      headY: (r.top - a.top + r.height * 0.22) / h,
      height: r.height / h,
      width: r.width / w,
      left: (r.left - a.left) / w,
      top: (r.top - a.top) / h,
    };
  };

  const mirrorFrame = (frame: EnemyVfxFrame | undefined): EnemyVfxFrame => {
    const f = frame ?? DEFAULT_ENEMY_FRAME;
    return {
      ...f,
      x: 1 - f.x,
      headX: 1 - f.headX,
      left: f.left != null ? 1 - f.left - f.width : undefined,
    };
  };

  // Arrastrar una carta sobre otra: fusiona si son iguales o las intercambia, como en la campana.
  const cardDragRef = useRef<{ uid: string; x: number; y: number; moved: boolean } | null>(null);
  const [dragUid, setDragUid] = useState<string | null>(null);
  const [hoverUid, setHoverUid] = useState<string | null>(null);

  const beginCardDrag = (event: React.PointerEvent<HTMLButtonElement>, card: PvpCard) => {
    if (!myTurn || busy) return;
    cardDragRef.current = { uid: card.uid, x: event.clientX, y: event.clientY, moved: false };
    try {
      event.currentTarget.setPointerCapture?.(event.pointerId);
    } catch {
      // Puntero sintético o ya liberado: el arrastre funciona igual con los eventos del botón.
    }
  };

  const moveCardDrag = (event: React.PointerEvent<HTMLButtonElement>) => {
    const drag = cardDragRef.current;
    if (!drag) return;
    if (!drag.moved) {
      if (Math.hypot(event.clientX - drag.x, event.clientY - drag.y) < 10) return;
      drag.moved = true;
      setDragUid(drag.uid);
    }
    const el = document.elementFromPoint(event.clientX, event.clientY);
    const target = el ? (el.closest('[data-pvp-card]') as HTMLElement | null) : null;
    const uid = target?.getAttribute('data-pvp-card') ?? null;
    setHoverUid(uid && uid !== drag.uid ? uid : null);
  };

  const endCardDrag = (event: React.PointerEvent<HTMLButtonElement>, card: PvpCard) => {
    const drag = cardDragRef.current;
    cardDragRef.current = null;
    const targetUid = hoverUid;
    const moved = drag?.moved ?? false;
    setDragUid(null);
    setHoverUid(null);
    if (!drag) return;

    if (!moved) {
      // Toque simple: juega la carta.
      sound.playSFX('card');
      void sendAction({ type: 'card', uid: card.uid });
      return;
    }
    if (!targetUid || targetUid === card.uid) return;

    const target = hand.find((c) => c.uid === targetUid);
    const merges =
      Boolean(target) && target!.skillId === card.skillId && target!.tier === card.tier && card.tier < 3;
    sound.playSFX(merges ? 'celestial' : 'click');
    void sendAction({ type: 'merge', uid: card.uid, targetUid });
  };

  const cancelCardDrag = () => {
    cardDragRef.current = null;
    setDragUid(null);
    setHoverUid(null);
  };

  const hpPct = (value: number, max: number) =>
    `${Math.max(0, Math.min(100, (value / Math.max(1, max)) * 100))}%`;

  const Orbs: React.FC<{ count: number; enemy?: boolean }> = ({ count, enemy }) => (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: PVP_MAX_ORBS }).map((_, index) => {
        const filled = index < count;
        return (
          <span
            key={index}
            className={`w-3.5 h-3.5 rounded-full transition-all duration-300 ${
              filled
                ? enemy
                  ? 'border border-rose-300 bg-gradient-to-tr from-rose-700 via-red-500 to-rose-300 shadow-[0_0_9px_#ef4444]'
                  : 'border border-yellow-200 bg-gradient-to-tr from-amber-400 via-yellow-300 to-yellow-100 shadow-[0_0_10px_#fde047]'
                : enemy
                ? 'border border-red-900/40 bg-black/55 shadow-[inset_0_2px_4px_rgba(0,0,0,0.95)]'
                : 'border border-yellow-600/40 bg-black/55 shadow-[inset_0_2px_4px_rgba(0,0,0,0.95)]'
            } ${filled && count >= PVP_MAX_ORBS ? 'scale-110 animate-pulse' : ''}`}
          />
        );
      })}
    </div>
  );

  const cardArtFor = (card: PvpCard): string | null => {
    if (card.skillId === PVP_ULTIMATE_SKILL_ID) return pvpUltimateArt(myHero?.heroId ?? 'magordito');
    return pvpCardArt(card.skillId, card.tier);
  };

  // ---- El duelo se juega en la vista real de la campaña (misma UI, mismas reglas) ----
  const [foeArt, setFoeArt] = useState<{ sprite: string; attack: string; thumb: string }>({
    sprite: '',
    attack: '',
    thumb: '',
  });

  useEffect(() => {
    const sprite = foeHero?.spriteUrl || foeHero?.portraitUrl || '';
    const attack = foeHero?.attackSpriteUrl || '';
    const thumb = foeHero?.portraitUrl || sprite;
    let alive = true;
    Promise.all([mirrorTexture(sprite), mirrorTexture(attack), mirrorTexture(thumb)]).then(([s, a, t]) => {
      if (!alive) return;
      setFoeArt({ sprite: s || sprite, attack: a || s, thumb: t || s });
    });
    return () => {
      alive = false;
    };
  }, [foeHero?.spriteUrl, foeHero?.attackSpriteUrl, foeHero?.portraitUrl]);

  const pvpBridge: PvpCombatBridge | null =
    room && me && foe
      ? {
          heroHp: me.hp,
          heroMaxHp: me.maxHp,
          orbs: me.orbs,
          activeHeroId: myHero?.heroId ?? '',
          hand: hand.map((card) => ({ uid: card.uid, skillId: card.skillId, tier: card.tier, name: card.name })),
          myStatuses: (me.statuses ?? []).map((status) => ({
            kind: status.kind,
            label: status.label,
            icon: status.icon,
            turns: status.turns,
            stacks: status.stacks,
            hostile: status.hostile,
          })),
          foe: {
            name: foe.name,
            title: foe.isBot ? 'Rival de los Pozos' : 'Gladiador',
            hp: foe.hp,
            maxHp: foe.maxHp,
            spriteUrl: foeArt.sprite || foeHero?.spriteUrl || '',
            attackSpriteUrl: foeArt.attack || foeHero?.attackSpriteUrl,
            hurtSpriteUrl: foeArt.attack || foeHero?.attackSpriteUrl,
            thumbUrl: foeArt.thumb || foeHero?.portraitUrl || '',
            statuses: (foe.statuses ?? []).map((status) => ({
              kind: status.kind,
              label: status.label,
              icon: status.icon,
              turns: status.turns,
              stacks: status.stacks,
              hostile: status.hostile,
            })),
          },
          myTurn,
          seat,
          lastAction: room.lastAction
            ? {
                at: room.lastAction.at,
                seat: room.lastAction.seat,
                kind: room.lastAction.kind,
                skillId: room.lastAction.skillId,
                tier: room.lastAction.tier,
                damage: room.lastAction.damage,
                heal: room.lastAction.heal,
                crit: room.lastAction.crit,
                missed: room.lastAction.missed,
              }
            : null,
          onPlayCard: (uid) => {
            void sendAction({ type: 'card', uid });
          },
          onMergeCards: (uid, targetUid) => {
            void sendAction({ type: 'merge', uid, targetUid });
          },
          onSwitchHero: (heroId) => {
            const index = me.heroes.findIndex((hero) => hero.heroId === heroId);
            if (index < 0) {
              setNotice('Ese héroe no está en tu escuadrón de los Pozos.');
              return;
            }
            void sendAction({ type: 'switch', heroIndex: index });
          },
          onBlockedAction: (reason) => setNotice(reason),
        }
      : null;

  if (phase === 'duel' && room && pvpBridge) {
    return (
      <div className="relative flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden bg-black select-none">
        <CombatView pvp={pvpBridge} />
        {notice && (
          <div className="pointer-events-none absolute left-1/2 top-14 z-[90] -translate-x-1/2 rounded-md border border-amber-400/70 bg-black/90 px-3 py-1.5 text-[10px] font-black text-amber-200 shadow-xl">
            {notice}
          </div>
        )}
        {!myTurn && room.status === 'playing' && (
          <div className="pointer-events-none absolute bottom-[152px] left-1/2 z-[70] -translate-x-1/2 rounded bg-black/70 px-2 py-0.5 text-[10px] font-bold text-white/85">
            Turno de {foe?.name}…
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex-1 flex flex-col overflow-hidden select-none bg-[#290a03] font-sans">
      {phase !== 'duel' && (
        <>
          <img
            src="/assets/backgrounds/coliseo_onirico_bg.webp"
            alt="Pozos de Pelea"
            className="absolute inset-0 w-full h-full object-cover opacity-70 pointer-events-none"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/35 to-black/85 pointer-events-none" />
        </>
      )}

      <div className={`relative z-30 items-center justify-between px-2.5 pt-1.5 ${phase === 'duel' ? 'hidden' : 'flex'}`}>
        <button
          onClick={leaveArena}
          className="h-7 px-2 rounded-md border border-amber-700/80 bg-[#2a120a]/90 text-amber-200 text-[10px] font-black tracking-wide cursor-pointer hover:bg-[#3a180c]"
        >
          ← SALIR
        </button>
        <div className="text-center">
          <div className="text-[11px] font-serif font-black text-amber-200 tracking-[0.18em]">POZOS DE PELEA</div>
          <div className="text-[7.5px] text-stone-400 font-bold uppercase tracking-widest">Coliseo · Duelos 1v1</div>
        </div>
        <div className="w-14 text-right">
          <span className={`text-[8px] font-bold ${connected ? 'text-emerald-300' : 'text-rose-300'}`}>
            {connected ? `● ${online}` : '● sin conexión'}
          </span>
        </div>
      </div>

      {notice && (
        <div className="relative z-30 mx-auto mt-1 px-3 py-1 rounded-lg bg-black/85 border border-amber-500/70 text-amber-200 text-[10px] font-bold shadow-xl">
          {notice}
        </div>
      )}

      {(phase === 'lobby' || phase === 'searching') && (
        <div className="relative z-10 flex-1 flex flex-col justify-center px-3 gap-2 overflow-y-auto">
          {/* Rango */}
          <div className="rounded-2xl border-2 border-amber-800/70 bg-[#1b0d07]/85 p-2.5 shadow-2xl">
            <div className="flex items-center gap-2">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg border-2 shrink-0"
                style={{ borderColor: rankInfo.tier.color, background: `${rankInfo.tier.color}22` }}
              >
                {rankInfo.tier.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[12px] font-black" style={{ color: rankInfo.tier.color }}>
                    {rankInfo.tier.name}
                  </span>
                  <span className="text-[9px] font-bold text-stone-400">{rank.rating} pts</span>
                  <span className="ml-auto text-[8px] font-bold text-stone-400">
                    {rank.wins}V · {rank.losses}D
                  </span>
                </div>
                <div className="h-1.5 mt-1 rounded-full bg-stone-900 border border-black/60 overflow-hidden">
                  <div
                    className="h-full transition-all duration-500"
                    style={{ width: `${rankInfo.progress * 100}%`, background: rankInfo.tier.color }}
                  />
                </div>
                <div className="text-[7.5px] text-stone-400 font-bold mt-0.5">
                  {rankInfo.next
                    ? `${rankInfo.next.name} a ${rankInfo.next.min - rank.rating} pts · recompensa ${rankInfo.next.reward} oro`
                    : 'Rango máximo alcanzado'}
                </div>
              </div>
            </div>
          </div>

          {/* Escuadrón */}
          <div className="rounded-2xl border border-amber-800/60 bg-[#1b0d07]/80 p-2.5">
            <div className="flex items-center justify-between">
              <div className="text-[9px] uppercase tracking-widest text-amber-400/90 font-black">
                Tu escuadrón
              </div>
              <span className="px-1.5 py-0.5 rounded bg-rose-950/70 border border-rose-700/60 text-rose-200 text-[8px] font-bold">
                ♥ 2000
              </span>
            </div>

            <div className="flex items-center gap-1.5 mt-1.5">
              {squadHeroes.map((hero) => (
                <div key={hero.id} className="flex flex-col items-center w-[52px]">
                  <div className="w-[52px] h-[52px] rounded-lg border border-amber-700/60 bg-black/50 flex items-end justify-center overflow-hidden">
                    <img
                      src={heroIdleSprite(hero.id)}
                      alt={hero.name}
                      onError={(event) => {
                        if (event.currentTarget.src !== hero.portrait) event.currentTarget.src = hero.portrait;
                      }}
                      className="h-[50px] object-contain"
                    />
                  </div>
                  <span className="text-[7px] font-bold text-stone-300 truncate w-full text-center">
                    {hero.name.split(' ')[0]}
                  </span>
                </div>
              ))}
              <div className="text-[7.5px] text-stone-400 leading-tight flex-1">
                {playerName || 'Gladiador'} · {squadHeroes.length}/3 héroes
                <br />
                Cada héroe lleva sus cartas de la campaña.
              </div>
            </div>

            {phase === 'lobby' && (
              <div className="flex gap-1 mt-1.5 overflow-x-auto pb-1">
                {roster.slice(0, 10).map((hero) => {
                  const active = squadHeroes.some((h) => h.id === hero.id);
                  return (
                    <button
                      key={hero.id}
                      onClick={() => toggleSquad(hero.id)}
                      className={`shrink-0 relative w-9 h-9 rounded-lg border-2 overflow-hidden cursor-pointer transition-transform hover:scale-105 ${
                        active ? 'border-amber-400' : 'border-stone-700/70 opacity-65'
                      }`}
                      title={`${hero.name} · nivel ${hero.level}`}
                    >
                      <img src={hero.portrait} alt={hero.name} className="w-full h-full object-cover" />
                      {active && (
                        <span className="absolute bottom-0 right-0 text-[7px] bg-amber-500 text-black font-black px-0.5">
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="mt-1.5 space-y-1">
              <div className="text-[8px] uppercase tracking-widest text-stone-500 font-black">
                Manos del escuadrón
              </div>
              {squadHeroes.map((hero) => (
                <div key={hero.id} className="flex items-center gap-1">
                  <span className="text-[7px] font-black text-stone-400 w-[44px] truncate">
                    {hero.name.split(' ')[0]}
                  </span>
                  <div className="flex gap-1 flex-1 overflow-hidden">
                    {pvpCardsForHero(hero.id)
                      .filter((card) => card.tier === 1)
                      .map((card) => (
                        <span
                          key={card.skillId}
                          className="px-1 py-0.5 rounded border border-amber-500/50 bg-gradient-to-b from-amber-700/40 to-[#2a1206] text-[6.5px] font-bold text-amber-100 truncate"
                        >
                          {card.name}
                        </span>
                      ))}
                  </div>
                </div>
              ))}
              <div className="text-[7px] text-stone-500 font-bold leading-tight">
                Mismo combate que en la historia: 4 cartas en mano, 5 orbes y definitiva.
              </div>
            </div>
          </div>

          {phase === 'lobby' ? (
            <button
              onClick={findMatch}
              disabled={busy || squadHeroes.length === 0}
              className="w-full py-2.5 rounded-xl border-2 border-amber-400 bg-gradient-to-b from-amber-500 to-amber-800 text-[#1a0b03] font-black tracking-wide text-sm shadow-2xl cursor-pointer disabled:opacity-50 hover:brightness-110 active:scale-[0.99]"
            >
              ⚔️ BUSCAR RIVAL
            </button>
          ) : (
            <div className="flex flex-col items-center gap-1.5">
              <div className="relative w-14 h-14">
                <div className="absolute inset-0 rounded-full border-4 border-amber-500/70 animate-ping" />
                <div className="absolute inset-0 rounded-full border-4 border-amber-300/90 flex items-center justify-center text-xl">
                  ⚔️
                </div>
              </div>
              <div className="text-[11px] font-black text-amber-200 animate-pulse">Buscando rival en los Pozos…</div>
              <div className="text-[8.5px] text-stone-400 font-bold text-center px-3">
                {waiting > 1
                  ? `${waiting} gladiadores en la cola`
                  : 'Si no aparece nadie en unos segundos, entra un escuadrón bot'}
              </div>
              <button
                onClick={cancelSearch}
                className="mt-0.5 px-3 py-1 rounded-lg border border-stone-600 bg-black/60 text-stone-300 text-[10px] font-bold cursor-pointer hover:text-white"
              >
                Cancelar
              </button>
            </div>
          )}

          <div className="text-[7.5px] leading-snug text-stone-500 text-center px-2">
            Ganas 250 de oro por victoria (60 por derrota) y tu rango sube o baja según el Elo.
            Al cambiar de rango recibes la recompensa del tramo.
          </div>
        </div>
      )}

      {phase === 'duel' && room && me && foe && (
        <div className="relative z-10 flex-1 flex flex-col min-h-0">
          <img
            src="/assets/backgrounds/icespear_combate_guardias.webp"
            alt="Arena del coliseo"
            className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40 pointer-events-none" />
          {/* Cabecera del rival: barra roja, orbes y retrato, igual que la barra del jefe */}
          <div
            className="relative z-20 w-[calc(100%+36px)] -mx-[18px] min-h-[58px] py-2 px-5 flex flex-col justify-center shadow-lg shrink-0 overflow-visible"
            style={{
              backgroundImage: 'url(/assets/aistudio/image_b8a81806.webp)',
              backgroundSize: '112% 115%',
              backgroundPosition: 'center',
              backgroundColor: '#380f05',
            }}
          >
            <div className="w-full flex items-center justify-between">
              <div className="relative flex-1 flex flex-col justify-center mr-3 gap-1 z-20">
                <div className="flex items-center justify-between px-1">
                  <Orbs count={foe.orbs} enemy />
                  <div className="flex items-center gap-1 min-w-0">
                    {foe.isBot ? (
                      <span className="text-[7px] font-black px-1 rounded bg-fuchsia-900/80 border border-fuchsia-500/60 text-fuchsia-200">
                        BOT
                      </span>
                    ) : (
                      <span className="text-[7px] font-bold text-stone-300">R{foe.rating}</span>
                    )}
                    <span className="text-[9px] font-black text-rose-100 truncate max-w-[92px]">{foe.name}</span>
                  </div>
                </div>

                <div className="relative w-full h-[28px] rounded-sm overflow-hidden flex items-center">
                  <div className="absolute inset-y-[8%] inset-x-[2.9%] rounded-xs overflow-hidden flex items-center bg-[#1e0305] shadow-[inset_0_2px_5px_rgba(0,0,0,0.9)]">
                    <div
                      style={{
                        width: hpPct(foe.hp, foe.maxHp),
                        boxShadow: '0 0 18px #ff0033, inset 0 2px 4px rgba(255,255,255,0.7)',
                      }}
                      className="h-full bg-gradient-to-r from-[#ff0033] via-[#ff1447] to-[#ff0022] transition-all duration-300 filter brightness-110 saturate-200 relative overflow-hidden"
                    >
                      <div className="absolute top-0 left-0 right-0 h-[45%] bg-gradient-to-b from-white/45 to-transparent pointer-events-none" />
                    </div>
                  </div>
                  <img
                    src="/assets/aistudio/image_fee54ee0.webp"
                    alt=""
                    className="absolute inset-0 w-full h-full object-fill pointer-events-none z-10"
                    onError={(event) => {
                      event.currentTarget.style.display = 'none';
                    }}
                  />
                  <span className="absolute inset-0 z-20 flex items-center justify-center text-[8.5px] font-mono font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                    {foe.hp} / {foe.maxHp}
                  </span>
                </div>
              </div>

              <div className="relative w-[54px] h-[54px] shrink-0 rounded-lg overflow-hidden border border-amber-600/60 bg-black/60 flex items-center justify-center pointer-events-none z-30 shadow-[0_4px_10px_rgba(0,0,0,0.9)]">
                <img
                  src={foeHero?.portraitUrl || foeHero?.spriteUrl}
                  alt={foeHero?.heroName}
                  className="w-full h-full object-cover object-top"
                />
              </div>
            </div>
          </div>

          {/* Arena */}
          <div
            ref={arenaRef}
            className="relative w-full flex-1 min-h-[220px] flex items-center justify-center overflow-hidden"
          >
            {/* Rival */}
            <div className="absolute right-[14%] bottom-[15%] flex flex-col items-center z-10">
              <div className="relative">
                {foe.statuses.length > 0 && (
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex items-center gap-0.5 z-20 pointer-events-none drop-shadow-[0_2px_3px_rgba(0,0,0,0.9)]">
                    {foe.statuses.slice(0, 4).map((status) => (
                      <span
                        key={status.id}
                        title={`${status.label} · ${status.turns} turno(s)${status.stacks > 1 ? ` x${status.stacks}` : ''}`}
                        className={`relative w-[19px] h-[19px] rounded-full border flex items-center justify-center text-[10px] bg-black/75 ${
                          status.hostile ? 'border-rose-400/90' : 'border-emerald-400/90'
                        }`}
                      >
                        {status.icon}
                        <span className="absolute -bottom-1.5 -right-1 px-[2px] rounded bg-black/90 text-[7px] font-black text-white leading-none">
                          {status.turns}
                        </span>
                      </span>
                    ))}
                  </div>
                )}
                {fx && fx.seat === seat && fx.damage ? (
                  <span
                    key={`dmg-foe-${fx.key}`}
                    className={`absolute -top-6 left-1/2 font-black drop-shadow animate-[pvpFloat_1.2s_ease-out_forwards] ${
                      fx.crit || fx.ultimate ? 'text-amber-300 text-xl' : 'text-rose-300 text-lg'
                    }`}
                  >
                    -{fx.damage}
                  </span>
                ) : null}
                <div
                  key={`foe-${fx && fx.seat !== seat ? fx.key : 'idle'}`}
                  ref={foeSpriteRef}
                  className={fx && fx.seat !== seat ? 'pvp-attack-left' : undefined}
                >
                  {fighterArt(
                    foeHero,
                    fx && fx.seat !== seat ? attackerCast ?? foeHero?.attackSpriteUrl ?? null : null,
                    true
                  )}
                </div>
              </div>
            </div>

            {/* Héroe propio */}
            <div className="absolute left-[8%] bottom-3 flex flex-col items-center z-10">
              <div className="relative">
                {me.statuses.length > 0 && (
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex items-center gap-0.5 z-20 pointer-events-none drop-shadow-[0_2px_3px_rgba(0,0,0,0.9)]">
                    {me.statuses.slice(0, 4).map((status) => (
                      <span
                        key={status.id}
                        title={`${status.label} · ${status.turns} turno(s)${status.stacks > 1 ? ` x${status.stacks}` : ''}`}
                        className={`relative w-[19px] h-[19px] rounded-full border flex items-center justify-center text-[10px] bg-black/75 ${
                          status.hostile ? 'border-rose-400/90' : 'border-emerald-400/90'
                        }`}
                      >
                        {status.icon}
                        <span className="absolute -bottom-1.5 -right-1 px-[2px] rounded bg-black/90 text-[7px] font-black text-white leading-none">
                          {status.turns}
                        </span>
                      </span>
                    ))}
                  </div>
                )}
                {fx && fx.seat !== seat && fx.damage ? (
                  <span
                    key={`dmg-me-${fx.key}`}
                    className={`absolute -top-6 left-1/2 font-black drop-shadow animate-[pvpFloat_1.2s_ease-out_forwards] ${
                      fx.crit || fx.ultimate ? 'text-amber-300 text-xl' : 'text-rose-400 text-lg'
                    }`}
                  >
                    -{fx.damage}
                  </span>
                ) : null}
                {fx && fx.seat === seat && fx.heal ? (
                  <span
                    key={`heal-me-${fx.key}`}
                    className="absolute -top-6 left-1/2 text-emerald-300 font-black text-lg drop-shadow animate-[pvpFloat_1.2s_ease-out_forwards]"
                  >
                    +{fx.heal}
                  </span>
                ) : null}
                <div
                  key={`my-${fx && fx.seat === seat ? fx.key : 'idle'}`}
                  ref={meSpriteRef}
                  className={fx && fx.seat === seat ? 'pvp-attack-right' : undefined}
                >
                  {fighterArt(
                    myHero,
                    fx && fx.seat === seat ? attackerCast ?? myHero?.attackSpriteUrl ?? null : null,
                    false
                  )}
                </div>
              </div>
            </div>

            {fx && fx.skillId && attackerHero && (
              <div
                className="absolute inset-0 pointer-events-none z-30"
                style={fx.seat === seat ? undefined : { transform: 'scaleX(-1)' }}
              >
                {skillVfxOverlay(attackerHero.heroId, {
                  skillType: fx.skillId,
                  tier: fx.tier ?? 1,
                  vfxKey: fx.key,
                  enemyFrame: fx.seat === seat ? fx.foeFrame : mirrorFrame(fx.meFrame),
                })}
              </div>
            )}

            {!myTurn && (
              <div className="absolute left-1/2 -translate-x-1/2 bottom-1 w-[52%] pointer-events-none">
                <div className="h-1 rounded-full bg-black/70 overflow-hidden">
                  <div
                    className="h-full bg-stone-300/80 transition-all duration-200"
                    style={{ width: `${turnRatio * 100}%` }}
                  />
                </div>
                <div className="text-center text-[8px] font-black text-white/90 mt-0.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)]">
                  Turno de {foe.name}…
                </div>
              </div>
            )}
          </div>

          {/* Placa del héroe: selector de la partida + orbes + barra verde */}
          <div
            className="relative z-20 w-full min-h-[82px] py-1.5 px-4 flex items-center justify-between shrink-0"
            style={{
              backgroundImage: 'url(/assets/aistudio/image_6c93ccdc.webp)',
              backgroundSize: '105% 105%',
              backgroundPosition: 'center',
              backgroundColor: '#0a101d',
            }}
          >
            {/* Selector de héroes de la partida */}
            <div className="absolute -top-7 right-8 flex items-center gap-1.5 z-40">
              {me.heroes.map((hero, index) => {
                const isActive = index === me.activeIndex;
                const canSwitch = myTurn && !busy && !me.swapped && !isActive;
                return (
                  <button
                    key={hero.heroId}
                    onClick={() => {
                      if (!canSwitch) return;
                      sound.playSFX('powerup');
                      void sendAction({ type: 'switch', heroIndex: index });
                    }}
                    disabled={!canSwitch}
                    title={canSwitch ? `Cambiar a ${hero.heroName}` : hero.heroName}
                    className={`relative w-6 h-6 rounded-full overflow-hidden border-2 transition-all ${
                      isActive
                        ? 'border-yellow-400 scale-110 shadow-[0_0_8px_#facc15]'
                        : canSwitch
                        ? 'border-stone-600 opacity-60 hover:opacity-100 hover:scale-110 cursor-pointer'
                        : 'border-stone-700/60 opacity-50'
                    }`}
                  >
                    <img src={hero.portraitUrl} alt={hero.heroName} className="w-full h-full object-cover" />
                  </button>
                );
              })}
            </div>

            <div className="relative w-[54px] h-[54px] shrink-0 z-30 pointer-events-none">
              <div className="absolute inset-0 rounded-lg overflow-hidden border-2 border-[#1d4e74] bg-[#06131d] shadow-[0_0_10px_rgba(56,189,248,0.35),0_4px_10px_rgba(0,0,0,0.85),inset_0_0_12px_rgba(0,0,0,0.9)]">
                <img
                  src={myHero?.portraitUrl}
                  alt={myHero?.heroName}
                  className="w-full h-full object-cover object-top ring-1 ring-inset ring-sky-200/25"
                />
              </div>
            </div>

            <div className="relative flex-1 flex flex-col justify-center ml-2 mr-1 gap-1 z-20">
              <div className="flex items-center justify-between px-1">
                <Orbs count={me.orbs} />
                <span className="text-[8px] font-black text-emerald-200 truncate max-w-[46%]">{me.name}</span>
              </div>

              <div className="relative w-full h-[26px] rounded-sm overflow-hidden flex items-center">
                <div className="absolute inset-y-[8%] inset-x-[2.9%] rounded-xs overflow-hidden flex items-center bg-[#031c07] shadow-[inset_0_2px_5px_rgba(0,0,0,0.9)]">
                  <div
                    style={{
                      width: hpPct(me.hp, me.maxHp),
                      boxShadow: '0 0 18px #00ff44, inset 0 2px 4px rgba(255,255,255,0.7)',
                    }}
                    className="h-full bg-gradient-to-r from-[#00ff44] via-[#24ff5b] to-[#00eb38] transition-all duration-300 filter brightness-110 saturate-200 relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 right-0 h-[45%] bg-gradient-to-b from-white/45 to-transparent pointer-events-none" />
                  </div>
                </div>
                <img
                  src="/assets/aistudio/image_7a62ba8b.webp"
                  alt=""
                  className="absolute inset-0 w-full h-full object-fill pointer-events-none z-10"
                  onError={(event) => {
                    event.currentTarget.style.display = 'none';
                  }}
                />
                <span className="absolute inset-0 z-20 flex items-center justify-center text-[8.5px] font-mono font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                  {me.hp} / {me.maxHp}
                </span>
              </div>
            </div>
          </div>

          {/* Panel de cartas, igual que en las misiones */}
          <div
            className="relative z-20 w-[calc(100%+36px)] -mx-[18px] flex flex-col items-center justify-between pt-2.5 pb-2 px-4 shadow-2xl overflow-hidden shrink-0"
            style={{
              backgroundImage: 'url(/assets/aistudio/image_b8a81806.webp)',
              backgroundSize: '112% 115%',
              backgroundPosition: 'center',
              backgroundColor: '#380f05',
            }}
          >
            <div className="relative w-full flex items-center justify-center gap-2 mb-2 min-h-[128px]">
              {hand.length === 0 && (
                <span className="text-[9px] font-bold text-stone-400">Sin cartas en la mano…</span>
              )}
              {hand.map((card) => {
                const isUltimate = card.skillId === PVP_ULTIMATE_SKILL_ID;
                const playable = myTurn && !busy && (!isUltimate || (me.orbs ?? 0) >= PVP_MAX_ORBS);
                const art = cardArtFor(card);
                return (
                  <button
                    key={card.uid}
                    data-pvp-card={card.uid}
                    onPointerDown={(event) => beginCardDrag(event, card)}
                    onPointerMove={moveCardDrag}
                    onPointerUp={(event) => endCardDrag(event, card)}
                    onPointerCancel={cancelCardDrag}
                    onContextMenu={(event) => event.preventDefault()}
                    disabled={!playable}
                    title={`${card.name} · nivel ${card.tier}`}
                    style={{ touchAction: 'none' }}
                    className={`relative ${hand.length >= 5 ? 'w-[66px]' : 'w-[78px]'} aspect-[3/4.4] shrink-0 rounded-lg overflow-visible flex flex-col items-center justify-center transition-all ${
                      playable ? 'cursor-pointer hover:scale-105 active:scale-95' : 'opacity-55 grayscale cursor-not-allowed'
                    } ${
                      hoverUid === card.uid && dragUid && dragUid !== card.uid
                        ? 'ring-2 ring-amber-300 ring-offset-2 ring-offset-[#380f05] scale-105'
                        : ''
                    } ${dragUid === card.uid ? 'opacity-40' : ''} ${
                      isUltimate ? 'animate-[celestialCardPulse_2s_ease-in-out_infinite]' : ''
                    }`}
                  >
                    {isUltimate && (
                      <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-300 to-amber-600 opacity-80 blur-xs animate-pulse pointer-events-none z-0" />
                    )}
                    <div className="relative w-full h-full flex flex-col items-center justify-center select-none pointer-events-none rounded-lg overflow-visible z-10">
                      {art ? (
                        <img
                          src={art}
                          alt={card.name}
                          draggable={false}
                          className={`w-full h-full object-contain pointer-events-none select-none ${
                            isUltimate
                              ? 'drop-shadow-[0_0_20px_#f59e0b] drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]'
                              : 'drop-shadow-[0_4px_8px_rgba(0,0,0,0.35)]'
                          }`}
                        />
                      ) : (
                        <div className="w-full h-full rounded-lg border-2 border-amber-500/70 bg-gradient-to-b from-amber-700/60 to-[#2a1206] flex flex-col items-center justify-center px-1">
                          <span className="text-[16px]">⚔️</span>
                          <span className="text-[7px] font-black text-amber-100 text-center leading-tight">
                            {card.name}
                          </span>
                          <span className="text-[6px] font-bold text-amber-300">nivel {card.tier}</span>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="w-full max-w-[420px] grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  sound.playSFX('click');
                  setNotice('En los Pozos no hay objetos: solo tus cartas.');
                }}
                className="h-[44px] px-3 bg-gradient-to-b from-[#e44901] via-[#c64400] to-[#9d3d01] hover:brightness-110 active:brightness-95 border-[2px] border-[#ff6900] text-white font-black text-[12px] uppercase tracking-wider rounded-[8px] shadow-[inset_0_1px_2px_rgba(255,255,255,0.4),0_3px_6px_rgba(0,0,0,0.7)] cursor-pointer transition-all active:scale-[0.98] flex items-center justify-center"
              >
                INVENTARIO
              </button>
              <button
                type="button"
                onClick={() => {
                  sound.playSFX('click');
                  void leaveArena();
                }}
                className="h-[44px] px-3 bg-gradient-to-b from-[#e44901] via-[#c64400] to-[#9d3d01] hover:brightness-110 active:brightness-95 border-[2px] border-[#ff6900] text-white font-black text-[12px] uppercase tracking-wider rounded-[8px] shadow-[inset_0_1px_2px_rgba(255,255,255,0.4),0_3px_6px_rgba(0,0,0,0.7)] cursor-pointer transition-all active:scale-[0.98] flex items-center justify-center"
              >
                HUIR
              </button>
            </div>
          </div>
        </div>
      )}

      {phase === 'result' && room && (
        <div className="relative z-20 flex-1 flex flex-col items-center justify-center gap-1.5 px-5 animate-[dossierIn_0.22s_ease-out]">
          <div
            className={`text-3xl font-serif font-black tracking-wider ${
              room.winnerSeat === seat ? 'text-amber-300 drop-shadow-[0_0_22px_rgba(251,191,36,0.7)]' : 'text-rose-400'
            }`}
          >
            {room.winnerSeat === seat ? '¡VICTORIA!' : 'DERROTA'}
          </div>
          <div className="text-[10px] text-stone-300 text-center max-w-[88%] leading-snug">{room.reason}</div>

          <div className="flex items-center gap-3 text-[10px] font-black">
            <span className="text-amber-200">+{room.winnerSeat === seat ? 250 : 60} oro</span>
            <span className={room.ratingDelta?.[seat] >= 0 ? 'text-emerald-300' : 'text-rose-300'}>
              {room.ratingDelta?.[seat] >= 0 ? '+' : ''}
              {room.ratingDelta?.[seat] ?? 0} pts
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-lg" style={{ color: rankInfo.tier.color }}>
              {rankInfo.tier.icon}
            </span>
            <span className="text-[11px] font-black" style={{ color: rankInfo.tier.color }}>
              {rankInfo.tier.name}
            </span>
            <span className="text-[9px] font-bold text-stone-400">{rank.rating} pts</span>
          </div>

          {promotion && (
            <div className="px-2.5 py-1 rounded-lg border-2 border-amber-400 bg-amber-500/20 text-amber-200 text-[10px] font-black text-center animate-pulse">
              ¡Nuevo rango {promotion.name}! +{promotion.reward} oro de recompensa
            </div>
          )}

          <div className="flex gap-2 mt-1.5">
            <button
              onClick={rematch}
              className="px-4 py-2 rounded-xl border-2 border-amber-400 bg-gradient-to-b from-amber-500 to-amber-800 text-[#1a0b03] font-black text-xs cursor-pointer hover:brightness-110"
            >
              REVANCHA
            </button>
            <button
              onClick={leaveArena}
              className="px-4 py-2 rounded-xl border border-stone-600 bg-black/70 text-stone-200 font-black text-xs cursor-pointer hover:text-white"
            >
              SALIR
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pvpFloat {
          0% { transform: translate(-50%, 6px) scale(0.8); opacity: 0; }
          25% { transform: translate(-50%, -6px) scale(1.15); opacity: 1; }
          100% { transform: translate(-50%, -30px) scale(1); opacity: 0; }
        }
        @keyframes celestialCardPulse {
          0%, 100% { transform: scale(1); filter: drop-shadow(0 0 10px #f59e0b); }
          50% { transform: scale(1.04); filter: drop-shadow(0 0 18px #f59e0b) drop-shadow(0 0 28px #fbbf24); }
        }
      `}</style>
    </div>
  );
};

export default PitArenaView;
