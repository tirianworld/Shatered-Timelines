import React, { useState } from 'react';
import { sound } from '../services/soundService';
import { launchConfetti } from '../utils/confetti';
import { Check, X, Sparkles, FlaskConical, Award } from 'lucide-react';

export interface PotionMilestoneStats {
  totalBrewed: number;
  rCount: number;
  srCount: number;
  ssrCount: number;
  brewedCategories: string[];
  brewedElements: string[];
}

export interface PotionMilestoneDef {
  id: string;
  title: string;
  description: string;
  category: 'progreso' | 'rareza' | 'maestria';
  target: number;
  rewardCrystals: number;
  getProgress: (stats: PotionMilestoneStats) => number;
}

export const POTION_MILESTONES: PotionMilestoneDef[] = [
  // --- PROGRESO (CANTIDAD) ---
  {
    id: 'potion_count_1',
    title: 'Primer Destilado',
    description: 'Elabora tu primera poción en el laboratorio de alquimia.',
    category: 'progreso',
    target: 1,
    rewardCrystals: 100,
    getProgress: (s) => s.totalBrewed,
  },
  {
    id: 'potion_count_3',
    title: 'Boticario Aprendiz',
    description: 'Destila 3 pociones en la botica.',
    category: 'progreso',
    target: 3,
    rewardCrystals: 150,
    getProgress: (s) => s.totalBrewed,
  },
  {
    id: 'potion_count_5',
    title: 'Caldero Hirviente',
    description: 'Alcanza un total de 5 pociones elaboradas.',
    category: 'progreso',
    target: 5,
    rewardCrystals: 200,
    getProgress: (s) => s.totalBrewed,
  },
  {
    id: 'potion_count_10',
    title: 'Maestro Alquimista',
    description: 'Destila 10 brebajes curativos o elixires arcanos.',
    category: 'progreso',
    target: 10,
    rewardCrystals: 350,
    getProgress: (s) => s.totalBrewed,
  },
  {
    id: 'potion_count_20',
    title: 'Boticario de Élite',
    description: 'Alcanza 20 preparados alquímicos en Icespear.',
    category: 'progreso',
    target: 20,
    rewardCrystals: 500,
    getProgress: (s) => s.totalBrewed,
  },
  {
    id: 'potion_count_35',
    title: 'Gran Sabio de las Hierbas',
    description: 'Elabora 35 pociones para nutrir y curar a la tropa.',
    category: 'progreso',
    target: 35,
    rewardCrystals: 800,
    getProgress: (s) => s.totalBrewed,
  },
  {
    id: 'potion_count_50',
    title: 'Transmutador Supremo',
    description: 'Destila una reserva legendaria de 50 pociones.',
    category: 'progreso',
    target: 50,
    rewardCrystals: 1200,
    getProgress: (s) => s.totalBrewed,
  },

  // --- RAREZA Y CALIDAD ---
  {
    id: 'potion_rare_r3',
    title: 'Hierbas Escogidas',
    description: 'Destila 3 pociones de calidad Normal (R).',
    category: 'rareza',
    target: 3,
    rewardCrystals: 120,
    getProgress: (s) => s.rCount,
  },
  {
    id: 'potion_rare_sr2',
    title: 'Destilado Mayor',
    description: 'Elabora 2 elixires de rango Superior (SR).',
    category: 'rareza',
    target: 2,
    rewardCrystals: 220,
    getProgress: (s) => s.srCount,
  },
  {
    id: 'potion_rare_sr5',
    title: 'Esencias Purificadas',
    description: 'Elabora 5 elixires de rango Superior (SR).',
    category: 'rareza',
    target: 5,
    rewardCrystals: 350,
    getProgress: (s) => s.srCount,
  },
  {
    id: 'potion_rare_ssr1',
    title: 'Brebaje Legendario',
    description: 'Destila tu primera poción Maestra (SSR) de 4 o 5 estrellas.',
    category: 'rareza',
    target: 1,
    rewardCrystals: 400,
    getProgress: (s) => s.ssrCount,
  },
  {
    id: 'potion_rare_ssr3',
    title: 'Tríada de los Dioses',
    description: 'Destila 3 brebajes legendarios de rango SSR.',
    category: 'rareza',
    target: 3,
    rewardCrystals: 750,
    getProgress: (s) => s.ssrCount,
  },

  // --- MAESTRÍA Y AFINIDAD ---
  {
    id: 'potion_cat_3',
    title: 'Diversidad Botánica',
    description: 'Elabora pociones de 3 categorías distintas.',
    category: 'maestria',
    target: 3,
    rewardCrystals: 250,
    getProgress: (s) => s.brewedCategories.length,
  },
  {
    id: 'potion_cat_all',
    title: 'Farmacopea Completa',
    description: 'Elabora al menos una poción de cada una de las 5 ramas de alquimia.',
    category: 'maestria',
    target: 5,
    rewardCrystals: 600,
    getProgress: (s) => s.brewedCategories.length,
  },
  {
    id: 'potion_elem_natural',
    title: 'Dote de la Selva Helada',
    description: 'Elabora una poción con la esencia Natural.',
    category: 'maestria',
    target: 1,
    rewardCrystals: 150,
    getProgress: (s) => (s.brewedElements.includes('Natural') ? 1 : 0),
  },
  {
    id: 'potion_elem_divino',
    title: 'Bendición de la Luz',
    description: 'Elabora un elixir impregnado con el elemento Divino.',
    category: 'maestria',
    target: 1,
    rewardCrystals: 150,
    getProgress: (s) => (s.brewedElements.includes('Divino') ? 1 : 0),
  },
  {
    id: 'potion_elem_arcano',
    title: 'Éter del Firmamento',
    description: 'Elabora una poción mística alineada con lo Arcano.',
    category: 'maestria',
    target: 1,
    rewardCrystals: 150,
    getProgress: (s) => (s.brewedElements.includes('Arcano') ? 1 : 0),
  },
  {
    id: 'potion_elem_profano',
    title: 'Sombra Prohibida',
    description: 'Destila un veneno o brebaje con la afinidad Profana.',
    category: 'maestria',
    target: 1,
    rewardCrystals: 150,
    getProgress: (s) => (s.brewedElements.includes('Profano') ? 1 : 0),
  },
  {
    id: 'potion_elem_all',
    title: 'Equilibrio Primordial',
    description: 'Domina los 4 elementos en tu laboratorio de pociones.',
    category: 'maestria',
    target: 4,
    rewardCrystals: 700,
    getProgress: (s) => s.brewedElements.length,
  },
];

interface PotionMilestonesModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: PotionMilestoneStats;
  claimedMilestones: string[];
  onClaimMilestone: (milestoneId: string, crystals: number) => void;
  onClaimAllMilestones: (rewards: { id: string; crystals: number }[]) => void;
}

export const PotionMilestonesModal: React.FC<PotionMilestonesModalProps> = ({
  isOpen,
  onClose,
  stats,
  claimedMilestones,
  onClaimMilestone,
  onClaimAllMilestones,
}) => {
  const [activeTab, setActiveTab] = useState<'todos' | 'progreso' | 'rareza' | 'maestria'>('todos');

  if (!isOpen) return null;

  const filtered = POTION_MILESTONES.filter((m) => {
    if (activeTab === 'todos') return true;
    return m.category === activeTab;
  });

  const claimableRewards = POTION_MILESTONES.filter((m) => {
    const isClaimed = claimedMilestones.includes(m.id);
    const progress = m.getProgress(stats);
    return !isClaimed && progress >= m.target;
  }).map((m) => ({ id: m.id, crystals: m.rewardCrystals }));

  const totalClaimableCrystals = claimableRewards.reduce((sum, r) => sum + r.crystals, 0);

  const handleClaim = (id: string, crystals: number) => {
    sound.playSFX('victory');
    launchConfetti();
    onClaimMilestone(id, crystals);
  };

  const handleClaimAll = () => {
    if (claimableRewards.length === 0) return;
    sound.playSFX('victory');
    launchConfetti();
    onClaimAllMilestones(claimableRewards);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-xs select-none animate-fade-in">
      <div className="relative w-full max-w-[390px] h-[580px] bg-[#1a0803] border-2 border-amber-600 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-stone-100">
        {/* Modal Header */}
        <div className="relative p-3 bg-gradient-to-b from-[#3a1506] to-[#1e0a03] border-b-2 border-amber-700/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-600 to-teal-900 border border-emerald-400 flex items-center justify-center shadow-md">
              <FlaskConical className="w-4 h-4 text-emerald-200" />
            </div>
            <div>
              <h3 className="text-sm font-serif font-black text-amber-200 tracking-wide leading-tight">
                Hitos de la Botica
              </h3>
              <p className="text-[10px] text-amber-400/80">Logros de Alquimia y Cristales</p>
            </div>
          </div>
          <button
            onClick={() => {
              sound.playSFX('click');
              onClose();
            }}
            className="w-7 h-7 rounded-lg bg-[#2d0f04] hover:bg-[#471908] border border-amber-800 text-stone-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Categories Tab Strip */}
        <div className="flex items-center justify-between p-1.5 bg-[#120502] border-b border-amber-900/60 text-[11px] font-bold">
          <button
            onClick={() => {
              sound.playSFX('click');
              setActiveTab('todos');
            }}
            className={`flex-1 py-1 rounded-md text-center transition-all cursor-pointer ${
              activeTab === 'todos'
                ? 'bg-gradient-to-r from-amber-700 to-amber-600 text-white shadow'
                : 'text-stone-400 hover:text-amber-300'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => {
              sound.playSFX('click');
              setActiveTab('progreso');
            }}
            className={`flex-1 py-1 rounded-md text-center transition-all cursor-pointer ${
              activeTab === 'progreso'
                ? 'bg-gradient-to-r from-amber-700 to-amber-600 text-white shadow'
                : 'text-stone-400 hover:text-amber-300'
            }`}
          >
            Progreso
          </button>
          <button
            onClick={() => {
              sound.playSFX('click');
              setActiveTab('rareza');
            }}
            className={`flex-1 py-1 rounded-md text-center transition-all cursor-pointer ${
              activeTab === 'rareza'
                ? 'bg-gradient-to-r from-amber-700 to-amber-600 text-white shadow'
                : 'text-stone-400 hover:text-amber-300'
            }`}
          >
            Rareza
          </button>
          <button
            onClick={() => {
              sound.playSFX('click');
              setActiveTab('maestria');
            }}
            className={`flex-1 py-1 rounded-md text-center transition-all cursor-pointer ${
              activeTab === 'maestria'
                ? 'bg-gradient-to-r from-amber-700 to-amber-600 text-white shadow'
                : 'text-stone-400 hover:text-amber-300'
            }`}
          >
            Maestría
          </button>
        </div>

        {/* Milestone List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
          {filtered.map((m) => {
            const isClaimed = claimedMilestones.includes(m.id);
            const currentVal = m.getProgress(stats);
            const isCompleted = currentVal >= m.target;
            const progressRatio = Math.min(1, currentVal / m.target);

            return (
              <div
                key={m.id}
                className={`p-2.5 rounded-xl border flex items-center justify-between gap-2.5 transition-all ${
                  isClaimed
                    ? 'bg-[#150702]/60 border-stone-800 opacity-60'
                    : isCompleted
                    ? 'bg-gradient-to-r from-[#2c1305] to-[#3f1906] border-amber-500 shadow-md ring-1 ring-amber-500/50'
                    : 'bg-[#1e0a04]/80 border-amber-900/60'
                }`}
              >
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-serif font-black text-xs text-amber-100 truncate">
                      {m.title}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-amber-400">
                      +{m.rewardCrystals} 🔮
                    </span>
                  </div>
                  <p className="text-[10px] text-stone-300 leading-tight">{m.description}</p>

                  {/* Progress Bar */}
                  <div className="w-full h-1.5 bg-black/60 rounded-full overflow-hidden border border-amber-900/40">
                    <div
                      style={{ width: `${progressRatio * 100}%` }}
                      className={`h-full transition-all duration-300 ${
                        isCompleted ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' : 'bg-amber-600'
                      }`}
                    />
                  </div>
                  <div className="text-[9px] text-right font-mono text-stone-400">
                    {Math.min(currentVal, m.target)} / {m.target}
                  </div>
                </div>

                {/* Action Button */}
                <div className="shrink-0">
                  {isClaimed ? (
                    <div className="px-2 py-1 rounded bg-stone-900 border border-stone-700 text-stone-500 text-[10px] font-bold flex items-center gap-1">
                      <Check className="w-3 h-3 text-emerald-500" />
                      <span>Reclamado</span>
                    </div>
                  ) : isCompleted ? (
                    <button
                      onClick={() => handleClaim(m.id, m.rewardCrystals)}
                      className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-stone-950 text-[10px] font-black uppercase tracking-wider shadow-lg shadow-amber-900/40 cursor-pointer animate-pulse active:scale-95"
                    >
                      Reclamar
                    </button>
                  ) : (
                    <div className="px-2 py-1 rounded bg-[#100401] border border-amber-900/40 text-stone-500 text-[10px] font-semibold">
                      En Curso
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer / Claim All */}
        <div className="p-2.5 bg-[#140602] border-t border-amber-800/60 flex items-center justify-between gap-2">
          <div className="text-[10px] text-amber-300 font-medium">
            {claimableRewards.length > 0 ? (
              <span>
                {claimableRewards.length} listos para reclamar (+{totalClaimableCrystals} 🔮)
              </span>
            ) : (
              <span>¡Destila más pociones para desbloquear hitos!</span>
            )}
          </div>
          <button
            disabled={claimableRewards.length === 0}
            onClick={handleClaimAll}
            className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wide transition-all ${
              claimableRewards.length > 0
                ? 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-md shadow-emerald-950/60 cursor-pointer active:scale-95'
                : 'bg-stone-900 text-stone-600 cursor-not-allowed border border-stone-800'
            }`}
          >
            Reclamar Todo
          </button>
        </div>
      </div>
    </div>
  );
};
