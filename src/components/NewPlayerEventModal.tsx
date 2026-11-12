import React from 'react';
import { useGame } from '../context/GameContext';
import { sound } from '../services/soundService';
import { launchConfetti } from '../utils/confetti';
import {
  NEW_PLAYER_EVENT_DAYS,
  NEW_PLAYER_EVENT_STEPS,
  NEW_PLAYER_HERO_CHOICES,
} from '../data/newPlayerEventData';
import { Check, Gift, Lock, Sparkles, Star, X } from 'lucide-react';

const CurrencyChip: React.FC<{ icon: string; value: string; tone?: 'gold' | 'crystal' }> = ({
  icon,
  value,
  tone = 'gold',
}) => (
  <span className="inline-flex items-center gap-1 rounded-full border border-[#6d280d] bg-[#120703] px-1.5 py-[1px]">
    <img src={icon} alt="" className="w-3 h-3 object-contain" />
    <span className={`font-mono font-bold text-[9.5px] ${tone === 'crystal' ? 'text-cyan-300' : 'text-amber-200'}`}>
      {value}
    </span>
  </span>
);

export const NewPlayerEventModal: React.FC = () => {
  const {
    isNewPlayerEventOpen,
    closeNewPlayerEvent,
    newPlayerEventClaimedCount,
    newPlayerEventUnlockedSteps,
    newPlayerEventDaysLeft,
    newPlayerEventChosenHeroId,
    newPlayerEventFinished,
    claimNewPlayerEventStep,
    chooseNewPlayerEventHero,
    playerName,
  } = useGame();

  if (!isNewPlayerEventOpen) return null;

  const nextStepNumber = Math.min(newPlayerEventClaimedCount + 1, NEW_PLAYER_EVENT_DAYS);
  const nextStep = NEW_PLAYER_EVENT_STEPS[nextStepNumber - 1];
  const nextUnlocked = newPlayerEventUnlockedSteps >= nextStepNumber;
  const choicePending = !!nextStep?.heroChoice && nextUnlocked && !newPlayerEventFinished;
  const progressPct = Math.round((newPlayerEventClaimedCount / NEW_PLAYER_EVENT_DAYS) * 100);

  const handleClaim = () => {
    if (!nextUnlocked || choicePending) return;
    const ok = claimNewPlayerEventStep();
    if (!ok) return;
    launchConfetti({ particleCount: 90, spread: 80, origin: { y: 0.55 } });
  };

  const handleChoose = (heroId: string) => {
    const ok = chooseNewPlayerEventHero(heroId);
    if (!ok) {
      sound.playSFX('hurt');
      return;
    }
    launchConfetti({ particleCount: 170, spread: 100, origin: { y: 0.5 } });
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) closeNewPlayerEvent();
      }}
      className="fixed inset-0 z-[61] flex items-center justify-center bg-black/85 backdrop-blur-xs p-2 sm:p-4 select-none animate-fade-in"
    >
      <div className="relative w-full max-w-[420px] max-h-[94vh] flex flex-col overflow-hidden rounded-2xl wood-frame">
        <img
          src="/assets/ui/nav_bar_wood_background.jpg"
          alt=""
          className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none opacity-30 mix-blend-luminosity"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#2b1107]/55 via-[#200c05]/80 to-[#150702]/90 pointer-events-none" />

        {/* ===== Cabecera ===== */}
        <header className="relative z-10 shrink-0 px-3.5 pt-3 pb-2 border-b border-[#5a230c]">
          <div className="flex items-start gap-2">
            <div className="w-8 h-8 rounded-full border border-[#8a4419] bg-[#200c05] flex items-center justify-center shrink-0 shadow-inner">
              <Star className="w-4 h-4 text-amber-300" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-serif text-[14px] font-black uppercase tracking-[0.14em] text-amber-200 leading-none drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
                Evento de Bienvenida
              </h2>
              <p className="mt-1 text-[8.5px] uppercase tracking-[0.16em] text-amber-300/60 font-bold">
                Nuevos aventureros · 14 días
              </p>
            </div>
            <div className="shrink-0 flex items-center gap-1.5">
              <div className="px-1.5 py-[3px] rounded-md border border-[#6d280d] bg-[#2e1207]">
                <span className="font-mono text-[9px] font-black text-amber-200 tracking-wide">
                  {newPlayerEventFinished
                    ? 'COMPLETO'
                    : `${newPlayerEventDaysLeft} ${newPlayerEventDaysLeft === 1 ? 'DÍA' : 'DÍAS'}`}
                </span>
              </div>
              <button
                type="button"
                onClick={closeNewPlayerEvent}
                className="w-6 h-6 rounded-full border border-[#5a230c] bg-[#200c05] flex items-center justify-center text-amber-300/70 hover:text-amber-200 hover:border-[#8a4419] active:scale-95 transition-all cursor-pointer"
                aria-label="Cerrar evento de bienvenida"
                title="Cerrar evento de bienvenida"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Progreso */}
          <div className="mt-2 flex items-center gap-2">
            <div className="relative h-1.5 flex-1 rounded-full bg-[#120703] border border-[#5a230c] overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <span className="font-mono text-[9px] font-black text-amber-200/90 shrink-0">
              {newPlayerEventClaimedCount}/{NEW_PLAYER_EVENT_DAYS}
            </span>
          </div>
        </header>

        {/* ===== Recompensa del día / elección final ===== */}
        <section className="relative z-10 shrink-0 px-3 pt-2.5">
          {newPlayerEventFinished ? (
            <div className="rounded-xl border border-[#521c08] bg-[#1b0a04] p-3 text-center">
              <div className="flex items-center justify-center gap-1.5 text-[11px] font-black uppercase tracking-[0.12em] text-amber-200">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                Evento completado
              </div>
              {newPlayerEventChosenHeroId && (
                <div className="mt-2 flex items-center justify-center gap-2">
                  <img
                    src={
                      NEW_PLAYER_HERO_CHOICES.find((c) => c.id === newPlayerEventChosenHeroId)?.portrait ??
                      '/assets/portraits/chispo_deez_icono.png'
                    }
                    alt="Héroe elegido"
                    className="w-12 h-12 rounded-lg object-cover object-top border border-[#8a4419]"
                  />
                  <div className="text-left">
                    <p className="text-[10.5px] font-black text-amber-100">
                      {NEW_PLAYER_HERO_CHOICES.find((c) => c.id === newPlayerEventChosenHeroId)?.name}
                    </p>
                    <p className="text-[8.5px] uppercase tracking-[0.1em] text-amber-300/60">
                      Se unió a tu equipo
                    </p>
                  </div>
                </div>
              )}
              <p className="mt-2 text-[9px] text-stone-400 leading-snug">
                {playerName}, ya tienes todas las recompensas de bienvenida. ¡Nos vemos en Icespear!
              </p>
            </div>
          ) : choicePending ? (
            <div className="rounded-xl border border-amber-600/70 bg-gradient-to-r from-[#2e1207] via-[#1b0a04] to-[#2e1207] p-2.5">
              <div className="flex items-center justify-center gap-1.5 pb-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span className="text-[10px] font-black uppercase tracking-[0.12em] text-amber-200">
                  Elige a tu héroe de bienvenida
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {NEW_PLAYER_HERO_CHOICES.map((choice) => (
                  <button
                    key={choice.id}
                    type="button"
                    onClick={() => handleChoose(choice.id)}
                    className="group relative rounded-lg overflow-hidden border border-[#6d280d] bg-[#120703] text-left hover:border-amber-500 transition-all cursor-pointer active:scale-[0.98]"
                    title={`Elegir a ${choice.name}`}
                  >
                    <div className="relative h-[92px] overflow-hidden">
                      <img
                        src={choice.portrait}
                        alt={choice.name}
                        className="w-full h-full object-cover object-top opacity-95 group-hover:opacity-100"
                      />
                      <span
                        className="absolute inset-x-0 bottom-0 h-[2px]"
                        style={{ backgroundColor: choice.accent }}
                      />
                      <span className="absolute top-1 right-1 px-1 py-[1px] rounded bg-[#120703]/90 border border-[#6d280d] text-[7px] font-black uppercase tracking-wide text-amber-200">
                        {choice.attribute}
                      </span>
                    </div>
                    <div className="px-1.5 py-1">
                      <p className="text-[10px] font-black text-amber-100 truncate">{choice.name}</p>
                      <p className="text-[7.5px] uppercase tracking-[0.08em] text-amber-300/60 truncate">
                        {choice.title}
                      </p>
                      <p className="mt-1 text-[7.5px] italic text-stone-400 line-clamp-2">“{choice.quote}”</p>
                      <span className="mt-1.5 flex items-center justify-center gap-1 rounded-md bg-gradient-to-r from-amber-600 to-amber-700 py-[3px] text-[8px] font-black uppercase tracking-[0.1em] text-white group-hover:from-amber-500 group-hover:to-amber-600">
                        <Gift className="w-2.5 h-2.5" />
                        Elegir
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div
              className={`relative rounded-xl border p-2 flex items-center gap-2.5 overflow-hidden ${
                nextUnlocked
                  ? 'border-amber-600/70 bg-gradient-to-r from-[#2e1207] via-[#1b0a04] to-[#2e1207]'
                  : 'border-[#521c08] bg-[#1b0a04]'
              }`}
            >
              <div className="relative shrink-0 w-[52px] h-[52px] rounded-lg border border-[#6d280d] bg-[#120703] flex items-center justify-center shadow-inner">
                <img
                  src={nextStep?.icon}
                  alt={nextStep?.title ?? ''}
                  className={`w-[42px] h-[42px] object-contain drop-shadow ${nextUnlocked ? '' : 'opacity-50 grayscale-[40%]'}`}
                />
                <span className="absolute -top-1.5 -left-1.5 px-1 py-[1px] rounded bg-amber-600 text-[#2b1603] text-[7.5px] font-black tracking-wide">
                  D{nextStepNumber}
                </span>
              </div>
              <div className="relative min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-serif font-black text-[11.5px] text-amber-200 truncate">{nextStep?.title}</h3>
                  {!nextUnlocked && (
                    <span className="shrink-0 inline-flex items-center gap-0.5 rounded bg-[#2e1207] border border-[#6d280d] px-1 py-[1px] text-[7px] font-black uppercase tracking-wide text-amber-300/70">
                      <Lock className="w-2 h-2" /> Bloqueado
                    </span>
                  )}
                </div>
                <p className="text-[9px] text-stone-300/85 leading-snug line-clamp-2">{nextStep?.subtitle}</p>
                <div className="mt-1 flex flex-wrap items-center gap-1">
                  {nextStep?.gold ? (
                    <CurrencyChip
                      icon="/assets/items/moneda_de_moonhaven.png"
                      value={`+${nextStep.gold.toLocaleString('es-ES')}`}
                    />
                  ) : null}
                  {nextStep?.crystals ? (
                    <CurrencyChip
                      icon="/assets/items/gema_del_recuerdo.png"
                      value={`+${nextStep.crystals.toLocaleString('es-ES')}`}
                      tone="crystal"
                    />
                  ) : null}
                  {nextStep?.items?.map((item) => (
                    <CurrencyChip key={item.id} icon={item.icon} value={`${item.name} x${item.count}`} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ===== Pista de 14 días ===== */}
        {!newPlayerEventFinished && (
          <section className="relative z-10 flex-1 min-h-0 overflow-y-auto no-scrollbar px-3 pt-2.5 pb-1">
            <div className="grid grid-cols-7 gap-1">
              {NEW_PLAYER_EVENT_STEPS.map((step) => {
                const isClaimed = step.day <= newPlayerEventClaimedCount;
                const isNext = step.day === newPlayerEventClaimedCount + 1;
                const isUnlocked = step.day <= newPlayerEventUnlockedSteps;

                return (
                  <div
                    key={step.day}
                    title={`Día ${step.day} · ${step.title}`}
                    className={`relative rounded-md border px-0.5 py-1 flex flex-col items-center gap-0.5 ${
                      isClaimed
                        ? 'border-emerald-800/70 bg-[#0f1a12]'
                        : isNext && isUnlocked
                        ? 'border-amber-500 bg-[#2e1207] shadow-[0_0_8px_rgba(245,158,11,0.35)]'
                        : isUnlocked
                        ? 'border-[#6d280d] bg-[#200c05]'
                        : 'border-[#5a230c]/70 bg-[#170803]'
                    }`}
                  >
                    <span
                      className={`text-[7px] font-black uppercase tracking-wider ${
                        isNext && isUnlocked ? 'text-amber-200' : 'text-amber-300/55'
                      }`}
                    >
                      D{step.day}
                    </span>
                    <div className="relative">
                      <img
                        src={step.icon}
                        alt=""
                        className={`w-[18px] h-[18px] object-contain ${
                          isClaimed ? 'opacity-60' : isUnlocked ? '' : 'opacity-35 grayscale'
                        }`}
                      />
                      {isClaimed && (
                        <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-700 border border-[#140803] flex items-center justify-center">
                          <Check className="w-1.5 h-1.5 text-emerald-50" strokeWidth={4} />
                        </span>
                      )}
                      {!isUnlocked && !isClaimed && (
                        <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#200c05] border border-[#5a230c] flex items-center justify-center">
                          <Lock className="w-[5px] h-[5px] text-amber-300/60" />
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="mt-1.5 text-center text-[8px] uppercase tracking-[0.12em] text-stone-500">
              Un paso se desbloquea cada día · el día 14 eliges héroe
            </p>
          </section>
        )}

        {/* ===== Reclamo ===== */}
        {!newPlayerEventFinished && !choicePending && (
          <footer className="relative z-10 shrink-0 px-3 pt-2 pb-3">
            <button
              type="button"
              onClick={handleClaim}
              disabled={!nextUnlocked}
              className={`group relative w-full overflow-hidden rounded-xl border py-2.5 transition-transform ${
                nextUnlocked
                  ? 'border-amber-500/60 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 cursor-pointer active:scale-[0.985] shadow-[0_6px_16px_rgba(0,0,0,0.6)]'
                  : 'border-[#521c08] bg-[#1b0a04] cursor-not-allowed'
              }`}
            >
              {nextUnlocked && (
                <span className="absolute inset-y-0 -left-1/3 w-1/3 bg-[linear-gradient(100deg,transparent,rgba(255,255,255,0.35),transparent)] animate-gold-shine pointer-events-none" />
              )}
              <span
                className={`relative flex items-center justify-center gap-1.5 text-[11.5px] font-black uppercase tracking-[0.14em] ${
                  nextUnlocked ? 'text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.4)]' : 'text-amber-300/45'
                }`}
              >
                <Gift className="w-4 h-4" />
                {nextUnlocked ? 'Reclamar recompensa' : `Se desbloquea mañana`}
              </span>
            </button>
          </footer>
        )}
      </div>
    </div>
  );
};
