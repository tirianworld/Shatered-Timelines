import React, { useState } from 'react';
import { sound } from '../services/soundService';
import { launchConfetti } from '../utils/confetti';
import { Check } from 'lucide-react';

export interface ForgeMilestoneStats {
  totalCrafted: number;
  rCount: number;
  srCount: number;
  ssrCount: number;
  craftedCategories: string[];
  craftedElements: string[];
}

export interface ForgeMilestoneDef {
  id: string;
  title: string;
  description: string;
  category: 'progreso' | 'rareza' | 'maestria';
  target: number;
  rewardCrystals: number;
  getProgress: (stats: ForgeMilestoneStats) => number;
}

export const FORGE_MILESTONES: ForgeMilestoneDef[] = [
  // --- PROGRESO (CANTIDAD) ---
  {
    id: 'craft_count_1',
    title: 'Primer Golpe de Martillo',
    description: 'Forja tu primera pieza de equipo en el taller.',
    category: 'progreso',
    target: 1,
    rewardCrystals: 100,
    getProgress: (s) => s.totalCrafted,
  },
  {
    id: 'craft_count_3',
    title: 'Herrero Aprendiz',
    description: 'Forja 3 piezas de equipo en la herrería.',
    category: 'progreso',
    target: 3,
    rewardCrystals: 150,
    getProgress: (s) => s.totalCrafted,
  },
  {
    id: 'craft_count_5',
    title: 'Temple Constante',
    description: 'Alcanza un total de 5 objetos forjados.',
    category: 'progreso',
    target: 5,
    rewardCrystals: 200,
    getProgress: (s) => s.totalCrafted,
  },
  {
    id: 'craft_count_10',
    title: 'Maestro del Yunque',
    description: 'Forja 10 piezas de armamento o joyería.',
    category: 'progreso',
    target: 10,
    rewardCrystals: 350,
    getProgress: (s) => s.totalCrafted,
  },
  {
    id: 'craft_count_20',
    title: 'Veterano de la Fragua',
    description: 'Alcanza 20 creaciones artesanales en Icespear.',
    category: 'progreso',
    target: 20,
    rewardCrystals: 500,
    getProgress: (s) => s.totalCrafted,
  },
  {
    id: 'craft_count_35',
    title: 'Patriarca del Fuego',
    description: 'Forja 35 piezas de equipo para los héroes.',
    category: 'progreso',
    target: 35,
    rewardCrystals: 800,
    getProgress: (s) => s.totalCrafted,
  },
  {
    id: 'craft_count_50',
    title: 'Dios de la Metalurgia',
    description: 'Forja un arsenal legendario de 50 objetos.',
    category: 'progreso',
    target: 50,
    rewardCrystals: 1200,
    getProgress: (s) => s.totalCrafted,
  },

  // --- RAREZAS ESPECÍFICAS ---
  {
    id: 'rarity_r_1',
    title: 'Calidad Impecable',
    description: 'Forja al menos 1 objeto de rareza R.',
    category: 'rareza',
    target: 1,
    rewardCrystals: 150,
    getProgress: (s) => s.rCount + s.srCount + s.ssrCount,
  },
  {
    id: 'rarity_sr_1',
    title: 'Acero de Élite (SR)',
    description: 'Forja tu primera pieza de rareza Épica SR.',
    category: 'rareza',
    target: 1,
    rewardCrystals: 300,
    getProgress: (s) => s.srCount + s.ssrCount,
  },
  {
    id: 'rarity_sr_5',
    title: 'Arsenal Excepcional',
    description: 'Forja 5 piezas de rango SR o superior.',
    category: 'rareza',
    target: 5,
    rewardCrystals: 450,
    getProgress: (s) => s.srCount + s.ssrCount,
  },
  {
    id: 'rarity_ssr_1',
    title: 'Obra Maestra Divina (SSR)',
    description: 'Forja una reliquia legendaria de rango SSR.',
    category: 'rareza',
    target: 1,
    rewardCrystals: 600,
    getProgress: (s) => s.ssrCount,
  },
  {
    id: 'rarity_ssr_3',
    title: 'Colección Inmortal',
    description: 'Forja 3 piezas supremas de rango SSR.',
    category: 'rareza',
    target: 3,
    rewardCrystals: 1000,
    getProgress: (s) => s.ssrCount,
  },

  // --- MAESTRÍA Y AFINIDADES ---
  {
    id: 'craft_cats_2',
    title: 'Taller Diversificado',
    description: 'Forja objetos de al menos 2 categorías distintas.',
    category: 'maestria',
    target: 2,
    rewardCrystals: 200,
    getProgress: (s) => s.craftedCategories.length,
  },
  {
    id: 'craft_cats_4',
    title: 'Gran Repertorio',
    description: 'Forja objetos de 4 categorías distintas (Armas, Armaduras, etc.).',
    category: 'maestria',
    target: 4,
    rewardCrystals: 400,
    getProgress: (s) => s.craftedCategories.length,
  },
  {
    id: 'craft_element_1',
    title: 'Despertar Elemental',
    description: 'Forja un arma imbuida con poder Divino, Natural, Arcano o Profano.',
    category: 'maestria',
    target: 1,
    rewardCrystals: 200,
    getProgress: (s) => s.craftedElements.length,
  },
  {
    id: 'craft_element_4',
    title: 'Armonía de los Cuatro Elementos',
    description: 'Forja armas de los 4 elementos primordiales.',
    category: 'maestria',
    target: 4,
    rewardCrystals: 600,
    getProgress: (s) => s.craftedElements.length,
  },
];

interface ForgeMilestonesModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: ForgeMilestoneStats;
  claimedIds: string[];
  onClaim: (id: string, crystals: number) => void;
  onClaimAll: (rewards: { id: string; crystals: number }[]) => void;
}

export const ForgeMilestonesModal: React.FC<ForgeMilestonesModalProps> = ({
  isOpen,
  onClose,
  stats,
  claimedIds,
  onClaim,
  onClaimAll,
}) => {
  const [filter, setFilter] = useState<'todos' | 'progreso' | 'rareza' | 'maestria'>('todos');

  if (!isOpen) return null;

  const filteredMilestones = FORGE_MILESTONES.filter((m) => {
    if (filter === 'todos') return true;
    return m.category === filter;
  });

  const claimableList = FORGE_MILESTONES.filter((m) => {
    const isClaimed = claimedIds.includes(m.id);
    const progress = m.getProgress(stats);
    return !isClaimed && progress >= m.target;
  });

  const totalClaimedCount = FORGE_MILESTONES.filter((m) => claimedIds.includes(m.id)).length;
  const totalCrystalsEarned = FORGE_MILESTONES.filter((m) => claimedIds.includes(m.id)).reduce(
    (acc, m) => acc + m.rewardCrystals,
    0
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-2 sm:p-4 select-none animate-fade-in"
      onClick={onClose}
    >
      {/* 
        POPUP CONTAINER:
        Strictly preserves the native 4197/5588 aspect ratio of POPUP .png so it is NEVER distorted!
      */}
      <div
        className="relative w-full max-w-[410px] sm:max-w-[450px] aspect-[4197/5588] max-h-[92vh] flex flex-col select-none animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* POPUP Background Image (4197x5588 native, zero distortion) */}
        <img
          src="/assets/forge/POPUP.png"
          alt="Marco POPUP"
          className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none z-0 filter drop-shadow-[0_20px_50px_rgba(0,0,0,0.98)]"
        />

        {/* Close Button: Positioned on the top-right frame corner */}
        <button
          type="button"
          onClick={() => {
            sound.playSFX('click');
            onClose();
          }}
          className="absolute top-[3.2%] right-[4.5%] z-30 w-7 h-7 sm:w-8 sm:h-8 cursor-pointer hover:scale-110 active:scale-95 transition-transform"
          title="Cerrar Hitos"
          aria-label="Cerrar Hitos"
        >
          <img
            src="/assets/forge/btn_close_x.png"
            alt="Cerrar"
            className="w-full h-full object-contain filter drop-shadow-md"
          />
        </button>

        {/* 
          INNER MASK CONTAINER:
          Strictly masked and positioned within the blue background of the POPUP frame
          (top: 21.8% to sit cleanly below the top medallion tip, bottom: 8.2%, left: 8.8%, right: 8.8%)
          Ensures the entire header, title, counter, tabs, and cards are 100% inside the blue canvas mask.
        */}
        <div className="absolute top-[21.8%] bottom-[8.2%] left-[8.8%] right-[8.8%] z-10 flex flex-col overflow-hidden">
          {/* 1. Header (Title, Emblem & Subtitle) - fully inside the mask */}
          <div className="px-2.5 pt-1 pb-1 shrink-0 flex items-center gap-2">
            <div className="w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-full border border-amber-500/70 overflow-hidden bg-black/60 flex items-center justify-center shrink-0 shadow-md">
              <img
                src="/assets/forge/boton_logros_forja.png"
                alt=""
                className="w-full h-full object-contain filter drop-shadow"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-amber-200 font-serif font-black text-xs sm:text-[13.5px] tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,1)] uppercase truncate">
                HITOS DE LA FORJA
              </h2>
              <p className="text-[9px] sm:text-[10px] text-amber-300/80 font-medium flex items-center gap-1 truncate">
                <span>Alcanza metas de forja y reclama Cristales del Recuerdo</span>
                <img src="/assets/items/gema_del_recuerdo.png" alt="Cristal del Recuerdo" className="w-3.5 h-3.5 object-contain inline shrink-0" />
              </p>
            </div>
          </div>

          {/* 2. Overview Stats & Optional "Reclamar Todo" */}
          <div className="px-2.5 py-0.5 flex items-center justify-between text-[10px] sm:text-[11px] shrink-0 border-b border-[#1b3d52]/50">
            <div className="flex items-center gap-2">
              <span className="text-stone-300">
                Completados:{' '}
                <strong className="text-amber-400 font-mono">
                  {totalClaimedCount}/{FORGE_MILESTONES.length}
                </strong>
              </span>
              <span className="text-stone-300 flex items-center gap-1">
                Total:{' '}
                <img src="/assets/items/gema_del_recuerdo.png" alt="Cristal del Recuerdo" className="w-3.5 h-3.5 object-contain inline" />
                <strong className="text-cyan-300 font-mono">{totalCrystalsEarned.toLocaleString()}</strong>
              </span>
            </div>

            {claimableList.length > 0 && (
              <button
                onClick={() => {
                  sound.playSFX('victory');
                  launchConfetti({ particleCount: 90, spread: 70 });
                  onClaimAll(claimableList.map((m) => ({ id: m.id, crystals: m.rewardCrystals })));
                }}
                className="px-2 py-0.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-black font-bold text-[9.5px] rounded shadow cursor-pointer active:scale-95 animate-pulse shrink-0"
              >
                ¡Reclamar Todo! ({claimableList.length})
              </button>
            )}
          </div>

          {/* 3. Category Filter Tabs */}
          <div className="px-2.5 py-1 flex items-center gap-1 shrink-0">
            {(
              [
                { id: 'todos', label: 'Todos' },
                { id: 'progreso', label: 'Cantidad' },
                { id: 'rareza', label: 'Rareza' },
                { id: 'maestria', label: 'Maestría' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  sound.playSFX('click');
                  setFilter(tab.id);
                }}
                className={`flex-1 py-0.5 text-[9.5px] sm:text-[10px] font-bold rounded-md cursor-pointer transition-all ${
                  filter === tab.id
                    ? 'bg-amber-600 text-stone-950 shadow-[0_2px_4px_rgba(0,0,0,0.8)]'
                    : 'bg-black/60 text-stone-300 hover:bg-black/80 hover:text-amber-200 border border-[#1b3d52]/40'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* 4. Scrollable Milestones List (Masked strictly inside the blue area) */}
          <div className="flex-1 min-h-0 overflow-y-auto px-3 pt-1 pb-2 space-y-1.5 scrollbar-thin scrollbar-thumb-amber-800 scrollbar-track-black/60">
            {filteredMilestones.map((milestone) => {
              const isClaimed = claimedIds.includes(milestone.id);
              const currentProgress = milestone.getProgress(stats);
              const isCompleted = currentProgress >= milestone.target;
              const progressRatio = Math.min(1, currentProgress / milestone.target);
              const progressPercent = Math.round(progressRatio * 100);

              return (
                <div
                  key={milestone.id}
                  className={`relative rounded-xl p-2 sm:p-2.5 transition-all border ${
                    isClaimed
                      ? 'bg-[#08151f]/80 border-stone-800/80 opacity-70'
                      : isCompleted
                      ? 'bg-gradient-to-r from-[#1b2c3a] via-[#10212d] to-[#0a1822] border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.25)]'
                      : 'bg-[#06141e]/85 border-[#153448]/80 hover:border-[#214f6d]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    {/* Left: Info & Progress Bar */}
                    <div className="flex-1 min-w-0 pr-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-serif font-bold text-amber-100 text-xs sm:text-[12.5px] tracking-wide">
                          {milestone.title}
                        </span>
                        {isClaimed && (
                          <span className="text-[8.5px] px-1.5 py-0.2 bg-emerald-950/80 text-emerald-400 border border-emerald-700/60 rounded font-semibold inline-flex items-center gap-0.5">
                            Reclamado <Check className="w-2.5 h-2.5 text-emerald-400" />
                          </span>
                        )}
                      </div>

                      <p className="text-[10px] text-stone-300 leading-snug mt-0.5">
                        {milestone.description}
                      </p>

                      {/* Progress Bar with numbers */}
                      <div className="mt-1.5 flex items-center gap-2">
                        <div className="flex-1 h-2 bg-black/80 border border-stone-700/60 rounded-full overflow-hidden p-[1px]">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              isCompleted
                                ? 'bg-gradient-to-r from-emerald-500 to-amber-400'
                                : 'bg-gradient-to-r from-amber-700 to-amber-500'
                            }`}
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                        <span className="font-mono text-[9.5px] font-bold text-amber-200/90 shrink-0">
                          {Math.min(currentProgress, milestone.target)}/{milestone.target}
                        </span>
                      </div>
                    </div>

                    {/* Right: Reward Badge & Claim Action */}
                    <div className="flex flex-col items-end justify-between self-stretch shrink-0 gap-1.5 pl-1">
                      {/* Reward crystal pill */}
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#031d28] border border-[#0e4860] shadow-inner">
                        <img
                          src="/assets/items/gema_del_recuerdo.png"
                          alt="Cristal del Recuerdo"
                          className="w-3.5 h-3.5 object-contain filter drop-shadow"
                        />
                        <span className="font-mono font-bold text-cyan-300 text-[11px] sm:text-xs">
                          +{milestone.rewardCrystals}
                        </span>
                      </div>

                      {/* Status / Claim Button */}
                      {isClaimed ? (
                        <div className="px-2 py-0.5 bg-black/60 border border-stone-800 text-stone-500 text-[9.5px] font-bold rounded">
                          Obtenido
                        </div>
                      ) : isCompleted ? (
                        <button
                          onClick={() => {
                            sound.playSFX('victory');
                            if (milestone.rewardCrystals >= 500) {
                              launchConfetti({ particleCount: 100, spread: 80 });
                            }
                            onClaim(milestone.id, milestone.rewardCrystals);
                          }}
                          className="px-2.5 py-0.5 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black font-black text-[10px] rounded shadow-[0_2px_6px_rgba(245,158,11,0.6)] cursor-pointer active:scale-95 animate-pulse"
                        >
                          Reclamar
                        </button>
                      ) : (
                        <div className="px-2 py-0.5 bg-black/60 border border-stone-800/80 text-stone-400 text-[9.5px] font-mono rounded">
                          {progressPercent}%
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
