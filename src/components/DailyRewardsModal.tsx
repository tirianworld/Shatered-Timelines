import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useGame } from '../context/GameContext';
import { sound } from '../services/soundService';
import { launchConfetti } from '../utils/confetti';
import { DAILY_REWARDS, getDailyReward } from '../data/dailyRewardsData';
import { DAILY_PRESENTERS, getDailyPresenter, getPresenterLine } from '../data/dailyRewardPresenters';
import { Check, CheckCircle2, Flame, Gift, Hourglass, Lock, Sparkles, Users, X } from 'lucide-react';

const CYCLE_DAYS = DAILY_REWARDS.length;

/** Milisegundos que faltan para el próximo reinicio (medianoche local). */
const msUntilReset = (): number => {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
  return Math.max(0, next.getTime() - now.getTime());
};

const formatCountdown = (ms: number): string => {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${`${h}`.padStart(2, '0')}:${`${m}`.padStart(2, '0')}:${`${s}`.padStart(2, '0')}`;
};

/** Esquina tallada del marco de madera, como el resto de menús. */
const Corner: React.FC<{ position: 'tl' | 'tr' | 'bl' | 'br' }> = ({ position }) => {
  const base = 'pointer-events-none absolute w-5 h-5 border-[#8a4419]/70';
  const map = {
    tl: 'left-1 top-1 border-l-2 border-t-2 rounded-tl-md',
    tr: 'right-1 top-1 border-r-2 border-t-2 rounded-tr-md',
    bl: 'left-1 bottom-1 border-l-2 border-b-2 rounded-bl-md',
    br: 'right-1 bottom-1 border-r-2 border-b-2 rounded-br-md',
  } as const;
  return <span className={`${base} ${map[position]}`} />;
};

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

export const DailyRewardsModal: React.FC = () => {
  const {
    isDailyRewardsOpen,
    setIsDailyRewardsOpen,
    dailyRewardAvailable,
    dailyRewardDay,
    dailyRewardStreak,
    dailyRewardClaimedToday,
    claimDailyReward,
    playerName,
    dailyRewardPresenterId,
    setDailyRewardPresenter,
    maybeOpenNewPlayerEventAfterDaily,
  } = useGame();

  const [justClaimed, setJustClaimed] = useState(false);
  const [remaining, setRemaining] = useState(msUntilReset());
  const [showPicker, setShowPicker] = useState(false);
  const [transientLine, setTransientLine] = useState<string | null>(null);
  const autoOpened = useRef(false);
  const transientTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const presenter = getDailyPresenter(dailyRewardPresenterId);
  const reward = getDailyReward(dailyRewardDay);
  const claimed = dailyRewardClaimedToday || justClaimed;

  // Encuadre de busto: el sprite se escala por altura y el marco recorta a la zona
  // del torso; el recorte lateral solo afecta a capas y armas, nunca a la cara.
  const bustWidth = 190;
  const bustHeight = 188;
  const bustScale = 376;

  const line = useMemo(
    () =>
      transientLine ??
      getPresenterLine(presenter, {
        claimed,
        isGrandPrize: reward.grand === true,
        day: dailyRewardDay,
        streak: dailyRewardStreak,
      }),
    [transientLine, presenter, claimed, reward.grand, dailyRewardDay, dailyRewardStreak]
  );

  // Se abre solo la primera vez que se carga el juego en el día.
  useEffect(() => {
    if (autoOpened.current) return;
    autoOpened.current = true;
    if (!dailyRewardAvailable) return;
    const timer = setTimeout(() => {
      setIsDailyRewardsOpen(true);
      sound.playSFX('powerup');
      launchConfetti({ particleCount: 70, spread: 65, origin: { y: 0.35 } });
    }, 900);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dailyRewardAvailable]);

  useEffect(() => {
    if (!isDailyRewardsOpen) {
      setJustClaimed(false);
      setShowPicker(false);
      setTransientLine(null);
      return;
    }
    setRemaining(msUntilReset());
    const id = setInterval(() => setRemaining(msUntilReset()), 1000);
    return () => clearInterval(id);
  }, [isDailyRewardsOpen]);

  useEffect(() => () => {
    if (transientTimer.current) clearTimeout(transientTimer.current);
  }, []);

  if (!isDailyRewardsOpen) return null;

  /** Al cerrar las recompensas diarias se ofrece el evento de bienvenida. */
  const closeDailyRewards = () => {
    setIsDailyRewardsOpen(false);
    maybeOpenNewPlayerEventAfterDaily();
  };

  const showTransient = (text: string) => {
    setTransientLine(text);
    if (transientTimer.current) clearTimeout(transientTimer.current);
    transientTimer.current = setTimeout(() => setTransientLine(null), 3200);
  };

  const handleClaim = () => {
    if (claimed) return;
    const ok = claimDailyReward();
    if (!ok) return;
    setJustClaimed(true);
    launchConfetti({ particleCount: 150, spread: 95, origin: { y: 0.5 } });
  };

  const handleAssign = (presenterId: string) => {
    if (presenterId !== presenter.id) {
      setDailyRewardPresenter(presenterId);
      sound.playSFX('upgrade');
      showTransient(getDailyPresenter(presenterId).lines.assigned);
    }
    setShowPicker(false);
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) closeDailyRewards();
      }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 backdrop-blur-xs p-2 sm:p-4 select-none animate-fade-in"
    >
      {/* Marco de madera del resto de menús */}
      <div className="relative w-full max-w-[420px] max-h-[94vh] flex flex-col overflow-hidden rounded-2xl wood-frame">
        <img
          src="/assets/ui/nav_bar_wood_background.jpg"
          alt=""
          className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none opacity-30 mix-blend-luminosity"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#2b1107]/55 via-[#200c05]/80 to-[#150702]/90 pointer-events-none" />
        <Corner position="tl" />
        <Corner position="tr" />
        <Corner position="bl" />
        <Corner position="br" />

        {/* ===== Cabecera ===== */}
        <header className="relative z-10 shrink-0 px-3.5 pt-3 pb-2 border-b border-[#5a230c]">
          <div className="flex items-start gap-2">
            <div className="w-8 h-8 rounded-full border border-[#8a4419] bg-[#200c05] flex items-center justify-center shrink-0 shadow-inner">
              <Gift className="w-4 h-4 text-amber-300" />
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="font-serif text-[14px] font-black uppercase tracking-[0.14em] text-amber-200 leading-none drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
                Recompensas Diarias
              </h2>
              <p className="mt-1 text-[8.5px] uppercase tracking-[0.16em] text-amber-300/60 font-bold">
                Bastión de Icespear
              </p>
            </div>

            <div className="shrink-0 flex items-center gap-1.5">
              <div className="px-1.5 py-[3px] rounded-md border border-[#6d280d] bg-[#2e1207]">
                <span className="font-mono text-[9px] font-black text-amber-200 tracking-wide">
                  DÍA {dailyRewardDay}/{CYCLE_DAYS}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  sound.playSFX('click');
                  closeDailyRewards();
                }}
                className="w-6 h-6 rounded-full border border-[#5a230c] bg-[#200c05] flex items-center justify-center text-amber-300/70 hover:text-amber-200 hover:border-[#8a4419] active:scale-95 transition-all cursor-pointer"
                title="Cerrar recompensas diarias"
                aria-label="Cerrar recompensas diarias"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Racha + reinicio */}
          <div className="mt-2 flex items-center justify-between gap-2 text-[9px] font-bold uppercase tracking-[0.1em]">
            <span className="inline-flex items-center gap-1 text-amber-300">
              <Flame className="w-3 h-3 text-orange-400" />
              Racha
              <strong className="font-mono text-amber-100">{Math.max(1, dailyRewardStreak)}</strong>
              <span className="text-amber-300/60">{Math.max(1, dailyRewardStreak) === 1 ? 'día' : 'días'}</span>
            </span>
            <span className="inline-flex items-center gap-1 text-amber-300/70">
              <Hourglass className="w-3 h-3" />
              Reinicio
              <strong className="font-mono tracking-normal text-amber-200">{formatCountdown(remaining)}</strong>
            </span>
          </div>
        </header>

        {/* ===== Escena del portador ===== */}
        <section className="relative z-10 shrink-0 h-[224px] overflow-hidden border-b border-[#5a230c] bg-[#150702]/60">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: `radial-gradient(ellipse at 74% 42%, ${presenter.accent}33, transparent 60%)` }}
          />
          <div className="absolute inset-x-8 bottom-[46px] h-px bg-gradient-to-r from-transparent via-[#8a4419]/70 to-transparent pointer-events-none" />

          {/* Retrato del portador: el mismo sprite, encuadrado del torso hacia arriba */}
          <div className="absolute right-2.5 bottom-0 overflow-hidden" style={{ width: bustWidth, height: bustHeight }}>
            <div className="relative flex h-full w-full justify-center">
              <img
                src={presenter.sprite}
                alt={presenter.name}
                className="h-auto max-w-none shrink-0 animate-presenter-float drop-shadow-[0_12px_16px_rgba(0,0,0,0.85)]"
                style={{
                  height: bustScale,
                  width: 'auto',
                  maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 82%, rgba(0,0,0,0) 100%)',
                  WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 82%, rgba(0,0,0,0) 100%)',
                }}
              />
            </div>

            {/* Botón redondo de asignación, en la esquina de la cajetilla del portador */}
            {!showPicker && (
              <button
                type="button"
                onClick={() => {
                  sound.playSFX('click');
                  setShowPicker(true);
                }}
                className="absolute top-1 right-1 z-30 w-7 h-7 rounded-full border border-[#8a4419] bg-[#200c05]/95 flex items-center justify-center text-amber-200 shadow-[0_3px_8px_rgba(0,0,0,0.75)] hover:bg-[#3a1708] hover:border-amber-500 active:scale-95 transition-all cursor-pointer"
                title="Asignar portador de las recompensas"
                aria-label="Asignar portador de las recompensas"
              >
                <Users className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Bocadillo con el diálogo único del portador */}
          <div className="absolute left-3 top-3 max-w-[47%]">
            <div className="relative rounded-xl rounded-bl-sm border border-[#a8652d]/70 bg-[#f4e4c4] px-2.5 py-2 shadow-[0_8px_16px_rgba(0,0,0,0.6)]">
              <p className="font-serif italic text-[10.5px] leading-snug text-[#3a1503]">“{line}”</p>
              <span className="absolute -bottom-[6px] right-6 w-2.5 h-2.5 rotate-45 bg-[#f4e4c4] border-r border-b border-[#a8652d]/70" />
            </div>
          </div>

          {showPicker && (
            <div className="absolute inset-x-0 bottom-0 z-20 border-t border-[#5a230c] bg-[#140803]/97 px-2.5 pt-1.5 pb-2 animate-fade-in">
              <div className="flex items-center justify-between pb-1">
                <span className="text-[8.5px] font-black uppercase tracking-[0.14em] text-amber-300/80">
                  ¿Quién entrega tu tributo?
                </span>
                <button
                  type="button"
                  onClick={() => setShowPicker(false)}
                  className="text-amber-300/70 hover:text-amber-200 cursor-pointer"
                  aria-label="Cerrar selector"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {DAILY_PRESENTERS.map((candidate) => {
                  const isSelected = candidate.id === presenter.id;
                  return (
                    <button
                      key={candidate.id}
                      type="button"
                      onClick={() => handleAssign(candidate.id)}
                      className={`group relative rounded-lg overflow-hidden border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.35)]'
                          : 'border-[#5a230c] hover:border-[#8a4419]'
                      }`}
                      title={`${candidate.name} · ${candidate.title}`}
                    >
                      <div className="relative h-[54px] bg-[#200c05] overflow-hidden">
                        <img
                          src={candidate.portrait}
                          alt={candidate.name}
                          className={`w-full h-full object-cover object-top ${
                            isSelected ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'
                          }`}
                        />
                        <span
                          className="absolute inset-x-0 bottom-0 h-[2px]"
                          style={{ backgroundColor: candidate.accent, opacity: isSelected ? 1 : 0.4 }}
                        />
                        {isSelected && (
                          <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-amber-500 flex items-center justify-center shadow">
                            <Check className="w-2.5 h-2.5 text-[#2b1603]" strokeWidth={4} />
                          </span>
                        )}
                      </div>
                      <span
                        className={`block truncate px-1 py-[2px] text-[8px] font-bold leading-tight ${
                          isSelected ? 'bg-[#2e1207] text-amber-100' : 'bg-[#170803]/95 text-amber-300/70'
                        }`}
                      >
                        {candidate.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {/* ===== Riel de 7 días ===== */}
        <section className="relative z-10 shrink-0 px-2.5 pt-2.5 pb-2 border-b border-[#5a230c]/70">
          <div className="relative grid grid-cols-7 gap-0.5">
            <div className="absolute left-3 right-3 top-[22px] h-px bg-gradient-to-r from-[#5a230c] via-[#8a4419]/70 to-[#5a230c]" />
            {DAILY_REWARDS.map((day) => {
              const isToday = day.day === dailyRewardDay;
              const isClaimedDay = claimed ? day.day <= dailyRewardDay : day.day < dailyRewardDay;
              const isFuture = !isToday && !isClaimedDay;

              return (
                <div key={day.day} className="relative flex flex-col items-center gap-0.5" title={day.title}>
                  <span
                    className={`text-[8px] font-black uppercase tracking-wider ${
                      isToday ? 'text-amber-200' : 'text-amber-300/55'
                    }`}
                  >
                    D{day.day}
                  </span>

                  <div
                    className={`relative w-[30px] h-[30px] rounded-full flex items-center justify-center border transition-all ${
                      isToday && !claimed
                        ? 'border-amber-400 bg-[#2e1207] shadow-[0_0_9px_rgba(245,158,11,0.55)]'
                        : isToday && claimed
                        ? 'border-[#8a4419] bg-[#200c05]'
                        : isClaimedDay
                        ? 'border-emerald-700/80 bg-[#0f1a12]'
                        : 'border-[#5a230c] bg-[#180a04]'
                    }`}
                  >
                    <img
                      src={day.icon}
                      alt={day.title}
                      className={`w-[19px] h-[19px] object-contain ${isFuture ? 'opacity-40 grayscale-[45%]' : ''}`}
                    />
                    {isClaimedDay && (
                      <span className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-emerald-700 border border-[#140803] flex items-center justify-center">
                        <Check className="w-2 h-2 text-emerald-50" strokeWidth={4} />
                      </span>
                    )}
                    {isFuture && (
                      <span className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-[#200c05] border border-[#5a230c] flex items-center justify-center">
                        <Lock className="w-[6px] h-[6px] text-amber-300/60" />
                      </span>
                    )}
                  </div>

                  <span
                    className={`font-mono text-[7.5px] font-bold leading-none text-center ${
                      isToday ? 'text-amber-200' : 'text-amber-300/60'
                    }`}
                  >
                    {day.crystals ? `${day.crystals}` : '—'}
                  </span>

                  {isToday && (
                    <span className="absolute -top-[3px] left-1/2 -translate-x-1/2 h-[2px] w-5 rounded-full bg-amber-400/80" />
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ===== Tributo de hoy ===== */}
        <section className="relative z-10 shrink-0 px-3 pt-2.5">
          <div
            className={`relative rounded-xl border p-2 flex items-center gap-2.5 overflow-hidden ${
              reward.grand
                ? 'border-amber-600/80 bg-gradient-to-r from-[#2e1207] via-[#1b0a04] to-[#2e1207]'
                : 'border-[#521c08] bg-[#1b0a04]'
            }`}
          >
            <div className="relative shrink-0 w-[52px] h-[52px] rounded-lg border border-[#6d280d] bg-[#120703] flex items-center justify-center shadow-inner">
              <img src={reward.icon} alt={reward.title} className="w-[42px] h-[42px] object-contain drop-shadow" />
              <span className="absolute -top-1.5 -left-1.5 px-1 py-[1px] rounded bg-amber-600 text-[#2b1603] text-[7.5px] font-black tracking-wide">
                D{reward.day}
              </span>
            </div>

            <div className="relative min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h3 className="font-serif font-black text-[11.5px] text-amber-200 truncate">{reward.title}</h3>
                {reward.grand && (
                  <span className="shrink-0 inline-flex items-center gap-0.5 rounded bg-amber-600 px-1 py-[1px] text-[7px] font-black uppercase tracking-wide text-[#2b1603]">
                    <Sparkles className="w-2 h-2" /> Gran premio
                  </span>
                )}
              </div>
              <p className="text-[9px] text-stone-300/85 leading-snug line-clamp-2">{reward.subtitle}</p>
              <div className="mt-1 flex flex-wrap items-center gap-1">
                {reward.gold ? (
                  <CurrencyChip icon="/assets/items/moneda_de_moonhaven.png" value={`+${reward.gold.toLocaleString('es-ES')}`} />
                ) : null}
                {reward.crystals ? (
                  <CurrencyChip
                    icon="/assets/items/gema_del_recuerdo.png"
                    value={`+${reward.crystals.toLocaleString('es-ES')}`}
                    tone="crystal"
                  />
                ) : null}
                {reward.items?.map((item) => (
                  <CurrencyChip key={item.id} icon={item.icon} value={`${item.name} x${item.count}`} />
                ))}
              </div>
            </div>

            {claimed && (
              <span className="absolute right-2 top-2 inline-flex items-center gap-0.5 rounded-full border border-emerald-700/70 bg-[#0f1a12] px-1.5 py-[2px] text-[7.5px] font-black uppercase tracking-wide text-emerald-300">
                <Check className="w-2 h-2" strokeWidth={4} /> Reclamado
              </span>
            )}
          </div>
        </section>

        {/* ===== Reclamo ===== */}
        <footer className="relative z-10 shrink-0 px-3 pt-2.5 pb-3">
          {claimed ? (
            <div className="relative w-full rounded-xl border border-[#521c08] bg-[#1b0a04] py-2.5 overflow-hidden">
              <span className="relative flex items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-amber-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Vuelve mañana
                <span className="font-mono tracking-normal text-amber-300">{formatCountdown(remaining)}</span>
              </span>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleClaim}
              className="group relative w-full overflow-hidden rounded-xl border border-amber-500/60 bg-gradient-to-r from-amber-600 to-amber-700 py-2.5 cursor-pointer active:scale-[0.985] transition-transform shadow-[0_6px_16px_rgba(0,0,0,0.6)] hover:from-amber-500 hover:to-amber-600"
            >
              <span className="absolute inset-y-0 -left-1/3 w-1/3 bg-[linear-gradient(100deg,transparent,rgba(255,255,255,0.35),transparent)] animate-gold-shine pointer-events-none" />
              <span className="relative flex items-center justify-center gap-1.5 text-[11.5px] font-black uppercase tracking-[0.14em] text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.4)]">
                <Gift className="w-4 h-4" />
                Reclamar tributo
              </span>
            </button>
          )}
          <p className="mt-1.5 text-center text-[8px] uppercase tracking-[0.14em] text-stone-500">
            Se renueva a medianoche · ciclo de {CYCLE_DAYS} días · {playerName}
          </p>
        </footer>
      </div>
    </div>
  );
};
