import React, { useMemo, useState } from 'react';
import { ArrowLeft, ChevronLeft, FlaskConical, Flame, ShoppingBag, Sparkles } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { sound } from '../services/soundService';
import { safeStorage } from '../utils/storage';
import {
  POTION_CATEGORIES,
  POTION_MATERIALS,
  POTION_RECIPES,
  type PotionCategoryId,
  type PotionRecipe,
} from '../data/potionsData';
import {
  POTION_MILESTONES,
  PotionMilestonesModal,
  type PotionMilestoneStats,
} from './PotionMilestonesModal';

const POTION_STATS_KEY = 'cdd_potion_milestones_stats_v1';
const POTION_CLAIMED_KEY = 'cdd_potion_milestones_claimed_v1';

const EMPTY_STATS: PotionMilestoneStats = {
  totalBrewed: 0,
  rCount: 0,
  srCount: 0,
  ssrCount: 0,
  brewedCategories: [],
  brewedElements: [],
};

const ORBIT_RADIUS_PX = 118;

const orbitalStyle = (idx: number, total: number): React.CSSProperties => {
  const angle = -Math.PI / 2 + (idx * 2 * Math.PI) / Math.max(1, total);
  return {
    left: `calc(50% + ${Math.cos(angle) * ORBIT_RADIUS_PX}px)`,
    top: `calc(48% + ${Math.sin(angle) * ORBIT_RADIUS_PX}px)`,
    transform: 'translate(-50%, -50%)',
  };
};

const rarityForStars = (stars: number): 'R' | 'SR' | 'SSR' =>
  stars >= 4 ? 'SSR' : stars >= 3 ? 'SR' : 'R';

const readStored = <T,>(key: string, fallback: T): T => {
  const raw = safeStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

/**
 * Botica de Pociones de Icespear. Misma estructura que el Fogón (TavernKitchenView):
 * cabecera con retorno, rueda de categorías, platos orbitales con las recetas y,
 * abajo, la mesa de alquimia con los materiales y el botón de destilar.
 */
export const PotionShopView: React.FC = () => {
  const {
    gold,
    addGold,
    addAstralShards,
    addShelfItem,
    shelfInventory,
    getMaterialCount,
    deductMaterials,
    goBack,
  } = useGame();

  const [category, setCategory] = useState<PotionCategoryId | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pantryOpen, setPantryOpen] = useState(false);
  const [milestonesOpen, setMilestonesOpen] = useState(false);
  const [stats, setStats] = useState<PotionMilestoneStats>(() =>
    readStored<PotionMilestoneStats>(POTION_STATS_KEY, EMPTY_STATS)
  );
  const [claimed, setClaimed] = useState<string[]>(() =>
    readStored<string[]>(POTION_CLAIMED_KEY, [])
  );

  const categoryRecipes = useMemo(
    () => (category ? POTION_RECIPES.filter((r) => r.category === category) : []),
    [category]
  );
  const selected = useMemo(
    () => POTION_RECIPES.find((r) => r.id === selectedId) ?? null,
    [selectedId]
  );

  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(null), 2600);
  };

  const ownedCount = (recipe: PotionRecipe) =>
    shelfInventory
      .filter((it) => it.name === recipe.name)
      .reduce((sum, it) => sum + it.count, 0);

  const materialHave = (icon: string, name: string) => getMaterialCount(icon, name);

  const canBrew =
    !!selected &&
    gold >= selected.costGold &&
    selected.ingredients.every((i) => materialHave(i.icon, i.name) >= i.need);

  const unclaimedMilestones = useMemo(
    () =>
      POTION_MILESTONES.filter(
        (m) => !claimed.includes(m.id) && m.getProgress(stats) >= m.target
      ).length,
    [claimed, stats]
  );

  const handleBack = () => {
    sound.playSFX('click');
    if (category) {
      setCategory(null);
      setSelectedId(null);
      return;
    }
    goBack();
  };

  const handleBrew = () => {
    if (!selected) {
      showNotice('Elige una receta de la rueda para destilarla.');
      return;
    }
    if (gold < selected.costGold) {
      sound.playSFX('hurt');
      showNotice('¡Oro insuficiente para destilar!');
      return;
    }
    if (!canBrew) {
      sound.playSFX('hurt');
      showNotice('¡Faltan materiales en la despensa!');
      return;
    }

    const deducted = deductMaterials(
      selected.ingredients.map((i) => ({ icon: i.icon, name: i.name, count: i.need }))
    );
    if (!deducted) {
      sound.playSFX('hurt');
      showNotice('¡Faltan materiales en la despensa!');
      return;
    }

    addGold(-selected.costGold);
    sound.playSFX('victory');

    const rarity = rarityForStars(selected.stars);
    addShelfItem({
      id: `crafted_${selected.id}`,
      name: selected.name,
      category: 'food',
      count: 1,
      icon: selected.icon,
      rarity,
      description: `${selected.category} destilada por Raxxar en la Botica de Icespear.`,
      priceGold: Math.round(selected.costGold * 0.65),
    });

    setStats((prev) => {
      const next: PotionMilestoneStats = {
        totalBrewed: prev.totalBrewed + 1,
        rCount: rarity === 'R' ? prev.rCount + 1 : prev.rCount,
        srCount: rarity === 'SR' ? prev.srCount + 1 : prev.srCount,
        ssrCount: rarity === 'SSR' ? prev.ssrCount + 1 : prev.ssrCount,
        brewedCategories: prev.brewedCategories.includes(selected.category)
          ? prev.brewedCategories
          : [...prev.brewedCategories, selected.category],
        brewedElements: prev.brewedElements.includes(selected.element)
          ? prev.brewedElements
          : [...prev.brewedElements, selected.element],
      };
      safeStorage.setItem(POTION_STATS_KEY, JSON.stringify(next));
      return next;
    });

    showNotice(`¡${selected.name} destilada con éxito! Guardada en la despensa.`);
  };

  const claimOne = (id: string, crystals: number) => {
    if (claimed.includes(id)) return;
    const next = [...claimed, id];
    setClaimed(next);
    safeStorage.setItem(POTION_CLAIMED_KEY, JSON.stringify(next));
    addAstralShards(crystals);
    sound.playSFX('coin');
    showNotice(`¡Hito completado! +${crystals} Cristales del Recuerdo`);
  };

  const claimAll = (rewards: { id: string; crystals: number }[]) => {
    const pending = rewards.filter((r) => !claimed.includes(r.id));
    if (pending.length === 0) return;
    const next = [...claimed, ...pending.map((r) => r.id)];
    setClaimed(next);
    safeStorage.setItem(POTION_CLAIMED_KEY, JSON.stringify(next));
    const total = pending.reduce((sum, r) => sum + r.crystals, 0);
    addAstralShards(total);
    sound.playSFX('coin');
    showNotice(`¡Todos los hitos reclamados! +${total} Cristales del Recuerdo`);
  };

  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-between overflow-hidden select-none font-sans text-stone-100 animate-fade-in bg-[#140602]">
      {/* Fondo: interior de la Botica */}
      <img
        src="/assets/aistudio/image_180f7992.webp"
        alt="Botica de Pociones de Icespear"
        className="absolute inset-0 w-full h-full object-cover scale-[1.12] -translate-y-[5%] object-center pointer-events-none z-0"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/75 pointer-events-none z-0" />

      {notice && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-40 bg-[#3b170c]/95 border-2 border-amber-400 text-amber-200 px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-2xl animate-fade-in text-center max-w-xs">
          {notice}
        </div>
      )}

      {/* 1. CABECERA */}
      <header className="relative z-20 w-full pt-2.5 pb-2 px-3 bg-gradient-to-b from-[#2a0e05] via-[#1a0803]/90 to-transparent border-b border-amber-600/40 shadow-xl flex items-center justify-between">
        <button
          onClick={handleBack}
          className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-b from-amber-700 to-amber-950 border border-amber-400 text-amber-200 shadow-lg cursor-pointer hover:scale-105 active:scale-95 transition-all"
          title={category ? 'Volver a Categorías' : 'Salir de la Botica'}
        >
          {category ? (
            <ArrowLeft className="w-5 h-5 text-amber-300" />
          ) : (
            <ChevronLeft className="w-5 h-5 text-amber-300" />
          )}
        </button>

        <div className="flex flex-col items-center">
          <span className="text-[11px] uppercase tracking-widest font-black text-amber-300 drop-shadow">
            Botica de Icespear
          </span>
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black/60 border border-amber-500/50 shadow-inner">
            <span className="text-[11px]">🪙</span>
            <span className="text-[11px] font-bold font-mono text-amber-200">
              {gold.toLocaleString()}
            </span>
            <span className="text-[9px] text-amber-400 font-extrabold bg-amber-950/80 px-1 rounded border border-amber-600/60">
              Raxxar
            </span>
          </div>
        </div>

        <button
          onClick={() => {
            sound.playSFX('click');
            setPantryOpen(true);
          }}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gradient-to-b from-amber-600 to-amber-800 hover:from-amber-500 hover:to-amber-700 text-amber-100 font-bold text-[11px] border border-amber-400/80 shadow-md active:scale-95 transition-all cursor-pointer"
          title="Despensa de materiales"
        >
          <ShoppingBag className="w-3.5 h-3.5 text-amber-200" />
          <span>Alacena</span>
        </button>
      </header>

      {/* 2. RUEDA ORBITAL */}
      <section className="relative z-10 flex-1 w-full flex flex-col items-center justify-center overflow-hidden">
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30">
          <circle
            cx="50%"
            cy="48%"
            r={ORBIT_RADIUS_PX}
            fill="none"
            stroke="#fbbf24"
            strokeWidth="1.5"
            strokeDasharray="4 6"
          />
        </svg>

        <span className="absolute top-[28%] left-[10%] text-amber-300 text-xs animate-pulse pointer-events-none">✦</span>
        <span className="absolute top-[16%] left-[28%] text-amber-200 text-sm animate-pulse pointer-events-none">✦</span>
        <span className="absolute top-[16%] right-[28%] text-amber-200 text-sm animate-pulse pointer-events-none">✦</span>
        <span className="absolute top-[28%] right-[10%] text-amber-300 text-xs animate-pulse pointer-events-none">✦</span>

        {/* Categorías */}
        {!category && (
          <div className="relative w-full h-full flex items-center justify-center animate-wheel-orbit-in">
            {POTION_CATEGORIES.map((cat, idx) => (
              <div
                key={cat.id}
                style={{ ...orbitalStyle(idx, POTION_CATEGORIES.length), animationDelay: `${idx * 45}ms` }}
                onClick={() => {
                  sound.playSFX('click');
                  setCategory(cat.id);
                  setSelectedId(null);
                }}
                className="absolute flex flex-col items-center group cursor-pointer active:scale-95 transition-all z-20 animate-wheel-plate-in"
              >
                <div className="relative w-15 h-15 sm:w-16 sm:h-16 rounded-full bg-gradient-to-b from-stone-800 via-stone-900 to-black border-2 border-amber-400/90 shadow-[0_0_15px_rgba(0,0,0,0.9)] flex items-center justify-center p-1.5 group-hover:scale-110 group-hover:border-yellow-300 transition-all">
                  <div className="w-full h-full rounded-full bg-gradient-to-b from-slate-200/90 to-slate-400/80 flex items-center justify-center p-1 shadow-inner">
                    <div className="w-full h-full rounded-full bg-stone-950 flex items-center justify-center overflow-hidden">
                      <img
                        src={cat.icon}
                        alt={cat.name}
                        className="w-9 h-9 sm:w-10 sm:h-10 object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                      />
                    </div>
                  </div>
                </div>
                <span className="mt-1 text-[10px] sm:text-[11px] font-black text-center text-amber-200 drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)] max-w-[76px] truncate">
                  {cat.name}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Recetas de la categoría */}
        {category && (
          <div className="relative w-full h-full flex items-center justify-center animate-wheel-orbit-in">
            {categoryRecipes.map((recipe, idx) => {
              const owned = ownedCount(recipe);
              const isSelected = selectedId === recipe.id;
              const affordable = gold >= recipe.costGold;

              return (
                <div
                  key={recipe.id}
                  style={{ ...orbitalStyle(idx, categoryRecipes.length), animationDelay: `${idx * 45}ms` }}
                  onClick={() => {
                    sound.playSFX('click');
                    setSelectedId(isSelected ? null : recipe.id);
                  }}
                  className="absolute flex flex-col items-center group cursor-pointer active:scale-95 transition-all z-20 animate-wheel-plate-in"
                >
                  <div
                    className={`relative w-15 h-15 sm:w-16 sm:h-16 rounded-full flex items-center justify-center p-1.5 transition-all transform group-hover:scale-110 shadow-xl ${
                      affordable
                        ? 'bg-gradient-to-b from-stone-800 via-stone-900 to-black border-2 border-amber-400 shadow-amber-900/40'
                        : 'bg-stone-900/80 border border-stone-600 opacity-70 grayscale'
                    } ${isSelected ? 'ring-2 ring-yellow-400 ring-offset-2 ring-offset-black scale-105' : ''}`}
                  >
                    <div className="w-full h-full rounded-full bg-gradient-to-b from-slate-200/90 to-slate-400/80 flex items-center justify-center p-1 shadow-inner">
                      <div className="w-full h-full rounded-full bg-stone-950 flex items-center justify-center overflow-hidden">
                        <img
                          src={recipe.icon}
                          alt={recipe.name}
                          className="w-9 h-9 sm:w-10 sm:h-10 object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                        />
                      </div>
                    </div>
                    <span
                      className={`absolute -bottom-1 -right-1 text-[10px] font-black font-mono px-1.5 py-0.2 rounded-full border shadow-md ${
                        owned > 0
                          ? 'bg-amber-500 text-stone-950 border-amber-200'
                          : 'bg-stone-700 text-stone-300 border-stone-500'
                      }`}
                    >
                      {owned}
                    </span>
                  </div>
                  <span className="mt-1 text-[9.5px] sm:text-[10px] font-bold text-center text-amber-100 max-w-[78px] leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)] line-clamp-2">
                    {recipe.name}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 3. MESA DE ALQUIMIA */}
      <div className="relative z-20 w-full pt-1 pb-3 px-3 bg-gradient-to-t from-[#140602] via-[#210904]/95 to-transparent flex flex-col items-center">
        <div className="w-full flex items-center justify-between px-2 mb-1">
          {selected ? (
            <div className="w-full flex items-center justify-between bg-amber-950/90 border border-amber-400 rounded-lg px-2.5 py-1.5 shadow-lg animate-fade-in">
              <div className="flex items-center gap-2 min-w-0">
                <img src={selected.icon} alt={selected.name} className="w-6 h-6 object-contain" />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-black text-amber-200 truncate">
                      {selected.name}
                    </span>
                    <span className="text-[9px] font-extrabold px-1 rounded bg-amber-500 text-black shrink-0">
                      {rarityForStars(selected.stars)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {selected.elementOrb && (
                      <img src={selected.elementOrb} alt={selected.element} className="w-3 h-3 object-contain" />
                    )}
                    <span className="text-[10px] text-amber-300/90 font-bold">
                      {selected.element} · Grado {selected.level}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  sound.playSFX('click');
                  setSelectedId(null);
                }}
                className="text-stone-400 hover:text-red-400 p-1 cursor-pointer shrink-0"
                title="Quitar de la mesa"
              >
                ✕
              </button>
            </div>
          ) : (
            <div className="w-full text-center text-[10px] text-amber-300/80 font-serif py-0.5">
              {category
                ? 'Toca una receta de la rueda para ponerla en la mesa.'
                : 'Elige Pociones, Encantamientos o Aceites para empezar.'}
            </div>
          )}
        </div>

        {/* Tabla de destilado con los materiales */}
        <div className="relative w-[340px] h-[95px] flex items-center justify-center">
          <div className="absolute inset-0 rounded-[16px] bg-gradient-to-b from-[#3d1b0c] via-[#2f1308] to-[#240d05] border border-[#74361a] shadow-[0_10px_22px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,190,120,0.18),inset_0_-8px_16px_rgba(0,0,0,0.45)]">
            <div className="absolute inset-0 rounded-[16px] opacity-20 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-200/70 via-transparent to-black" />
          </div>

          <div className="relative z-10 w-full flex items-center justify-center gap-7">
            {[0, 1, 2].map((slotIdx) => {
              const ingredient = selected?.ingredients[slotIdx] ?? null;
              const have = ingredient ? materialHave(ingredient.icon, ingredient.name) : 0;
              const enough = ingredient ? have >= ingredient.need : false;

              return (
                <div key={slotIdx} className="relative flex flex-col items-center">
                  <div
                    className={`relative w-15 h-15 rounded-full flex items-center justify-center bg-[#1f0a03] shadow-[inset_0_3px_8px_rgba(0,0,0,0.85)] ${
                      ingredient
                        ? enough
                          ? 'border-2 border-amber-500/90'
                          : 'border-2 border-rose-600/80'
                        : 'border-2 border-dashed border-amber-600/60'
                    }`}
                  >
                    {ingredient ? (
                      <>
                        <div className="w-12 h-12 rounded-full bg-stone-900 flex items-center justify-center overflow-hidden p-1 shadow-inner">
                          <img
                            src={ingredient.icon}
                            alt={ingredient.name}
                            className="w-9 h-9 object-contain"
                          />
                        </div>
                        <span
                          className={`absolute -bottom-1 -right-1 text-[10px] font-black font-mono px-1.5 py-0.2 rounded-full border shadow-md ${
                            enough
                              ? 'bg-amber-500 text-stone-950 border-amber-200'
                              : 'bg-rose-700 text-white border-rose-300'
                          }`}
                        >
                          {have}/{ingredient.need}
                        </span>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-amber-500/90 leading-none">
                        <FlaskConical className="w-5 h-5" />
                        <span className="mt-0.5 text-[10px] font-black font-mono text-amber-600/80">
                          {slotIdx + 1}
                        </span>
                      </div>
                    )}
                  </div>
                  <span className="mt-1 text-[9px] font-bold text-amber-100/90 max-w-[76px] truncate drop-shadow">
                    {ingredient ? ingredient.name : '—'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. ACCIÓN INFERIOR */}
        <div className="w-full flex items-center justify-between gap-3 mt-2 px-3">
          <div className="w-12 text-center">
            {selected && (
              <span className="text-[10px] font-black font-mono text-amber-300">{selected.costGold}🪙</span>
            )}
          </div>

          <button
            onClick={handleBrew}
            disabled={!canBrew}
            className={`flex-1 py-2.5 px-4 rounded-xl font-black font-serif text-sm tracking-wider uppercase flex items-center justify-center gap-2 border-2 transition-all cursor-pointer shadow-xl ${
              canBrew
                ? 'bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:from-amber-500 hover:to-orange-500 text-white border-amber-300 shadow-[0_0_20px_rgba(249,115,22,0.6)] active:scale-95 animate-pulse'
                : 'bg-stone-900/80 text-stone-500 border-stone-700 cursor-not-allowed opacity-60'
            }`}
          >
            <Flame className={`w-5 h-5 ${canBrew ? 'text-yellow-300 animate-spin' : 'text-stone-500'}`} />
            <span>Destilar</span>
          </button>

          <button
            onClick={() => {
              sound.playSFX('click');
              setMilestonesOpen(true);
            }}
            className="relative w-12 h-12 rounded-full bg-gradient-to-b from-amber-700 via-amber-900 to-black border-2 border-amber-400 p-1 flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 cursor-pointer transition-all shrink-0"
            title="Hitos de la Botica"
          >
            <Sparkles className="w-5 h-5 text-amber-200" />
            {unclaimedMilestones > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-rose-600 text-white text-[9px] font-black flex items-center justify-center border border-amber-200">
                {unclaimedMilestones}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Despensa de materiales */}
      {pantryOpen && (
        <div
          className="absolute inset-0 z-40 bg-black/70 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setPantryOpen(false)}
        >
          <div
            className="w-full max-w-sm max-h-[70%] overflow-y-auto rounded-2xl bg-[#2a0e05]/97 border-2 border-amber-500/80 shadow-2xl p-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] uppercase tracking-widest font-black text-amber-300">
                Alacena de Raxxar
              </span>
              <button
                onClick={() => setPantryOpen(false)}
                className="text-stone-400 hover:text-red-400 p-1 cursor-pointer"
                title="Cerrar"
              >
                ✕
              </button>
            </div>
            <div className="flex flex-col gap-1.5">
              {POTION_MATERIALS.map((material) => {
                const count = materialHave(material.icon, material.name);
                return (
                  <div
                    key={material.icon}
                    className="flex items-center gap-2 rounded-lg bg-black/40 border border-amber-800/60 px-2 py-1.5"
                  >
                    <img src={material.icon} alt={material.name} className="w-6 h-6 object-contain" />
                    <span className="flex-1 text-[11px] font-bold text-amber-100 truncate">
                      {material.name}
                    </span>
                    <span
                      className={`text-[11px] font-black font-mono px-1.5 rounded border ${
                        count > 0
                          ? 'bg-amber-500 text-stone-950 border-amber-200'
                          : 'bg-stone-800 text-stone-400 border-stone-600'
                      }`}
                    >
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <PotionMilestonesModal
        isOpen={milestonesOpen}
        onClose={() => setMilestonesOpen(false)}
        stats={stats}
        claimedMilestones={claimed}
        onClaimMilestone={claimOne}
        onClaimAllMilestones={claimAll}
      />
    </div>
  );
};
