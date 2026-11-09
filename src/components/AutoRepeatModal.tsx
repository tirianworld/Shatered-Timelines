import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { sound } from '../services/soundService';
import { launchConfetti } from '../utils/confetti';
import { loadTavernCookingStock, saveTavernCookingStock } from '../data/cookingData';
import { X, Sparkles, CheckCircle2, RotateCcw, AlertCircle, Utensils } from 'lucide-react';

export interface MissionAutoRewardItem {
  id: string;
  name: string;
  category: 'materials' | 'food';
  rarity: 'R' | 'SR' | 'SSR' | 'UR';
  icon: string;
  count: number;
  description: string;
}

export interface MissionAutoRewardConfig {
  gold: number;
  crystals: number;
  items: MissionAutoRewardItem[];
  tavernStockBonus?: Record<string, number>;
}

export const MISSION_AUTO_REWARDS: Record<string, MissionAutoRewardConfig> = {
  m1_tirano: {
    gold: 2500,
    crystals: 100,
    items: [
      {
        id: 'pocion_vida_tirano',
        name: 'Poción de Vida Mayor',
        category: 'materials',
        rarity: 'R',
        icon: '/assets/items/pocion_vida.png',
        count: 2,
        description: 'Poción de alta graduación para restaurar vitalidad de Magordito en combate.',
      },
      {
        id: 'ing_hortalizas_huerto',
        name: 'Hortalizas de Huerto',
        category: 'materials',
        rarity: 'R',
        icon: '/assets/items/ing_hortalizas.png',
        count: 3,
        description: 'Vegetales frescos cosechados para la cocina de la taberna.',
      },
    ],
    tavernStockBonus: { ing_hortalizas_huerto: 3 },
  },
  m2_robo: {
    gold: 3500,
    crystals: 150,
    items: [
      {
        id: 'kebab_recompensa',
        name: 'Kebab Especiado de Mercader',
        category: 'food',
        rarity: 'SR',
        icon: '/assets/items/kebab.png',
        count: 2,
        description: 'Carne adobada y asada con vegetales en pan pita tradicional.',
      },
      {
        id: 'ing_carne_ahumada',
        name: 'Carne Seca Curada',
        category: 'materials',
        rarity: 'R',
        icon: '/assets/items/ing_carne_seca.png',
        count: 3,
        description: 'Carne secada al humo de abeto para platos reconstituyentes.',
      },
    ],
    tavernStockBonus: { ing_carne_ahumada: 3 },
  },
  m3_bosque: {
    gold: 4500,
    crystals: 200,
    items: [
      {
        id: 'fragmento_quitina',
        name: 'Fragmento de Quitina',
        category: 'materials',
        rarity: 'SR',
        icon: '/assets/items/fragmento_de_quitina.png',
        count: 3,
        description: 'Placas resistentes de coraza de bestias del bosque para forja.',
      },
      {
        id: 'ing_setas_cueva',
        name: 'Setas de las Minas',
        category: 'materials',
        rarity: 'SR',
        icon: '/assets/items/ing_setas_cueva.png',
        count: 2,
        description: 'Hongos cavernícolas umami para estofados de la taberna.',
      },
    ],
    tavernStockBonus: { ing_setas_cueva: 2 },
  },
  m4_puertas_selladas: {
    gold: 8000,
    crystals: 300,
    items: [
      {
        id: 'coraza_quitinosa_titan',
        name: 'Coraza del Devorador Quitinoso',
        category: 'materials',
        rarity: 'SSR',
        icon: '/assets/items/fragmento_de_quitina.png',
        count: 1,
        description: 'El núcleo de coraza blindada del coloso de las puertas selladas.',
      },
      {
        id: 'ing_carne_devorador',
        name: 'Carne de Devorador',
        category: 'materials',
        rarity: 'SSR',
        icon: '/assets/items/ing_carne_devorador.png',
        count: 3,
        description: 'Carne densa y marmolada protegida por la coraza quitinosa para cocina exótica.',
      },
    ],
    tavernStockBonus: { ing_carne_devorador: 3 },
  },
  m5_minas_historia: {
    gold: 5000,
    crystals: 200,
    items: [
      {
        id: 'plata_glimmerstone',
        name: 'Lingote de Plata Glimmerstone',
        category: 'materials',
        rarity: 'SSR',
        icon: '/assets/items/lingote_de_plata.png',
        count: 2,
        description: 'Plata subterránea pura de máxima pureza extraída en las minas.',
      },
      {
        id: 'ing_patata_montana',
        name: 'Patata de Icespear',
        category: 'materials',
        rarity: 'R',
        icon: '/assets/items/ing_patata_rara.png',
        count: 4,
        description: 'Tubérculo dorado resistente a las heladas, base para tortillas.',
      },
    ],
    tavernStockBonus: { ing_patata_montana: 4 },
  },
  m3_cuevas_rojo: {
    gold: 7000,
    crystals: 250,
    items: [
      {
        id: 'huevo_carmesi',
        name: 'Huevo Carmesí Calcificado',
        category: 'materials',
        rarity: 'SSR',
        icon: '/assets/items/fragmento_de_quitina.png',
        count: 1,
        description: 'Huevo mutante petrificado de la cámara de cría con maná primigenio.',
      },
      {
        id: 'ing_huevos_araknoide',
        name: 'Huevos de Araknoide',
        category: 'materials',
        rarity: 'SR',
        icon: '/assets/items/ing_huevos_araknoide.png',
        count: 4,
        description: 'Huevos translúcidos recolectados en los nidos carmesíes de la colonia.',
      },
      {
        id: 'ing_larvas_araknoide',
        name: 'Larvas de Araknoide',
        category: 'materials',
        rarity: 'SR',
        icon: '/assets/items/ing_larvas_araknoide.png',
        count: 4,
        description: 'Larvas cavernícolas ricas en proteínas y maná residual para salteados.',
      },
    ],
    tavernStockBonus: { ing_huevos_araknoide: 4, ing_larvas_araknoide: 4 },
  },
  m4_cuevas_azul: {
    gold: 8000,
    crystals: 250,
    items: [
      {
        id: 'aguja_criogenica',
        name: 'Aguja Criogénica Parasitaria',
        category: 'materials',
        rarity: 'SSR',
        icon: '/assets/items/fragmento_de_quitina.png',
        count: 1,
        description: 'Púa glacial extraída de los acechadores congelados.',
      },
      {
        id: 'fragmento_quitina',
        name: 'Fragmento de Quitina',
        category: 'materials',
        rarity: 'SR',
        icon: '/assets/items/fragmento_de_quitina.png',
        count: 4,
        description: 'Material quitinoso denso para forja de armaduras.',
      },
    ],
  },
  m5_cuevas_zancudo: {
    gold: 10000,
    crystals: 350,
    items: [
      {
        id: 'pata_aguja_zancudo',
        name: 'Pata Aguja de Zancudo',
        category: 'materials',
        rarity: 'SSR',
        icon: '/assets/items/fragmento_astral.png',
        count: 1,
        description: 'Extremidad puntiaguda del Jefe Zancudo Espectral con esencia abisal.',
      },
      {
        id: 'ing_especias_dragon',
        name: 'Especias de Dragón',
        category: 'materials',
        rarity: 'SR',
        icon: '/assets/items/ing_especias_chili.png',
        count: 3,
        description: 'Pimientos picantes secos para platos ardientes de combate.',
      },
    ],
    tavernStockBonus: { ing_especias_dragon: 3 },
  },
  m6_cuevas_titan: {
    gold: 9000,
    crystals: 300,
    items: [
      {
        id: 'cerda_titan',
        name: 'Cerda Adamantina de Titán',
        category: 'materials',
        rarity: 'SSR',
        icon: '/assets/items/fragmento_astral.png',
        count: 2,
        description: 'Cerdas colosales impenetrables del Titán Melenudo.',
      },
      {
        id: 'ing_lomo_jabali',
        name: 'Chuletón de Jabalí',
        category: 'materials',
        rarity: 'SR',
        icon: '/assets/items/ing_lomo_jabali.png',
        count: 3,
        description: 'Corte selecto para recetas contundentes de la taberna.',
      },
    ],
    tavernStockBonus: { ing_lomo_jabali: 3 },
  },
  m7_cuevas_reina: {
    gold: 12000,
    crystals: 500,
    items: [
      {
        id: 'corazon_madre_nidos',
        name: 'Corazón de la Madre de Nidos',
        category: 'materials',
        rarity: 'UR',
        icon: '/assets/items/fragmento_astral.png',
        count: 1,
        description: 'Reliquia suprema del abismo que palpita con poder arcano puro.',
      },
      {
        id: 'ing_carne_devorador',
        name: 'Carne de Devorador',
        category: 'materials',
        rarity: 'SSR',
        icon: '/assets/items/ing_carne_devorador.png',
        count: 4,
        description: 'Carne colosal para la forja y la cocina de élite.',
      },
    ],
    tavernStockBonus: { ing_carne_devorador: 4 },
  },
};

const DEFAULT_REWARD: MissionAutoRewardConfig = {
  gold: 4000,
  crystals: 150,
  items: [
    {
      id: 'fragmento_quitina',
      name: 'Fragmento de Quitina',
      category: 'materials',
      rarity: 'SR',
      icon: '/assets/items/fragmento_de_quitina.png',
      count: 2,
      description: 'Placas resistentes para mejoras en la forja.',
    },
    {
      id: 'ing_hortalizas_huerto',
      name: 'Hortalizas de Huerto',
      category: 'materials',
      rarity: 'R',
      icon: '/assets/items/ing_hortalizas.png',
      count: 3,
      description: 'Ingredientes para cocinar platos de combate.',
    },
  ],
  tavernStockBonus: { ing_hortalizas_huerto: 3 },
};

export const ASTRAL_COST_PER_RUN = 10;

interface AutoRepeatModalProps {
  mission: {
    id: string;
    title: string;
    portrait: string;
    portraitClass?: string;
    difficulty: string;
    description: string;
  };
  onClose: () => void;
}

export const AutoRepeatModal: React.FC<AutoRepeatModalProps> = ({ mission, onClose }) => {
  const { astralShards, addAstralShards, addGold, addCrystals, addShelfItem } = useGame();

  const [count, setCount] = useState<number>(1);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [result, setResult] = useState<{
    count: number;
    totalGold: number;
    totalCrystals: number;
    items: {
      name: string;
      rarity: string;
      icon: string;
      totalCount: number;
    }[];
    tavernBonusApplied: boolean;
  } | null>(null);

  const rewardConfig = MISSION_AUTO_REWARDS[mission.id] || DEFAULT_REWARD;
  const maxPossibleRuns = Math.max(1, Math.floor(astralShards / ASTRAL_COST_PER_RUN));
  const totalCost = count * ASTRAL_COST_PER_RUN;
  const hasEnoughShards = astralShards >= totalCost;

  const handleAdjustCount = (newCount: number) => {
    sound.playSFX('click');
    const clamped = Math.max(1, Math.min(newCount, Math.max(1, maxPossibleRuns)));
    setCount(clamped);
  };

  const handleExecuteRepeat = () => {
    if (!hasEnoughShards || isExecuting) {
      sound.playSFX('card');
      return;
    }

    setIsExecuting(true);
    sound.playSFX('card');

    setTimeout(() => {
      // 1. Deduct Astral Fragments
      addAstralShards(-totalCost);

      // 2. Add Gold & Crystals
      const totalGoldGained = rewardConfig.gold * count;
      const totalCrystalsGained = rewardConfig.crystals * count;
      addGold(totalGoldGained);
      addCrystals(totalCrystalsGained);

      // 3. Add Items to Shelf Inventory
      const aggregatedItems: {
        name: string;
        rarity: string;
        icon: string;
        totalCount: number;
      }[] = [];

      rewardConfig.items.forEach((it) => {
        const totalItemCount = it.count * count;
        addShelfItem({
          id: `${it.id}_auto_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          name: it.name,
          category: it.category,
          rarity: it.rarity,
          count: totalItemCount,
          icon: it.icon,
          description: it.description,
        });

        aggregatedItems.push({
          name: it.name,
          rarity: it.rarity,
          icon: it.icon,
          totalCount: totalItemCount,
        });
      });

      // 4. Update Tavern Cooking Stock if applicable
      let tavernBonusApplied = false;
      if (rewardConfig.tavernStockBonus) {
        try {
          const stock = loadTavernCookingStock();
          Object.entries(rewardConfig.tavernStockBonus).forEach(([ingId, baseAmt]) => {
            stock[ingId] = (stock[ingId] || 0) + baseAmt * count;
          });
          saveTavernCookingStock(stock);
          tavernBonusApplied = true;
        } catch (e) {
          console.error('Failed to update tavern cooking stock during auto-repeat:', e);
        }
      }

      // 5. Celebration & Result State
      setIsExecuting(false);
      setResult({
        count,
        totalGold: totalGoldGained,
        totalCrystals: totalCrystalsGained,
        items: aggregatedItems,
        tavernBonusApplied,
      });

      launchConfetti();
      sound.playSFX('victory');
    }, 450);
  };

  const getRarityBadge = (rarity: string) => {
    switch (rarity) {
      case 'UR':
        return 'border-fuchsia-400 bg-fuchsia-950/80 text-fuchsia-300';
      case 'SSR':
        return 'border-amber-400 bg-amber-950/80 text-amber-300';
      case 'SR':
        return 'border-sky-400 bg-sky-950/80 text-sky-300';
      default:
        return 'border-stone-500 bg-stone-900/80 text-stone-300';
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-md bg-gradient-to-b from-[#1c0f06] via-[#101924] to-[#080d14] rounded-2xl border-2 border-cyan-500/60 shadow-[0_0_40px_rgba(6,182,212,0.35),0_15px_30px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col text-stone-100">
        {/* Glow ambient background elements */}
        <div className="absolute top-0 right-0 w-56 h-56 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="relative z-10 px-4 sm:px-5 pt-4 pb-3 border-b border-cyan-900/40 bg-gradient-to-r from-[#170a04] via-[#091f2c] to-[#170a04] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#09151e] border border-cyan-400/50 p-1 flex items-center justify-center shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)] shrink-0">
              <img
                src="/assets/items/fragmento_astral.png"
                alt="Astral"
                className="w-7 h-7 object-contain drop-shadow-[0_0_8px_rgba(34,211,238,0.8)] animate-pulse"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase font-mono font-black tracking-widest text-cyan-400 drop-shadow">
                  REPETICIÓN RÁPIDA
                </span>
                <span className="px-1.5 py-0.2 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-mono text-[9px] font-black">
                  BARRIDO ASTRAL
                </span>
              </div>
              <h3 className="font-serif font-black text-sm sm:text-base text-amber-200 drop-shadow truncate">
                {mission.title}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              sound.playSFX('click');
              onClose();
            }}
            className="w-8 h-8 rounded-lg bg-stone-900/80 hover:bg-stone-800 border border-stone-700 text-stone-400 hover:text-white flex items-center justify-center transition-all cursor-pointer active:scale-95"
            title="Cerrar ventana"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="relative z-10 p-4 sm:p-5 flex flex-col gap-3.5 max-h-[75vh] overflow-y-auto">
          {/* If Result View is Active */}
          {result ? (
            <div className="flex flex-col items-center text-center space-y-3.5 animate-in zoom-in-95 duration-200">
              <div className="w-14 h-14 rounded-2xl bg-cyan-950/70 border-2 border-cyan-400 flex items-center justify-center shadow-[0_0_20px_rgba(34,211,238,0.6)]">
                <CheckCircle2 className="w-8 h-8 text-cyan-300" />
              </div>

              <div>
                <h4 className="font-serif font-black text-base sm:text-lg text-cyan-200 tracking-wide drop-shadow">
                  ¡BARRIDO COMPLETADO ({result.count}x)!
                </h4>
                <p className="text-xs text-stone-300 mt-0.5">
                  Has obtenido todas las recompensas acumuladas de la misión instantáneamente.
                </p>
              </div>

              {/* Currency gains summary */}
              <div className="grid grid-cols-2 gap-2 w-full">
                <div className="p-2.5 rounded-xl bg-stone-900/80 border border-amber-500/30 flex items-center justify-center gap-2">
                  <img src="/assets/items/oro.png" alt="Oro" className="w-5 h-5 object-contain" />
                  <div className="flex flex-col items-start leading-tight">
                    <span className="text-[10px] font-sans font-bold text-amber-300/80">ORO GANADO</span>
                    <span className="text-sm font-mono font-black text-amber-200">
                      +{result.totalGold.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-stone-900/80 border border-emerald-500/30 flex items-center justify-center gap-2">
                  <img src="/assets/items/gema.png" alt="Cristales" className="w-5 h-5 object-contain" />
                  <div className="flex flex-col items-start leading-tight">
                    <span className="text-[10px] font-sans font-bold text-emerald-300/80">CRISTALES</span>
                    <span className="text-sm font-mono font-black text-emerald-200">
                      +{result.totalCrystals.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Items grid */}
              <div className="w-full flex flex-col gap-1.5 text-left">
                <span className="text-[10px] uppercase font-mono font-black text-stone-400 tracking-wider">
                  BOTÍN Y MATERIALES RECLAMADOS:
                </span>
                <div className="grid grid-cols-1 gap-1.5 max-h-48 overflow-y-auto pr-0.5">
                  {result.items.map((it, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-xl bg-[#0d141d]/90 border border-stone-800 flex items-center justify-between gap-2 shadow-sm"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-stone-950 border border-stone-700 p-1 shrink-0 flex items-center justify-center">
                          <img src={it.icon} alt={it.name} className="w-full h-full object-contain" />
                        </div>
                        <div className="min-w-0 flex flex-col">
                          <span className="text-xs font-bold text-amber-100 truncate">{it.name}</span>
                          <span className={`text-[8.5px] font-mono font-bold uppercase ${getRarityBadge(it.rarity)} w-fit px-1 rounded`}>
                            {it.rarity}
                          </span>
                        </div>
                      </div>
                      <span className="text-sm font-mono font-black text-cyan-300 shrink-0">
                        x{it.totalCount}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {result.tavernBonusApplied && (
                <div className="w-full p-2 rounded-lg bg-amber-950/40 border border-amber-600/50 flex items-center gap-2 text-amber-200 text-xs text-left">
                  <Utensils className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-[11px] font-medium leading-tight">
                    ¡Los ingredientes culinarios también se han depositado en la despensa del fogón de la taberna!
                  </span>
                </div>
              )}

              {/* Result Actions */}
              <div className="flex items-center gap-2 w-full pt-2">
                <button
                  type="button"
                  onClick={() => {
                    sound.playSFX('click');
                    setResult(null);
                  }}
                  className="flex-1 py-2.5 px-3 rounded-xl border border-cyan-500/50 bg-[#08222f] hover:bg-[#0c2f42] text-cyan-200 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  REPETIR DE NUEVO
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sound.playSFX('click');
                    onClose();
                  }}
                  className="flex-1 py-2.5 px-3 rounded-xl border border-amber-500/60 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-black text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer active:scale-95"
                >
                  ACEPTAR
                </button>
              </div>
            </div>
          ) : (
            /* Configure Auto-Repeat View */
            <>
              {/* Mission Snapshot Banner */}
              <div className="p-2.5 rounded-xl bg-[#0e1620]/80 border border-cyan-900/50 flex items-center gap-3 shadow-inner">
                <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-stone-950 border-2 border-cyan-600/60 shrink-0 shadow-md flex items-center justify-center">
                  <img
                    src={mission.portrait}
                    alt={mission.title}
                    className={`w-full h-full object-contain ${mission.portraitClass || 'scale-[1.8] origin-top'}`}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-serif font-black text-amber-200 truncate">
                      {mission.title}
                    </span>
                    <span className="px-1.5 py-0.2 rounded bg-cyan-900/60 text-cyan-300 font-mono text-[9px] font-bold">
                      {mission.difficulty}
                    </span>
                  </div>
                  <p className="text-[10px] text-stone-300 line-clamp-2 leading-tight mt-0.5">
                    {mission.description}
                  </p>
                </div>
              </div>

              {/* Astral Fragment Balance & Cost Box */}
              <div className="p-3 rounded-xl bg-gradient-to-r from-[#07131b] via-[#091a26] to-[#07131b] border border-cyan-500/40 flex items-center justify-between shadow-inner">
                <div className="flex items-center gap-2">
                  <img
                    src="/assets/items/fragmento_astral.png"
                    alt="Fragmentos Astrales"
                    className="w-6 h-6 object-contain drop-shadow-[0_0_6px_rgba(34,211,238,0.7)]"
                  />
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-mono font-bold text-cyan-300/80">
                      TUS FRAGMENTOS ASTRALES
                    </span>
                    <span className="text-sm sm:text-base font-mono font-black text-cyan-200">
                      {astralShards.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end">
                  <span className="text-[9.5px] uppercase font-mono font-bold text-stone-400">
                    COSTE POR BARRIDO
                  </span>
                  <span className="text-xs font-mono font-bold text-cyan-400">
                    {ASTRAL_COST_PER_RUN} ✦ / vez
                  </span>
                </div>
              </div>

              {/* Repetition Multiplier Controls */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10.5px] uppercase font-mono font-black text-amber-300 tracking-wider">
                    CANTIDAD DE REPETICIONES:
                  </span>
                  <span className="text-xs font-mono font-bold text-cyan-300">
                    Coste Total: <strong className="text-amber-300 font-black">{totalCost} ✦</strong>
                  </span>
                </div>

                {/* Counter Stepper */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleAdjustCount(count - 1)}
                    disabled={count <= 1}
                    className="w-10 h-10 rounded-xl bg-stone-900 hover:bg-stone-800 disabled:opacity-40 border border-stone-700 text-stone-200 text-lg font-black flex items-center justify-center transition-all cursor-pointer active:scale-95 disabled:pointer-events-none"
                  >
                    -
                  </button>

                  <div className="flex-1 h-10 rounded-xl bg-stone-950 border border-cyan-800/60 flex items-center justify-center shadow-inner">
                    <span className="text-base sm:text-lg font-mono font-black text-amber-200">
                      {count} {count === 1 ? 'Vez' : 'Veces'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAdjustCount(count + 1)}
                    disabled={count >= maxPossibleRuns}
                    className="w-10 h-10 rounded-xl bg-stone-900 hover:bg-stone-800 disabled:opacity-40 border border-stone-700 text-stone-200 text-lg font-black flex items-center justify-center transition-all cursor-pointer active:scale-95 disabled:pointer-events-none"
                  >
                    +
                  </button>
                </div>

                {/* Quick preset buttons */}
                <div className="grid grid-cols-5 gap-1.5 pt-1">
                  {[1, 3, 5, 10].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handleAdjustCount(preset)}
                      className={`py-1.5 rounded-lg border text-xs font-mono font-black uppercase transition-all cursor-pointer active:scale-95 ${
                        count === preset
                          ? 'border-cyan-400 bg-cyan-900/70 text-cyan-200 shadow-[0_0_8px_rgba(6,182,212,0.4)]'
                          : 'border-stone-800 bg-stone-900/70 hover:bg-stone-850 text-stone-300'
                      }`}
                    >
                      x{preset}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => handleAdjustCount(maxPossibleRuns)}
                    className="py-1.5 rounded-lg border border-amber-600/70 bg-amber-950/40 hover:bg-amber-900/50 text-amber-300 text-xs font-mono font-black uppercase transition-all cursor-pointer active:scale-95"
                    title="Usar el máximo posible según tus fragmentos astrales"
                  >
                    MÁX
                  </button>
                </div>
              </div>

              {/* Rewards Preview List */}
              <div className="flex flex-col gap-1.5 pt-1">
                <span className="text-[10px] uppercase font-mono font-black text-stone-400 tracking-wider">
                  BOTÍN ESTIMADO (TOTAL X{count}):
                </span>

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 rounded-lg bg-stone-900/60 border border-amber-500/20 flex items-center gap-2">
                    <img src="/assets/items/oro.png" alt="Oro" className="w-4 h-4 object-contain" />
                    <span className="text-xs font-mono font-bold text-amber-200">
                      +{(rewardConfig.gold * count).toLocaleString()} Oro
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-stone-900/60 border border-emerald-500/20 flex items-center gap-2">
                    <img src="/assets/items/gema.png" alt="Cristales" className="w-4 h-4 object-contain" />
                    <span className="text-xs font-mono font-bold text-emerald-200">
                      +{(rewardConfig.crystals * count).toLocaleString()} Cristales
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-1 max-h-36 overflow-y-auto pr-0.5">
                  {rewardConfig.items.map((it, idx) => (
                    <div
                      key={idx}
                      className="p-1.5 rounded-lg bg-stone-950/70 border border-stone-800/80 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <img src={it.icon} alt={it.name} className="w-6 h-6 object-contain" />
                        <span className="text-stone-300 truncate font-medium text-[11px]">{it.name}</span>
                      </div>
                      <span className="font-mono font-bold text-cyan-300 shrink-0 text-[11px]">
                        x{it.count * count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Warning if not enough shards */}
              {!hasEnoughShards && (
                <div className="p-2 rounded-lg bg-rose-950/60 border border-rose-600/70 flex items-center gap-2 text-rose-200 text-xs">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>
                    No tienes suficientes Fragmentos Astrales para este barrido (Te faltan{' '}
                    {totalCost - astralShards} ✦).
                  </span>
                </div>
              )}

              {/* Execution Button */}
              <button
                type="button"
                onClick={handleExecuteRepeat}
                disabled={!hasEnoughShards || isExecuting}
                className={`w-full py-3 px-4 rounded-xl font-serif font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer active:scale-95 ${
                  hasEnoughShards && !isExecuting
                    ? 'border-2 border-cyan-400 bg-gradient-to-r from-cyan-600 via-sky-600 to-cyan-700 hover:brightness-110 text-white shadow-[0_4px_16px_rgba(6,182,212,0.45)]'
                    : 'border border-stone-700 bg-stone-900/90 text-stone-500 cursor-not-allowed opacity-60'
                }`}
              >
                {isExecuting ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin text-cyan-200" />
                    <span>EJECUTANDO BARRIDO ASTRAL...</span>
                  </>
                ) : (
                  <>
                    <img
                      src="/assets/items/fragmento_astral.png"
                      alt=""
                      className="w-4 h-4 object-contain drop-shadow"
                    />
                    <span>
                      ¡REPETIR CON FRAGMENTOS ASTRALES ({count}x)!
                    </span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
