import React from 'react';
import { ActiveGachaEffect } from '../types/gachaCombatEffects';

export type CleanVFXStatus =
  | 'frozen'      // Partículas glaciares: motas de hielo y escarcha flotantes
  | 'stunned'     // Partículas eléctricas: chispas que parpadean rápidamente
  | 'paralyzed'   // Sobrecarga eléctrica
  | 'ignited'     // Ascuas ígneas: chispas cálidas que suben
  | 'atk_buff'    // Potenciación: motas doradas ascendentes
  | 'poison'      // Veneno: burbujas esmeralda flotantes
  | 'regen'       // Regeneración: motas de luz curativa sagrada
  | 'shield'      // Escudo: destellos celestes protectores
  | 'def_break'   // Ruptura: micro-esquirlas de fractura
  | 'haste'       // Celeridad: estelas veloces de luz
  | 'blind'       // Ceguera: motas de ceniza y sombra
  | 'atk_down'    // Debilitado: motas púrpuras descendentes
  | 'none';

interface HeroCleanAuraProps {
  status?: CleanVFXStatus;
  conditions?: ActiveGachaEffect[];
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'full';
}

/**
 * Biblioteca de Efectos Simples de Animaciones de Partículas para Héroes.
 * 
 * Filosofía:
 * - Partículas puras, sutiles y elegantes (pequeños puntos brillantes, ascuas, chispas).
 * - Cero marcos o figuras geométricas invasivas: sólo estelas y motas flotantes orgánicas.
 * - Animaciones CSS fluidas a 60 FPS con aceleración por GPU.
 */
export const HeroCleanAura: React.FC<HeroCleanAuraProps> = ({
  status,
  conditions,
  className = '',
}) => {
  // Extraer los estados activos
  const activeStatuses: CleanVFXStatus[] = [];

  if (status && status !== 'none') {
    activeStatuses.push(status);
  }

  if (conditions && conditions.length > 0) {
    conditions.forEach((c) => {
      const type = c.canonicalType || c.type;
      if ((type === 'stun' || type === 'stunned') && !activeStatuses.includes('stunned')) {
        activeStatuses.push('stunned');
      } else if ((type === 'paralyze' || type === 'paralyzed') && !activeStatuses.includes('paralyzed')) {
        activeStatuses.push('paralyzed');
      } else if ((type === 'poison' || type === 'poisoned') && !activeStatuses.includes('poison')) {
        activeStatuses.push('poison');
      } else if (type === 'atk_buff' && !activeStatuses.includes('atk_buff')) {
        activeStatuses.push('atk_buff');
      } else if (type === 'def_buff' && !activeStatuses.includes('shield')) {
        activeStatuses.push('shield');
      } else if ((type === 'def_break' || type === 'prone' || type === 'restrained') && !activeStatuses.includes('def_break')) {
        activeStatuses.push('def_break');
      } else if ((type === 'regen' || type === 'blessed') && !activeStatuses.includes('regen')) {
        activeStatuses.push('regen');
      } else if (type === 'haste' && !activeStatuses.includes('haste')) {
        activeStatuses.push('haste');
      } else if ((type === 'blind' || type === 'blinded') && !activeStatuses.includes('blind')) {
        activeStatuses.push('blind');
      } else if ((type === 'atk_down' || type === 'frightened' || type === 'exhaustion') && !activeStatuses.includes('atk_down')) {
        activeStatuses.push('atk_down');
      } else if ((type === 'frozen' || type === 'chilled') && !activeStatuses.includes('frozen')) {
        activeStatuses.push('frozen');
      }
    });
  }

  if (activeStatuses.length === 0) return null;

  return (
    <div className={`absolute inset-0 pointer-events-none overflow-visible z-20 ${className}`}>
      {/* KEYFRAMES CSS LIMPIOS PARA LAS PARTÍCULAS */}
      <style>{`
        /* 1. Flotación ascendente suave con estela (Glacial, Fuego, Veneno, Sagrado) */
        @keyframes simpleParticleRise1 {
          0% { transform: translateY(0px) translateX(0px) scale(0.3); opacity: 0; }
          20% { opacity: 0.9; transform: translateY(-10px) translateX(-3px) scale(1); }
          75% { opacity: 0.7; transform: translateY(-34px) translateX(4px) scale(0.9); }
          100% { transform: translateY(-50px) translateX(-2px) scale(0.2); opacity: 0; }
        }
        @keyframes simpleParticleRise2 {
          0% { transform: translateY(0px) translateX(0px) scale(0.3); opacity: 0; }
          20% { opacity: 0.95; transform: translateY(-12px) translateX(4px) scale(1.1); }
          75% { opacity: 0.65; transform: translateY(-38px) translateX(-4px) scale(0.85); }
          100% { transform: translateY(-56px) translateX(3px) scale(0.2); opacity: 0; }
        }
        @keyframes simpleParticleRise3 {
          0% { transform: translateY(0px) translateX(0px) scale(0.4); opacity: 0; }
          25% { opacity: 0.85; transform: translateY(-8px) translateX(-2px) scale(1); }
          70% { opacity: 0.6; transform: translateY(-28px) translateX(3px) scale(0.8); }
          100% { transform: translateY(-44px) translateX(-1px) scale(0.15); opacity: 0; }
        }
        @keyframes poisonBubbleWobble {
          0% { transform: translateY(0px) translateX(0px) scale(0.25); opacity: 0; }
          15% { opacity: 0.95; transform: translateY(-20px) translateX(3px) scale(1); }
          50% { transform: translateY(-70px) translateX(-4px) scale(1.15); opacity: 0.85; }
          80% { transform: translateY(-120px) translateX(3px) scale(1.25); opacity: 0.7; }
          95% { opacity: 0.3; transform: translateY(-145px) translateX(-1px) scale(1.5); }
          100% { transform: translateY(-160px) translateX(0px) scale(1.8); opacity: 0; }
        }

        /* 2. Chispas eléctricas rápidas e intermitentes (Aturdido / Eléctrico) */
        @keyframes simpleElectricSpark1 {
          0%, 100% { opacity: 0; transform: scale(0.2); }
          18% { opacity: 1; transform: scale(1.3) translate(2px, -2px); }
          32% { opacity: 0.2; transform: scale(0.5); }
          50% { opacity: 0.9; transform: scale(1.1) translate(-2px, 1px); }
          70% { opacity: 0; }
        }
        @keyframes simpleElectricSpark2 {
          0%, 100% { opacity: 0; transform: scale(0.2); }
          25% { opacity: 0.1; }
          40% { opacity: 1; transform: scale(1.25) translate(-3px, 2px); }
          60% { opacity: 0.3; }
          75% { opacity: 0.95; transform: scale(1.05) translate(2px, -1px); }
          90% { opacity: 0; }
        }

        /* 3. Destellos perimetrales suaves (Escudo) */
        @keyframes simpleShieldShimmer {
          0%, 100% { opacity: 0.3; transform: scale(0.96); }
          50% { opacity: 0.85; transform: scale(1.04); }
        }

        /* 4. Estelas de velocidad rápidas (Haste) */
        @keyframes simpleSpeedTrail {
          0% { transform: translateX(-14px) scaleX(0.3); opacity: 0; }
          30% { opacity: 0.85; transform: translateX(0px) scaleX(1.4); }
          100% { transform: translateX(18px) scaleX(0.3); opacity: 0; }
        }

        /* 5. Motas descendentes (Debilitado) */
        @keyframes simpleParticleSink {
          0% { transform: translateY(0px) scale(0.3); opacity: 0; }
          25% { opacity: 0.85; transform: translateY(10px) scale(1); }
          75% { opacity: 0.6; transform: translateY(30px) scale(0.8); }
          100% { transform: translateY(45px) scale(0.2); opacity: 0; }
        }
      `}</style>

      {/* ========================================================================= */}
      {/* 1. GLACIAL (CONGELADO): Motas de escarcha cian flotantes con brillo suave */}
      {/* ========================================================================= */}
      {activeStatuses.includes('frozen') && (
        <div className="absolute inset-0">
          <div className="absolute bottom-[10%] left-[20%] w-1.5 h-1.5 rounded-full bg-cyan-200 shadow-[0_0_8px_#38bdf8] animate-[simpleParticleRise1_2.4s_ease-out_infinite]" />
          <div className="absolute bottom-[15%] right-[22%] w-2 h-2 rounded-full bg-sky-200 shadow-[0_0_10px_#0ea5e9] animate-[simpleParticleRise2_2.8s_ease-out_infinite_0.4s]" />
          <div className="absolute bottom-[20%] left-[50%] w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_6px_#bae6fd] animate-[simpleParticleRise3_2.2s_ease-out_infinite_0.8s]" />
          <div className="absolute bottom-[8%] right-[40%] w-1.5 h-1.5 rounded-full bg-cyan-300 shadow-[0_0_8px_#38bdf8] animate-[simpleParticleRise1_2.6s_ease-out_infinite_1.2s]" />
          <div className="absolute bottom-[25%] left-[32%] w-1 h-1 rounded-full bg-white shadow-[0_0_6px_#7dd3fc] animate-[simpleParticleRise2_2.1s_ease-out_infinite_1.6s]" />
          {/* Suave resplandor gélido perimetral */}
          <div className="absolute inset-0 rounded-lg shadow-[inset_0_0_12px_rgba(56,189,248,0.35)]" />
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. ATURDIDO / ELÉCTRICO: Chispas eléctricas rápidas y destellos amarillos */}
      {/* ========================================================================= */}
      {(activeStatuses.includes('stunned') || activeStatuses.includes('paralyzed')) && (
        <div className="absolute inset-0">
          <div className="absolute top-[18%] left-[24%] w-1.5 h-1.5 rounded-full bg-yellow-200 shadow-[0_0_8px_#fde047] animate-[simpleElectricSpark1_1.1s_infinite]" />
          <div className="absolute top-[28%] right-[20%] w-2 h-2 rounded-full bg-cyan-200 shadow-[0_0_10px_#00f7ff] animate-[simpleElectricSpark2_1.3s_infinite_0.2s]" />
          <div className="absolute bottom-[30%] left-[18%] w-1.5 h-1.5 rounded-full bg-amber-300 shadow-[0_0_8px_#f59e0b] animate-[simpleElectricSpark1_1.4s_infinite_0.5s]" />
          <div className="absolute bottom-[22%] right-[26%] w-1.5 h-1.5 rounded-full bg-yellow-100 shadow-[0_0_8px_#facc15] animate-[simpleElectricSpark2_1.2s_infinite_0.7s]" />
          <div className="absolute top-[14%] right-[42%] w-1 h-1 rounded-full bg-cyan-100 shadow-[0_0_6px_#38bdf8] animate-[simpleElectricSpark1_0.9s_infinite_0.3s]" />
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. ÍGNEO / POTENCIADO (ATK BUFF): Ascuas cálidas que suben ondulando       */}
      {/* ========================================================================= */}
      {(activeStatuses.includes('atk_buff') || activeStatuses.includes('ignited')) && (
        <div className="absolute inset-0">
          <div className="absolute bottom-[10%] left-[22%] w-1.5 h-1.5 rounded-full bg-amber-300 shadow-[0_0_8px_#f59e0b] animate-[simpleParticleRise1_2.3s_ease-out_infinite]" />
          <div className="absolute bottom-[14%] right-[26%] w-2 h-2 rounded-full bg-orange-400 shadow-[0_0_10px_#ea580c] animate-[simpleParticleRise2_2.6s_ease-out_infinite_0.4s]" />
          <div className="absolute bottom-[18%] left-[48%] w-1.5 h-1.5 rounded-full bg-yellow-200 shadow-[0_0_8px_#fde047] animate-[simpleParticleRise3_2.1s_ease-out_infinite_0.9s]" />
          <div className="absolute bottom-[8%] left-[36%] w-1 h-1 rounded-full bg-red-400 shadow-[0_0_6px_#ef4444] animate-[simpleParticleRise1_2.5s_ease-out_infinite_1.3s]" />
          <div className="absolute bottom-[22%] right-[38%] w-1.5 h-1.5 rounded-full bg-amber-200 shadow-[0_0_8px_#f59e0b] animate-[simpleParticleRise2_2.2s_ease-out_infinite_1.7s]" />
        </div>
      )}

      {/* 4. VENENO: Ramillete de burbujas translúcidas con centro transparente que ascienden de abajo hacia arriba */}
      {activeStatuses.includes('poison') && (
        <div className="absolute inset-0">
          {/* Burbuja 1: Grande (10px) con centro transparente */}
          <div className="absolute bottom-[3%] left-[22%] w-2.5 h-2.5 rounded-full bg-[radial-gradient(circle_at_35%_35%,rgba(255,255,255,0.7)_0%,rgba(16,185,129,0.06)_35%,rgba(16,185,129,0.35)_75%,rgba(5,150,105,0.85)_100%)] border border-emerald-300/80 shadow-[0_0_8px_#10b981] animate-[poisonBubbleWobble_2.6s_ease-out_infinite]">
            <div className="absolute top-0.5 left-0.5 w-0.5 h-0.5 rounded-full bg-white/90" />
          </div>
          {/* Burbuja 2: Grande derecha (9px) con centro transparente */}
          <div className="absolute bottom-[4%] right-[24%] w-2.5 h-2.5 rounded-full bg-[radial-gradient(circle_at_35%_35%,rgba(255,255,255,0.7)_0%,rgba(34,197,94,0.06)_35%,rgba(34,197,94,0.35)_75%,rgba(21,128,61,0.85)_100%)] border border-green-300/80 shadow-[0_0_8px_#22c55e] animate-[poisonBubbleWobble_2.8s_ease-out_infinite_0.4s]">
            <div className="absolute top-0.5 left-0.5 w-0.5 h-0.5 rounded-full bg-white/90" />
          </div>
          {/* Burbuja 3: Central mediana (8px) con centro transparente */}
          <div className="absolute bottom-[2%] left-[44%] w-2 h-2 rounded-full bg-[radial-gradient(circle_at_35%_35%,rgba(255,255,255,0.6)_0%,rgba(20,184,166,0.06)_35%,rgba(20,184,166,0.35)_75%,rgba(15,118,110,0.85)_100%)] border border-teal-200/80 shadow-[0_0_6px_#14b8a6] animate-[poisonBubbleWobble_2.4s_ease-out_infinite_0.8s]">
            <div className="absolute top-0.5 left-0.5 w-0.5 h-0.5 rounded-full bg-white" />
          </div>
          {/* Burbuja 4: Derecha mediana (7px) con centro transparente */}
          <div className="absolute bottom-[5%] right-[38%] w-2 h-2 rounded-full bg-[radial-gradient(circle_at_35%_35%,rgba(255,255,255,0.6)_0%,rgba(52,211,153,0.06)_35%,rgba(52,211,153,0.35)_75%,rgba(5,150,105,0.85)_100%)] border border-emerald-200/80 shadow-[0_0_6px_#34d399] animate-[poisonBubbleWobble_2.5s_ease-out_infinite_1.2s]">
            <div className="absolute top-0.5 left-0.5 w-0.5 h-0.5 rounded-full bg-white" />
          </div>
          {/* Burbuja 5: Izquierda flotante (6px) con centro transparente */}
          <div className="absolute bottom-[4%] left-[30%] w-1.5 h-1.5 rounded-full bg-[radial-gradient(circle_at_35%_35%,rgba(255,255,255,0.5)_0%,rgba(132,204,22,0.06)_35%,rgba(132,204,22,0.35)_75%,rgba(77,124,15,0.85)_100%)] border border-lime-200/80 shadow-[0_0_6px_#84cc16] animate-[poisonBubbleWobble_2.7s_ease-out_infinite_0.6s]" />
          {/* Burbuja 6: Centro baja (6px) con centro transparente */}
          <div className="absolute bottom-[2%] left-[54%] w-1.5 h-1.5 rounded-full bg-[radial-gradient(circle_at_35%_35%,rgba(255,255,255,0.5)_0%,rgba(16,185,129,0.06)_35%,rgba(16,185,129,0.35)_75%,rgba(5,150,105,0.85)_100%)] border border-emerald-200/80 shadow-[0_0_5px_#10b981] animate-[poisonBubbleWobble_2.3s_ease-out_infinite_1.5s]" />
          {/* Burbuja 7: Derecha baja (5px) con centro transparente */}
          <div className="absolute bottom-[6%] right-[28%] w-1.5 h-1.5 rounded-full bg-[radial-gradient(circle_at_35%_35%,rgba(255,255,255,0.5)_0%,rgba(20,184,166,0.06)_35%,rgba(20,184,166,0.35)_75%,rgba(15,118,110,0.85)_100%)] border border-teal-200/80 shadow-[0_0_5px_#14b8a6] animate-[poisonBubbleWobble_2.5s_ease-out_infinite_1.8s]" />
          {/* Burbuja 8: Extremo izquierdo (5px) con centro transparente */}
          <div className="absolute bottom-[3%] left-[16%] w-1.5 h-1.5 rounded-full bg-[radial-gradient(circle_at_35%_35%,rgba(255,255,255,0.5)_0%,rgba(52,211,153,0.06)_35%,rgba(52,211,153,0.35)_75%,rgba(5,150,105,0.85)_100%)] border border-emerald-200/80 shadow-[0_0_5px_#34d399] animate-[poisonBubbleWobble_2.9s_ease-out_infinite_0.3s]" />
          {/* Burbuja 9: Micro-burbuja (4px) */}
          <div className="absolute bottom-[5%] left-[64%] w-1 h-1 rounded-full border border-emerald-300 bg-emerald-300/20 shadow-[0_0_4px_#10b981] animate-[poisonBubbleWobble_2.2s_ease-out_infinite_1.1s]" />
          {/* Burbuja 10: Micro-burbuja (4px) */}
          <div className="absolute bottom-[2%] left-[38%] w-1 h-1 rounded-full border border-teal-300 bg-teal-300/20 shadow-[0_0_4px_#34d399] animate-[poisonBubbleWobble_2.4s_ease-out_infinite_1.7s]" />
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. REGENERACIÓN: Motas de luz sagrada curativa                             */}
      {/* ========================================================================= */}
      {activeStatuses.includes('regen') && (
        <div className="absolute inset-0">
          <div className="absolute bottom-[14%] left-[25%] w-2 h-2 rounded-full bg-emerald-200 shadow-[0_0_10px_#34d399] animate-[simpleParticleRise1_2.5s_ease-out_infinite]" />
          <div className="absolute bottom-[18%] right-[25%] w-1.5 h-1.5 rounded-full bg-yellow-200 shadow-[0_0_8px_#fef08a] animate-[simpleParticleRise2_2.7s_ease-out_infinite_0.6s]" />
          <div className="absolute bottom-[24%] left-[50%] w-1.5 h-1.5 rounded-full bg-green-300 shadow-[0_0_8px_#4ade80] animate-[simpleParticleRise3_2.3s_ease-out_infinite_1.1s]" />
          <div className="absolute bottom-[10%] left-[38%] w-1 h-1 rounded-full bg-white shadow-[0_0_6px_#a7f3d0] animate-[simpleParticleRise1_2.1s_ease-out_infinite_1.5s]" />
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. ÉGIDA / ESCUDO: Destellos protectores celestes                          */}
      {/* ========================================================================= */}
      {activeStatuses.includes('shield') && (
        <div className="absolute inset-0">
          <div className="absolute top-[10%] left-[12%] w-1.5 h-1.5 rounded-full bg-sky-200 shadow-[0_0_8px_#38bdf8] animate-[simpleShieldShimmer_2s_ease-in-out_infinite]" />
          <div className="absolute top-[10%] right-[12%] w-1.5 h-1.5 rounded-full bg-sky-200 shadow-[0_0_8px_#38bdf8] animate-[simpleShieldShimmer_2s_ease-in-out_infinite_0.5s]" />
          <div className="absolute bottom-[10%] left-[12%] w-1.5 h-1.5 rounded-full bg-cyan-200 shadow-[0_0_8px_#06b6d4] animate-[simpleShieldShimmer_2s_ease-in-out_infinite_1s]" />
          <div className="absolute bottom-[10%] right-[12%] w-1.5 h-1.5 rounded-full bg-cyan-200 shadow-[0_0_8px_#06b6d4] animate-[simpleShieldShimmer_2s_ease-in-out_infinite_1.5s]" />
          <div className="absolute inset-1 rounded-lg border border-sky-400/40 shadow-[0_0_10px_rgba(56,189,248,0.3)] animate-pulse" />
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. CELERIDAD / VELOCIDAD (HASTE): Estelas de viento doradas                */}
      {/* ========================================================================= */}
      {activeStatuses.includes('haste') && (
        <div className="absolute inset-0">
          <div className="absolute top-[35%] left-[20%] w-3 h-0.5 rounded-full bg-yellow-300 shadow-[0_0_6px_#fde047] animate-[simpleSpeedTrail_0.9s_linear_infinite]" />
          <div className="absolute top-[50%] left-[28%] w-4 h-0.5 rounded-full bg-amber-300 shadow-[0_0_8px_#f59e0b] animate-[simpleSpeedTrail_0.8s_linear_infinite_0.2s]" />
          <div className="absolute top-[65%] left-[18%] w-3 h-0.5 rounded-full bg-yellow-200 shadow-[0_0_6px_#fef08a] animate-[simpleSpeedTrail_1s_linear_infinite_0.4s]" />
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. RUPTURA / DEFENSA BAJA (DEF BREAK): Micro-esquirlas doradas             */}
      {/* ========================================================================= */}
      {activeStatuses.includes('def_break') && (
        <div className="absolute inset-0">
          <div className="absolute top-[38%] left-[28%] w-1.5 h-1.5 rounded-sm bg-orange-400 rotate-45 shadow-[0_0_6px_#f97316] animate-[simpleParticleRise1_2s_ease-out_infinite]" />
          <div className="absolute top-[42%] right-[26%] w-1.5 h-1.5 rounded-sm bg-amber-400 rotate-12 shadow-[0_0_6px_#f59e0b] animate-[simpleParticleRise2_2.2s_ease-out_infinite_0.4s]" />
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. DEBILITADO / ATK DOWN: Motas violetas que descienden suavemente         */}
      {/* ========================================================================= */}
      {activeStatuses.includes('atk_down') && (
        <div className="absolute inset-0">
          <div className="absolute top-[20%] left-[30%] w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_8px_#a855f7] animate-[simpleParticleSink_2.4s_ease-out_infinite]" />
          <div className="absolute top-[16%] right-[32%] w-1.5 h-1.5 rounded-full bg-violet-300 shadow-[0_0_8px_#8b5cf6] animate-[simpleParticleSink_2.7s_ease-out_infinite_0.5s]" />
        </div>
      )}
    </div>
  );
};
