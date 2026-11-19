import React from 'react';

/**
 * Escarcha visible de las criaturas de Tundra.
 *
 * Pinta una capa de hielo sobre el elemento que esté congelado (barra de vida, orbe de
 * definitiva, botón de inventario o de huida). `intensity` va de 0 a 1 y se usa para
 * espesar la costra: cuanto más alta, más opaco el velo, más gruesas las grietas, más
 * largos los carámbanos y más fuerte la distorsión (backdrop-filter) de lo que hay debajo.
 *
 * `mode="bar"` cubre de derecha a izquierda, como la corrosión del Devorador, para que se
 * vea cómo el hielo avanza por la barra con cada carga.
 */
export const FrostFreezeOverlay: React.FC<{
  intensity: number;
  mode?: 'full' | 'bar';
  className?: string;
}> = ({ intensity, mode = 'full', className = '' }) => {
  const t = Math.max(0, Math.min(1, intensity));
  if (t <= 0) return null;

  const cover =
    mode === 'bar'
      ? { top: 0, bottom: 0, right: 0, width: `${Math.round(t * 100)}%` }
      : { top: 0, right: 0, bottom: 0, left: 0 };

  const blurPx = (0.5 + t * 1.6).toFixed(2);
  const saturate = (1 - t * 0.65).toFixed(2);
  const frostMask = [
    `radial-gradient(circle at 18% 24%, #000 0 ${18 + t * 16}%, transparent ${34 + t * 12}%)`,
    `radial-gradient(circle at 72% 68%, #000 0 ${20 + t * 18}%, transparent ${38 + t * 12}%)`,
    `radial-gradient(circle at 45% 100%, #000 0 ${26 + t * 20}%, transparent ${44 + t * 14}%)`,
  ].join(', ');

  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      aria-hidden
    >
      <div className="absolute" style={cover}>
        {/* Distorsión: lo congelado se ve helado y desaturado por debajo. */}
        <div
          className="absolute inset-0"
          style={{
            backdropFilter: `blur(${blurPx}px) saturate(${saturate}) brightness(${(1 - t * 0.12).toFixed(2)})`,
            WebkitBackdropFilter: `blur(${blurPx}px) saturate(${saturate}) brightness(${(1 - t * 0.12).toFixed(2)})`,
          }}
        />

        {/* Velo de hielo con máscara de cristales: crece con la carga. */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(118deg, rgba(224,244,255,0.85) 0%, rgba(125,211,252,0.6) 45%, rgba(240,250,255,0.95) 100%)',
            opacity: 0.32 + t * 0.5,
            WebkitMaskImage: frostMask,
            maskImage: frostMask,
          }}
        />

        {/* Grietas y agujas de hielo. */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `repeating-linear-gradient(112deg, rgba(255,255,255,0.85) 0 ${1 + t}px, transparent ${1 + t}px ${9 - t * 4}px)`,
            opacity: 0.1 + t * 0.32,
          }}
        />

        {/* Borde helado que enmarca lo congelado. */}
        <div
          className="absolute inset-0"
          style={{
            boxShadow: `inset 0 0 ${4 + t * 8}px rgba(224,242,254,${0.55 + t * 0.4}), inset 0 0 ${1 + t * 2}px rgba(255,255,255,0.95)`,
          }}
        />

        {/* Carámbanos colgando de la base. */}
        <div
          className="absolute bottom-0 left-0 right-0"
          style={{
            height: `${Math.round(3 + t * 11)}px`,
            backgroundImage:
              'repeating-linear-gradient(90deg, rgba(240,250,255,0.98) 0 2px, rgba(147,214,255,0.8) 2px 3px, transparent 3px 7px)',
            clipPath:
              'polygon(0 0, 100% 0, 100% 30%, 93% 100%, 86% 35%, 78% 88%, 70% 28%, 62% 92%, 54% 32%, 46% 100%, 38% 30%, 30% 86%, 22% 34%, 14% 95%, 7% 28%, 0 62%)',
            opacity: 0.7 + t * 0.3,
          }}
        />
      </div>
    </div>
  );
};

export default FrostFreezeOverlay;
