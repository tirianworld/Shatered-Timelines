import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useGame } from '../context/GameContext';
import { sound } from '../services/soundService';
import { launchConfetti } from '../utils/confetti';
import { getHeroLuck, getDrinkingDifficultyFromLuck } from '../utils/heroLuck';
import { ArrowLeft, Volume2, VolumeX, RotateCcw, Trophy, Star, Hammer, ShieldAlert } from 'lucide-react';

type BreachPhase = 'COUNTDOWN' | 'PLAYING' | 'FINISHED';
type CheckOutcome = 'idle' | 'hit' | 'miss';

interface SkillCheckWheel {
  id: number;
  zoneStartDeg: number;
  zoneSizeDeg: number;
  startAngleDeg: number;
  progressDeg: number;
}

const BREACH_DURATION_MS = 20_000;
const FEEDBACK_PAUSE_MS = 140;
const COUNTDOWN_SEQUENCE: Array<{ label: string; sub: string; durationMs: number }> = [
  { label: '3', sub: 'Afianza la palanca en el marco', durationMs: 800 },
  { label: '2', sub: 'Siente el cerrojo congelado', durationMs: 800 },
  { label: '1', sub: '¡Toma impulso!', durationMs: 800 },
  { label: '¡FUERZA!', sub: '¡Pulsa la pantalla en la zona iluminada!', durationMs: 650 },
];

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
}

function normalizeDeg(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

function isAngleInZone(angleDeg: number, zoneStartDeg: number, zoneSizeDeg: number): boolean {
  const a = normalizeDeg(angleDeg);
  const start = normalizeDeg(zoneStartDeg);
  const end = start + zoneSizeDeg;
  if (end <= 360) {
    return a >= start && a <= end;
  }
  return a >= start || a <= end - 360;
}

export const DoorBreachView: React.FC = () => {
  const {
    heroes,
    team,
    soloMissionHeroId,
    completeQuestMission,
    isMissionCompleted,
    addGold,
    addCrystals,
    addShelfItem,
    navigateTo,
    setActiveQuestChapter,
    setPendingMissionLaunch,
    setSelectedCombatMissionId,
  } = useGame();

  const selectedHero = useMemo(() => {
    if (soloMissionHeroId) {
      const found = heroes.find((h) => h.id === soloMissionHeroId);
      if (found) return found;
    }
    const firstTeamId = team.find((id): id is string => Boolean(id));
    if (firstTeamId) {
      const found = heroes.find((h) => h.id === firstTeamId);
      if (found) return found;
    }
    return heroes[0] ?? null;
  }, [heroes, soloMissionHeroId, team]);

  const heroLuck = useMemo(() => getHeroLuck(selectedHero), [selectedHero]);
  const difficulty = useMemo(() => getDrinkingDifficultyFromLuck(heroLuck), [heroLuck]);

  const [phase, setPhase] = useState<BreachPhase>('COUNTDOWN');
  const [countdownStep, setCountdownStep] = useState<number>(0);
  const [timeLeftMs, setTimeLeftMs] = useState<number>(BREACH_DURATION_MS);
  const [score, setScore] = useState<number>(0);
  const [attempts, setAttempts] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [outcome, setOutcome] = useState<CheckOutcome>('idle');
  const [feedbackText, setFeedbackText] = useState<string>('');
  const [doorShake, setDoorShake] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(() => sound.getIsMuted());
  const [grantedTrophyReward, setGrantedTrophyReward] = useState<boolean>(false);
  const [earnedGold, setEarnedGold] = useState<number>(0);
  const [earnedCrystals, setEarnedCrystals] = useState<number>(0);

  const createWheel = useCallback(
    (id: number): SkillCheckWheel => {
      const startAngleDeg = Math.floor(Math.random() * 360);
      const offsetAhead = 48 + Math.random() * 77;
      const zoneStartDeg = normalizeDeg(startAngleDeg + offsetAhead);
      return {
        id,
        zoneStartDeg,
        zoneSizeDeg: difficulty.zoneDegrees,
        startAngleDeg,
        progressDeg: 0,
      };
    },
    [difficulty.zoneDegrees]
  );

  const [wheel, setWheel] = useState<SkillCheckWheel>(() => createWheel(1));

  const phaseRef = useRef<BreachPhase>(phase);
  phaseRef.current = phase;
  const wheelRef = useRef<SkillCheckWheel>(wheel);
  wheelRef.current = wheel;
  const outcomeRef = useRef<CheckOutcome>(outcome);
  outcomeRef.current = outcome;
  const scoreRef = useRef<number>(score);
  scoreRef.current = score;
  const remainingMsRef = useRef<number>(BREACH_DURATION_MS);
  const pauseTimeoutRef = useRef<number | null>(null);
  const shakeTimeoutRef = useRef<number | null>(null);
  const finalizedRef = useRef<boolean>(false);

  useEffect(() => {
    try {
      sound.initBGM('/assets/audio/cinematic_adventure.mp3');
      sound.playBGM();
    } catch {
      // Ignorar si está restringido
    }
    return () => {
      sound.stopBGM();
    };
  }, []);

  const finalizeBreach = useCallback(
    (finalScore: number) => {
      if (finalizedRef.current) return;
      finalizedRef.current = true;
      if (pauseTimeoutRef.current !== null) {
        window.clearTimeout(pauseTimeoutRef.current);
        pauseTimeoutRef.current = null;
      }
      setPhase('FINISHED');

      const stars = finalScore >= 18 ? 3 : finalScore >= 12 ? 2 : finalScore >= 10 ? 1 : 0;
      if (stars > 0) {
        const alreadyCleared = isMissionCompleted('m21c_forzar_puerta');
        completeQuestMission('m21c_forzar_puerta', stars);
        const goldReward = stars === 3 ? 260000 : stars === 2 ? 235000 : 210000;
        const crystalReward = stars === 3 ? 11500 : stars === 2 ? 10000 : 9000;

        if (!alreadyCleared) {
          addGold(goldReward);
          addCrystals(crystalReward);
          addShelfItem({
            id: 'bisagra_rota_gabriel',
            name: 'Cerrojo Quebrado de Gabriel',
            category: 'materials',
            count: 1,
            icon: '/assets/portraits/puerta_gabriel_thumb.webp',
            rarity: 'UR',
            priceGold: 220000,
            description:
              'Cerrojo de hierro escarchado arrancado a la fuerza de la puerta principal de la casa del Capitán Gabriel en Icespear.',
          });
          setGrantedTrophyReward(true);
          setEarnedGold(goldReward);
          setEarnedCrystals(crystalReward);
        } else {
          const replayGold = stars * 5000;
          const replayCrystals = stars * 120;
          addGold(replayGold);
          addCrystals(replayCrystals);
          setGrantedTrophyReward(false);
          setEarnedGold(replayGold);
          setEarnedCrystals(replayCrystals);
        }
        sound.playSFX('victory');
        launchConfetti();
      } else {
        setGrantedTrophyReward(false);
        setEarnedGold(0);
        setEarnedCrystals(0);
        sound.playSFX('hurt');
      }
    },
    [addCrystals, addGold, addShelfItem, completeQuestMission, isMissionCompleted]
  );

  useEffect(() => {
    if (phase !== 'COUNTDOWN') return;

    const current = COUNTDOWN_SEQUENCE[countdownStep];
    if (!current) {
      remainingMsRef.current = BREACH_DURATION_MS;
      setTimeLeftMs(BREACH_DURATION_MS);
      setPhase('PLAYING');
      return;
    }

    if (current.label === '¡FUERZA!') {
      sound.playSFX('powerup');
    } else {
      sound.playSFX('lockpick');
    }

    const timer = window.setTimeout(() => {
      if (countdownStep < COUNTDOWN_SEQUENCE.length - 1) {
        setCountdownStep((prev) => prev + 1);
      } else {
        remainingMsRef.current = BREACH_DURATION_MS;
        setTimeLeftMs(BREACH_DURATION_MS);
        setPhase('PLAYING');
      }
    }, current.durationMs);

    return () => window.clearTimeout(timer);
  }, [phase, countdownStep]);

  const spawnNextWheel = useCallback(() => {
    if (phaseRef.current !== 'PLAYING' || remainingMsRef.current <= 0) return;
    setOutcome('idle');
    setFeedbackText('');
    setWheel((prev) => createWheel(prev.id + 1));
  }, [createWheel]);

  const handleMiss = useCallback(
    (reasonText: string) => {
      if (phaseRef.current !== 'PLAYING' || outcomeRef.current !== 'idle') return;
      outcomeRef.current = 'miss';
      setOutcome('miss');
      setAttempts((prev) => prev + 1);
      setStreak(0);
      setFeedbackText(reasonText);
      sound.playSFX('hurt');

      pauseTimeoutRef.current = window.setTimeout(() => {
        spawnNextWheel();
      }, FEEDBACK_PAUSE_MS);
    },
    [spawnNextWheel]
  );

  useEffect(() => {
    if (phase !== 'PLAYING') return;

    let rafId = 0;
    let lastTs = performance.now();

    const tick = (now: number) => {
      const dtMs = Math.min(80, Math.max(0, now - lastTs));
      lastTs = now;

      if (phaseRef.current !== 'PLAYING') return;

      const nextRemaining = Math.max(0, remainingMsRef.current - dtMs);
      remainingMsRef.current = nextRemaining;
      setTimeLeftMs(nextRemaining);

      if (nextRemaining <= 0) {
        finalizeBreach(scoreRef.current);
        return;
      }

      if (outcomeRef.current === 'idle') {
        const deltaDeg = (difficulty.speedDegPerSec * dtMs) / 1000;
        const nextProgress = wheelRef.current.progressDeg + deltaDeg;

        if (nextProgress >= 360) {
          setWheel((prev) => ({ ...prev, progressDeg: 360 }));
          handleMiss('¡El cerrojo resistió!');
        } else {
          setWheel((prev) => ({ ...prev, progressDeg: nextProgress }));
        }
      }

      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => {
      window.cancelAnimationFrame(rafId);
    };
  }, [phase, difficulty.speedDegPerSec, finalizeBreach, handleMiss]);

  useEffect(() => {
    return () => {
      if (pauseTimeoutRef.current !== null) {
        window.clearTimeout(pauseTimeoutRef.current);
      }
      if (shakeTimeoutRef.current !== null) {
        window.clearTimeout(shakeTimeoutRef.current);
      }
    };
  }, []);

  const handleStopNeedle = useCallback(() => {
    if (phaseRef.current !== 'PLAYING' || outcomeRef.current !== 'idle') return;

    const currentWheel = wheelRef.current;
    const needleDeg = normalizeDeg(currentWheel.startAngleDeg + currentWheel.progressDeg);
    const hit = isAngleInZone(needleDeg, currentWheel.zoneStartDeg, currentWheel.zoneSizeDeg);

    setAttempts((prev) => prev + 1);

    if (hit) {
      const nextScore = scoreRef.current + 1;
      scoreRef.current = nextScore;
      outcomeRef.current = 'hit';
      setScore(nextScore);
      setStreak((prev) => prev + 1);
      setOutcome('hit');
      setDoorShake(true);
      if (shakeTimeoutRef.current !== null) {
        window.clearTimeout(shakeTimeoutRef.current);
      }
      shakeTimeoutRef.current = window.setTimeout(() => setDoorShake(false), 180);

      setFeedbackText(
        nextScore >= 18
          ? '¡BISAGRA REVENTADA! +1'
          : nextScore >= 10
          ? '¡MADERA ASTILLADA! +1'
          : '¡GOLPE CERTERO! +1'
      );
      sound.playSFX(nextScore >= 18 ? 'shatter' : 'impact');
    } else {
      outcomeRef.current = 'miss';
      setStreak(0);
      setOutcome('miss');
      setFeedbackText('¡PATINÓ LA PALANCA!');
      sound.playSFX('hurt');
    }

    pauseTimeoutRef.current = window.setTimeout(() => {
      spawnNextWheel();
    }, FEEDBACK_PAUSE_MS);
  }, [spawnNextWheel]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        if (phaseRef.current === 'PLAYING' && outcomeRef.current === 'idle') {
          e.preventDefault();
          handleStopNeedle();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleStopNeedle]);

  const handleRetry = () => {
    if (pauseTimeoutRef.current !== null) {
      window.clearTimeout(pauseTimeoutRef.current);
      pauseTimeoutRef.current = null;
    }
    finalizedRef.current = false;
    remainingMsRef.current = BREACH_DURATION_MS;
    scoreRef.current = 0;
    outcomeRef.current = 'idle';
    setScore(0);
    setAttempts(0);
    setStreak(0);
    setOutcome('idle');
    setFeedbackText('');
    setDoorShake(false);
    setTimeLeftMs(BREACH_DURATION_MS);
    setCountdownStep(0);
    setWheel(createWheel(1));
    setPhase('COUNTDOWN');
    sound.playSFX('click');
  };

  const handleToggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextMuted = sound.toggleMute();
    setIsMuted(nextMuted);
  };

  const handleExit = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    sound.playSFX('click');
    setActiveQuestChapter(6);
    navigateTo('quest', true);
  };

  const handleChangeHero = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    sound.playSFX('click');
    setPendingMissionLaunch({
      missionId: 'm21c_forzar_puerta',
      destination: 'door_breach',
    });
    navigateTo('party', true);
  };

  const handleContinueEpilogue = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    sound.playSFX('click');
    setSelectedCombatMissionId('m21c_forzar_puerta_epilogo');
    navigateTo('story', true);
  };

  const starsEarned = score >= 18 ? 3 : score >= 12 ? 2 : score >= 10 ? 1 : 0;
  const timeSeconds = (timeLeftMs / 1000).toFixed(1);
  const timeRatio = Math.max(0, Math.min(100, (timeLeftMs / BREACH_DURATION_MS) * 100));
  const doorIntegrityPct = Math.max(0, Math.round(100 - (Math.min(score, 10) / 10) * 100));

  const currentNeedleDeg = normalizeDeg(wheel.startAngleDeg + wheel.progressDeg);
  const needleTip = polarToCartesian(120, 120, 92, currentNeedleDeg);
  const needleInner = polarToCartesian(120, 120, 52, currentNeedleDeg);
  const zoneEndDeg = wheel.zoneStartDeg + wheel.zoneSizeDeg;
  const successArcPath = describeArc(120, 120, 82, wheel.zoneStartDeg, zoneEndDeg);

  const centerBonusStart = wheel.zoneStartDeg + wheel.zoneSizeDeg * 0.35;
  const centerBonusEnd = wheel.zoneStartDeg + wheel.zoneSizeDeg * 0.65;
  const centerArcPath = describeArc(120, 120, 82, centerBonusStart, centerBonusEnd);

  return (
    <div
      onPointerDown={phase === 'PLAYING' ? handleStopNeedle : undefined}
      className={`relative w-full h-full flex flex-col justify-between overflow-hidden select-none bg-[#070a10] ${
        phase === 'PLAYING' ? 'cursor-pointer' : ''
      } ${doorShake ? 'animate-fgo-shake' : ''}`}
    >
      {/* Fondo: Exterior nevado de la casa del Capitán Gabriel */}
      <img
        src="/assets/backgrounds/casa_gabriel_exterior.webp"
        alt="Casa del Capitán Gabriel en Icespear"
        referrerPolicy="no-referrer"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none z-0"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/85 via-slate-950/50 to-black/92 pointer-events-none z-[1]" />

      {/* Top HUD */}
      <header
        onPointerDown={(e) => e.stopPropagation()}
        className="relative z-20 px-3 pt-2.5 pb-2 flex items-center justify-between gap-2 border-b border-cyan-900/60 bg-[#08101c]/85 backdrop-blur-xs"
      >
        <button
          type="button"
          onClick={handleExit}
          className="px-2.5 py-1.5 rounded-lg bg-[#101c2d] border border-cyan-800/70 text-cyan-100 hover:text-white text-xs font-bold flex items-center gap-1 cursor-pointer active:scale-95 transition-transform whitespace-nowrap shrink-0"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Salir</span>
        </button>

        <div className="text-center min-w-0">
          <h2 className="font-serif font-black text-xs sm:text-sm text-cyan-100 tracking-wide truncate">
            Forzar la Puerta de Gabriel
          </h2>
          <p className="text-[10px] text-cyan-300/85 font-medium truncate">
            Icespear · Capítulo VI: Sangre y Hielo
          </p>
        </div>

        <button
          type="button"
          onClick={handleToggleMute}
          className="p-2 rounded-lg bg-[#101c2d] border border-cyan-800/70 text-cyan-100 hover:text-white cursor-pointer active:scale-95 transition-transform shrink-0"
          title={isMuted ? 'Activar sonido' : 'Silenciar'}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </header>

      {/* Marcador principal: Tiempo, Golpes y Resistencia del Cerrojo */}
      <div className="relative z-20 px-3 pt-2.5 space-y-2 pointer-events-none">
        <div className="grid grid-cols-3 gap-1.5">
          <div className="rounded-xl bg-[#09121e]/90 border border-cyan-800/70 px-2.5 py-1.5 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-slate-300">Tiempo</span>
            <span
              className={`font-mono tabular-nums text-sm font-black ${
                timeLeftMs <= 5000 && phase === 'PLAYING' ? 'text-red-400' : 'text-amber-300'
              }`}
            >
              {timeSeconds}s
            </span>
          </div>
          <div className="rounded-xl bg-[#09121e]/90 border border-cyan-800/70 px-2.5 py-1.5 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-slate-300">Aciertos</span>
            <span className="font-mono tabular-nums text-sm font-black text-emerald-300">
              {score} / 18
            </span>
          </div>
          <div className="rounded-xl bg-[#09121e]/90 border border-cyan-800/70 px-2.5 py-1.5 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-slate-300">Cerrojo</span>
            <span
              className={`font-mono tabular-nums text-sm font-black ${
                doorIntegrityPct === 0 ? 'text-emerald-300' : 'text-cyan-300'
              }`}
            >
              {doorIntegrityPct === 0 ? '¡ABIERTO!' : `${doorIntegrityPct}%`}
            </span>
          </div>
        </div>

        {/* Barra de tiempo */}
        <div className="w-full h-2.5 rounded-full bg-black/75 border border-cyan-900/70 overflow-hidden p-0.5">
          <div
            className={`h-full rounded-full transition-colors ${
              timeLeftMs <= 5000
                ? 'bg-gradient-to-r from-red-600 to-orange-500'
                : 'bg-gradient-to-r from-cyan-400 to-emerald-400'
            }`}
            style={{ width: `${timeRatio}%` }}
          />
        </div>

        {/* Hitos de estrellas */}
        <div className="flex items-center justify-between text-[10px] font-bold px-1 text-slate-300">
          <span className={score >= 10 ? 'text-emerald-300' : 'text-slate-400'}>
            10 golpes · 1★
          </span>
          <span className={score >= 12 ? 'text-sky-300' : 'text-slate-400'}>
            12 · 2★ Notable
          </span>
          <span className={score >= 18 ? 'text-amber-300' : 'text-slate-400'}>
            18 · 3★ Demolición
          </span>
        </div>
      </div>

      {/* Arena Central: Skill Check Wheel / Countdown */}
      <div className="relative z-20 flex-1 flex flex-col items-center justify-center px-4 pointer-events-none">
        {phase === 'COUNTDOWN' && (
          <div className="flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-36 h-36 rounded-full bg-[#0a1422]/90 border-4 border-cyan-400 shadow-[0_0_36px_rgba(34,211,238,0.45)] flex items-center justify-center">
              <span
                key={countdownStep}
                className="font-serif font-black text-4xl text-cyan-100 drop-shadow-[0_3px_8px_rgba(0,0,0,0.95)] tabular-nums"
              >
                {COUNTDOWN_SEQUENCE[countdownStep]?.label ?? '¡FUERZA!'}
              </span>
            </div>
            <p className="text-sm font-bold text-cyan-100 drop-shadow">
              {COUNTDOWN_SEQUENCE[countdownStep]?.sub}
            </p>
            <p className="text-xs text-slate-300 max-w-[280px] leading-snug">
              Pulsa la pantalla o la barra espaciadora justo cuando la aguja cruce el arco iluminado para reventar la puerta.
            </p>
          </div>
        )}

        {phase === 'PLAYING' && (
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="relative w-[240px] h-[240px] flex items-center justify-center">
              <svg viewBox="0 0 240 240" className="w-full h-full overflow-visible drop-shadow-[0_0_24px_rgba(0,0,0,0.9)]">
                <circle
                  cx="120"
                  cy="120"
                  r="98"
                  fill="rgba(7, 13, 24, 0.84)"
                  stroke="rgba(34, 211, 238, 0.4)"
                  strokeWidth="2"
                />

                {/* Pista base */}
                <circle
                  cx="120"
                  cy="120"
                  r="82"
                  fill="none"
                  stroke="#172538"
                  strokeWidth="16"
                />

                {/* Área correcta */}
                <path
                  d={successArcPath}
                  fill="none"
                  stroke={outcome === 'hit' ? '#22c55e' : '#38bdf8'}
                  strokeWidth="18"
                  strokeLinecap="butt"
                  opacity={0.92}
                />

                {/* Centro dulce */}
                <path
                  d={centerArcPath}
                  fill="none"
                  stroke="#fde047"
                  strokeWidth="18"
                  strokeLinecap="butt"
                  opacity={0.95}
                />

                {/* Bordes nítidos */}
                {[wheel.zoneStartDeg, zoneEndDeg].map((edgeDeg, idx) => {
                  const pIn = polarToCartesian(120, 120, 71, edgeDeg);
                  const pOut = polarToCartesian(120, 120, 93, edgeDeg);
                  return (
                    <line
                      key={idx}
                      x1={pIn.x}
                      y1={pIn.y}
                      x2={pOut.x}
                      y2={pOut.y}
                      stroke="#ffffff"
                      strokeWidth="2.5"
                    />
                  );
                })}

                {/* Aguja giratoria */}
                <line
                  x1={needleInner.x}
                  y1={needleInner.y}
                  x2={needleTip.x}
                  y2={needleTip.y}
                  stroke={outcome === 'miss' ? '#ef4444' : outcome === 'hit' ? '#4ade80' : '#ffffff'}
                  strokeWidth="5"
                  strokeLinecap="round"
                />
                <circle
                  cx={needleTip.x}
                  cy={needleTip.y}
                  r="4"
                  fill={outcome === 'miss' ? '#ef4444' : outcome === 'hit' ? '#4ade80' : '#fde047'}
                />
              </svg>

              {/* Centro de la rueda: puerta agrietada de Gabriel */}
              <div
                className={`absolute w-24 h-24 rounded-full overflow-hidden border-2 flex flex-col items-center justify-center transition-colors ${
                  outcome === 'hit'
                    ? 'border-emerald-400 bg-emerald-950/90'
                    : outcome === 'miss'
                    ? 'border-red-500 bg-red-950/90'
                    : 'border-cyan-400/80 bg-[#0b1524]/95'
                }`}
              >
                <img
                  src="/assets/portraits/puerta_gabriel_thumb.webp"
                  alt="Puerta de Gabriel"
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 object-cover rounded-lg border border-cyan-500/40"
                />
                <span className="font-mono text-[10px] font-black text-cyan-200 tabular-nums mt-0.5">
                  Racha {streak}
                </span>
              </div>
            </div>

            {/* Feedback claro */}
            <div className="min-h-[30px] flex items-center justify-center">
              {feedbackText ? (
                <span
                  className={`text-sm font-black uppercase tracking-wide px-3 py-1 rounded-lg ${
                    outcome === 'hit'
                      ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-500/60'
                      : 'bg-red-950/90 text-red-300 border border-red-500/60'
                  }`}
                >
                  {feedbackText}
                </span>
              ) : (
                <span className="text-xs font-bold text-cyan-100/95 bg-black/65 px-3 py-1 rounded-lg border border-cyan-800/50">
                  ¡Pulsa la pantalla para golpear la cerradura!
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Pie del minijuego: Héroe elegido vs Puerta Blindada */}
      <div className="relative z-20 px-3 pb-3 pt-1 pointer-events-none">
        <div className="rounded-2xl bg-[#09121e]/92 border border-cyan-800/70 p-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {selectedHero && (
              <img
                src={selectedHero.portrait}
                alt={selectedHero.name}
                referrerPolicy="no-referrer"
                className="w-11 h-11 rounded-xl object-cover border-2 border-cyan-400/80 shrink-0 bg-[#070d16]"
              />
            )}
            <div className="min-w-0">
              <p className="text-xs font-serif font-black text-cyan-100 truncate">
                {selectedHero?.name ?? 'Campeón'}
              </p>
              <div className="flex items-center gap-1 text-[10px] text-amber-300 font-bold">
                <img
                  src="/assets/heropage/stat_suerte.webp"
                  alt=""
                  className="w-3.5 h-3.5 object-contain shrink-0"
                />
                <span className="tabular-nums">Suerte {heroLuck}</span>
                <span aria-hidden="true">·</span>
                <span className="text-emerald-300 truncate">{difficulty.luckTierLabel}</span>
              </div>
            </div>
          </div>

          <div className="text-[10px] font-black text-cyan-400 px-1 shrink-0">VS</div>

          <div className="flex items-center gap-2 min-w-0 flex-1 justify-end text-right">
            <div className="min-w-0">
              <p className="text-xs font-serif font-black text-slate-100 truncate">Portón Sellado</p>
              <p className="text-[10px] text-slate-400 truncate">Casa de Gabriel</p>
            </div>
            <img
              src="/assets/portraits/puerta_gabriel_thumb.webp"
              alt="Portón de la Casa de Gabriel"
              referrerPolicy="no-referrer"
              className="w-11 h-11 rounded-xl object-cover border-2 border-slate-500/80 shrink-0 bg-[#070d16]"
            />
          </div>
        </div>
      </div>

      {/* Modal de Resultado Final */}
      {phase === 'FINISHED' && (
        <div
          onPointerDown={(e) => e.stopPropagation()}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4"
        >
          <div className="relative w-full max-w-sm rounded-2xl border-2 border-cyan-500/80 bg-[#0b1524] p-5 text-center text-slate-100 shadow-2xl space-y-4">
            <div className="flex flex-col items-center space-y-2">
              <div
                className={`w-14 h-14 rounded-full flex items-center justify-center border-2 ${
                  starsEarned > 0
                    ? 'bg-cyan-900/60 border-cyan-400 text-cyan-200'
                    : 'bg-red-950/70 border-red-500 text-red-300'
                }`}
              >
                {starsEarned > 0 ? <Hammer className="w-7 h-7" /> : <ShieldAlert className="w-7 h-7" />}
              </div>

              <h3 className="font-serif font-black text-xl text-cyan-100">
                {starsEarned === 3
                  ? '¡Puerta Hecha Astillas!'
                  : starsEarned === 2
                  ? '¡Cerrojo Reventado!'
                  : starsEarned === 1
                  ? '¡Entrada Forzada!'
                  : 'La puerta no ha cedido'}
              </h3>

              <div className="flex items-center justify-center gap-2 py-1">
                {[1, 2, 3].map((idx) => (
                  <Star
                    key={idx}
                    className={`w-7 h-7 ${
                      starsEarned >= idx
                        ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.7)]'
                        : 'text-slate-700'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="rounded-xl bg-[#070e18] border border-cyan-900/60 p-3 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Golpes certeros</span>
                <span className="font-mono font-black text-cyan-300 tabular-nums">
                  {score} puntos ({attempts} intentos)
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Meta: 10 (1★) · 12 (2★) · 18 (3★ Demolición)</span>
              </div>
            </div>

            {starsEarned > 0 ? (
              <div className="rounded-xl bg-[#070e18] border border-cyan-700/60 p-3 space-y-2.5">
                <p className="text-xs text-slate-200 leading-snug">
                  {grantedTrophyReward
                    ? '¡Las bisagras de hierro saltan por los aires! La puerta de la casa del Capitán Gabriel cede por completo.'
                    : '¡Has vuelto a reventar el portón congelado en tiempo récord!'}
                </p>

                <div className="flex items-center justify-center gap-3">
                  {grantedTrophyReward && (
                    <div className="flex items-center gap-2 bg-[#112034] border border-cyan-500/50 rounded-lg px-2.5 py-1.5">
                      <img
                        src="/assets/portraits/puerta_gabriel_thumb.webp"
                        alt="Cerrojo Quebrado"
                        className="w-7 h-7 object-cover rounded"
                      />
                      <span className="text-[11px] font-bold text-cyan-200">Cerrojo Quebrado</span>
                    </div>
                  )}
                  <div className="text-left font-mono text-xs tabular-nums">
                    <div className="text-amber-300 font-black">+{earnedGold.toLocaleString('es-ES')} Oro</div>
                    <div className="text-sky-300 font-black">+{earnedCrystals.toLocaleString('es-ES')} Gemas</div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-300 leading-relaxed">
                Necesitas al menos <span className="text-cyan-300 font-bold">10 golpes certeros</span> en 20 segundos para reventar el cerrojo helado. Prueba con un héroe con más{' '}
                <span className="text-amber-300 font-bold">Suerte</span> o vuelve a intentarlo.
              </p>
            )}

            <div className="space-y-2 pt-1">
              {starsEarned > 0 && (
                <button
                  type="button"
                  onClick={() => handleContinueEpilogue()}
                  className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-cyan-600 via-sky-600 to-indigo-600 hover:brightness-110 text-white font-black text-xs uppercase tracking-wider cursor-pointer active:scale-95 transition-transform shadow-[0_0_14px_rgba(34,211,238,0.45)] flex items-center justify-center gap-1.5"
                >
                  <Trophy className="w-4 h-4 text-amber-200" />
                  <span>Continuar Historia: Entrar en la Casa</span>
                </button>
              )}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRetry}
                  className="flex-1 py-2.5 px-3 rounded-xl border border-cyan-500/70 bg-[#102033] hover:bg-[#162d47] text-cyan-100 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-transform"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reintentar</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleChangeHero()}
                  className="flex-1 py-2.5 px-3 rounded-xl border border-slate-700 bg-[#0d1726] hover:bg-[#142339] text-slate-200 font-bold text-xs cursor-pointer active:scale-95 transition-transform"
                >
                  Cambiar héroe
                </button>
              </div>
              <button
                type="button"
                onClick={() => handleExit()}
                className={`w-full py-2 px-3 rounded-xl font-bold text-xs cursor-pointer active:scale-95 transition-transform ${
                  starsEarned > 0
                    ? 'border border-slate-800 bg-[#070e18] hover:bg-[#101c2d] text-slate-300'
                    : 'bg-gradient-to-r from-cyan-600 to-sky-600 hover:brightness-110 text-white font-black'
                }`}
              >
                Volver a Misiones
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
