import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { PatrolMission } from '../types/game';
import { PATROLS } from '../data/gameContent';
import { sound } from '../services/soundService';
import { Coins, Sparkles, Boxes, Hourglass, Plus, X } from 'lucide-react';
import { launchConfetti } from '../utils/confetti';
import { safeStorage } from '../utils/storage';
import {
  MINES_BROTHERS_PORTRAIT,
  MINES_TUTORIAL_DONE_KEY,
  MINES_TUTORIAL_FAREWELL,
  MINES_TUTORIAL_LINES,
  MINES_TUTORIAL_PATROL_ID,
} from '../data/minesIntroData';

/** Duración de la misión al estilo del tablón de 7DS: "8h 0m", "30m", "45s". */
const formatDuration = (total: number): string => {
  if (total < 60) return `${total}s`;
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
};

const formatRemaining = (total: number): string => {
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
  return `${seconds}s`;
};

const TILE_TONES = {
  gold: 'from-[#fbebba] to-[#cfa347] border-[#8d6a2a] text-[#46300f]',
  crystal: 'from-[#d9edff] to-[#68a9d8] border-[#2f6288] text-[#123a55]',
  xp: 'from-[#e4f7cf] to-[#84b95c] border-[#456b2c] text-[#22380f]',
  material: 'from-[#f0e5fb] to-[#ad8fcb] border-[#6a4d88] text-[#33204a]',
  copper: 'from-[#f7d7b4] to-[#bf7c40] border-[#7c4b21] text-[#3d2109]',
  silver: 'from-[#f3f5f8] to-[#adb4be] border-[#6b727b] text-[#242a31]',
  gem: 'from-[#e2f0ff] to-[#8fc4e8] border-[#3f6f93] text-[#123149]',
} as const;

/** Color de la ficha según el mineral que se extrae. */
const tileToneFor = (itemId: string): keyof typeof TILE_TONES => {
  if (itemId.includes('cobre')) return 'copper';
  if (itemId.includes('plata')) return 'silver';
  if (itemId.includes('oro')) return 'gold';
  return 'gem';
};

const RewardTile: React.FC<{
  tone: keyof typeof TILE_TONES;
  icon: React.ReactNode;
  amount: string;
  title: string;
}> = ({ tone, icon, amount, title }) => (
  <div
    title={title}
    className={`relative w-9 h-9 sm:w-10 sm:h-10 rounded-[4px] border-2 bg-gradient-to-b ${TILE_TONES[tone]} shadow-[0_2px_3px_rgba(0,0,0,0.35)] flex items-center justify-center`}
  >
    {icon}
    <span className="absolute -bottom-[7px] -right-[5px] px-1 rounded-sm bg-[#2a1a0b] text-[#f4e3bd] text-[9px] font-bold leading-[11px] shadow">
      {amount}
    </span>
  </div>
);

export const PatrolView: React.FC = () => {
  const { heroes, activePatrols, startPatrol, claimPatrol, activeSanctuary } = useGame();

  const [selectedPatrolForDispatch, setSelectedPatrolForDispatch] = useState<PatrolMission | null>(null);
  const [selectedHeroesForDispatch, setSelectedHeroesForDispatch] = useState<string[]>([]);
  const [currentTime, setCurrentTime] = useState<number>(Date.now());
  // Tutorial de Boran y Thora: arranca al abrir las galerías de Silverpeack y se
  // reanuda si quedó a medias. Solo tiene sentido en ese tablón.
  const [minesTutorialStep, setMinesTutorialStep] = useState<number>(() =>
    safeStorage.getItem(MINES_TUTORIAL_DONE_KEY) === 'done' ? -1 : 0
  );
  const [minesFarewell, setMinesFarewell] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Cada santuario ofrece sus propias expediciones: las minas de Silverpeack
  // tienen las suyas, más largas y con más recompensa.
  const isSilverpeack = activeSanctuary === 'silverpeack';
  const patrols = isSilverpeack
    ? PATROLS.filter((p) => p.region === 'Silverpeack')
    : PATROLS.filter((p) => p.region !== 'Silverpeack');

  const minesTutorialActive = minesTutorialStep >= 0 && isSilverpeack;
  // Si la galería de cobre ya está en marcha, el tutorial deja elegir cualquier
  // veta libre en vez de quedarse bloqueado señalando una ocupada.
  const minesTutorialCopperFree = !activePatrols.some((a) => a.patrolId === MINES_TUTORIAL_PATROL_ID);
  const minesTutorialLine = minesTutorialActive
    ? minesTutorialStep === 0 && !minesTutorialCopperFree
      ? {
          step: 0,
          speaker: 'Thora' as const,
          title: 'Capataza de la Veta',
          text: 'La de cobre ya está picando. Elige cualquiera de las vetas libres y toca Desplegar; el tutorial es el mismo.',
        }
      : MINES_TUTORIAL_LINES.find((line) => line.step === minesTutorialStep) ?? null
    : null;

  const finishMinesTutorial = () => {
    setMinesTutorialStep(-1);
    safeStorage.setItem(MINES_TUTORIAL_DONE_KEY, 'done');
    sound.playSFX('fanfare');
    try {
      launchConfetti();
    } catch {
      // Sin confeti si el canvas no está disponible
    }
    setMinesFarewell(MINES_TUTORIAL_FAREWELL.text);
    setTimeout(() => setMinesFarewell(null), 7000);
  };

  // En cuanto el jugador elige un héroe, el tutorial pasa al botón de desplegar.
  useEffect(() => {
    if (!minesTutorialActive || minesTutorialStep !== 1) return;
    if (selectedHeroesForDispatch.length > 0) setMinesTutorialStep(2);
  }, [minesTutorialActive, minesTutorialStep, selectedHeroesForDispatch.length]);

  const visibleActives = activePatrols.filter((a) => patrols.some((p) => p.id === a.patrolId));
  const readyIds = visibleActives.filter((a) => currentTime >= a.endTime).map((a) => a.patrolId);

  const handleToggleHeroSelection = (heroId: string) => {
    sound.playSFX('click');
    setSelectedHeroesForDispatch((prev) => {
      if (prev.includes(heroId)) return prev.filter((id) => id !== heroId);
      if (prev.length >= 3) return prev;
      return [...prev, heroId];
    });
  };

  const handleConfirmDispatch = () => {
    if (!selectedPatrolForDispatch || selectedHeroesForDispatch.length === 0) return;
    const wasTutorial = minesTutorialActive;
    startPatrol(selectedPatrolForDispatch.id, selectedHeroesForDispatch);
    setSelectedPatrolForDispatch(null);
    setSelectedHeroesForDispatch([]);
    if (wasTutorial) finishMinesTutorial();
  };

  const handleClaimAll = () => {
    if (readyIds.length === 0) return;
    readyIds.forEach((id) => claimPatrol(id));
    sound.playSFX('fanfare');
  };

  /** Fichas de recompensa: minerales y gemas si la misión los define. */
  const renderTiles = (rewards: PatrolMission['rewards'], centered = false) => {
    const wrapper = centered ? 'flex items-center justify-center gap-2 pl-0.5' : 'flex items-center gap-2 pl-1';

    if (rewards.items && rewards.items.length > 0) {
      return (
        <div className={wrapper}>
          {rewards.items.map((item) => (
            <RewardTile
              key={item.id}
              tone={tileToneFor(item.id)}
              icon={<img src={item.icon} alt="" className="w-6 h-6 sm:w-7 sm:h-7 object-contain drop-shadow" />}
              amount={`${item.count}`}
              title={`${item.name} ×${item.count}`}
            />
          ))}
        </div>
      );
    }

    return (
      <div className={wrapper}>
        <RewardTile tone="gold" icon={<Coins className="w-4 h-4 sm:w-5 sm:h-5" />} amount={`${rewards.gold}`} title="Oro" />
        <RewardTile
          tone="crystal"
          icon={<img src="/assets/items/gema_del_recuerdo.png" alt="" className="w-6 h-6 object-contain" />}
          amount={`${rewards.crystals}`}
          title="Cristales del Recuerdo"
        />
        <RewardTile tone="xp" icon={<Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />} amount={`${rewards.xp}`} title="Experiencia" />
        <RewardTile
          tone="material"
          icon={<Boxes className="w-4 h-4 sm:w-5 sm:h-5" />}
          amount={`${rewards.materials?.length ?? 0}`}
          title={(rewards.materials ?? []).join(' · ') || 'Materiales'}
        />
      </div>
    );
  };

  const dispatchButton = (patrol: PatrolMission) => {
    // Durante el tutorial solo responde la galería que señalan los hermanos.
    const locked =
      minesTutorialActive &&
      (minesTutorialStep > 0 ||
        (minesTutorialCopperFree && patrol.id !== MINES_TUTORIAL_PATROL_ID));
    const isTutorialTarget =
      minesTutorialActive && minesTutorialCopperFree && patrol.id === MINES_TUTORIAL_PATROL_ID;

    return (
      <button
        onClick={() => {
          if (locked) {
            sound.playSFX('hurt');
            return;
          }
          sound.playSFX('click');
          setSelectedPatrolForDispatch(patrol);
          setSelectedHeroesForDispatch([]);
          if (minesTutorialActive && minesTutorialStep === 0) setMinesTutorialStep(1);
        }}
        className={`shrink-0 px-5 sm:px-7 py-[7px] rounded-[6px] border-2 border-[#f0e2b6] bg-gradient-to-b from-[#63b3c9] via-[#3d879f] to-[#2a6272] text-white font-serif font-bold text-sm sm:text-base tracking-wide shadow-[0_3px_0_#123f4c,0_7px_14px_rgba(0,0,0,0.35)] transition-all ${
          locked
            ? 'opacity-45 grayscale cursor-not-allowed'
            : 'hover:brightness-110 active:translate-y-[1px] active:shadow-[0_1px_0_#123f4c] cursor-pointer'
        } ${isTutorialTarget && minesTutorialStep === 0 ? 'ring-2 ring-amber-300 ring-offset-2 ring-offset-[#f4e3bd] animate-pulse' : ''}`}
      >
        Desplegar
      </button>
    );
  };

  return (
    <div
      className="relative w-full h-full flex-1 overflow-y-auto no-scrollbar pb-28 sm:pb-32 select-none"
      style={{ backgroundImage: "url('/assets/backgrounds/silverpeack.png')", backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      <div className="absolute inset-0 bg-[#140b05]/90 pointer-events-none" />
      <div className="relative z-10 max-w-3xl mx-auto px-2 sm:px-4 pt-3 sm:pt-5">
        {/* Rodillo de madera del pergamino */}
        <div className="relative h-10 sm:h-12 mx-5 rounded-full border border-[#f3e5ba]/70 bg-gradient-to-b from-[#e8cf9b] via-[#a8833f] to-[#4c3316] shadow-[0_10px_22px_rgba(0,0,0,0.7)]">
          <span className="absolute -left-2 top-1/2 -translate-y-1/2 h-11 sm:h-13 w-5 sm:w-6 rounded-full border border-[#f3e5ba]/70 bg-gradient-to-b from-[#eeddb2] to-[#66471d] shadow-inner" />
          <span className="absolute -right-2 top-1/2 -translate-y-1/2 h-11 sm:h-13 w-5 sm:w-6 rounded-full border border-[#f3e5ba]/70 bg-gradient-to-b from-[#eeddb2] to-[#66471d] shadow-inner" />
        </div>

        {/* Pergamino */}
        <div
          className="relative -mt-4 rounded-b-[26px] border-x-[6px] border-b-[6px] border-[#5a3f1d] shadow-[0_26px_50px_rgba(0,0,0,0.65)] overflow-hidden"
          style={{ backgroundImage: "url('/assets/ui/pergamino_patrulla.png')", backgroundSize: 'cover', backgroundPosition: 'center' }}
        >
          <div className="pt-4 pb-2 text-center">
            <h2 className="font-serif font-black text-[#422c14] text-[22px] sm:text-[30px] tracking-wide drop-shadow-[0_1px_0_rgba(255,255,255,0.5)]">
              Despliegue de Patrullas
            </h2>
            <div className="mt-1 flex items-center justify-center gap-2 text-[#6a4a24] text-[11px] sm:text-sm font-semibold">
              <Hourglass className="w-4 h-4" />
              <span>
                {patrols.length} misiones · {visibleActives.length} en curso
              </span>
            </div>
            <p className="mt-1 px-5 text-[10.5px] sm:text-xs text-[#71542a]">
              {isSilverpeack
                ? 'Las galerías pagan en minerales: cobre, plata, oro y gemas. Cada héroe solo puede patrullar una mina.'
                : 'Envía exploradores a la frontera helada. Cada héroe solo puede estar en una patrulla.'}
            </p>
          </div>

          <div className="mx-4 sm:mx-6 border-t border-[#a98a52]/80" />

          {patrols.map((patrol) => {
            const active = visibleActives.find((p) => p.patrolId === patrol.id);
            const isCompleted = !!active && currentTime >= active.endTime;
            const remainingSeconds = active ? Math.max(0, Math.floor((active.endTime - currentTime) / 1000)) : 0;
            const progress = active
              ? isCompleted
                ? 100
                : Math.min(100, ((patrol.durationSeconds - remainingSeconds) / patrol.durationSeconds) * 100)
              : 0;

            return (
              <div key={patrol.id} className="px-4 sm:px-6 py-3 border-b border-[#bda06a]/60 last:border-b-0">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="font-serif font-bold text-[#422c14] text-[15px] sm:text-lg leading-tight">{patrol.name}</h3>
                  <span className="shrink-0 font-serif font-bold text-[#5c3f1c] text-sm sm:text-base tabular-nums">
                    {formatDuration(patrol.durationSeconds)}
                  </span>
                </div>

                <p className="mt-0.5 text-[10.5px] sm:text-[11.5px] text-[#6b4c26]/90 leading-snug">{patrol.description}</p>

                <div className="mt-2.5 flex items-end justify-between gap-3">
                  {renderTiles(patrol.rewards)}

                  {active ? (
                    <div className="flex flex-col items-end gap-1 min-w-[128px]">
                      <span className="text-[10px] font-bold uppercase tracking-wide text-[#5b3f1d]">
                        {isCompleted ? '¡Completada!' : 'En patrulla'}
                      </span>
                      <div className="w-28 sm:w-32 h-1.5 rounded-full bg-[#8a6a3a]/35 overflow-hidden border border-[#8a6a3a]/40">
                        <div
                          className="h-full bg-gradient-to-r from-[#3f7f4a] to-[#86bd5f] transition-all duration-1000"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      {isCompleted ? (
                        <button
                          onClick={() => claimPatrol(patrol.id)}
                          className="mt-0.5 px-4 py-[5px] rounded-[6px] border-2 border-[#fbeec2] bg-gradient-to-b from-[#f2d582] via-[#d9a94b] to-[#a97b26] text-[#3a2508] font-serif font-bold text-xs sm:text-sm shadow-[0_3px_0_#6d4c14] hover:brightness-110 active:translate-y-[1px] cursor-pointer animate-pulse"
                        >
                          Reclamar
                        </button>
                      ) : (
                        <span className="font-mono text-[10px] text-[#5b3f1d]">{formatRemaining(remainingSeconds)}</span>
                      )}
                    </div>
                  ) : (
                    dispatchButton(patrol)
                  )}
                </div>
              </div>
            );
          })}

          <div className="flex justify-center pt-3 pb-5 px-4">
            <button
              onClick={handleClaimAll}
              disabled={readyIds.length === 0}
              className={`px-9 sm:px-12 py-2.5 rounded-[7px] border-2 font-serif font-bold text-sm sm:text-base tracking-wide transition-all ${
                readyIds.length > 0
                  ? 'border-[#e6dfcc] bg-gradient-to-b from-[#b0ada2] via-[#7e7b73] to-[#55524c] text-[#f8f3e6] shadow-[0_4px_0_#3b3833] hover:brightness-110 active:translate-y-[1px] cursor-pointer'
                  : 'border-[#cfc8b5]/60 bg-gradient-to-b from-[#9a978d]/60 to-[#5f5c56]/60 text-[#efe9db]/50 cursor-not-allowed'
              }`}
            >
              Reclamar todo{readyIds.length > 0 ? ` (${readyIds.length})` : ''}
            </button>
          </div>
        </div>
      </div>

      {/* Globo de los hermanos: aparece con cada paso y se va al avanzar */}
      {!selectedPatrolForDispatch && (minesTutorialLine || minesFarewell) && (
        <div className="pointer-events-none fixed left-1/2 -translate-x-1/2 bottom-[88px] z-[60] w-[94%] max-w-md animate-fade-in">
          <div className="flex items-start gap-2 rounded-xl border-2 border-[#c9a758] bg-[#2a1a0b]/97 px-3 py-2 shadow-[0_10px_26px_rgba(0,0,0,0.65)]">
            <img
              src={MINES_BROTHERS_PORTRAIT}
              alt=""
              className="h-10 w-10 shrink-0 rounded-md border border-[#c9a758]/70 object-cover"
            />
            <div className="min-w-0">
              <div className="font-serif text-[11px] font-black uppercase tracking-wide text-[#f2d79a]">
                {minesTutorialLine ? minesTutorialLine.speaker : MINES_TUTORIAL_FAREWELL.speaker}
                <span className="ml-1 text-[9px] font-semibold normal-case text-[#c9b184]">
                  · {minesTutorialLine ? minesTutorialLine.title : MINES_TUTORIAL_FAREWELL.title}
                </span>
              </div>
              <p className="text-[11px] leading-snug text-[#f4e3bd]">
                {minesTutorialLine ? minesTutorialLine.text : minesFarewell}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Asignación de héroes */}
      {selectedPatrolForDispatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-3 sm:p-4">
          <div
            className="relative w-full max-w-2xl rounded-[20px] border-4 border-[#5a3f1d] shadow-[0_24px_60px_rgba(0,0,0,0.75)] overflow-hidden"
            style={{ backgroundImage: "url('/assets/ui/pergamino_patrulla.png')", backgroundSize: 'cover', backgroundPosition: 'center' }}
          >
            <div className="flex items-center justify-between px-4 sm:px-5 py-2.5 bg-gradient-to-b from-[#3d2913]/97 to-[#241708]/97 border-b-2 border-[#a98a52]">
              <h3 className="font-serif font-black text-[#f1dcae] text-sm sm:text-base truncate">
                Asignar héroes · {selectedPatrolForDispatch.name}
              </h3>
              <button
                onClick={() => {
                  setSelectedPatrolForDispatch(null);
                  setSelectedHeroesForDispatch([]);
                  // Si se cierra a medias, el tutorial vuelve al tablón.
                  if (minesTutorialActive && minesTutorialStep > 0) setMinesTutorialStep(0);
                }}
                className="text-[#e8d4a8] hover:text-white p-1 rounded-md bg-black/30 cursor-pointer"
                title="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 sm:p-4 space-y-3">
              {minesTutorialLine && (
                <div className="rounded-lg border-2 border-[#c9a758] bg-[#2a1a0b]/95 px-2.5 py-1.5">
                  <div className="font-serif text-[10px] font-black uppercase tracking-wide text-[#f2d79a]">
                    {minesTutorialLine.speaker}
                    <span className="ml-1 text-[9px] font-semibold normal-case text-[#c9b184]">· {minesTutorialLine.title}</span>
                  </div>
                  <p className="text-[11px] leading-snug text-[#f4e3bd]">{minesTutorialLine.text}</p>
                </div>
              )}
              <div className="flex items-center justify-center gap-3">
                {[0, 1, 2].map((slot) => {
                  const heroId = selectedHeroesForDispatch[slot];
                  const hero = heroes.find((h) => h.id === heroId);
                  return (
                    <div
                      key={slot}
                      className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-md border-2 flex items-center justify-center overflow-hidden ${
                        hero
                          ? 'border-[#c9a758] bg-[#2a1a0b] shadow-[0_0_0_2px_rgba(0,0,0,0.35)]'
                          : 'border-dashed border-[#8a6a3a]/70 bg-[#efe0bc]/50'
                      }`}
                    >
                      {hero ? (
                        <>
                          <img src={hero.portrait} alt={hero.name} className="w-full h-full object-cover" />
                          <button
                            onClick={() => handleToggleHeroSelection(hero.id)}
                            className="absolute top-0 right-0 w-4 h-4 rounded-bl bg-[#2a1a0b]/90 text-[#f1dcae] flex items-center justify-center cursor-pointer"
                            title="Quitar"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </>
                      ) : (
                        <Plus className="w-6 h-6 text-[#8a6a3a]" />
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-center gap-2.5 text-[#5b3f1d] text-[11px] font-semibold">
                <Hourglass className="w-3.5 h-3.5" />
                <span>{formatDuration(selectedPatrolForDispatch.durationSeconds)}</span>
                <span className="opacity-60">·</span>
                <span>{selectedHeroesForDispatch.length}/3 héroes</span>
              </div>

              {renderTiles(selectedPatrolForDispatch.rewards, true)}

              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 max-h-56 sm:max-h-64 overflow-y-auto no-scrollbar p-1">
                {heroes.map((hero) => {
                  const isSelected = selectedHeroesForDispatch.includes(hero.id);
                  const isBusy = hero.inPatrol;
                  return (
                    <button
                      key={hero.id}
                      onClick={() => {
                        if (!isBusy) handleToggleHeroSelection(hero.id);
                      }}
                      className={`relative rounded-md overflow-hidden border-2 text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#e2b955] ring-2 ring-[#e2b955]/60 shadow-lg'
                          : isBusy
                          ? 'border-[#7a5a2a]/50 opacity-40 cursor-not-allowed grayscale'
                          : 'border-[#8a6a3a]/60 hover:border-[#c9a758]'
                      }`}
                    >
                      <div className="w-full aspect-square bg-[#2a1a0b]">
                        <img src={hero.portrait} alt={hero.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="px-1 py-0.5 bg-[#2a1a0b]/92">
                        <div className="text-[9.5px] font-serif font-bold text-[#f2ddad] truncate">{hero.name}</div>
                        <div className="text-[8.5px] text-[#c9b184] flex items-center justify-between">
                          <span>Nvl. {hero.level}</span>
                          <span>{isBusy ? 'En patrulla' : hero.attribute}</span>
                        </div>
                      </div>
                      {isSelected && (
                        <span className="absolute top-1 left-1 w-4 h-4 rounded-full bg-[#e2b955] text-[#3a2508] text-[10px] font-black flex items-center justify-center">
                          {selectedHeroesForDispatch.indexOf(hero.id) + 1}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <button
                disabled={selectedHeroesForDispatch.length === 0}
                onClick={handleConfirmDispatch}
                className={`w-full py-2.5 rounded-[7px] border-2 font-serif font-black text-sm sm:text-base tracking-wide transition-all ${
                  selectedHeroesForDispatch.length > 0
                    ? 'border-[#f0e2b6] bg-gradient-to-b from-[#63b3c9] via-[#3d879f] to-[#2a6272] text-white shadow-[0_3px_0_#123f4c] hover:brightness-110 active:translate-y-[1px] cursor-pointer'
                    : 'border-[#cfc8b5]/60 bg-[#8a8780]/50 text-[#efe9db]/50 cursor-not-allowed'
                }`}
              >
                Desplegar patrulla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
