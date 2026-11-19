import React, { useMemo } from 'react';

export type StageAmbientEffect = 'snow' | 'rain' | 'fog' | 'dust' | 'wind' | 'embers';

/** Efecto de ambiente que le pega a cada fondo de combate. */
export const AMBIENT_BY_BACKGROUND: Record<string, StageAmbientEffect> = {
  '/assets/backgrounds/icespear_combate_guardias.webp': 'snow',
  '/assets/backgrounds/bosque_icespear.webp': 'snow',
  '/assets/backgrounds/puertas_selladas_glimmerstone.webp': 'snow',
  '/assets/backgrounds/cueva_congelada.webp': 'snow',
  '/assets/backgrounds/camino_bosque_carromatos.webp': 'wind',
  '/assets/backgrounds/asalto_orco_combate.webp': 'wind',
  '/assets/backgrounds/emboscada_combate.webp': 'fog',
  '/assets/backgrounds/callejon_trasero_taberna.webp': 'rain',
  '/assets/backgrounds/barracon_combate.webp': 'fog',
  '/assets/backgrounds/iglesia_destrozada_combate.webp': 'fog',
  '/assets/backgrounds/primera_camara_gorgon.webp': 'fog',
  '/assets/backgrounds/segunda_camara_aire.webp': 'wind',
  '/assets/backgrounds/tercera_camara_bulezau.webp': 'dust',
  '/assets/backgrounds/mina_underdark_telaranas.webp': 'dust',
  '/assets/backgrounds/cueva_huevos_carmesis.webp': 'dust',
  '/assets/backgrounds/recibidor_mansion_ferton.webp': 'dust',
  '/assets/backgrounds/escaleras_mansion_ferton.webp': 'dust',
  '/assets/backgrounds/coliseo_onirico_bg.webp': 'embers',
  '/assets/backgrounds/sala_tesoro_ignivrax.webp': 'embers',
  '/assets/aistudio/image_4daa80e0.webp': 'snow',
};

const COUNT: Record<StageAmbientEffect, number> = {
  snow: 26,
  rain: 30,
  fog: 4,
  dust: 22,
  wind: 14,
  embers: 16,
};

const DURATION: Record<StageAmbientEffect, [number, number]> = {
  snow: [6, 12],
  rain: [1.4, 2.3],
  fog: [22, 34],
  dust: [14, 22],
  wind: [9, 16],
  embers: [6, 12],
};

const SEED: Record<StageAmbientEffect, number> = {
  snow: 17,
  rain: 29,
  fog: 43,
  dust: 53,
  wind: 67,
  embers: 83,
};

interface Particle {
  id: number;
  left: number;
  top: number;
  size: number;
  drift: number;
  delay: number;
  duration: number;
  opacity: number;
}

/** Partículas deterministas: cada efecto tiene su semilla, así no bailan entre renders. */
const buildParticles = (effect: StageAmbientEffect): Particle[] => {
  let seed = SEED[effect];
  const rnd = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
  return Array.from({ length: COUNT[effect] }, (_, id) => ({
    id,
    left: rnd() * 100,
    top: rnd() * 100,
    size: 0.6 + rnd() * 0.9,
    drift: (rnd() - 0.5) * 70,
    delay: -rnd() * 16,
    duration: DURATION[effect][0] + rnd() * (DURATION[effect][1] - DURATION[effect][0]),
    opacity: 0.18 + rnd() * 0.32,
  }));
};

/**
 * Capa de ambiente sutil sobre el fondo de combate: nieve, lluvia, niebla, polvo,
 * viento o brasas. Solo decora: no captura clics ni tapa a los combatientes.
 */
export const StageAmbientFx: React.FC<{ effect: StageAmbientEffect }> = ({ effect }) => {
  const particles = useMemo(() => buildParticles(effect), [effect]);

  return (
    <div
      aria-hidden="true"
      className={`stage-fx stage-fx--${effect} absolute inset-0 overflow-hidden pointer-events-none`}
    >
      {particles.map((p) => (
        <span
          key={p.id}
          className="stage-fx__p"
          style={
            {
              left: `${p.left.toFixed(2)}%`,
              top: `${p.top.toFixed(2)}%`,
              width:
                effect === 'fog'
                  ? `${(38 + p.size * 16).toFixed(1)}%`
                  : effect === 'rain'
                  ? '1px'
                  : effect === 'wind'
                  ? `${(18 + p.size * 14).toFixed(0)}px`
                  : `${(p.size * 3).toFixed(1)}px`,
              height:
                effect === 'fog'
                  ? `${(26 + p.size * 12).toFixed(1)}%`
                  : effect === 'rain'
                  ? `${(p.size * 18).toFixed(0)}px`
                  : `${(p.size * 3).toFixed(1)}px`,
              opacity: p.opacity,
              animationDelay: `${p.delay.toFixed(2)}s`,
              animationDuration: `${p.duration.toFixed(2)}s`,
              '--fx-drift': `${p.drift.toFixed(0)}px`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
};
