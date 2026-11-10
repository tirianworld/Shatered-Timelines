import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { sound } from '../services/soundService';
import confetti from 'canvas-confetti';
import {
  COOKING_INGREDIENTS,
  COOKING_RECIPES,
  INGREDIENT_CATEGORIES,
  IngredientCategory,
  CookingIngredient,
  CookingRecipe,
  matchRecipe,
  loadTavernCookingStock,
  saveTavernCookingStock,
  hasMonsterMaterial,
  loadChefAffection,
  saveChefAffection,
  loadDiscoveredRecipes,
  saveDiscoveredRecipes,
  TavernCookingStock,
  ChefAffectionData,
} from '../data/cookingData';
import { CookingIngredientIcon } from './CookingIngredientIcon';
import { safeStorage } from '../utils/storage';
import {
  KITCHEN_INTRO_MISSION_ID,
  KITCHEN_INTRO_SEEN_KEY,
  KITCHEN_MONSTERS_INTRO_MISSION_ID,
  KITCHEN_MONSTERS_INTRO_PENDING_KEY,
  KITCHEN_MONSTERS_INTRO_SEEN_KEY,
  KITCHEN_MONSTERS_UNLOCK_KEY,
  KITCHEN_TUTORIAL_DONE_KEY,
  KITCHEN_TUTORIAL_INGREDIENT_IDS,
  KITCHEN_TUTORIAL_STEPS,
} from '../data/kitchenIntroData';
import {
  ChevronLeft,
  Heart,
  Flame,
  Sparkles,
  BookOpen,
  ShoppingBag,
  X,
  Check,
  Plus,
  RotateCcw,
  Coins,
  ArrowLeft,
  Utensils,
  Lock,
} from 'lucide-react';

interface TavernKitchenViewProps {
  onClose: () => void;
}

// Radio del anillo en píxeles: así la órbita es un círculo perfecto
// independientemente de lo ancha o alta que sea la pantalla.
const ORBIT_RADIUS_PX = 150;
const ORBIT_CENTER_Y = 48;

// Primer paso del tutorial de Paco que se puede tocar: el inicial ("volver") solo
// tiene sentido cuando ya estás dentro de una categoría.
const FIRST_KITCHEN_TUTORIAL_STEP = KITCHEN_TUTORIAL_STEPS.findIndex((s) => s.kind !== 'back');

// Los monstruos se agrupan en las familias de siempre, pero solo se muestran
// las que tienen materiales de monstruo.
const MONSTER_SUBCATEGORIES = INGREDIENT_CATEGORIES.filter(
  (cat) =>
    cat.id !== 'monstruos' &&
    COOKING_INGREDIENTS.some(
      (ing) => ing.category === 'monstruos' && ing.subCategory === cat.id
    )
);

// Computes uniform orbital coordinates around the central hub without overlapping
const getOrbitalPositionStyle = (
  index: number,
  total: number,
  radiusPx = ORBIT_RADIUS_PX,
  centerY = ORBIT_CENTER_Y
) => {
  if (total <= 0) return { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' };
  // Start at -90 deg (-Math.PI / 2) so first item is at 12 o'clock (top center)
  const angle = (2 * Math.PI * index) / total - Math.PI / 2;
  const offsetX = radiusPx * Math.cos(angle);
  const offsetY = radiusPx * Math.sin(angle);
  return {
    left: `calc(50% + ${offsetX.toFixed(2)}px)`,
    top: `calc(${centerY}% + ${offsetY.toFixed(2)}px)`,
    transform: 'translate(-50%, -50%)',
  };
};

export const TavernKitchenView: React.FC<TavernKitchenViewProps> = ({ onClose }) => {
  const { gold, addGold, addShelfItem, navigateTo, setSelectedCombatMissionId } = useGame();

  // Navigation within the circle: categorías → subcategorías (solo Monstruos) → ingredientes.
  const [viewMode, setViewMode] = useState<'categories' | 'subcategories' | 'ingredients'>(
    'categories'
  );
  const [selectedCategory, setSelectedCategory] = useState<IngredientCategory>('carnes');
  // Familia elegida dentro de Monstruos (carnes, verduras, harinas…).
  const [selectedSubcategory, setSelectedSubcategory] = useState<IngredientCategory>('carnes');

  // Cutting board: 3 slots for ingredients
  const [slots, setSlots] = useState<[CookingIngredient | null, CookingIngredient | null, CookingIngredient | null]>([
    null,
    null,
    null,
  ]);

  // Active slot index (0, 1, or 2) - targeted by the golden sun pointer
  const [activeSlotIndex, setActiveSlotIndex] = useState<number>(0);

  // Stock of ingredients and chef affection
  const [stock, setStock] = useState<TavernCookingStock>(() => loadTavernCookingStock());
  const [affection, setAffection] = useState<ChefAffectionData>(() => loadChefAffection());
  const [discoveredRecipes, setDiscoveredRecipes] = useState<string[]>(() => loadDiscoveredRecipes());

  // UI Modals & Overlays
  const [isRecipeBookOpen, setIsRecipeBookOpen] = useState(false);
  const [recipeFilter, setRecipeFilter] = useState<string>('todas');
  const [recipeSearch, setRecipeSearch] = useState<string>('');
  const [recipePageLimit, setRecipePageLimit] = useState<number>(50);
  const [isPantryOpen, setIsPantryOpen] = useState(false);
  const [isAffectionModalOpen, setIsAffectionModalOpen] = useState(false);

  // Primera visita al fogón: cinemática de Paco (una sola vez).
  const kitchenIntroLaunched = useRef(false);

  useEffect(() => {
    if (kitchenIntroLaunched.current) return;
    if (safeStorage.getItem(KITCHEN_INTRO_SEEN_KEY) === 'seen') return;
    kitchenIntroLaunched.current = true;
    safeStorage.setItem(KITCHEN_INTRO_SEEN_KEY, 'seen');
    setViewMode('categories');
    setSelectedCombatMissionId(KITCHEN_INTRO_MISSION_ID);
    navigateTo('story');
  }, [navigateTo, setSelectedCombatMissionId]);

  // Al volver de la cinemática de Monstruos se abre directamente su rueda.
  useEffect(() => {
    if (safeStorage.getItem(KITCHEN_MONSTERS_INTRO_PENDING_KEY) !== '1') return;
    safeStorage.removeItem(KITCHEN_MONSTERS_INTRO_PENDING_KEY);
    setSelectedCategory('monstruos');
    setViewMode('subcategories');
  }, []);

  // La cocina de monstruos arranca cerrada: se abre al conseguir el primer componente.
  const monstersUnlocked =
    safeStorage.getItem(KITCHEN_MONSTERS_UNLOCK_KEY) === '1' || hasMonsterMaterial(stock);

  useEffect(() => {
    if (monstersUnlocked) safeStorage.setItem(KITCHEN_MONSTERS_UNLOCK_KEY, '1');
  }, [monstersUnlocked]);

  // Filtered recipes memoized for the Recipe Book modal
  const filteredRecipes = useMemo(() => {
    const q = recipeSearch.trim().toLowerCase();
    return COOKING_RECIPES.filter((rec) => {
      if (recipeFilter !== 'todas' && !rec.requiredCategories.includes(recipeFilter as any)) {
        return false;
      }
      if (q) {
        return (
          rec.name.toLowerCase().includes(q) ||
          rec.buffBadge.toLowerCase().includes(q) ||
          rec.lore.toLowerCase().includes(q)
        );
      }
      return true;
    }).sort((a, b) => {
      const aDisc = discoveredRecipes.includes(a.id) ? 1 : 0;
      const bDisc = discoveredRecipes.includes(b.id) ? 1 : 0;
      return bDisc - aDisc;
    });
  }, [recipeFilter, recipeSearch, discoveredRecipes]);

  useEffect(() => {
    setRecipePageLimit(50);
  }, [recipeFilter, recipeSearch]);


  // Cooking state & celebration modal
  const [isCookingAnimation, setIsCookingAnimation] = useState(false);
  const [cookedDishResult, setCookedDishResult] = useState<{
    recipe: CookingRecipe;
    duplicated: boolean;
    affectionGain: number;
  } | null>(null);

  // Feedback notice banner
  const [kitchenNotice, setKitchenNotice] = useState<string | null>(null);

  const kitchenNoticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showNotice = (msg: string) => {
    if (kitchenNoticeTimer.current) clearTimeout(kitchenNoticeTimer.current);
    setKitchenNotice(msg);
    kitchenNoticeTimer.current = setTimeout(() => setKitchenNotice(null), 2500);
  };

  // -------------------------------------------------------------------------
  // Tutorial guiado de Paco: volver → categoría → ingrediente, tres veces.
  // Se muestra una sola vez y se reanuda si quedó a medias.
  // -------------------------------------------------------------------------
  const [kitchenTutorialStep, setKitchenTutorialStep] = useState<number>(() => {
    const introSeen = safeStorage.getItem(KITCHEN_INTRO_SEEN_KEY) === 'seen';
    const tutorialDone = safeStorage.getItem(KITCHEN_TUTORIAL_DONE_KEY) === 'done';
    return introSeen && !tutorialDone ? FIRST_KITCHEN_TUTORIAL_STEP : -1;
  });
  const kitchenTutorialKitGranted = useRef(false);

  const tutorialStage =
    kitchenTutorialStep >= 0 ? KITCHEN_TUTORIAL_STEPS[kitchenTutorialStep] : null;
  const tutorialCategoryTarget =
    tutorialStage?.kind === 'category' ? tutorialStage.category : null;
  const tutorialIngredientTarget =
    tutorialStage?.kind === 'ingredient' ? tutorialStage.ingredientId : null;
  const isTutorialBackStep = tutorialStage?.kind === 'back';
  const tutorialTargetName = tutorialCategoryTarget
    ? INGREDIENT_CATEGORIES.find((c) => c.id === tutorialCategoryTarget)?.name ?? ''
    : tutorialIngredientTarget
    ? COOKING_INGREDIENTS.find((i) => i.id === tutorialIngredientTarget)?.name ?? ''
    : '';

  // Durante el tutorial, lo que no hay que tocar se apaga en blanco y negro y se queda quieto.
  const tutorialIsActive = kitchenTutorialStep >= 0;
  const tutorialDimClass = (isTarget: boolean) =>
    tutorialIsActive && !isTarget
      ? 'grayscale opacity-60 transition-none! [&_*]:animate-none!'
      : '';
  const tutorialInertClass = (isTarget: boolean) =>
    tutorialIsActive && !isTarget
      ? 'grayscale opacity-60 transition-none! [&_*]:animate-none! pointer-events-none'
      : '';

  // Paco deja apartado lo necesario para el asado del día antes de empezar.
  useEffect(() => {
    if (kitchenTutorialStep < 0 || kitchenTutorialKitGranted.current) return;
    kitchenTutorialKitGranted.current = true;
    setStock((prev) => {
      const next = { ...prev };
      let changed = false;
      KITCHEN_TUTORIAL_INGREDIENT_IDS.forEach((id) => {
        if ((next[id] || 0) < 1) {
          next[id] = 1;
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [kitchenTutorialStep]);

  const finishKitchenTutorial = () => {
    setKitchenTutorialStep(-1);
    safeStorage.setItem(KITCHEN_TUTORIAL_DONE_KEY, 'done');
  };

  const advanceKitchenTutorial = (
    currentView: 'categories' | 'subcategories' | 'ingredients' = viewMode
  ) => {
    if (kitchenTutorialStep < 0) return;
    let next = kitchenTutorialStep + 1;
    // El paso de "volver" solo tiene sentido si estamos viendo ingredientes.
    while (
      next < KITCHEN_TUTORIAL_STEPS.length &&
      KITCHEN_TUTORIAL_STEPS[next].kind === 'back' &&
      currentView !== 'ingredients'
    ) {
      next += 1;
    }
    if (next >= KITCHEN_TUTORIAL_STEPS.length) {
      finishKitchenTutorial();
      sound.playSFX('victory');
      try {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#fbbf24', '#ef4444', '#10b981'],
        });
      } catch {
        // Safe fallback
      }
      showNotice('¡Tutorial completado! El asado del día está listo en la tabla.');
      return;
    }
    setKitchenTutorialStep(next);
  };


  // La flecha del header vuelve a categorías y, si toca, avanza el tutorial.
  const handleHeaderBack = () => {
    sound.playSFX('click');
    if (viewMode === 'subcategories') {
      setViewMode('categories');
      return;
    }
    if (viewMode === 'ingredients') {
      setViewMode(selectedCategory === 'monstruos' ? 'subcategories' : 'categories');
      if (isTutorialBackStep) {
        advanceKitchenTutorial('categories');
        return;
      }
      // Si se vuelve a medias de un ingrediente, el tutorial retrocede a su
      // categoría para no quedarse bloqueado.
      if (tutorialIngredientTarget) setKitchenTutorialStep(kitchenTutorialStep - 1);
      return;
    }
    onClose();
  };

  // Check if 3 slots are filled
  const isBoardFull = slots[0] !== null && slots[1] !== null && slots[2] !== null;
  const previewRecipe: CookingRecipe | null = isBoardFull
    ? matchRecipe([slots[0]!, slots[1]!, slots[2]!])
    : null;

  // Sync storage on change
  useEffect(() => {
    saveTavernCookingStock(stock);
  }, [stock]);

  useEffect(() => {
    saveChefAffection(affection);
  }, [affection]);

  useEffect(() => {
    saveDiscoveredRecipes(discoveredRecipes);
  }, [discoveredRecipes]);

  // Filter ingredients for current active category
  const categoryIngredients = COOKING_INGREDIENTS.filter((ing) =>
    selectedCategory === 'monstruos'
      ? ing.category === 'monstruos' && ing.subCategory === selectedSubcategory
      : ing.category === selectedCategory
  );

  // Switch to ingredients view for a clicked category
  const handleSelectCategory = (catId: IngredientCategory) => {
    if (tutorialCategoryTarget && catId !== tutorialCategoryTarget) {
      sound.playSFX('hurt');
      return;
    }
    // Bloqueada: la placa no responde hasta conseguir un componente de monstruo.
    if (catId === 'monstruos' && !monstersUnlocked) return;

    // La primera vez que se abre Monstruos, Paco explica la cocina exótica.
    if (
      catId === 'monstruos' &&
      safeStorage.getItem(KITCHEN_MONSTERS_INTRO_SEEN_KEY) !== 'seen'
    ) {
      safeStorage.setItem(KITCHEN_MONSTERS_INTRO_SEEN_KEY, 'seen');
      safeStorage.setItem(KITCHEN_MONSTERS_INTRO_PENDING_KEY, '1');
      setSelectedCombatMissionId(KITCHEN_MONSTERS_INTRO_MISSION_ID);
      navigateTo('story');
      return;
    }

    sound.playSFX('click');
    setSelectedCategory(catId);
    // Monstruos abre primero sus familias antes de enseñar los materiales.
    setViewMode(catId === 'monstruos' ? 'subcategories' : 'ingredients');
    if (tutorialCategoryTarget) advanceKitchenTutorial('ingredients');
  };

  // Familia de Monstruos: mismos nombres que las categorías normales.
  const handleSelectSubcategory = (catId: IngredientCategory) => {
    sound.playSFX('click');
    setSelectedSubcategory(catId);
    setViewMode('ingredients');
  };

  // Place ingredient onto current active slot on cutting board
  const handleSelectIngredient = (ingredient: CookingIngredient) => {
    if (tutorialIngredientTarget && ingredient.id !== tutorialIngredientTarget) {
      sound.playSFX('hurt');
      return;
    }

    const currentCount = stock[ingredient.id] || 0;
    if (currentCount <= 0) {
      sound.playSFX('hurt');
      showNotice(`¡Agotado! Compra más ${ingredient.name} en la Despensa.`);
      return;
    }

    sound.playSFX('click');
    const newSlots: [CookingIngredient | null, CookingIngredient | null, CookingIngredient | null] = [...slots];
    newSlots[activeSlotIndex] = ingredient;
    setSlots(newSlots);

    // Auto-advance pointer to next empty slot
    const nextEmpty = newSlots.findIndex((s) => s === null);
    if (nextEmpty !== -1) {
      setActiveSlotIndex(nextEmpty);
    } else {
      setActiveSlotIndex((activeSlotIndex + 1) % 3);
    }

    showNotice(`¡${ingredient.name} colocado en la tabla!`);
    if (tutorialIngredientTarget) advanceKitchenTutorial();
  };

  // Remove ingredient from a slot
  const handleRemoveSlot = (index: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    sound.playSFX('click');
    const newSlots: [CookingIngredient | null, CookingIngredient | null, CookingIngredient | null] = [...slots];
    newSlots[index] = null;
    setSlots(newSlots);
    setActiveSlotIndex(index);
  };

  // Clear all slots
  const handleClearBoard = () => {
    sound.playSFX('click');
    setSlots([null, null, null]);
    setActiveSlotIndex(0);
  };

  // Cook the dish
  const handleCook = () => {
    if (!isBoardFull) return;

    // Check stock for all 3 ingredients
    const neededCounts: Record<string, number> = {};
    for (const slot of slots) {
      if (slot) {
        neededCounts[slot.id] = (neededCounts[slot.id] || 0) + 1;
      }
    }

    for (const [id, count] of Object.entries(neededCounts)) {
      if ((stock[id] || 0) < count) {
        sound.playSFX('hurt');
        showNotice(`¡Faltan ingredientes en la despensa!`);
        return;
      }
    }

    // Deduct stock
    const newStock = { ...stock };
    for (const [id, count] of Object.entries(neededCounts)) {
      newStock[id] = Math.max(0, (newStock[id] || 0) - count);
    }
    setStock(newStock);

    // Start cooking animation & sound
    setIsCookingAnimation(true);
    sound.playSFX('laser1');
    setTimeout(() => {
      sound.playSFX('powerup');
    }, 450);

    const recipe = matchRecipe([slots[0]!, slots[1]!, slots[2]!]);

    setTimeout(() => {
      setIsCookingAnimation(false);

      const isDuplicated = Math.random() < 0.2;
      const countToAdd = isDuplicated ? 2 : 1;

      // Add item to shelfInventory as food consumable
      addShelfItem({
        id: recipe.shelfItemId,
        name: recipe.name,
        category: 'food',
        count: countToAdd,
        icon: recipe.icon,
        rarity: recipe.rarity,
        description: `${recipe.lore} [${recipe.buffBadge}]: ${recipe.buffDescription}`,
        priceGold: recipe.rarity === 'SSR' ? 450 : recipe.rarity === 'SR' ? 250 : 150,
      });

      // Update chef affection
      const affGain = recipe.rarity === 'SSR' ? 120 : recipe.rarity === 'SR' ? 80 : 50;
      setAffection((prev) => {
        const nextPts = prev.points + affGain;
        const nextLvl = Math.floor(nextPts / 200) + 1;
        return {
          ...prev,
          points: nextPts,
          level: Math.max(prev.level, nextLvl),
        };
      });

      if (!discoveredRecipes.includes(recipe.id)) {
        setDiscoveredRecipes((prev) => [...prev, recipe.id]);
      }

      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.65 },
          colors: ['#f59e0b', '#ef4444', '#10b981', '#3b82f6'],
        });
      } catch {
        // Safe fallback
      }
      sound.playSFX('coin');

      setCookedDishResult({
        recipe,
        duplicated: isDuplicated,
        affectionGain: affGain,
      });

      setSlots([null, null, null]);
      setActiveSlotIndex(0);
    }, 1200);
  };

  // Quick auto-fill recipe from Cookbook
  const handleAutoFillRecipe = (recipe: CookingRecipe) => {
    let ing1: CookingIngredient | null = null;
    let ing2: CookingIngredient | null = null;
    let ing3: CookingIngredient | null = null;

    if (recipe.specificIngredientIds && recipe.specificIngredientIds.length === 3) {
      ing1 = COOKING_INGREDIENTS.find((i) => i.id === recipe.specificIngredientIds![0]) || null;
      ing2 = COOKING_INGREDIENTS.find((i) => i.id === recipe.specificIngredientIds![1]) || null;
      ing3 = COOKING_INGREDIENTS.find((i) => i.id === recipe.specificIngredientIds![2]) || null;
    } else {
      const chosen: CookingIngredient[] = [];
      const usedCounts: Record<string, number> = {};

      for (const cat of recipe.requiredCategories) {
        // Try finding candidate with available stock first
        let candidate = COOKING_INGREDIENTS.find(
          (i) => i.category === cat && (stock[i.id] || 0) > (usedCounts[i.id] || 0)
        );
        // Fallback to any ingredient in that category
        if (!candidate) {
          candidate = COOKING_INGREDIENTS.find((i) => i.category === cat);
        }
        if (candidate) {
          chosen.push(candidate);
          usedCounts[candidate.id] = (usedCounts[candidate.id] || 0) + 1;
        }
      }

      ing1 = chosen[0] || null;
      ing2 = chosen[1] || null;
      ing3 = chosen[2] || null;
    }

    if (ing1 && ing2 && ing3) {
      sound.playSFX('click');
      setSlots([ing1, ing2, ing3]);
      setIsRecipeBookOpen(false);
      showNotice(`¡Ingredientes para ${recipe.name} listos en la tabla!`);
    }
  };

  // Buy ingredient from Pantry
  const handleBuyIngredient = (ingredient: CookingIngredient) => {
    if (gold < ingredient.priceGold) {
      sound.playSFX('hurt');
      showNotice('¡No tienes suficiente oro para comprar este ingrediente!');
      return;
    }
    sound.playSFX('coin');
    addGold(-ingredient.priceGold);
    setStock((prev) => ({
      ...prev,
      [ingredient.id]: (prev[ingredient.id] || 0) + 1,
    }));
  };

  // Claim daily free rations
  const handleClaimFreeRations = () => {
    sound.playSFX('powerup');
    const updated = { ...stock };
    COOKING_INGREDIENTS.forEach((ing) => {
      updated[ing.id] = (updated[ing.id] || 0) + 2;
    });
    setStock(updated);
    showNotice('¡Raciones frescas añadidas a la despensa!');
  };

  return (
    <div className="absolute inset-0 w-full h-full bg-[#140602] text-stone-100 flex flex-col justify-between overflow-hidden select-none z-50 animate-fade-in font-sans">
      {/* Background: Authentic Tavern Kitchen Interior */}
      <img
        src="/assets/backgrounds/cocina_taverna_icespear.png"
        alt="Cocina de la Taberna de Icespear"
        className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none z-0"
      />

      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/75 pointer-events-none z-0" />

      {/* Notice Banner */}
      {kitchenNotice && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-40 bg-[#3b170c]/95 border-2 border-amber-400 text-amber-200 px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-2xl animate-fade-in text-center max-w-xs">
          {kitchenNotice}
        </div>
      )}

      {/* Tutorial de Paco: indicación del paso */}
      {kitchenTutorialStep >= 0 && (
        <div className="absolute top-[54px] left-1/2 -translate-x-1/2 z-40 flex flex-col items-center pointer-events-none max-w-[92%]">
          <p className="px-3 py-1 rounded-lg bg-[#2a0e05]/95 border border-amber-600/60 text-[10px] font-bold text-amber-100 text-center shadow-lg">
            {tutorialStage?.kind === 'back'
              ? 'Toca la flecha de arriba para volver a las categorías.'
              : tutorialStage?.kind === 'category'
              ? `Toca la categoría ${tutorialTargetName}.`
              : `Toca ${tutorialTargetName} para ponerlo en la tabla.`}
          </p>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 1. TOP HEADER                                                 */}
      {/* ------------------------------------------------------------- */}
      <header className="relative z-20 w-full pt-2.5 pb-2 px-3 bg-gradient-to-b from-[#2a0e05] via-[#1a0803]/90 to-transparent border-b border-amber-600/40 shadow-xl flex items-center justify-between">
        {/* Back Button (Golden Arrow) */}
        <button
          onClick={handleHeaderBack}
          className={`flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-b from-amber-700 to-amber-950 border border-amber-400 text-amber-200 shadow-lg cursor-pointer hover:scale-105 active:scale-95 transition-all ${
            isTutorialBackStep ? 'ring-2 ring-yellow-300 ring-offset-2 ring-offset-black animate-pulse' : ''
          } ${tutorialDimClass(!!isTutorialBackStep)}`}
          title={
            viewMode === 'categories'
              ? 'Salir del menú de cocina'
              : viewMode === 'ingredients' && selectedCategory === 'monstruos'
              ? 'Volver a Subcategorías'
              : 'Volver a Categorías'
          }
        >
          {viewMode === 'categories' ? (
            <ChevronLeft className="w-5 h-5 text-amber-300" />
          ) : (
            <ArrowLeft className="w-5 h-5 text-amber-300" />
          )}
        </button>

        {/* Center Title & Affection */}
        <div
          onClick={() => {
            sound.playSFX('click');
            setIsAffectionModalOpen(true);
          }}
          className={`flex flex-col items-center cursor-pointer group transition-all ${tutorialInertClass(false)}`}
          title="Ver Nivel del Fogón"
        >
          <span className="text-[11px] uppercase tracking-widest font-black text-amber-300 drop-shadow">
            Fogón de Icespear
          </span>
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black/60 border border-amber-500/50 shadow-inner group-hover:border-amber-400 transition-all">
            <Heart className="w-3 h-3 text-rose-500 fill-rose-500 animate-pulse" />
            <span className="text-[11px] font-bold font-mono text-amber-200">
              {affection.points.toLocaleString()}
            </span>
            <span className="text-[9px] text-amber-400 font-extrabold bg-amber-950/80 px-1 rounded border border-amber-600/60">
              +
            </span>
          </div>
        </div>

        {/* Right Action: Pantry / Ingredients Drawer */}
        <button
          onClick={() => {
            sound.playSFX('click');
            setIsPantryOpen(true);
          }}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gradient-to-b from-amber-600 to-amber-800 hover:from-amber-500 hover:to-amber-700 text-amber-100 font-bold text-[11px] border border-amber-400/80 shadow-md active:scale-95 transition-all cursor-pointer ${tutorialInertClass(false)}`}
          title="Despensa de Ingredientes"
        >
          <ShoppingBag className="w-3.5 h-3.5 text-amber-200" />
          <span>Despensa</span>
        </button>
      </header>

      {/* ------------------------------------------------------------- */}
      {/* 2. CIRCULAR CONSTELLATION STAGE (NO MAGORDITO, NO BARRA)       */}
      {/* ------------------------------------------------------------- */}
      <section className="relative z-10 flex-1 w-full flex flex-col items-center justify-center overflow-hidden">
        {/* Responsive Celestial Dashed Orbit Ring */}
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

        {/* Orbit Star Twinkles (✦) */}
        <span className="absolute top-[28%] left-[10%] text-amber-300 text-xs animate-pulse pointer-events-none">✦</span>
        <span className="absolute top-[16%] left-[28%] text-amber-200 text-sm animate-pulse pointer-events-none">✦</span>
        <span className="absolute top-[16%] right-[28%] text-amber-200 text-sm animate-pulse pointer-events-none">✦</span>
        <span className="absolute top-[28%] right-[10%] text-amber-300 text-xs animate-pulse pointer-events-none">✦</span>
        <span className="absolute bottom-[34%] left-[15%] text-amber-400 text-xs pointer-events-none">✦</span>
        <span className="absolute bottom-[34%] right-[15%] text-amber-400 text-xs pointer-events-none">✦</span>

        {/* ========================================================= */}
        {/* VIEW 1: CATEGORIES CIRCLE (Primero salen las categorías)  */}
        {/* ========================================================= */}
        {viewMode === 'categories' && (
          <div className="relative w-full h-full flex items-center justify-center animate-wheel-orbit-in">
            {/* Category Circular Plates around Orbit (Dynamically Spaced) */}
            {INGREDIENT_CATEGORIES.map((cat, idx) => {
              const pos = getOrbitalPositionStyle(idx, INGREDIENT_CATEGORIES.length);

              return (
                <div
                  key={cat.id}
                  style={{ ...pos, animationDelay: `${idx * 45}ms` }}
                  onClick={() => handleSelectCategory(cat.id)}
                  className={`absolute flex flex-col items-center group cursor-pointer active:scale-95 transition-all z-20 animate-wheel-plate-in ${tutorialInertClass(
                    tutorialCategoryTarget === cat.id
                  )} ${cat.id === 'monstruos' && !monstersUnlocked ? 'grayscale opacity-60 pointer-events-none' : ''}`}
                >
                  {/* Category Circle Plate */}
                  <div
                    className={`relative w-15 h-15 sm:w-16 sm:h-16 rounded-full bg-gradient-to-b from-stone-800 via-stone-900 to-black border-2 border-amber-400/90 shadow-[0_0_15px_rgba(0,0,0,0.9)] flex items-center justify-center p-1.5 group-hover:scale-110 group-hover:border-yellow-300 transition-all ${
                      tutorialCategoryTarget === cat.id
                        ? 'ring-2 ring-yellow-300 ring-offset-2 ring-offset-black animate-pulse'
                        : ''
                    }`}
                  >
                    {/* Inner Plate Dish */}
                    <div className="w-full h-full rounded-full bg-gradient-to-b from-slate-200/90 to-slate-400/80 flex items-center justify-center p-1 shadow-inner">
                      <div className="w-full h-full rounded-full bg-stone-950 flex items-center justify-center overflow-hidden">
                        <img
                          src={cat.imageIcon}
                          alt={cat.name}
                          className="w-9 h-9 sm:w-10 sm:h-10 object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                        />
                      </div>
                    </div>

                    {/* Candado: sin componentes de monstruo no se abre */}
                    {cat.id === 'monstruos' && !monstersUnlocked && (
                      <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center">
                        <Lock
                          className="w-6 h-6 text-amber-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]"
                          strokeWidth={2.6}
                        />
                      </div>
                    )}
                  </div>

                  {/* Category Name */}
                  <span className="mt-1 text-[10px] sm:text-[11px] font-black text-center text-amber-200 drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)] max-w-[70px] truncate">
                    {cat.name}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 1.5: SUBFAMILIAS DE MONSTRUOS                        */}
        {/* Mismas familias que las categorías, con materiales de      */}
        {/* monstruo dentro de cada una.                               */}
        {/* ========================================================= */}
        {viewMode === 'subcategories' && (
          <div className="relative w-full h-full flex items-center justify-center animate-wheel-orbit-in">
            {MONSTER_SUBCATEGORIES.map((cat, idx) => {
              const pos = getOrbitalPositionStyle(idx, MONSTER_SUBCATEGORIES.length);
              // Cada familia enseña el material de monstruo que contiene.
              const subcategoryIcon =
                COOKING_INGREDIENTS.find(
                  (ing) => ing.category === 'monstruos' && ing.subCategory === cat.id
                )?.icon ?? cat.imageIcon;

              return (
                <div
                  key={cat.id}
                  style={{ ...pos, animationDelay: `${idx * 45}ms` }}
                  onClick={() => handleSelectSubcategory(cat.id)}
                  className="absolute flex flex-col items-center group cursor-pointer active:scale-95 transition-all z-20 animate-wheel-plate-in"
                >
                  {/* Subcategory plate, same finish as the normal categories */}
                  <div className="relative w-15 h-15 sm:w-16 sm:h-16 rounded-full bg-gradient-to-b from-stone-800 via-stone-900 to-black border-2 border-amber-400/90 shadow-[0_0_15px_rgba(0,0,0,0.9)] flex items-center justify-center p-1.5 group-hover:scale-110 group-hover:border-yellow-300 transition-all">
                    <div className="w-full h-full rounded-full bg-gradient-to-b from-slate-200/90 to-slate-400/80 flex items-center justify-center p-1 shadow-inner">
                      <div className="w-full h-full rounded-full bg-stone-950 flex items-center justify-center overflow-hidden">
                        <img
                          src={subcategoryIcon}
                          alt={cat.name}
                          className="w-9 h-9 sm:w-10 sm:h-10 object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Subcategory Name */}
                  <span className="mt-1 text-[10px] sm:text-[11px] font-black text-center text-amber-200 drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)] max-w-[70px] truncate">
                    {cat.name}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 2: INGREDIENTS CIRCLE (Ingredientes de la categoría)  */}
        {/* ========================================================= */}
        {viewMode === 'ingredients' && (
          <div className="relative w-full h-full flex items-center justify-center animate-wheel-orbit-in">
            {/* Ingredients Plates around the Orbit (Dynamically Spaced) */}
            {categoryIngredients.map((ing, idx) => {
              const pos = getOrbitalPositionStyle(idx, categoryIngredients.length);
              const count = stock[ing.id] || 0;
              const isSelected = slots.some((s) => s?.id === ing.id);

              return (
                <div
                  key={ing.id}
                  style={{ ...pos, animationDelay: `${idx * 45}ms` }}
                  onClick={() => handleSelectIngredient(ing)}
                  className={`absolute flex flex-col items-center group cursor-pointer active:scale-95 transition-all z-20 animate-wheel-plate-in ${tutorialInertClass(
                    tutorialIngredientTarget === ing.id
                  )}`}
                >
                  {/* Plate */}
                  <div
                    className={`relative w-15 h-15 sm:w-16 sm:h-16 rounded-full flex items-center justify-center p-1.5 transition-all transform group-hover:scale-110 shadow-xl ${
                      count > 0
                        ? 'bg-gradient-to-b from-stone-800 via-stone-900 to-black border-2 border-amber-400 shadow-amber-900/40'
                        : 'bg-stone-900/80 border border-stone-600 opacity-60 grayscale'
                    } ${isSelected ? 'ring-2 ring-yellow-400 ring-offset-2 ring-offset-black scale-105' : ''} ${
                      tutorialIngredientTarget === ing.id
                        ? 'ring-2 ring-yellow-300 ring-offset-2 ring-offset-black animate-pulse'
                        : ''
                    }`}
                  >
                    {/* Inner Silver Dish Rim */}
                    <div className="w-full h-full rounded-full bg-gradient-to-b from-slate-200/90 to-slate-400/80 flex items-center justify-center p-1 shadow-inner">
                      <div className="w-full h-full rounded-full bg-stone-950 flex items-center justify-center overflow-hidden">
                        <CookingIngredientIcon ingredient={ing} className="w-10 h-10 sm:w-11 sm:h-11" />
                      </div>
                    </div>

                    {/* Quantity Badge */}
                    <span
                      className={`absolute -bottom-1 -right-1 text-[10px] font-black font-mono px-1.5 py-0.2 rounded-full border shadow-md ${
                        count > 0
                          ? 'bg-amber-500 text-stone-950 border-amber-200'
                          : 'bg-stone-700 text-stone-300 border-stone-500'
                      }`}
                    >
                      {count}
                    </span>
                  </div>

                  {/* Ingredient Name */}
                  <span className="mt-1 text-[9.5px] sm:text-[10px] font-bold text-center text-amber-100 max-w-[76px] leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)] line-clamp-2">
                    {ing.name}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 3. FOREGROUND COUNTER: WOODEN CUTTING BOARD (7DS Style)       */}
      {/* ------------------------------------------------------------- */}
      <div className="relative z-20 w-full pt-1 pb-3 px-3 bg-gradient-to-t from-[#140602] via-[#210904]/95 to-transparent flex flex-col items-center">
        {/* Recipe Match Preview Banner */}
        <div className="w-full flex items-center justify-between px-2 mb-1">
          {previewRecipe ? (
            <div className="w-full flex items-center justify-between bg-amber-950/90 border border-amber-400 rounded-lg px-2.5 py-1.5 shadow-lg animate-fade-in">
              <div className="flex items-center gap-2">
                <img
                  src={previewRecipe.icon}
                  alt={previewRecipe.name}
                  className="w-6 h-6 object-contain"
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-black text-amber-200">
                      {previewRecipe.name}
                    </span>
                    <span className="text-[9px] font-extrabold px-1 rounded bg-amber-500 text-black">
                      {previewRecipe.rarity}
                    </span>
                  </div>
                  <span className="text-[10px] text-green-400 font-bold">
                    {previewRecipe.buffBadge}
                  </span>
                </div>
              </div>
              <button
                onClick={handleClearBoard}
                className="text-stone-400 hover:text-red-400 p-1 cursor-pointer"
                title="Vaciar tabla"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="w-full text-center text-[10px] text-amber-300/80 font-serif py-0.5">
              {slots.filter((s) => s !== null).length === 0
                ? 'Coloca 3 ingredientes en la tabla para cocinar un plato.'
                : `Ingredientes colocados: ${slots.filter((s) => s !== null).length}/3`}
            </div>
          )}
        </div>

        {/* 7DS Wooden Cutting Board */}
        <div className="relative w-[340px] h-[95px] flex items-center justify-center">
          {/* Wooden Board Shape with right handle */}
          <div className="absolute inset-0 rounded-[16px] bg-gradient-to-b from-[#3d1b0c] via-[#2f1308] to-[#240d05] border border-[#74361a] shadow-[0_10px_22px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,190,120,0.18),inset_0_-8px_16px_rgba(0,0,0,0.45)]">
            <div className="absolute inset-0 rounded-[16px] opacity-20 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-200/70 via-transparent to-black" />
          </div>

          {/* 3 Circular Sockets on the Cutting Board */}
          <div className="relative z-10 w-full flex items-center justify-center gap-9">
            {[0, 1, 2].map((slotIdx) => {
              const item = slots[slotIdx];
              const isActive = activeSlotIndex === slotIdx;

              return (
                <div key={slotIdx} className="relative flex flex-col items-center">
                  {/* Golden Pin above Active Slot */}
                  {isActive && (
                    <div className="absolute -top-[15px] flex flex-col items-center z-20 pointer-events-none">
                      <div className="w-4 h-4 rounded-full bg-gradient-to-b from-amber-200 via-amber-400 to-amber-600 border border-amber-200/90 shadow-[0_0_10px_rgba(251,191,36,0.95)] flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#3a1a08]" />
                      </div>
                      <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[6px] border-t-amber-400 -mt-[3px] drop-shadow-[0_0_3px_rgba(251,191,36,0.9)]" />
                    </div>
                  )}

                  {/* Circular Socket */}
                  <div
                    onClick={() => {
                      sound.playSFX('click');
                      setActiveSlotIndex(slotIdx);
                    }}
                    className={`relative w-15 h-15 rounded-full flex items-center justify-center transition-all cursor-pointer bg-[#1f0a03] shadow-[inset_0_3px_8px_rgba(0,0,0,0.85)] ${
                      item
                        ? 'border-2 border-amber-500/90'
                        : 'border-2 border-dashed border-amber-600/60 hover:border-amber-400/80'
                    } ${
                      isActive
                        ? 'border-solid border-amber-400 shadow-[0_0_0_1px_rgba(251,191,36,0.35),0_0_16px_rgba(245,158,11,0.45),inset_0_3px_8px_rgba(0,0,0,0.85)]'
                        : ''
                    }`}
                  >
                    {item ? (
                      <>
                        <div className="w-12 h-12 rounded-full bg-stone-900 flex items-center justify-center overflow-hidden p-1 shadow-inner">
                          <CookingIngredientIcon ingredient={item} className="w-9 h-9" />
                        </div>
                        {/* Cancel / Remove 'X' button on slot */}
                        <button
                          onClick={(e) => handleRemoveSlot(slotIdx, e)}
                          className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-b from-red-600 to-red-800 border border-amber-300 text-white flex items-center justify-center shadow-md hover:scale-110 active:scale-95 cursor-pointer z-10"
                          title="Quitar ingrediente"
                        >
                          <X className="w-3 h-3 text-amber-200 stroke-[3]" />
                        </button>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-amber-500/90 leading-none">
                        <Plus className="w-6 h-6 stroke-[2.5]" />
                        <span className="mt-0.5 text-[10px] font-black font-mono text-amber-600/80">
                          {slotIdx + 1}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* 4. BOTTOM ACTION ROW: "COCINAR PLATO" & RECETARIO BUTTON      */}
        {/* ------------------------------------------------------------- */}
        <div className="w-full flex items-center justify-between gap-3 mt-2 px-3">
          <div className="w-12" />

          {/* "Cocinar Plato" Button */}
          <button
            onClick={handleCook}
            disabled={!isBoardFull || isCookingAnimation}
            className={`flex-1 py-2.5 px-4 rounded-xl font-black font-serif text-sm tracking-wider uppercase flex items-center justify-center gap-2 border-2 transition-all cursor-pointer shadow-xl ${
              isBoardFull && !isCookingAnimation
                ? 'bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:from-amber-500 hover:to-orange-500 text-white border-amber-300 shadow-[0_0_20px_rgba(249,115,22,0.6)] active:scale-95 animate-pulse'
                : 'bg-stone-900/80 text-stone-500 border-stone-700 cursor-not-allowed opacity-60'
            } ${tutorialInertClass(false)}`}
          >
            <Flame className={`w-5 h-5 ${isBoardFull ? 'text-yellow-300 animate-spin' : 'text-stone-500'}`} />
            <span>{isCookingAnimation ? 'Cocinando...' : 'Cocinar Plato'}</span>
          </button>

          {/* Recetario Circular Button on Bottom-Right */}
          <button
            onClick={() => {
              sound.playSFX('click');
              setIsRecipeBookOpen(true);
            }}
            className={`relative w-12 h-12 rounded-full bg-gradient-to-b from-amber-700 via-amber-900 to-black border-2 border-amber-400 p-1 flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 cursor-pointer transition-all shrink-0 ${tutorialInertClass(
              false
            )}`}
            title="Libro de Recetas de la Taberna"
          >
            <div className="w-full h-full rounded-full bg-stone-900/90 flex items-center justify-center overflow-hidden">
              <BookOpen className="w-5 h-5 text-amber-300" />
            </div>
            <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full border border-amber-200 shadow">
              {discoveredRecipes.length}
            </span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 5. COOKING ANIMATION OVERLAY                                  */}
      {/* ------------------------------------------------------------- */}
      {isCookingAnimation && (
        <div className="absolute inset-0 z-50 bg-black/80 flex flex-col items-center justify-center animate-fade-in pointer-events-auto">
          <div className="relative w-36 h-36 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-orange-600/30 blur-2xl animate-ping" />
            <div className="w-28 h-28 rounded-full border-4 border-amber-400 border-t-orange-500 border-b-yellow-400 animate-spin flex items-center justify-center bg-black/70">
              <Flame className="w-14 h-14 text-orange-500 animate-bounce" />
            </div>
          </div>
          <h3 className="mt-4 text-amber-300 font-serif font-black text-lg tracking-wider animate-pulse">
            ¡Cocinando en el Fogón de Icespear!
          </h3>
          <p className="text-xs text-amber-100/70 font-mono mt-1">
            Los aromas mágicos llenan la taberna...
          </p>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 6. DISH CREATED CELEBRATION MODAL                             */}
      {/* ------------------------------------------------------------- */}
      {cookedDishResult && (
        <div className="absolute inset-0 z-50 bg-black/85 flex items-center justify-center p-4 animate-fade-in">
          <div className="relative w-full max-w-sm rounded-2xl bg-gradient-to-b from-[#2e1107] via-[#1c0803] to-[#0c0301] border-3 border-amber-400 shadow-2xl p-5 flex flex-col items-center text-center">
            <div className="absolute -top-12 w-40 h-40 bg-amber-500/25 blur-3xl pointer-events-none rounded-full" />

            <span className="text-[11px] font-black tracking-widest text-amber-400 uppercase">
              ¡Plato Cocinado con Éxito!
            </span>

            <div className="relative w-24 h-24 my-3 rounded-full bg-gradient-to-b from-amber-500 to-amber-900 border-3 border-amber-300 p-2 shadow-2xl flex items-center justify-center">
              <img
                src={cookedDishResult.recipe.icon}
                alt={cookedDishResult.recipe.name}
                className="w-18 h-18 object-contain drop-shadow-xl animate-fade-in"
              />
              <span className="absolute -bottom-1 right-1 text-xs font-black px-2 py-0.5 rounded-full bg-black text-amber-300 border border-amber-400">
                {cookedDishResult.recipe.rarity}
              </span>
            </div>

            <h2 className="text-lg font-black font-serif text-amber-200">
              {cookedDishResult.recipe.name}
            </h2>

            {cookedDishResult.duplicated && (
              <span className="text-xs font-black text-emerald-400 bg-emerald-950/80 border border-emerald-500 px-2 py-0.5 rounded-full mt-1">
                ¡Doble Ración! Obtuviste x2 unidades 🍖🍖
              </span>
            )}

            <div className="w-full my-3 p-2.5 rounded-xl bg-black/60 border border-amber-500/50 flex flex-col items-center">
              <span className="text-xs font-black text-amber-300">
                {cookedDishResult.recipe.buffBadge}
              </span>
              <p className="text-[11px] text-stone-300 font-sans mt-0.5">
                {cookedDishResult.recipe.buffDescription}
              </p>
            </div>

            <p className="text-[10px] text-stone-400 font-serif italic mb-3">
              "{cookedDishResult.recipe.lore}"
            </p>

            <div className="flex items-center gap-1.5 text-xs text-rose-400 font-bold mb-4">
              <Heart className="w-3.5 h-3.5 fill-rose-500" />
              <span>+{cookedDishResult.affectionGain} Afecto del Fogón</span>
            </div>

            <button
              onClick={() => {
                sound.playSFX('click');
                setCookedDishResult(null);
              }}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-stone-950 font-black text-xs uppercase tracking-wider border border-amber-300 shadow-xl cursor-pointer active:scale-95 transition-all"
            >
              ¡Guardar en la Bolsa de Combate!
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 7. LIBRO DE RECETAS MODAL                                     */}
      {/* ------------------------------------------------------------- */}
      {isRecipeBookOpen && (
        <div className="absolute inset-0 z-50 bg-black/85 flex items-center justify-center p-3 animate-fade-in">
          <div className="relative w-full max-w-sm max-h-[92%] rounded-2xl bg-gradient-to-b from-[#2a0e05] to-[#120502] border-3 border-amber-500 shadow-2xl flex flex-col overflow-hidden">
            <div className="p-3 bg-[#1e0a04] border-b border-amber-600/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-300" />
                <h3 className="text-sm font-black font-serif text-amber-200">
                  Libro de Recetas ({COOKING_RECIPES.length})
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-600/50">
                  {discoveredRecipes.length}/{COOKING_RECIPES.length}
                </span>
                <button
                  onClick={() => setIsRecipeBookOpen(false)}
                  className="text-stone-400 hover:text-white p-1 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Search & Category Filter Bar */}
            <div className="p-2 bg-stone-950/80 border-b border-stone-800 space-y-1.5">
              <input
                type="text"
                placeholder="Buscar plato o efecto..."
                value={recipeSearch}
                onChange={(e) => setRecipeSearch(e.target.value)}
                className="w-full px-2.5 py-1 text-xs bg-stone-900 border border-amber-600/40 rounded-lg text-amber-100 placeholder:text-stone-500 focus:outline-none focus:border-amber-400"
              />
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
                <button
                  onClick={() => setRecipeFilter('todas')}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0 transition-all cursor-pointer ${
                    recipeFilter === 'todas'
                      ? 'bg-amber-600 text-stone-950'
                      : 'bg-stone-900 text-stone-400 hover:text-white border border-stone-800'
                  }`}
                >
                  Todas ({COOKING_RECIPES.length})
                </button>
                {INGREDIENT_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setRecipeFilter(cat.id)}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1 ${
                      recipeFilter === cat.id
                        ? 'bg-amber-600 text-stone-950'
                        : 'bg-stone-900 text-stone-400 hover:text-white border border-stone-800'
                    }`}
                  >
                    <span>{cat.iconText}</span>
                    <span>{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2.5 space-y-2 no-scrollbar">
              {filteredRecipes.length === 0 ? (
                <div className="text-center py-8 text-stone-400 text-xs font-serif">
                  No se encontraron recetas con este filtro o búsqueda.
                </div>
              ) : (
                filteredRecipes.slice(0, recipePageLimit).map((rec) => {
                  const isDiscovered = discoveredRecipes.includes(rec.id);
                  return (
                    <div
                      key={rec.id}
                      className={`p-2 rounded-xl border flex items-center justify-between gap-2 ${
                        isDiscovered
                          ? 'bg-stone-900/80 border-amber-500/60'
                          : 'bg-stone-950/60 border-stone-800 opacity-75'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-11 h-11 rounded-lg bg-stone-950 border border-amber-400/60 p-1 flex items-center justify-center shrink-0">
                          {isDiscovered ? (
                            <img
                              src={rec.icon}
                              alt={rec.name}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <span className="text-lg">❓</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-black text-amber-200 truncate">
                              {isDiscovered ? rec.name : '??? Receta Secreta'}
                            </span>
                            <span className="text-[9px] font-black px-1 rounded bg-amber-500 text-black shrink-0">
                              {rec.rarity}
                            </span>
                          </div>
                          <span className="text-[10px] text-green-400 font-bold block truncate">
                            {isDiscovered ? rec.buffBadge : 'Descúbrela cocinando'}
                          </span>
                          <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                            {rec.specificIngredientIds && rec.specificIngredientIds.length === 3 ? (
                              rec.specificIngredientIds.map((ingId, iIdx) => {
                                const ingObj = COOKING_INGREDIENTS.find((i) => i.id === ingId);
                                return (
                                  <span
                                    key={iIdx}
                                    className="text-[8px] px-1 py-0.2 rounded bg-black/60 text-amber-200 border border-amber-700/60 shrink-0"
                                  >
                                    {ingObj?.name || ingId}
                                  </span>
                                );
                              })
                            ) : (
                              rec.requiredCategories.map((cat, cIdx) => {
                                const catObj = INGREDIENT_CATEGORIES.find((c) => c.id === cat);
                                return (
                                  <span
                                    key={cIdx}
                                    className="text-[8px] px-1 py-0.2 rounded bg-black/60 text-stone-300 border border-stone-700 shrink-0"
                                  >
                                    {catObj?.iconText} {catObj?.name}
                                  </span>
                                );
                              })
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleAutoFillRecipe(rec)}
                        className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-stone-950 font-black text-[10px] uppercase border border-amber-300 shadow cursor-pointer active:scale-95 transition-all shrink-0"
                      >
                        Colocar
                      </button>
                    </div>
                  );
                })
              )}

              {recipePageLimit < filteredRecipes.length && (
                <button
                  onClick={() => setRecipePageLimit((prev) => prev + 50)}
                  className="w-full py-2 rounded-xl bg-amber-950/80 hover:bg-amber-900 border border-amber-500/60 text-amber-200 font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  Cargar más recetas (+50)... (Mostrando {Math.min(recipePageLimit, filteredRecipes.length)} de {filteredRecipes.length})
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 8. DESPENSA DE INGREDIENTES MODAL                             */}
      {/* ------------------------------------------------------------- */}
      {isPantryOpen && (
        <div className="absolute inset-0 z-50 bg-black/85 flex items-center justify-center p-3 animate-fade-in">
          <div className="relative w-full max-w-sm max-h-[90%] rounded-2xl bg-gradient-to-b from-[#2a0e05] to-[#120502] border-3 border-amber-500 shadow-2xl flex flex-col overflow-hidden">
            <div className="p-3 bg-[#1e0a04] border-b border-amber-600/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-amber-300" />
                <h3 className="text-sm font-black font-serif text-amber-200">
                  Despensa del Bastión
                </h3>
              </div>
              <button
                onClick={() => setIsPantryOpen(false)}
                className="text-stone-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-2.5 bg-gradient-to-r from-amber-950 to-stone-900 border-b border-amber-700/40 flex items-center justify-between">
              <div>
                <span className="text-xs font-black text-amber-300 block">
                  Raciones Diarias Gratuitas
                </span>
                <span className="text-[10px] text-stone-300">
                  +2 de cada ingrediente para la despensa
                </span>
              </div>
              <button
                onClick={handleClaimFreeRations}
                className="px-2.5 py-1 rounded-lg bg-green-600 hover:bg-green-500 text-white font-bold text-xs border border-green-300 shadow active:scale-95 transition-all cursor-pointer"
              >
                Reclamar
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2.5 space-y-2 no-scrollbar">
              {COOKING_INGREDIENTS.map((ing) => {
                const count = stock[ing.id] || 0;
                return (
                  <div
                    key={ing.id}
                    className="p-2 rounded-xl bg-stone-900/80 border border-stone-700/60 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-stone-950 border border-amber-500/40 flex items-center justify-center p-1">
                        <CookingIngredientIcon ingredient={ing} className="w-8 h-8" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-amber-200 block">
                          {ing.name}
                        </span>
                        <span className="text-[10px] text-stone-400">
                          En despensa: <b className="text-amber-300">{count}</b>
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleBuyIngredient(ing)}
                      className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-600 text-white font-bold text-[11px] border border-amber-400 flex items-center gap-1 shadow cursor-pointer active:scale-95"
                    >
                      <Coins className="w-3 h-3 text-amber-300" />
                      <span>{ing.priceGold} $</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 9. REPUTACIÓN DEL FOGÓN MODAL                                 */}
      {/* ------------------------------------------------------------- */}
      {isAffectionModalOpen && (
        <div className="absolute inset-0 z-50 bg-black/85 flex items-center justify-center p-3 animate-fade-in">
          <div className="relative w-full max-w-sm rounded-2xl bg-gradient-to-b from-[#2a0e05] to-[#120502] border-3 border-amber-500 shadow-2xl p-4 flex flex-col items-center text-center">
            <button
              onClick={() => setIsAffectionModalOpen(false)}
              className="absolute top-3 right-3 text-stone-400 hover:text-white p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <Heart className="w-10 h-10 text-rose-500 fill-rose-500 mb-2 animate-pulse" />
            <h3 className="text-base font-black font-serif text-amber-200">
              Maestría del Fogón de Icespear
            </h3>
            <span className="text-xs text-amber-400 font-mono mt-0.5">
              Nivel {affection.level} • {affection.points.toLocaleString()} Puntos
            </span>

            <div className="w-full my-3 p-3 rounded-xl bg-black/60 border border-amber-600/50 text-left space-y-2">
              <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider block">
                Beneficios Activos:
              </span>
              <div className="flex items-center gap-2 text-xs text-stone-200">
                <Check className="w-3.5 h-3.5 text-green-400 shrink-0" />
                <span>+20% de probabilidad de Ración Doble al cocinar.</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-stone-200">
                <Check className="w-3.5 h-3.5 text-green-400 shrink-0" />
                <span>Descuento de ingredientes en la Despensa.</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-stone-200">
                <Check className="w-3.5 h-3.5 text-green-400 shrink-0" />
                <span>Acceso a recetas legendarias de combate.</span>
              </div>
            </div>

            <button
              onClick={() => setIsAffectionModalOpen(false)}
              className="w-full py-2 rounded-xl bg-amber-600 text-stone-950 font-bold text-xs uppercase cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
