import React from 'react';

export type CartoonSkillType =
  | 'martillo_titan'
  | 'estocada_sombra'
  | 'llamarada_infernal'
  | 'lanza_glacial'
  | 'estallido_sonico'
  | 'lluvia_caustica'
  | 'chispa_sagrada'
  | 'pulso_mental'
  | 'cataclismo_astral'
  // Enemy skills
  | 'araknoide_claw'
  | 'crimson_claw'
  | 'araknoide_silk'
  | 'shadow_web'
  | 'medusa_electric'
  | 'abyssal_electric'
  | 'medusa_sting'
  | 'toxic_spores'
  | 'araknoide_death'
  | 'earth_titan'
  | 'frost_blizzard'
  | 'shadow_needle'
  | 'void_miasma'
  | 'gorgon_lightning'
  | string;

export interface CartoonVectorSkillVfxProps {
  type: CartoonSkillType;
  tier?: 1 | 2 | 3;
  isEnemy?: boolean;
  target?: 'hero' | 'enemy' | 'screen';
}

/**
 * SISTEMA DE EFECTOS CARTOON VECTORIAL (SUTIL, ELEGANTE Y ENVOLVENTE)
 *
 * Mantiene la cobertura de la silueta completa del sprite (pies a corona)
 * con una densidad y opacidad sutiles y estéticas (animaciones limpias sin ruido visual).
 */
export const CartoonVectorSkillVfx: React.FC<CartoonVectorSkillVfxProps> = ({
  type,
  tier = 1,
  isEnemy = false,
  target,
}) => {
  const scaleMultiplier = tier === 3 ? 1.25 : tier === 2 ? 1.1 : 1.0;

  // Determine target positioning: covers the exact silhouette of Hero or Enemy
  const isHeroTarget =
    target === 'hero' ||
    (target === undefined && isEnemy);
  const isScreenTarget = target === 'screen' || type === 'cataclismo_astral';

  const containerClasses = isScreenTarget
    ? 'inset-0 w-full h-full'
    : isHeroTarget
    ? 'left-[-12px] bottom-0 w-[280px] h-[310px]' // Blankets Magordito (156x268px)
    : 'right-[-12px] bottom-0 w-[300px] h-[300px]'; // Blankets Enemy (200x240px)

  return (
    <div
      className={`absolute pointer-events-none z-45 flex items-center justify-center overflow-visible select-none ${containerClasses}`}
      style={{
        transform: `scale(${scaleMultiplier})`,
        transformOrigin: 'center bottom',
      }}
    >
      <style>{`
        /* ========================================================================= */
        /* KEYFRAMES CARTOON VECTORIAL (SUAVES Y SUTILES)                            */
        /* ========================================================================= */

        @keyframes proVfxPop {
          0% { transform: scale(0.3) rotate(-8deg); opacity: 0; }
          25% { transform: scale(1.15) rotate(2deg); opacity: 0.9; }
          60% { transform: scale(1.02) rotate(-1deg); opacity: 0.85; }
          100% { transform: scale(1.3) rotate(8deg); opacity: 0; }
        }

        @keyframes proVfxSlashA {
          0% { transform: translate(-60px, -50px) rotate(-35deg) scale(0.35); opacity: 0; }
          22% { transform: translate(0px, 0px) rotate(-35deg) scale(1.2); opacity: 0.9; }
          70% { transform: translate(25px, 20px) rotate(-35deg) scale(1.05); opacity: 0.85; }
          100% { transform: translate(60px, 45px) rotate(-35deg) scale(0.4); opacity: 0; }
        }

        @keyframes proVfxSlashB {
          0% { transform: translate(60px, -50px) rotate(35deg) scale(0.35); opacity: 0; }
          22% { transform: translate(0px, 0px) rotate(35deg) scale(1.2); opacity: 0.9; }
          70% { transform: translate(-25px, 20px) rotate(35deg) scale(1.05); opacity: 0.85; }
          100% { transform: translate(-60px, 45px) rotate(35deg) scale(0.4); opacity: 0; }
        }

        @keyframes proVfxLightning {
          0% { opacity: 0; transform: scaleY(0.3) translateY(-40px); }
          15% { opacity: 0.95; transform: scaleY(1.15) translateY(0px); filter: drop-shadow(0 0 18px #00f7ff); }
          30% { opacity: 0.25; transform: scaleY(0.9) skewX(4deg); }
          48% { opacity: 0.95; transform: scaleY(1.1) skewX(-3deg); filter: drop-shadow(0 0 20px #fde047); }
          68% { opacity: 0.3; transform: scaleY(0.95); }
          82% { opacity: 0.85; transform: scaleY(1.05); filter: drop-shadow(0 0 16px #38bdf8); }
          100% { opacity: 0; transform: scaleY(0.4) translateY(20px); }
        }

        @keyframes proVfxFirePulse {
          0% { transform: scale(0.35) translateY(45px); opacity: 0; }
          22% { transform: scale(1.18) translateY(-6px) rotate(-3deg); opacity: 0.9; filter: drop-shadow(0 0 22px #f97316); }
          52% { transform: scale(1.05) translateY(-18px) rotate(4deg); opacity: 0.85; }
          75% { transform: scale(1.15) translateY(-28px) rotate(-2deg); opacity: 0.75; }
          100% { transform: scale(0.4) translateY(-50px); opacity: 0; }
        }

        @keyframes proVfxShockwave {
          0% { transform: scale(0.2); opacity: 0; }
          20% { transform: scale(0.65); opacity: 0.85; }
          75% { transform: scale(1.25); opacity: 0.7; }
          100% { transform: scale(1.6); opacity: 0; }
        }

        @keyframes proVfxSpinFast {
          0% { transform: rotate(0deg) scale(0.5); opacity: 0; }
          25% { transform: rotate(180deg) scale(1.15); opacity: 0.85; }
          75% { transform: rotate(540deg) scale(1.05); opacity: 0.7; }
          100% { transform: rotate(720deg) scale(0.4); opacity: 0; }
        }

        @keyframes proVfxComicBurstPulse {
          0% { transform: scale(0.2) rotate(0deg); opacity: 0; }
          30% { transform: scale(1.2) rotate(10deg); opacity: 0.85; }
          70% { transform: scale(1.05) rotate(20deg); opacity: 0.75; }
          100% { transform: scale(1.35) rotate(30deg); opacity: 0; }
        }
      `}</style>


      {/* ===================================================================== */}
      {/* 2. RAYO VOLTAICO (SUTIL RELÁMPAGO VECTORIAL Y ARCO ELÉCTRICO)           */}
      {/* ===================================================================== */}
      {(type === 'medusa_electric' || type === 'abyssal_electric' || type === 'gorgon_lightning') && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {/* Subtle Vector SVG Lightning Bolt */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none animate-[proVfxLightning_0.75s_ease-out_forwards]">
            <defs>
              <linearGradient id="boltGradSubtle" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="60%" stopColor="#00f7ff" />
                <stop offset="100%" stopColor="#38bdf8" />
              </linearGradient>
            </defs>
            <path
              d="M140 10 L155 80 L132 110 L160 180 L130 210 L150 290"
              stroke="#0f172a"
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M140 10 L155 80 L132 110 L160 180 L130 210 L150 290"
              stroke="url(#boltGradSubtle)"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M140 10 L155 80 L132 110 L160 180 L130 210 L150 290"
              stroke="#ffffff"
              strokeWidth="1.2"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          {/* Anillo de choque sutil */}
          <img
            src="/assets/particles/circle_01.png"
            alt=""
            className="absolute inset-0 w-full h-full object-contain animate-[proVfxShockwave_0.65s_ease-out_forwards] filter drop-shadow-[0_0_18px_#00f7ff] opacity-80"
            style={{ mixBlendMode: 'screen' }}
          />
          {/* Relámpago principal Kenney */}
          <img
            src="/assets/particles/trace_05.png"
            alt=""
            className="absolute inset-0 w-full h-full object-contain animate-[proVfxLightning_0.75s_ease-out_forwards] filter drop-shadow-[0_0_20px_#00f7ff] opacity-85"
            style={{ mixBlendMode: 'screen' }}
          />
        </div>
      )}

      {/* ===================================================================== */}
      {/* 2. SOMBRAS ENEMIGAS (RUNA ARCANA Y CALAVERA ESPECTRAL SUTIL)          */}
      {/* ===================================================================== */}
      {(type === 'shadow_needle' || type === 'void_miasma' || type === 'araknoide_death') && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {/* Runa arcana oscura Kenney magic_04 */}
          <img
            src="/assets/particles/magic_04.png"
            alt=""
            className="absolute inset-0 w-full h-full object-contain animate-[proVfxSpinFast_0.85s_ease-out_forwards] filter drop-shadow-[0_0_22px_#a855f7] opacity-80"
            style={{ mixBlendMode: 'screen' }}
          />
          {/* Calavera espectral Cartoon FX Remaster */}
          <img
            src="/assets/cfxr/graphics/cfxr-skull-2.png"
            alt=""
            className="absolute top-4 w-[160px] h-[160px] object-contain animate-[proVfxPop_0.8s_ease-out_forwards] filter drop-shadow-[0_0_24px_#7c3aed] hue-rotate-[270deg] opacity-85"
            style={{ mixBlendMode: 'screen' }}
          />
        </div>
      )}

      {/* ===================================================================== */}
      {/* 4. GARRAS (TAJO VECTORIAL ELEGANTE)                                   */}
      {/* ===================================================================== */}
      {(type === 'araknoide_claw' || type === 'crimson_claw') && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {/* Anime Vector Slash Path SVG */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none animate-[proVfxSlashA_0.45s_ease-out_forwards]">
            <path
              d="M30 30 Q140 150 250 250 Q150 160 30 30 Z"
              fill={type.includes('claw') ? '#ef4444' : '#fbbf24'}
              stroke="#0f172a"
              strokeWidth="2.2"
              opacity="0.8"
            />
          </svg>

          {/* Tajo Kenney slash_01 */}
          <img
            src="/assets/particles/slash_01.png"
            alt=""
            className={`absolute inset-0 w-full h-full object-contain animate-[proVfxSlashA_0.5s_ease-out_forwards] filter ${
              type.includes('claw')
                ? 'drop-shadow-[0_0_20px_#ef4444] hue-rotate-[320deg]'
                : 'drop-shadow-[0_0_20px_#f59e0b]'
            } opacity-85`}
            style={{ mixBlendMode: 'screen' }}
          />
        </div>
      )}

      {/* ===================================================================== */}
      {/* 5. MARTILLO TITÁN (ONDA DE TIERRA Y CRÁTER SUTIL)                     */}
      {/* ===================================================================== */}
      {(type === 'martillo_titan' || type === 'earth_titan') && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {/* Impacto de cráter en el suelo */}
          <img
            src="/assets/particles/scorch_02.png"
            alt=""
            className="absolute inset-0 w-full h-full object-contain animate-[proVfxPop_0.55s_ease-out_forwards] filter drop-shadow-[0_0_22px_#d97706] opacity-80"
            style={{ mixBlendMode: 'screen' }}
          />
          {/* Onda expansiva de tierra */}
          <img
            src="/assets/cfxr/graphics/cfxr-spikes-half-impact-gradient.png"
            alt=""
            className="absolute inset-0 w-full h-full object-contain animate-[proVfxShockwave_0.6s_ease-out_forwards] filter drop-shadow-[0_0_18px_#f59e0b] opacity-85"
            style={{ mixBlendMode: 'screen' }}
          />
        </div>
      )}

      {/* ===================================================================== */}
      {/* 6. ESTOCADA SOMBRA (TAJO PENETRANTE CARMESÍ)                          */}
      {/* ===================================================================== */}
      {type === 'estocada_sombra' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {/* Tajo penetrante Kenney slash_03 */}
          <img
            src="/assets/particles/slash_03.png"
            alt=""
            className="absolute inset-0 w-full h-full object-contain animate-[proVfxSlashA_0.45s_ease-out_forwards] filter drop-shadow-[0_0_22px_#ef4444] opacity-85"
            style={{ mixBlendMode: 'screen' }}
          />
          {/* Salpicadura carmesí */}
          <img
            src="/assets/cfxr/graphics/cfxr-blood-splash.png"
            alt=""
            className="absolute w-[180px] h-[180px] object-contain animate-[proVfxPop_0.55s_ease-out_forwards] filter drop-shadow-[0_0_18px_#dc2626] opacity-80"
            style={{ mixBlendMode: 'screen' }}
          />
        </div>
      )}

      {/* ===================================================================== */}
      {/* 7. LLAMARADA INFERNAL (COLUMNA DE FUEGO SUTIL Y ESTILIZADA)           */}
      {/* ===================================================================== */}
      {type === 'llamarada_infernal' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {/* Bola de fuego central Kenney fire_01 */}
          <img
            src="/assets/particles/fire_01.png"
            alt=""
            className="absolute inset-0 w-full h-full object-contain animate-[proVfxFirePulse_0.85s_ease-out_forwards] filter drop-shadow-[0_0_24px_#f97316] opacity-85"
            style={{ mixBlendMode: 'screen' }}
          />
          {/* Fuego cómic Phaser */}
          <img
            src="/assets/phaser/fire1.png"
            alt=""
            className="absolute w-[160px] h-[160px] object-contain animate-pulse filter drop-shadow-[0_0_16px_#facc15] opacity-80"
            style={{ mixBlendMode: 'screen' }}
          />
        </div>
      )}

      {/* ===================================================================== */}
      {/* 8. LANZA GLACIAL (ANILLO DE ESCARCHA Y COPO SUTIL)                   */}
      {/* ===================================================================== */}
      {(type === 'lanza_glacial' || type === 'frost_blizzard') && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {/* Anillo de hielo Cartoon FX Remaster */}
          <img
            src="/assets/cfxr/graphics/cfxr-ring-ice.png"
            alt=""
            className="absolute inset-0 w-full h-full object-contain animate-[proVfxShockwave_0.7s_ease-out_forwards] filter drop-shadow-[0_0_20px_#38bdf8] opacity-85"
            style={{ mixBlendMode: 'screen' }}
          />
          {/* Copo de nieve Phaser */}
          <img
            src="/assets/phaser/snowflake.png"
            alt=""
            className="absolute w-28 h-28 object-contain animate-[proVfxSpinFast_0.8s_ease-out_forwards] filter drop-shadow-[0_0_16px_#ffffff] opacity-85"
            style={{ mixBlendMode: 'screen' }}
          />
        </div>
      )}

      {/* ===================================================================== */}
      {/* 9. ESTALLIDO SÓNICO (ONDA SÓNICA LIMPIA)                              */}
      {/* ===================================================================== */}
      {type === 'estallido_sonico' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {/* Onda sónica concéntrica Kenney circle_02 */}
          <img
            src="/assets/particles/circle_02.png"
            alt=""
            className="absolute inset-0 w-full h-full object-contain animate-[proVfxShockwave_0.6s_ease-out_forwards] filter drop-shadow-[0_0_22px_#818cf8] opacity-85"
            style={{ mixBlendMode: 'screen' }}
          />
        </div>
      )}

      {/* ===================================================================== */}
      {/* 10. LLUVIA CÁUSTICA (BURBUJA ÁCIDA Y GOTAS SUTILES)                   */}
      {/* ===================================================================== */}
      {(type === 'lluvia_caustica' || type === 'medusa_sting' || type === 'toxic_spores') && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {/* Estallido de burbuja ácida Kenney circle_05 */}
          <img
            src="/assets/particles/circle_05.png"
            alt=""
            className="absolute inset-0 w-full h-full object-contain animate-[proVfxPop_0.65s_ease-out_forwards] filter drop-shadow-[0_0_22px_#84cc16] hue-rotate-[65deg] opacity-85"
            style={{ mixBlendMode: 'screen' }}
          />
        </div>
      )}

      {/* ===================================================================== */}
      {/* 11. CHISPA SAGRADA (RUNA CELESTIAL SUTIL)                             */}
      {/* ===================================================================== */}
      {type === 'chispa_sagrada' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {/* Runa sagrada Kenney magic_03 */}
          <img
            src="/assets/particles/magic_03.png"
            alt=""
            className="absolute inset-0 w-full h-full object-contain animate-[proVfxSpinFast_0.8s_ease-out_forwards] filter drop-shadow-[0_0_24px_#fde047] opacity-85"
            style={{ mixBlendMode: 'screen' }}
          />
        </div>
      )}

      {/* ===================================================================== */}
      {/* 12. PULSO MENTAL (VÓRTICE PSÍQUICO SUTIL)                             */}
      {/* ===================================================================== */}
      {type === 'pulso_mental' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {/* Vórtice hipnótico Kenney twirl_02 */}
          <img
            src="/assets/particles/twirl_02.png"
            alt=""
            className="absolute inset-0 w-full h-full object-contain animate-[proVfxShockwave_0.65s_ease-out_forwards] filter drop-shadow-[0_0_22px_#d946ef] opacity-85"
            style={{ mixBlendMode: 'screen' }}
          />
        </div>
      )}

      {/* ===================================================================== */}
      {/* 13. CATACLISMO ASTRAL (SUPERNOVA CELESTIAL)                           */}
      {/* ===================================================================== */}
      {type === 'cataclismo_astral' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {/* Runa cósmica celestial Kenney magic_01 */}
          <img
            src="/assets/particles/magic_01.png"
            alt=""
            className="absolute inset-0 w-full h-full object-contain animate-[proVfxSpinFast_0.9s_ease-out_forwards] filter drop-shadow-[0_0_28px_#f59e0b] opacity-85"
            style={{ mixBlendMode: 'screen' }}
          />
          {/* Estrella supernova de 12 puntas Kenney star_05 */}
          <img
            src="/assets/particles/star_05.png"
            alt=""
            className="absolute inset-0 w-full h-full object-contain animate-spin filter drop-shadow-[0_0_24px_#fbbf24] opacity-80"
            style={{ mixBlendMode: 'screen' }}
          />
        </div>
      )}

      {/* ===================================================================== */}
      {/* 14. TELARAÑA / SEDA ARÁCNIDA                                          */}
      {/* ===================================================================== */}
      {(type === 'araknoide_silk' || type === 'shadow_web') && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {/* Vórtice de seda Kenney twirl_02 */}
          <img
            src="/assets/particles/twirl_02.png"
            alt=""
            className="absolute inset-0 w-full h-full object-contain animate-[proVfxShockwave_0.65s_ease-out_forwards] filter drop-shadow-[0_0_20px_#06b6d4] opacity-85"
            style={{ mixBlendMode: 'screen' }}
          />
        </div>
      )}
    </div>
  );
};
