import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { EnemyDossier } from '../data/enemyDossier';

interface EnemyDossierHoldProps {
  enemy: {
    uid: string;
    name: string;
    title: string;
    hp: number;
    maxHp: number;
    spriteUrl: string;
  };
  dossier: EnemyDossier;
  /** Tiempo que hay que mantener pulsado para completar el anillo. */
  holdMs?: number;
}

const EMBLEM_SRC = '/assets/ui/enemy_scan_emblem.webp';

const formatNumber = (value: number) => value.toLocaleString('es-ES');

const Stat: React.FC<{ label: string; value: string; align?: 'left' | 'right' }> = ({
  label,
  value,
  align = 'left',
}) => (
  <div className={align === 'right' ? 'text-right' : 'text-left'}>
    <div className="text-[10px] uppercase tracking-wider text-stone-400 font-bold">{label}</div>
    <div className="text-base font-black text-stone-50 leading-none mt-0.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
      {value}
    </div>
  </div>
);

const Chip: React.FC<{ children: React.ReactNode; tone?: 'resist' | 'immune' | 'empty' }> = ({
  children,
  tone = 'resist',
}) => (
  <span
    className={`px-2 py-1 rounded-lg border text-[10px] font-bold leading-tight ${
      tone === 'immune'
        ? 'border-emerald-400/50 bg-emerald-500/12 text-emerald-200'
        : tone === 'empty'
        ? 'border-stone-700/70 bg-stone-900/60 text-stone-500'
        : 'border-amber-400/45 bg-amber-500/12 text-amber-200'
    }`}
  >
    {children}
  </span>
);

/**
 * Inspección de enemigo: al mantener pulsado sobre él se dibuja el emblema con un relleno
 * radial en sentido horario y, al completarse, se abre su ficha con estadísticas, pasiva,
 * resistencias, inmunidades y sus tres habilidades.
 */
export const EnemyDossierHold: React.FC<EnemyDossierHoldProps> = ({
  enemy,
  dossier,
  holdMs = 900,
}) => {
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<'idle' | 'holding' | 'burst'>('idle');
  const originRef = useRef<{ x: number; y: number } | null>(null);
  const fillRef = useRef<HTMLImageElement | null>(null);
  const chargeRef = useRef<HTMLDivElement | null>(null);
  const holdTimerRef = useRef<number | null>(null);
  const burstTimerRef = useRef<number | null>(null);

  const clearTimers = () => {
    if (holdTimerRef.current !== null) {
      window.clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    if (burstTimerRef.current !== null) {
      window.clearTimeout(burstTimerRef.current);
      burstTimerRef.current = null;
    }
  };

  const resetFill = useCallback(() => {
    const el = fillRef.current;
    if (!el) return;
    el.style.transition = 'none';
    el.style.setProperty('--hold', '0deg');
  }, []);

  const startFill = useCallback(() => {
    const el = fillRef.current;
    if (!el) return;
    el.style.transition = 'none';
    el.style.setProperty('--hold', '0deg');
    // Fuerza un reflow para que la transición arranque desde 0deg y no desde el final anterior.
    void el.offsetWidth;
    el.style.transition = `--hold ${holdMs}ms linear`;
    el.style.setProperty('--hold', '360deg');

    // Reinicia el brillo de carga para que cada pulsación vuelva a encenderse desde cero.
    const charge = chargeRef.current;
    if (charge) {
      charge.style.animation = 'none';
      void charge.offsetWidth;
      charge.style.animation = '';
    }
  }, [holdMs]);

  const cancelHold = useCallback(() => {
    clearTimers();
    originRef.current = null;
    setPhase('idle');
    resetFill();
  }, [resetFill]);

  const handlePointerDown = (event: React.PointerEvent) => {
    if (open) return;
    event.preventDefault();
    originRef.current = { x: event.clientX, y: event.clientY };
    clearTimers();
    setPhase('holding');
    startFill();
    holdTimerRef.current = window.setTimeout(() => {
      holdTimerRef.current = null;
      // Estallido de anillos antes de que la ficha tape la arena.
      setPhase('burst');
      burstTimerRef.current = window.setTimeout(() => {
        burstTimerRef.current = null;
        setPhase('idle');
        setOpen(true);
      }, 200);
    }, holdMs);
  };

  const handlePointerMove = (event: React.PointerEvent) => {
    if (open) return;
    const origin = originRef.current;
    if (!origin) return;
    if (Math.hypot(event.clientX - origin.x, event.clientY - origin.y) > 26) cancelHold();
  };

  const handlePointerEnd = () => {
    // Con la ficha abierta el gesto ya terminó: se cierra con su botón o tocando el fondo.
    if (!open) cancelHold();
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => () => clearTimers(), []);

  const panel = open
    ? createPortal(
        <div
          className="fixed inset-0 z-[90] overflow-y-auto bg-[#040d14]/95 backdrop-blur-md text-stone-100 animate-[dossierIn_0.18s_ease-out]"
          onPointerDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_16%,rgba(14,165,233,0.45),transparent_62%),radial-gradient(circle_at_50%_88%,rgba(2,132,199,0.32),transparent_66%)]" />

          <div className="relative px-4 pt-4 pb-2 flex items-start gap-2">
            <button
              onClick={() => setOpen(false)}
              aria-label="Cerrar ficha"
              className="w-8 h-8 shrink-0 rounded-full border border-stone-600/80 bg-black/50 text-stone-300 font-black cursor-pointer hover:text-white"
            >
              ✕
            </button>
            <div className="flex-1 min-w-0 text-center">
              <h2 className="text-lg font-black tracking-wide truncate">{enemy.name}</h2>
              <div className="flex items-center justify-center gap-2 mt-1">
                <span className="px-2 py-0.5 rounded-full border border-cyan-400/50 bg-cyan-500/15 text-cyan-200 text-[11px] font-bold">
                  Nv. {dossier.level}
                </span>
                <span className="px-2 py-0.5 rounded-full border border-amber-400/45 bg-amber-500/15 text-amber-200 text-[11px] font-bold">
                  {dossier.role}
                </span>
              </div>
            </div>
            <div className="w-8 shrink-0" />
          </div>

          <div className="relative px-4 flex flex-wrap justify-center gap-1.5 mb-1">
            {dossier.badges.map((badge, index) => (
              <span
                key={`${badge.label}-${index}`}
                title={badge.label}
                className="w-7 h-7 rounded-lg border border-sky-400/40 bg-sky-500/15 flex items-center justify-center text-sm shadow-[0_0_10px_rgba(56,189,248,0.35)]"
              >
                {badge.icon}
              </span>
            ))}
          </div>

          <div className="relative flex items-center justify-between gap-2 px-4 py-2">
            <div className="flex flex-col gap-3">
              <Stat label="Ataque" value={formatNumber(dossier.attack)} />
              <Stat label="Defensa" value={`${dossier.defense}%`} />
            </div>
            <img
              src={enemy.spriteUrl}
              alt={enemy.name}
              className="h-32 max-w-[45%] object-contain drop-shadow-[0_0_26px_rgba(56,189,248,0.55)]"
            />
            <div className="flex flex-col gap-3">
              <Stat label="PV restantes" value={formatNumber(enemy.hp)} align="right" />
              <Stat label="PV máximos" value={formatNumber(enemy.maxHp)} align="right" />
            </div>
          </div>

          <div className="relative px-4 mt-1">
            <div className="text-[10px] font-black uppercase tracking-widest text-sky-300 mb-1">
              Pasiva
            </div>
            <ul className="space-y-1">
              {dossier.passives.map((passive) => (
                <li
                  key={passive}
                  className="text-[11px] leading-snug text-stone-300 border-l-2 border-sky-500/60 pl-2"
                >
                  {passive}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative px-4 mt-3 grid grid-cols-2 gap-2">
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-amber-300 mb-1">
                Resistencias
              </div>
              <div className="flex flex-wrap gap-1">
                {dossier.resistances.length > 0 ? (
                  dossier.resistances.map((item) => <Chip key={item}>{item}</Chip>)
                ) : (
                  <Chip tone="empty">Sin resistencias conocidas</Chip>
                )}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-emerald-300 mb-1">
                Inmunidades
              </div>
              <div className="flex flex-wrap gap-1">
                {dossier.immunities.length > 0 ? (
                  dossier.immunities.map((item) => (
                    <Chip key={item} tone="immune">
                      {item}
                    </Chip>
                  ))
                ) : (
                  <Chip tone="empty">Ninguna conocida</Chip>
                )}
              </div>
            </div>
          </div>

          <div className="relative px-4 pb-8 mt-4 grid grid-cols-3 gap-2">
            {dossier.skills.map((skill) => (
              <div
                key={skill.label}
                className="rounded-xl border border-stone-700/80 bg-gradient-to-b from-stone-800/90 to-stone-950/95 p-2 flex flex-col min-h-[132px]"
              >
                <div
                  className="text-[9px] font-black uppercase tracking-wider"
                  style={{ color: skill.typeColor }}
                >
                  {skill.typeIcon} {skill.typeLabel}
                </div>
                <div className="text-[11px] font-black leading-tight mt-0.5">{skill.name}</div>
                <div className="text-[9px] leading-snug text-stone-400 mt-1 line-clamp-4">
                  {skill.desc}
                </div>
                {skill.effect && (
                  <div className="text-[9px] text-sky-300 mt-1 leading-tight">{skill.effect}</div>
                )}
                <div className="mt-auto pt-1 text-[10px] font-mono font-bold text-amber-300">
                  {skill.damage} DMG
                </div>
                <div className="text-[9px] uppercase tracking-wider text-stone-500 mt-0.5">
                  {skill.label}
                </div>
              </div>
            ))}
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <>
      <div
        role="button"
        aria-label={`Mantén pulsado para inspeccionar a ${enemy.name}`}
        data-enemy-inspect=""
        className="absolute inset-0 z-[60] pointer-events-auto"
        style={{ touchAction: 'none' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onContextMenu={(event) => event.preventDefault()}
      />

      <div
        aria-hidden="true"
        className={`absolute left-1/2 top-1/2 z-[62] w-[88px] h-[88px] -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-opacity duration-100 ${
          phase === 'idle' ? 'opacity-0' : 'opacity-100'
        }`}
        style={{ '--hold-ms': `${holdMs}ms` } as React.CSSProperties}
      >
        <div
          className={`enemy-scan-shell absolute inset-0 ${
            phase === 'holding' ? 'enemy-scan-shell--in' : ''
          }`}
        >
          <img
            src={EMBLEM_SRC}
            alt=""
            className="enemy-scan-ghost absolute inset-0 w-full h-full object-contain"
          />
          <div className="enemy-scan-fill-wrap absolute inset-0">
            <img
              ref={fillRef}
              src={EMBLEM_SRC}
              alt=""
              className="enemy-scan-fill absolute inset-0 w-full h-full object-contain"
            />
          </div>
          <div ref={chargeRef} className="enemy-scan-charge absolute inset-0 rounded-full" />
          <div className="enemy-scan-ring absolute inset-0 rounded-full" />
        </div>

        {phase === 'burst' && (
          <>
            <div className="enemy-scan-burst absolute inset-0 rounded-full" />
            <div className="enemy-scan-burst enemy-scan-burst--late absolute inset-0 rounded-full" />
          </>
        )}
      </div>

      {panel}
    </>
  );
};

export default EnemyDossierHold;
