import React, { useState, useEffect, useMemo } from 'react';
import { useGame } from '../context/GameContext';
import { sound } from '../services/soundService';
import { ArrowLeft, Shield, Heart, Coins } from 'lucide-react';
import { ForgeMaskedSlider } from './ForgeMaskedSlider';
import { ForgeMilestonesModal, FORGE_MILESTONES, ForgeMilestoneStats } from './ForgeMilestonesModal';
import { safeStorage } from '../utils/storage';

interface CraftItemData {
  id: string;
  name: string;
  category: 'Armas' | 'Armaduras' | 'Anillos' | 'Cascos' | 'Abalorios' | 'Pociones' | 'Encantamientos' | 'Aceites para Armas' | string;
  subCategory?: string;
  level: number;
  stars: number;
  minAtk?: number;
  maxAtk?: number;
  defense?: number;
  hp?: number;
  element?: 'Divino' | 'Natural' | 'Profano' | 'Arcano';
  elementOrb?: string;
  portrait?: string;
  icon: string;
  costGold: number;
  ingredients: {
    ingotIcon: string;
    ingotHave: number;
    ingotNeed: number;
    hiltIcon: string;
    hiltHave: number;
    hiltNeed: number;
    kitIcon: string;
    kitHave: number;
    kitNeed: number;
  };
}

interface ForgeViewProps {
  backgroundSrc?: string;
  isPotionShop?: boolean;
}

export const ForgeView: React.FC<ForgeViewProps> = ({
  backgroundSrc = '/assets/backgrounds/fondo_herreria_1.png',
  isPotionShop = false,
}) => {
  const {
    gold,
    addGold,
    addCrystals,
    addAstralShards,
    addShelfItem,
    shelfInventory,
    getMaterialCount,
    deductMaterials,
    forgeCategory,
    setForgeCategory,
    forgeSubcategory,
    setForgeSubcategory,
  } = useGame();

  const tier1Category = forgeCategory || null;
  const tier2Subcategory = forgeSubcategory || null;
  const setTier1Category = (cat: string | null) => setForgeCategory(cat || '');
  const setTier2Subcategory = (sub: string | null) => setForgeSubcategory(sub);

  const [elementFilter, setElementFilter] = useState<string | null>(null);
  const [craftModalItem, setCraftModalItem] = useState<CraftItemData | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showMilestonesModal, setShowMilestonesModal] = useState<boolean>(false);

  // Persistent Milestone stats and claimed achievements
  const [milestoneStats, setMilestoneStats] = useState<ForgeMilestoneStats>(() => {
    const saved = safeStorage.getItem('cdd_forge_milestones_stats_v1');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return {
      totalCrafted: 0,
      rCount: 0,
      srCount: 0,
      ssrCount: 0,
      craftedCategories: [],
      craftedElements: [],
    };
  });

  const [claimedMilestones, setClaimedMilestones] = useState<string[]>(() => {
    const saved = safeStorage.getItem('cdd_forge_milestones_claimed_v1');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return [];
  });

  // Synchronize stats with existing crafted items in inventory
  useEffect(() => {
    const craftedFromShelf = shelfInventory.filter((it) => it.id.startsWith('crafted_'));
    if (craftedFromShelf.length > 0) {
      setMilestoneStats((prev) => {
        const nextTotal = Math.max(prev.totalCrafted, craftedFromShelf.length);
        const nextR = Math.max(prev.rCount, craftedFromShelf.filter((it) => it.rarity === 'R').length);
        const nextSR = Math.max(prev.srCount, craftedFromShelf.filter((it) => it.rarity === 'SR').length);
        const nextSSR = Math.max(prev.ssrCount, craftedFromShelf.filter((it) => it.rarity === 'SSR').length);

        if (
          nextTotal !== prev.totalCrafted ||
          nextR !== prev.rCount ||
          nextSR !== prev.srCount ||
          nextSSR !== prev.ssrCount
        ) {
          const updated: ForgeMilestoneStats = {
            ...prev,
            totalCrafted: nextTotal,
            rCount: nextR,
            srCount: nextSR,
            ssrCount: nextSSR,
          };
          safeStorage.setItem('cdd_forge_milestones_stats_v1', JSON.stringify(updated));
          return updated;
        }
        return prev;
      });
    }
  }, [shelfInventory]);

  // Calculate count of unclaimed completed milestones for badge
  const unclaimedMilestonesCount = useMemo(() => {
    return FORGE_MILESTONES.filter((m) => {
      const isClaimed = claimedMilestones.includes(m.id);
      const progress = m.getProgress(milestoneStats);
      return !isClaimed && progress >= m.target;
    }).length;
  }, [milestoneStats, claimedMilestones]);

  const handleClaimMilestone = (id: string, crystals: number) => {
    if (claimedMilestones.includes(id)) return;
    const nextClaimed = [...claimedMilestones, id];
    setClaimedMilestones(nextClaimed);
    safeStorage.setItem('cdd_forge_milestones_claimed_v1', JSON.stringify(nextClaimed));
    addAstralShards(crystals);
    setToastMessage(`¡Hito completado! +${crystals} Cristales del Recuerdo recibidos`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleClaimAllMilestones = (rewards: { id: string; crystals: number }[]) => {
    const newIds = rewards.map((r) => r.id).filter((id) => !claimedMilestones.includes(id));
    if (newIds.length === 0) return;
    const nextClaimed = [...claimedMilestones, ...newIds];
    setClaimedMilestones(nextClaimed);
    safeStorage.setItem('cdd_forge_milestones_claimed_v1', JSON.stringify(nextClaimed));
    const totalCrystals = rewards.reduce((sum, r) => sum + r.crystals, 0);
    addAstralShards(totalCrystals);
    setToastMessage(`¡Todos los hitos reclamados! +${totalCrystals} Cristales del Recuerdo recibidos`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Blacksmith 5 main categories
  const blacksmithCategories = [
    {
      id: 'Armas',
      name: 'Armas',
      imageSrc: '/assets/forge/btn_armas.png',
    },
    {
      id: 'Armaduras',
      name: 'Armaduras',
      imageSrc: '/assets/forge/btn_armaduras.png',
    },
    {
      id: 'Anillos',
      name: 'Anillos',
      imageSrc: '/assets/forge/btn_anillos.png',
    },
    {
      id: 'Cascos',
      name: 'Cascos',
      imageSrc: '/assets/forge/btn_cascos.png',
    },
    {
      id: 'Abalorios',
      name: 'Abalorios',
      imageSrc: '/assets/forge/btn_abalorios.png',
    },
  ];

  // Potion Shop 3 main start categories requested by user with clean transparent assets
  const potionMainCategories = [
    {
      id: 'Pociones',
      name: 'Pociones',
      imageSrc: '/assets/aistudio/btn_pociones.png',
    },
    {
      id: 'Encantamientos',
      name: 'Encantamientos',
      imageSrc: '/assets/aistudio/btn_encantamientos.png',
    },
    {
      id: 'Aceites para Armas',
      name: 'Aceites para Armas',
      imageSrc: '/assets/aistudio/btn_aceites.png',
    },
  ];

  const mainCategories = isPotionShop ? potionMainCategories : blacksmithCategories;

  // Weapon subcategories matching game assets
  const weaponSubcategories = [
    { id: 'Espadas', name: 'Espadas', imageSrc: '/assets/forge/btn_espadas.png' },
    { id: 'Dagas', name: 'Dagas', imageSrc: '/assets/forge/btn_dagas.png' },
    { id: 'Lanzas', name: 'Lanzas', imageSrc: '/assets/forge/btn_lanzas_final.png' },
    { id: 'Hachas', name: 'Hachas', imageSrc: '/assets/forge/btn_hachas_final.png' },
    { id: 'Martillos', name: 'Martillos', imageSrc: '/assets/forge/btn_martillos.png' },
    { id: 'Grimorios', name: 'Grimorios', imageSrc: '/assets/forge/btn_grimorios_final.png' },
  ];

  // Comprehensive Crafting Catalog for all 5 categories
  const [craftItems, setCraftItems] = useState<CraftItemData[]>([
    // === ARMAS: ESPADAS (Exact 10 Swords matching User Reference Screenshots) ===
    {
      id: 'espada_hierro',
      name: 'Espada de Hierro',
      category: 'Armas',
      subCategory: 'Espadas',
      level: 1,
      stars: 2,
      minAtk: 20,
      maxAtk: 25,
      portrait: '/assets/aistudio/image_5889f1da.png',
      icon: '/assets/aistudio/image_5889f1da.png',
      costGold: 500,
      ingredients: {
        ingotIcon: '/assets/items/lingote_app.png',
        ingotHave: 8,
        ingotNeed: 6,
        hiltIcon: '/assets/aistudio/mango_de_espada_ITEM_80f48554.png',
        hiltHave: 12,
        hiltNeed: 1,
        kitIcon: '/assets/items/kit_de_herreria_app.png',
        kitHave: 2,
        kitNeed: 1,
      },
    },
    {
      id: 'ropera_hierro',
      name: 'Ropera de Hierro',
      category: 'Armas',
      subCategory: 'Espadas',
      level: 1,
      stars: 2,
      minAtk: 15,
      maxAtk: 30,
      portrait: '/assets/aistudio/image_17a979ba.png',
      icon: '/assets/aistudio/image_17a979ba.png',
      costGold: 550,
      ingredients: {
        ingotIcon: '/assets/items/lingote_app.png',
        ingotHave: 8,
        ingotNeed: 6,
        hiltIcon: '/assets/aistudio/mango_de_espada_ITEM_80f48554.png',
        hiltHave: 12,
        hiltNeed: 1,
        kitIcon: '/assets/items/kit_de_herreria_app.png',
        kitHave: 2,
        kitNeed: 1,
      },
    },
    {
      id: 'espada_quitina',
      name: 'Espada de Quitina',
      category: 'Armas',
      subCategory: 'Espadas',
      level: 1,
      stars: 2,
      minAtk: 25,
      maxAtk: 30,
      element: 'Natural',
      elementOrb: '/assets/items/atributo_natural.png',
      portrait: '/assets/aistudio/image_471092bb.png',
      icon: '/assets/aistudio/image_471092bb.png',
      costGold: 1200,
      ingredients: {
        ingotIcon: '/assets/items/fragmento de quitina.png',
        ingotHave: 10,
        ingotNeed: 8,
        hiltIcon: '/assets/aistudio/mango_de_espada_ITEM_80f48554.png',
        hiltHave: 12,
        hiltNeed: 1,
        kitIcon: '/assets/items/kit_de_herreria_app.png',
        kitHave: 2,
        kitNeed: 1,
      },
    },
    {
      id: 'ropera_quitina',
      name: 'Ropera de Quitina',
      category: 'Armas',
      subCategory: 'Espadas',
      level: 1,
      stars: 2,
      minAtk: 15,
      maxAtk: 35,
      element: 'Natural',
      elementOrb: '/assets/items/atributo_natural.png',
      portrait: '/assets/aistudio/image_41c60939.png',
      icon: '/assets/aistudio/image_41c60939.png',
      costGold: 1300,
      ingredients: {
        ingotIcon: '/assets/items/fragmento de quitina.png',
        ingotHave: 10,
        ingotNeed: 8,
        hiltIcon: '/assets/aistudio/mango_de_espada_ITEM_80f48554.png',
        hiltHave: 12,
        hiltNeed: 1,
        kitIcon: '/assets/items/kit_de_herreria_app.png',
        kitHave: 2,
        kitNeed: 1,
      },
    },
    {
      id: 'espada_plata',
      name: 'Espada de Plata',
      category: 'Armas',
      subCategory: 'Espadas',
      level: 1,
      stars: 2,
      minAtk: 25,
      maxAtk: 30,
      element: 'Divino',
      elementOrb: '/assets/items/atributo_fe.png',
      portrait: '/assets/aistudio/image_a03a0228.png',
      icon: '/assets/aistudio/image_a03a0228.png',
      costGold: 2000,
      ingredients: {
        ingotIcon: '/assets/items/lingote_plata_app.png',
        ingotHave: 10,
        ingotNeed: 8,
        hiltIcon: '/assets/aistudio/mango_de_espada_ITEM_80f48554.png',
        hiltHave: 12,
        hiltNeed: 1,
        kitIcon: '/assets/items/kit_de_herreria_app.png',
        kitHave: 2,
        kitNeed: 1,
      },
    },
    {
      id: 'ropera_plata',
      name: 'Ropera de Plata',
      category: 'Armas',
      subCategory: 'Espadas',
      level: 1,
      stars: 2,
      minAtk: 15,
      maxAtk: 35,
      element: 'Divino',
      elementOrb: '/assets/items/atributo_fe.png',
      portrait: '/assets/aistudio/image_e5644ada.png',
      icon: '/assets/aistudio/image_e5644ada.png',
      costGold: 2200,
      ingredients: {
        ingotIcon: '/assets/items/lingote_plata_app.png',
        ingotHave: 10,
        ingotNeed: 8,
        hiltIcon: '/assets/aistudio/mango_de_espada_ITEM_80f48554.png',
        hiltHave: 12,
        hiltNeed: 1,
        kitIcon: '/assets/items/kit_de_herreria_app.png',
        kitHave: 2,
        kitNeed: 1,
      },
    },
    {
      id: 'espada_electrum',
      name: 'Espada de Electrum',
      category: 'Armas',
      subCategory: 'Espadas',
      level: 1,
      stars: 2,
      minAtk: 25,
      maxAtk: 30,
      element: 'Arcano',
      elementOrb: '/assets/items/atributo_arcano.png',
      portrait: '/assets/aistudio/image_e2582085.png',
      icon: '/assets/aistudio/image_e2582085.png',
      costGold: 3200,
      ingredients: {
        ingotIcon: '/assets/items/lingote_electrum_app.png',
        ingotHave: 8,
        ingotNeed: 6,
        hiltIcon: '/assets/aistudio/mango_de_espada_ITEM_80f48554.png',
        hiltHave: 12,
        hiltNeed: 2,
        kitIcon: '/assets/items/kit_de_herreria_app.png',
        kitHave: 2,
        kitNeed: 2,
      },
    },
    {
      id: 'ropera_electrum',
      name: 'Ropera de Electrum',
      category: 'Armas',
      subCategory: 'Espadas',
      level: 1,
      stars: 2,
      minAtk: 15,
      maxAtk: 35,
      element: 'Arcano',
      elementOrb: '/assets/items/atributo_arcano.png',
      portrait: '/assets/aistudio/image_11993886.png',
      icon: '/assets/aistudio/image_11993886.png',
      costGold: 3500,
      ingredients: {
        ingotIcon: '/assets/items/lingote_electrum_app.png',
        ingotHave: 8,
        ingotNeed: 6,
        hiltIcon: '/assets/aistudio/mango_de_espada_ITEM_80f48554.png',
        hiltHave: 12,
        hiltNeed: 2,
        kitIcon: '/assets/items/kit_de_herreria_app.png',
        kitHave: 2,
        kitNeed: 2,
      },
    },
    {
      id: 'espada_oro',
      name: 'Espada de Oro',
      category: 'Armas',
      subCategory: 'Espadas',
      level: 1,
      stars: 2,
      minAtk: 25,
      maxAtk: 30,
      element: 'Profano',
      elementOrb: '/assets/items/atributo_oscuro.png',
      portrait: '/assets/aistudio/image_58b5d62a.png',
      icon: '/assets/aistudio/image_58b5d62a.png',
      costGold: 4800,
      ingredients: {
        ingotIcon: '/assets/items/lingote_oro_app.png',
        ingotHave: 10,
        ingotNeed: 8,
        hiltIcon: '/assets/aistudio/mango_de_espada_ITEM_80f48554.png',
        hiltHave: 12,
        hiltNeed: 2,
        kitIcon: '/assets/items/kit_de_herreria_app.png',
        kitHave: 2,
        kitNeed: 3,
      },
    },
    {
      id: 'ropera_oro',
      name: 'Ropera de Oro',
      category: 'Armas',
      subCategory: 'Espadas',
      level: 1,
      stars: 2,
      minAtk: 15,
      maxAtk: 35,
      element: 'Profano',
      elementOrb: '/assets/items/atributo_oscuro.png',
      portrait: '/assets/aistudio/image_0be8d919.png',
      icon: '/assets/aistudio/image_0be8d919.png',
      costGold: 5200,
      ingredients: {
        ingotIcon: '/assets/items/lingote_oro_app.png',
        ingotHave: 10,
        ingotNeed: 8,
        hiltIcon: '/assets/aistudio/mango_de_espada_ITEM_80f48554.png',
        hiltHave: 12,
        hiltNeed: 2,
        kitIcon: '/assets/items/kit_de_herreria_app.png',
        kitHave: 2,
        kitNeed: 3,
      },
    },

    // === ARMAS: LANZAS Y TRIDENTES (Tridentes clasificados como Lanzas) ===
    {
      id: 'lanza_hierro',
      name: 'Lanza de Hierro',
      category: 'Armas',
      subCategory: 'Lanzas',
      level: 1,
      stars: 2,
      minAtk: 20,
      maxAtk: 25,
      portrait: '/assets/aistudio/lanza_de_hierro_basica_app_bf1dd7a4.png',
      icon: '/assets/aistudio/lanza_de_hierro_basica_app_bf1dd7a4.png',
      costGold: 500,
      ingredients: {
        ingotIcon: '/assets/items/lingote_app.png',
        ingotHave: 8,
        ingotNeed: 6,
        hiltIcon: '/assets/items/mango_lanza.png',
        hiltHave: 10,
        hiltNeed: 1,
        kitIcon: '/assets/items/kit_de_herreria_app.png',
        kitHave: 2,
        kitNeed: 1,
      },
    },
    {
      id: 'tridente_hierro',
      name: 'Tridente de Hierro',
      category: 'Armas',
      subCategory: 'Lanzas',
      level: 1,
      stars: 2,
      minAtk: 16,
      maxAtk: 29,
      portrait: '/assets/aistudio/tridente_de_hierro_basico_2666625e.png',
      icon: '/assets/aistudio/tridente_de_hierro_basico_2666625e.png',
      costGold: 550,
      ingredients: {
        ingotIcon: '/assets/items/lingote_app.png',
        ingotHave: 8,
        ingotNeed: 6,
        hiltIcon: '/assets/items/mango_lanza.png',
        hiltHave: 10,
        hiltNeed: 1,
        kitIcon: '/assets/items/kit_de_herreria_app.png',
        kitHave: 2,
        kitNeed: 1,
      },
    },
    {
      id: 'lanza_quitina',
      name: 'Lanza de Quitina',
      category: 'Armas',
      subCategory: 'Lanzas',
      level: 1,
      stars: 2,
      minAtk: 25,
      maxAtk: 30,
      element: 'Natural',
      elementOrb: '/assets/items/atributo_natural.png',
      portrait: '/assets/aistudio/lanza_de_quitina_marron_25d0dbba.png',
      icon: '/assets/aistudio/lanza_de_quitina_marron_25d0dbba.png',
      costGold: 1200,
      ingredients: {
        ingotIcon: '/assets/items/fragmento de quitina.png',
        ingotHave: 10,
        ingotNeed: 8,
        hiltIcon: '/assets/items/mango_lanza.png',
        hiltHave: 10,
        hiltNeed: 1,
        kitIcon: '/assets/items/kit_de_herreria_app.png',
        kitHave: 2,
        kitNeed: 1,
      },
    },
    {
      id: 'tridente_quitina',
      name: 'Tridente de Quitina',
      category: 'Armas',
      subCategory: 'Lanzas',
      level: 1,
      stars: 2,
      minAtk: 18,
      maxAtk: 36,
      element: 'Natural',
      elementOrb: '/assets/items/atributo_natural.png',
      portrait: '/assets/aistudio/tridente_de_quitina_66f71514.png',
      icon: '/assets/aistudio/tridente_de_quitina_66f71514.png',
      costGold: 1300,
      ingredients: {
        ingotIcon: '/assets/items/fragmento de quitina.png',
        ingotHave: 10,
        ingotNeed: 8,
        hiltIcon: '/assets/items/mango_lanza.png',
        hiltHave: 10,
        hiltNeed: 1,
        kitIcon: '/assets/items/kit_de_herreria_app.png',
        kitHave: 2,
        kitNeed: 1,
      },
    },
    {
      id: 'lanza_plata',
      name: 'Lanza de Plata',
      category: 'Armas',
      subCategory: 'Lanzas',
      level: 1,
      stars: 2,
      minAtk: 26,
      maxAtk: 31,
      element: 'Divino',
      elementOrb: '/assets/items/atributo_fe.png',
      portrait: '/assets/aistudio/lanza_de_plata_61e36f76.png',
      icon: '/assets/aistudio/lanza_de_plata_61e36f76.png',
      costGold: 2000,
      ingredients: {
        ingotIcon: '/assets/items/lingote_plata_app.png',
        ingotHave: 10,
        ingotNeed: 8,
        hiltIcon: '/assets/items/mango_lanza.png',
        hiltHave: 10,
        hiltNeed: 1,
        kitIcon: '/assets/items/kit_de_herreria_app.png',
        kitHave: 2,
        kitNeed: 1,
      },
    },
    {
      id: 'tridente_plata',
      name: 'Tridente de Plata',
      category: 'Armas',
      subCategory: 'Lanzas',
      level: 1,
      stars: 2,
      minAtk: 19,
      maxAtk: 37,
      element: 'Divino',
      elementOrb: '/assets/items/atributo_fe.png',
      portrait: '/assets/aistudio/tridente_de_plata_b2da1515.png',
      icon: '/assets/aistudio/tridente_de_plata_b2da1515.png',
      costGold: 2200,
      ingredients: {
        ingotIcon: '/assets/items/lingote_plata_app.png',
        ingotHave: 10,
        ingotNeed: 8,
        hiltIcon: '/assets/items/mango_lanza.png',
        hiltHave: 10,
        hiltNeed: 1,
        kitIcon: '/assets/items/kit_de_herreria_app.png',
        kitHave: 2,
        kitNeed: 1,
      },
    },
    {
      id: 'lanza_electrum',
      name: 'Lanza de Electrum',
      category: 'Armas',
      subCategory: 'Lanzas',
      level: 1,
      stars: 2,
      minAtk: 27,
      maxAtk: 32,
      element: 'Arcano',
      elementOrb: '/assets/items/atributo_arcano.png',
      portrait: '/assets/aistudio/lanza_de_electrum_294bf709.png',
      icon: '/assets/aistudio/lanza_de_electrum_294bf709.png',
      costGold: 3200,
      ingredients: {
        ingotIcon: '/assets/items/lingote_electrum_app.png',
        ingotHave: 8,
        ingotNeed: 6,
        hiltIcon: '/assets/items/mango_lanza.png',
        hiltHave: 10,
        hiltNeed: 2,
        kitIcon: '/assets/items/kit_de_herreria_app.png',
        kitHave: 2,
        kitNeed: 2,
      },
    },
    {
      id: 'tridente_electrum',
      name: 'Tridente de Electrum',
      category: 'Armas',
      subCategory: 'Lanzas',
      level: 1,
      stars: 2,
      minAtk: 20,
      maxAtk: 38,
      element: 'Arcano',
      elementOrb: '/assets/items/atributo_arcano.png',
      portrait: '/assets/aistudio/tridente_de_electrum_53435b1e.png',
      icon: '/assets/aistudio/tridente_de_electrum_53435b1e.png',
      costGold: 3500,
      ingredients: {
        ingotIcon: '/assets/items/lingote_electrum_app.png',
        ingotHave: 8,
        ingotNeed: 6,
        hiltIcon: '/assets/items/mango_lanza.png',
        hiltHave: 10,
        hiltNeed: 2,
        kitIcon: '/assets/items/kit_de_herreria_app.png',
        kitHave: 2,
        kitNeed: 2,
      },
    },
    {
      id: 'lanza_oro',
      name: 'Lanza de Oro',
      category: 'Armas',
      subCategory: 'Lanzas',
      level: 1,
      stars: 2,
      minAtk: 28,
      maxAtk: 33,
      element: 'Profano',
      elementOrb: '/assets/items/atributo_oscuro.png',
      portrait: '/assets/aistudio/lanza_de_oro_basica_app_4011f8c7.png',
      icon: '/assets/aistudio/lanza_de_oro_basica_app_4011f8c7.png',
      costGold: 4800,
      ingredients: {
        ingotIcon: '/assets/items/lingote_oro_app.png',
        ingotHave: 10,
        ingotNeed: 8,
        hiltIcon: '/assets/items/mango_lanza.png',
        hiltHave: 10,
        hiltNeed: 2,
        kitIcon: '/assets/items/kit_de_herreria_app.png',
        kitHave: 2,
        kitNeed: 3,
      },
    },
    {
      id: 'tridente_oro',
      name: 'Tridente de Oro',
      category: 'Armas',
      subCategory: 'Lanzas',
      level: 1,
      stars: 2,
      minAtk: 21,
      maxAtk: 41,
      element: 'Profano',
      elementOrb: '/assets/items/atributo_oscuro.png',
      portrait: '/assets/aistudio/tridente_de_oro_dbf6ff6e.png',
      icon: '/assets/aistudio/tridente_de_oro_dbf6ff6e.png',
      costGold: 5200,
      ingredients: {
        ingotIcon: '/assets/items/lingote_oro_app.png',
        ingotHave: 10,
        ingotNeed: 8,
        hiltIcon: '/assets/items/mango_lanza.png',
        hiltHave: 10,
        hiltNeed: 2,
        kitIcon: '/assets/items/kit_de_herreria_app.png',
        kitHave: 2,
        kitNeed: 3,
      },
    },

    // === ARMAS: HACHAS (Hachas Básicas y Hachas de Guerra de Dos Manos) ===
    {
      id: 'hacha_hierro',
      name: 'Hacha de Hierro',
      category: 'Armas',
      subCategory: 'Hachas',
      level: 1,
      stars: 2,
      minAtk: 22,
      maxAtk: 28,
      portrait: '/assets/aistudio/hacha_de_hierro_basica_app_63e1a4cd.png',
      icon: '/assets/aistudio/hacha_de_hierro_basica_app_63e1a4cd.png',
      costGold: 500,
      ingredients: {
        ingotIcon: '/assets/items/lingote_app.png',
        ingotHave: 8,
        ingotNeed: 6,
        hiltIcon: '/assets/items/mango_hacha_martillo.png',
        hiltHave: 12,
        hiltNeed: 1,
        kitIcon: '/assets/items/kit_de_herreria_app.png',
        kitHave: 2,
        kitNeed: 1,
      },
    },
    {
      id: 'hacha_guerra_hierro',
      name: 'Hacha de Guerra de Hierro',
      category: 'Armas',
      subCategory: 'Hachas',
      level: 1,
      stars: 2,
      minAtk: 18,
      maxAtk: 34,
      portrait: '/assets/aistudio/hacha_de_guerra_HIERRO_ITEM_f33aec86.png',
      icon: '/assets/aistudio/hacha_de_guerra_HIERRO_ITEM_f33aec86.png',
      costGold: 600,
      ingredients: {
        ingotIcon: '/assets/items/lingote_app.png',
        ingotHave: 8,
        ingotNeed: 7,
        hiltIcon: '/assets/items/mango_hacha_martillo.png',
        hiltHave: 12,
        hiltNeed: 1,
        kitIcon: '/assets/items/kit_de_herreria_app.png',
        kitHave: 2,
        kitNeed: 1,
      },
    },
    {
      id: 'hacha_quitina',
      name: 'Hacha de Quitina',
      category: 'Armas',
      subCategory: 'Hachas',
      level: 1,
      stars: 2,
      minAtk: 27,
      maxAtk: 33,
      element: 'Natural',
      elementOrb: '/assets/items/atributo_natural.png',
      portrait: '/assets/aistudio/Hacha_de_quitina_b937aa7c.png',
      icon: '/assets/aistudio/Hacha_de_quitina_b937aa7c.png',
      costGold: 1200,
      ingredients: {
        ingotIcon: '/assets/items/fragmento de quitina.png',
        ingotHave: 10,
        ingotNeed: 8,
        hiltIcon: '/assets/items/mango_hacha_martillo.png',
        hiltHave: 12,
        hiltNeed: 1,
        kitIcon: '/assets/items/kit_de_herreria_app.png',
        kitHave: 2,
        kitNeed: 1,
      },
    },
    {
      id: 'hacha_guerra_quitina',
      name: 'Hacha de Guerra de Quitina',
      category: 'Armas',
      subCategory: 'Hachas',
      level: 1,
      stars: 2,
      minAtk: 23,
      maxAtk: 41,
      element: 'Natural',
      elementOrb: '/assets/items/atributo_natural.png',
      portrait: '/assets/aistudio/hacha_de_guerra_QUITINA_ITEM_17a3befe.png',
      icon: '/assets/aistudio/hacha_de_guerra_QUITINA_ITEM_17a3befe.png',
      costGold: 1400,
      ingredients: {
        ingotIcon: '/assets/items/fragmento de quitina.png',
        ingotHave: 10,
        ingotNeed: 9,
        hiltIcon: '/assets/items/mango_hacha_martillo.png',
        hiltHave: 12,
        hiltNeed: 1,
        kitIcon: '/assets/items/kit_de_herreria_app.png',
        kitHave: 2,
        kitNeed: 1,
      },
    },
    {
      id: 'hacha_plata',
      name: 'Hacha de Plata',
      category: 'Armas',
      subCategory: 'Hachas',
      level: 1,
      stars: 2,
      minAtk: 28,
      maxAtk: 34,
      element: 'Divino',
      elementOrb: '/assets/items/atributo_fe.png',
      portrait: '/assets/aistudio/hacha_de_plata_e05325b5.png',
      icon: '/assets/aistudio/hacha_de_plata_e05325b5.png',
      costGold: 2000,
      ingredients: {
        ingotIcon: '/assets/items/lingote_plata_app.png',
        ingotHave: 10,
        ingotNeed: 8,
        hiltIcon: '/assets/items/mango_hacha_martillo.png',
        hiltHave: 12,
        hiltNeed: 1,
        kitIcon: '/assets/items/kit_de_herreria_app.png',
        kitHave: 2,
        kitNeed: 1,
      },
    },
    {
      id: 'hacha_guerra_plata',
      name: 'Hacha de Guerra de Plata',
      category: 'Armas',
      subCategory: 'Hachas',
      level: 1,
      stars: 2,
      minAtk: 24,
      maxAtk: 43,
      element: 'Divino',
      elementOrb: '/assets/items/atributo_fe.png',
      portrait: '/assets/aistudio/hacha_de_guerra_PLATA_ITEM_2b85baf8.png',
      icon: '/assets/aistudio/hacha_de_guerra_PLATA_ITEM_2b85baf8.png',
      costGold: 2300,
      ingredients: {
        ingotIcon: '/assets/items/lingote_plata_app.png',
        ingotHave: 10,
        ingotNeed: 9,
        hiltIcon: '/assets/items/mango_hacha_martillo.png',
        hiltHave: 12,
        hiltNeed: 1,
        kitIcon: '/assets/items/kit_de_herreria_app.png',
        kitHave: 2,
        kitNeed: 1,
      },
    },
    {
      id: 'hacha_electrum',
      name: 'Hacha de Electrum',
      category: 'Armas',
      subCategory: 'Hachas',
      level: 1,
      stars: 2,
      minAtk: 30,
      maxAtk: 36,
      element: 'Arcano',
      elementOrb: '/assets/items/atributo_arcano.png',
      portrait: '/assets/aistudio/hacha_de_electrum_basica_app_149ffbee.png',
      icon: '/assets/aistudio/hacha_de_electrum_basica_app_149ffbee.png',
      costGold: 3200,
      ingredients: {
        ingotIcon: '/assets/items/lingote_electrum_app.png',
        ingotHave: 8,
        ingotNeed: 6,
        hiltIcon: '/assets/items/mango_hacha_martillo.png',
        hiltHave: 12,
        hiltNeed: 2,
        kitIcon: '/assets/items/kit_de_herreria_app.png',
        kitHave: 2,
        kitNeed: 2,
      },
    },
    {
      id: 'hacha_guerra_electrum',
      name: 'Hacha de Guerra de Electrum',
      category: 'Armas',
      subCategory: 'Hachas',
      level: 1,
      stars: 2,
      minAtk: 26,
      maxAtk: 46,
      element: 'Arcano',
      elementOrb: '/assets/items/atributo_arcano.png',
      portrait: '/assets/aistudio/hacha_de_guerra_ELECTRUM_ITEM_93464ae3.png',
      icon: '/assets/aistudio/hacha_de_guerra_ELECTRUM_ITEM_93464ae3.png',
      costGold: 3600,
      ingredients: {
        ingotIcon: '/assets/items/lingote_electrum_app.png',
        ingotHave: 8,
        ingotNeed: 7,
        hiltIcon: '/assets/items/mango_hacha_martillo.png',
        hiltHave: 12,
        hiltNeed: 2,
        kitIcon: '/assets/items/kit_de_herreria_app.png',
        kitHave: 2,
        kitNeed: 2,
      },
    },
    {
      id: 'hacha_oro',
      name: 'Hacha de Oro',
      category: 'Armas',
      subCategory: 'Hachas',
      level: 1,
      stars: 2,
      minAtk: 32,
      maxAtk: 38,
      element: 'Profano',
      elementOrb: '/assets/items/atributo_oscuro.png',
      portrait: '/assets/aistudio/hacha_de_oro_basica_app_6ade33fd.png',
      icon: '/assets/aistudio/hacha_de_oro_basica_app_6ade33fd.png',
      costGold: 4800,
      ingredients: {
        ingotIcon: '/assets/items/lingote_oro_app.png',
        ingotHave: 10,
        ingotNeed: 8,
        hiltIcon: '/assets/items/mango_hacha_martillo.png',
        hiltHave: 12,
        hiltNeed: 2,
        kitIcon: '/assets/items/kit_de_herreria_app.png',
        kitHave: 2,
        kitNeed: 3,
      },
    },
    {
      id: 'hacha_guerra_oro',
      name: 'Hacha de Guerra de Oro',
      category: 'Armas',
      subCategory: 'Hachas',
      level: 1,
      stars: 2,
      minAtk: 28,
      maxAtk: 49,
      element: 'Profano',
      elementOrb: '/assets/items/atributo_oscuro.png',
      portrait: '/assets/aistudio/hacha_de_guerra_OROITEM_b7663ca8.png',
      icon: '/assets/aistudio/hacha_de_guerra_OROITEM_b7663ca8.png',
      costGold: 5300,
      ingredients: {
        ingotIcon: '/assets/items/lingote_oro_app.png',
        ingotHave: 10,
        ingotNeed: 9,
        hiltIcon: '/assets/items/mango_hacha_martillo.png',
        hiltHave: 12,
        hiltNeed: 2,
        kitIcon: '/assets/items/kit_de_herreria_app.png',
        kitHave: 2,
        kitNeed: 3,
      },
    },

    // === ARMAS: MARTILLOS (Martillos Pesados y Martillos de Guerra) ===
    {
      id: 'martillo_hierro',
      name: 'Martillo de Hierro',
      category: 'Armas',
      subCategory: 'Martillos',
      level: 1,
      stars: 2,
      minAtk: 22,
      maxAtk: 30,
      portrait: '/assets/aistudio/martillo_de_hierropng_562813c4.png',
      icon: '/assets/aistudio/martillo_de_hierropng_562813c4.png',
      costGold: 500,
      ingredients: {
        ingotIcon: '/assets/items/lingote_app.png',
        ingotHave: 8,
        ingotNeed: 6,
        hiltIcon: '/assets/items/mango_hacha_martillo.png',
        hiltHave: 12,
        hiltNeed: 1,
        kitIcon: '/assets/items/kit_de_herreria_app.png',
        kitHave: 2,
        kitNeed: 1,
      },
    },
    {
      id: 'martillo_guerra_hierro',
      name: 'Martillo de Guerra de Hierro',
      category: 'Armas',
      subCategory: 'Martillos',
      level: 1,
      stars: 2,
      minAtk: 25,
      maxAtk: 35,
      portrait: '/assets/aistudio/martillo_de_guerra_8845aea4.png',
      icon: '/assets/aistudio/martillo_de_guerra_8845aea4.png',
      costGold: 600,
      ingredients: {
        ingotIcon: '/assets/items/lingote_app.png',
        ingotHave: 8,
        ingotNeed: 8,
        hiltIcon: '/assets/items/mango_hacha_martillo.png',
        hiltHave: 12,
        hiltNeed: 1,
        kitIcon: '/assets/items/kit_de_herreria_app.png',
        kitHave: 2,
        kitNeed: 1,
      },
    },
    {
      id: 'martillo_quitina',
      name: 'Martillo de Quitina',
      category: 'Armas',
      subCategory: 'Martillos',
      level: 1,
      stars: 2,
      minAtk: 28,
      maxAtk: 36,
      element: 'Natural',
      elementOrb: '/assets/items/atributo_natural.png',
      portrait: '/assets/aistudio/martillo_de_quitinapng_72887996.png',
      icon: '/assets/aistudio/martillo_de_quitinapng_72887996.png',
      costGold: 1200,
      ingredients: {
        ingotIcon: '/assets/items/fragmento de quitina.png',
        ingotHave: 10,
        ingotNeed: 8,
        hiltIcon: '/assets/items/mango_hacha_martillo.png',
        hiltHave: 12,
        hiltNeed: 1,
        kitIcon: '/assets/items/kit_de_herreria_app.png',
        kitHave: 2,
        kitNeed: 1,
      },
    },
    {
      id: 'martillo_guerra_quitina',
      name: 'Martillo de Guerra de Quitina',
      category: 'Armas',
      subCategory: 'Martillos',
      level: 1,
      stars: 2,
      minAtk: 30,
      maxAtk: 42,
      element: 'Natural',
      elementOrb: '/assets/items/atributo_natural.png',
      portrait: '/assets/aistudio/martillo_de_guerra_de_quitina_ef9e5364.png',
      icon: '/assets/aistudio/martillo_de_guerra_de_quitina_ef9e5364.png',
      costGold: 1400,
      ingredients: {
        ingotIcon: '/assets/items/fragmento de quitina.png',
        ingotHave: 10,
        ingotNeed: 10,
        hiltIcon: '/assets/items/mango_hacha_martillo.png',
        hiltHave: 12,
        hiltNeed: 1,
        kitIcon: '/assets/items/kit_de_herreria_app.png',
        kitHave: 2,
        kitNeed: 1,
      },
    },
    {
      id: 'martillo_plata',
      name: 'Martillo de Plata',
      category: 'Armas',
      subCategory: 'Martillos',
      level: 1,
      stars: 2,
      minAtk: 30,
      maxAtk: 38,
      element: 'Divino',
      elementOrb: '/assets/items/atributo_fe.png',
      portrait: '/assets/aistudio/martillo_de_plata_12731c2b.png',
      icon: '/assets/aistudio/martillo_de_plata_12731c2b.png',
      costGold: 2000,
      ingredients: {
        ingotIcon: '/assets/items/lingote_plata_app.png',
        ingotHave: 10,
        ingotNeed: 8,
        hiltIcon: '/assets/items/mango_hacha_martillo.png',
        hiltHave: 12,
        hiltNeed: 1,
        kitIcon: '/assets/items/kit_de_herreria_app.png',
        kitHave: 2,
        kitNeed: 1,
      },
    },
    {
      id: 'martillo_guerra_plata',
      name: 'Martillo de Guerra de Plata',
      category: 'Armas',
      subCategory: 'Martillos',
      level: 1,
      stars: 2,
      minAtk: 33,
      maxAtk: 45,
      element: 'Divino',
      elementOrb: '/assets/items/atributo_fe.png',
      portrait: '/assets/aistudio/martillo_de_guerra_de_plata_d2e6353c.png',
      icon: '/assets/aistudio/martillo_de_guerra_de_plata_d2e6353c.png',
      costGold: 2300,
      ingredients: {
        ingotIcon: '/assets/items/lingote_plata_app.png',
        ingotHave: 10,
        ingotNeed: 10,
        hiltIcon: '/assets/items/mango_hacha_martillo.png',
        hiltHave: 12,
        hiltNeed: 1,
        kitIcon: '/assets/items/kit_de_herreria_app.png',
        kitHave: 2,
        kitNeed: 1,
      },
    },
    {
      id: 'martillo_electrum',
      name: 'Martillo de Electrum',
      category: 'Armas',
      subCategory: 'Martillos',
      level: 1,
      stars: 2,
      minAtk: 32,
      maxAtk: 42,
      element: 'Arcano',
      elementOrb: '/assets/items/atributo_arcano.png',
      portrait: '/assets/aistudio/martillo_de_electrum_85e0be8f.png',
      icon: '/assets/aistudio/martillo_de_electrum_85e0be8f.png',
      costGold: 3200,
      ingredients: {
        ingotIcon: '/assets/items/lingote_electrum_app.png',
        ingotHave: 8,
        ingotNeed: 6,
        hiltIcon: '/assets/items/mango_hacha_martillo.png',
        hiltHave: 12,
        hiltNeed: 2,
        kitIcon: '/assets/items/kit_de_herreria_app.png',
        kitHave: 2,
        kitNeed: 2,
      },
    },
    {
      id: 'martillo_guerra_electrum',
      name: 'Martillo de Guerra de Electrum',
      category: 'Armas',
      subCategory: 'Martillos',
      level: 1,
      stars: 2,
      minAtk: 35,
      maxAtk: 48,
      element: 'Arcano',
      elementOrb: '/assets/items/atributo_arcano.png',
      portrait: '/assets/aistudio/martillo_de_guerra_de_electrum_7e3e66a4.png',
      icon: '/assets/aistudio/martillo_de_guerra_de_electrum_7e3e66a4.png',
      costGold: 3600,
      ingredients: {
        ingotIcon: '/assets/items/lingote_electrum_app.png',
        ingotHave: 8,
        ingotNeed: 8,
        hiltIcon: '/assets/items/mango_hacha_martillo.png',
        hiltHave: 12,
        hiltNeed: 2,
        kitIcon: '/assets/items/kit_de_herreria_app.png',
        kitHave: 2,
        kitNeed: 2,
      },
    },
    {
      id: 'martillo_oro',
      name: 'Martillo de Oro',
      category: 'Armas',
      subCategory: 'Martillos',
      level: 1,
      stars: 2,
      minAtk: 34,
      maxAtk: 44,
      element: 'Profano',
      elementOrb: '/assets/items/atributo_oscuro.png',
      portrait: '/assets/aistudio/martillo_de_oro_2144f9ff.png',
      icon: '/assets/aistudio/martillo_de_oro_2144f9ff.png',
      costGold: 4800,
      ingredients: {
        ingotIcon: '/assets/items/lingote_oro_app.png',
        ingotHave: 10,
        ingotNeed: 8,
        hiltIcon: '/assets/items/mango_hacha_martillo.png',
        hiltHave: 12,
        hiltNeed: 2,
        kitIcon: '/assets/items/kit_de_herreria_app.png',
        kitHave: 2,
        kitNeed: 3,
      },
    },
    {
      id: 'martillo_guerra_oro',
      name: 'Martillo de Guerra de Oro',
      category: 'Armas',
      subCategory: 'Martillos',
      level: 1,
      stars: 2,
      minAtk: 38,
      maxAtk: 52,
      element: 'Profano',
      elementOrb: '/assets/items/atributo_oscuro.png',
      portrait: '/assets/aistudio/martillo_de_guerra_de_oro_b5f2d8a4.png',
      icon: '/assets/aistudio/martillo_de_guerra_de_oro_b5f2d8a4.png',
      costGold: 5400,
      ingredients: {
        ingotIcon: '/assets/items/lingote_oro_app.png',
        ingotHave: 10,
        ingotNeed: 10,
        hiltIcon: '/assets/items/mango_hacha_martillo.png',
        hiltHave: 12,
        hiltNeed: 2,
        kitIcon: '/assets/items/kit_de_herreria_app.png',
        kitHave: 2,
        kitNeed: 3,
      },
    },

    // === ARMAS: DAGAS (Hierro, Quitina, Plata, Electrum, Oro) ===
    {
      id: 'dagas_hierro',
      name: 'Dagas de Hierro',
      category: 'Armas',
      subCategory: 'Dagas',
      level: 1,
      stars: 2,
      minAtk: 16,
      maxAtk: 24,
      portrait: '/assets/aistudio/dagas_de_hierro_basica_app_afd081a5.png',
      icon: '/assets/aistudio/dagas_de_hierro_basica_app_afd081a5.png',
      costGold: 450,
      ingredients: {
        ingotIcon: '/assets/items/lingote_app.png',
        ingotHave: 8,
        ingotNeed: 4,
        hiltIcon: '/assets/aistudio/mango_de_espada_ITEM_80f48554.png',
        hiltHave: 12,
        hiltNeed: 1,
        kitIcon: '/assets/items/kit_de_herreria_app.png',
        kitHave: 2,
        kitNeed: 1,
      },
    },
    {
      id: 'dagas_quitina',
      name: 'Dagas de Quitina',
      category: 'Armas',
      subCategory: 'Dagas',
      level: 1,
      stars: 2,
      minAtk: 20,
      maxAtk: 28,
      element: 'Natural',
      elementOrb: '/assets/items/atributo_natural.png',
      portrait: '/assets/aistudio/dagas_de_quitina_72864683.png',
      icon: '/assets/aistudio/dagas_de_quitina_72864683.png',
      costGold: 1100,
      ingredients: {
        ingotIcon: '/assets/items/fragmento de quitina.png',
        ingotHave: 10,
        ingotNeed: 6,
        hiltIcon: '/assets/aistudio/mango_de_espada_ITEM_80f48554.png',
        hiltHave: 12,
        hiltNeed: 1,
        kitIcon: '/assets/items/kit_de_herreria_app.png',
        kitHave: 2,
        kitNeed: 1,
      },
    },
    {
      id: 'dagas_plata',
      name: 'Dagas de Plata',
      category: 'Armas',
      subCategory: 'Dagas',
      level: 1,
      stars: 2,
      minAtk: 22,
      maxAtk: 30,
      element: 'Divino',
      elementOrb: '/assets/items/atributo_fe.png',
      portrait: '/assets/aistudio/dagas_de_plata_4988d0bc.png',
      icon: '/assets/aistudio/dagas_de_plata_4988d0bc.png',
      costGold: 1800,
      ingredients: {
        ingotIcon: '/assets/items/lingote_plata_app.png',
        ingotHave: 10,
        ingotNeed: 6,
        hiltIcon: '/assets/aistudio/mango_de_espada_ITEM_80f48554.png',
        hiltHave: 12,
        hiltNeed: 1,
        kitIcon: '/assets/items/kit_de_herreria_app.png',
        kitHave: 2,
        kitNeed: 1,
      },
    },
    {
      id: 'dagas_electrum',
      name: 'Dagas de Electrum',
      category: 'Armas',
      subCategory: 'Dagas',
      level: 1,
      stars: 2,
      minAtk: 24,
      maxAtk: 32,
      element: 'Arcano',
      elementOrb: '/assets/items/atributo_arcano.png',
      portrait: '/assets/aistudio/dagas_de_electrum_f8997ef3.png',
      icon: '/assets/aistudio/dagas_de_electrum_f8997ef3.png',
      costGold: 2900,
      ingredients: {
        ingotIcon: '/assets/items/lingote_electrum_app.png',
        ingotHave: 8,
        ingotNeed: 5,
        hiltIcon: '/assets/aistudio/mango_de_espada_ITEM_80f48554.png',
        hiltHave: 12,
        hiltNeed: 2,
        kitIcon: '/assets/items/kit_de_herreria_app.png',
        kitHave: 2,
        kitNeed: 2,
      },
    },
    {
      id: 'dagas_oro',
      name: 'Dagas de Oro',
      category: 'Armas',
      subCategory: 'Dagas',
      level: 1,
      stars: 2,
      minAtk: 26,
      maxAtk: 35,
      element: 'Profano',
      elementOrb: '/assets/items/atributo_oscuro.png',
      portrait: '/assets/aistudio/dagas_de_oro_c08c3a2a.png',
      icon: '/assets/aistudio/dagas_de_oro_c08c3a2a.png',
      costGold: 4400,
      ingredients: {
        ingotIcon: '/assets/items/lingote_oro_app.png',
        ingotHave: 10,
        ingotNeed: 6,
        hiltIcon: '/assets/aistudio/mango_de_espada_ITEM_80f48554.png',
        hiltHave: 12,
        hiltNeed: 2,
        kitIcon: '/assets/items/kit_de_herreria_app.png',
        kitHave: 2,
        kitNeed: 3,
      },
    },
    // === ARMAS: GRIMORIOS (Hierro, Quitina, Plata, Electrum, Oro) ===
    {
      id: 'grimorio_hierro',
      name: 'Grimorio de Hierro',
      category: 'Armas',
      subCategory: 'Grimorios',
      level: 1,
      stars: 2,
      minAtk: 24,
      maxAtk: 32,
      portrait: '/assets/aistudio/grimorio_hierroapp_01bcdb9b.png',
      icon: '/assets/aistudio/grimorio_hierroapp_01bcdb9b.png',
      costGold: 600,
      ingredients: {
        ingotIcon: '/assets/items/lingote_app.png',
        ingotHave: 8,
        ingotNeed: 6,
        hiltIcon: '/assets/items/lomo_libro.png',
        hiltHave: 10,
        hiltNeed: 1,
        kitIcon: '/assets/items/kit_de_inscripcion_app.png',
        kitHave: 8,
        kitNeed: 1,
      },
    },
    {
      id: 'grimorio_quitina',
      name: 'Grimorio de Quitina',
      category: 'Armas',
      subCategory: 'Grimorios',
      level: 1,
      stars: 2,
      minAtk: 28,
      maxAtk: 38,
      element: 'Natural',
      elementOrb: '/assets/items/atributo_natural.png',
      portrait: '/assets/aistudio/grimorio_de_quitina_59eb86e3.png',
      icon: '/assets/aistudio/grimorio_de_quitina_59eb86e3.png',
      costGold: 1300,
      ingredients: {
        ingotIcon: '/assets/items/fragmento de quitina.png',
        ingotHave: 10,
        ingotNeed: 8,
        hiltIcon: '/assets/items/lomo_libro.png',
        hiltHave: 10,
        hiltNeed: 1,
        kitIcon: '/assets/items/kit_de_inscripcion_app.png',
        kitHave: 8,
        kitNeed: 1,
      },
    },
    {
      id: 'grimorio_plata',
      name: 'Grimorio de Plata',
      category: 'Armas',
      subCategory: 'Grimorios',
      level: 1,
      stars: 2,
      minAtk: 30,
      maxAtk: 40,
      element: 'Divino',
      elementOrb: '/assets/items/atributo_fe.png',
      portrait: '/assets/aistudio/grimorio_de_plata_0acbecea.png',
      icon: '/assets/aistudio/grimorio_de_plata_0acbecea.png',
      costGold: 2100,
      ingredients: {
        ingotIcon: '/assets/items/lingote_plata_app.png',
        ingotHave: 10,
        ingotNeed: 8,
        hiltIcon: '/assets/items/lomo_libro.png',
        hiltHave: 10,
        hiltNeed: 1,
        kitIcon: '/assets/items/kit_de_inscripcion_app.png',
        kitHave: 8,
        kitNeed: 1,
      },
    },
    {
      id: 'grimorio_electrum',
      name: 'Grimorio de Electrum',
      category: 'Armas',
      subCategory: 'Grimorios',
      level: 1,
      stars: 2,
      minAtk: 34,
      maxAtk: 44,
      element: 'Arcano',
      elementOrb: '/assets/items/atributo_arcano.png',
      portrait: '/assets/aistudio/grimorio_de_electrum_f97ce2b3.png',
      icon: '/assets/aistudio/grimorio_de_electrum_f97ce2b3.png',
      costGold: 3300,
      ingredients: {
        ingotIcon: '/assets/items/lingote_electrum_app.png',
        ingotHave: 8,
        ingotNeed: 6,
        hiltIcon: '/assets/items/lomo_libro.png',
        hiltHave: 10,
        hiltNeed: 2,
        kitIcon: '/assets/items/kit_de_inscripcion_app.png',
        kitHave: 8,
        kitNeed: 2,
      },
    },
    {
      id: 'grimorio_oro',
      name: 'Grimorio de Oro',
      category: 'Armas',
      subCategory: 'Grimorios',
      level: 1,
      stars: 2,
      minAtk: 36,
      maxAtk: 48,
      element: 'Profano',
      elementOrb: '/assets/items/atributo_oscuro.png',
      portrait: '/assets/aistudio/grimorio_de_oro_7ebca939.png',
      icon: '/assets/aistudio/grimorio_de_oro_7ebca939.png',
      costGold: 5000,
      ingredients: {
        ingotIcon: '/assets/items/lingote_oro_app.png',
        ingotHave: 10,
        ingotNeed: 8,
        hiltIcon: '/assets/items/lomo_libro.png',
        hiltHave: 10,
        hiltNeed: 2,
        kitIcon: '/assets/items/kit_de_inscripcion_app.png',
        kitHave: 8,
        kitNeed: 3,
      },
    },

    // === ARMADURAS ===
    {
      id: 'armadura_hierro',
      name: 'Cota de Malla Simple',
      category: 'Armaduras',
      level: 1,
      stars: 1,
      defense: 20,
      hp: 120,
      icon: '/assets/items/ARMADURA LOUX.png',
      costGold: 450,
      ingredients: {
        ingotIcon: '/assets/items/lingote_app.png',
        ingotHave: 8,
        ingotNeed: 5,
        hiltIcon: '/assets/items/fragmento de quitina.png',
        hiltHave: 6,
        hiltNeed: 2,
        kitIcon: '/assets/items/kit_de_herreria_app.png',
        kitHave: 2,
        kitNeed: 1,
      },
    },
    {
      id: 'armadura_coraza',
      name: 'Coraza de Hierro Forjado',
      category: 'Armaduras',
      level: 2,
      stars: 2,
      defense: 38,
      hp: 220,
      icon: '/assets/items/ARMADURA LOUX.png',
      costGold: 950,
      ingredients: {
        ingotIcon: '/assets/items/lingote_plata_app.png',
        ingotHave: 10,
        ingotNeed: 6,
        hiltIcon: '/assets/items/fragmento de quitina.png',
        hiltHave: 6,
        hiltNeed: 3,
        kitIcon: '/assets/items/kit_de_herreria_app.png',
        kitHave: 2,
        kitNeed: 2,
      },
    },
    {
      id: 'armadura_pesada',
      name: 'Armadura Pesada de las Cumbres',
      category: 'Armaduras',
      level: 3,
      stars: 3,
      defense: 65,
      hp: 400,
      icon: '/assets/items/ARMADURA LOUX.png',
      costGold: 1800,
      ingredients: {
        ingotIcon: '/assets/items/lingote_electrum_app.png',
        ingotHave: 5,
        ingotNeed: 4,
        hiltIcon: '/assets/items/escamas_de_cryovain.png',
        hiltHave: 8,
        hiltNeed: 2,
        kitIcon: '/assets/items/kit_de_herreria_app.png',
        kitHave: 2,
        kitNeed: 2,
      },
    },
    {
      id: 'armadura_titanio',
      name: 'Placa de Titanio de Moonhaven',
      category: 'Armaduras',
      level: 4,
      stars: 4,
      defense: 95,
      hp: 650,
      icon: '/assets/items/ARMADURA LOUX.png',
      costGold: 3200,
      ingredients: {
        ingotIcon: '/assets/items/lingote_netherita_app.png',
        ingotHave: 4,
        ingotNeed: 3,
        hiltIcon: '/assets/items/escamas_de_cryovain.png',
        hiltHave: 8,
        hiltNeed: 4,
        kitIcon: '/assets/items/kit_de_herreria_app.png',
        kitHave: 2,
        kitNeed: 3,
      },
    },

    // === ANILLOS ===
    {
      id: 'anillo_cobre',
      name: 'Sortija de Cobre Rústica',
      category: 'Anillos',
      level: 1,
      stars: 1,
      minAtk: 15,
      maxAtk: 15,
      defense: 10,
      icon: '/assets/items/ANILLO ORO.png',
      costGold: 400,
      ingredients: {
        ingotIcon: '/assets/items/lingote_cobre_app.png',
        ingotHave: 8,
        ingotNeed: 4,
        hiltIcon: '/assets/items/fragmento de quitina.png',
        hiltHave: 6,
        hiltNeed: 1,
        kitIcon: '/assets/items/kit_de_joyeria_app.png',
        kitHave: 2,
        kitNeed: 1,
      },
    },
    {
      id: 'anillo_incrustado',
      name: 'Anillo del Incrustado',
      category: 'Anillos',
      level: 2,
      stars: 2,
      minAtk: 32,
      maxAtk: 32,
      defense: 22,
      icon: '/assets/items/anillo del incrustado.png',
      costGold: 850,
      ingredients: {
        ingotIcon: '/assets/items/lingote_oro_app.png',
        ingotHave: 8,
        ingotNeed: 4,
        hiltIcon: '/assets/items/moneda de moonhaven.png',
        hiltHave: 4,
        hiltNeed: 1,
        kitIcon: '/assets/items/kit_de_joyeria_app.png',
        kitHave: 2,
        kitNeed: 2,
      },
    },
    {
      id: 'anillo_amatista',
      name: 'Sortija de Amatista Purificada',
      category: 'Anillos',
      level: 3,
      stars: 3,
      minAtk: 55,
      maxAtk: 55,
      defense: 40,
      icon: '/assets/items/ANILLO ORO.png',
      costGold: 1700,
      ingredients: {
        ingotIcon: '/assets/items/lingote_electrum_app.png',
        ingotHave: 5,
        ingotNeed: 3,
        hiltIcon: '/assets/items/escamas_de_cryovain.png',
        hiltHave: 8,
        hiltNeed: 2,
        kitIcon: '/assets/items/kit_de_joyeria_app.png',
        kitHave: 2,
        kitNeed: 2,
      },
    },
    {
      id: 'anillo_moonhaven',
      name: 'Sortija Rúnica de Moonhaven',
      category: 'Anillos',
      level: 4,
      stars: 4,
      minAtk: 85,
      maxAtk: 85,
      defense: 65,
      icon: '/assets/items/anillo del incrustado.png',
      costGold: 3000,
      ingredients: {
        ingotIcon: '/assets/items/lingote_hierro_estelar_app.png',
        ingotHave: 6,
        ingotNeed: 4,
        hiltIcon: '/assets/items/moneda de moonhaven.png',
        hiltHave: 4,
        hiltNeed: 3,
        kitIcon: '/assets/items/kit_de_joyeria_app.png',
        kitHave: 2,
        kitNeed: 3,
      },
    },

    // === CASCOS ===
    {
      id: 'casco_cuero',
      name: 'Casco de Cuero y Remaches',
      category: 'Cascos',
      level: 1,
      stars: 1,
      defense: 15,
      hp: 90,
      icon: '/assets/items/pepe_loux_caso.png',
      costGold: 400,
      ingredients: {
        ingotIcon: '/assets/items/lingote_app.png',
        ingotHave: 8,
        ingotNeed: 4,
        hiltIcon: '/assets/items/fragmento de quitina.png',
        hiltHave: 6,
        hiltNeed: 2,
        kitIcon: '/assets/items/kit_de_herreria_app.png',
        kitHave: 2,
        kitNeed: 1,
      },
    },
    {
      id: 'casco_acero',
      name: 'Yelmo de Acero Nórdico',
      category: 'Cascos',
      level: 2,
      stars: 2,
      defense: 32,
      hp: 180,
      icon: '/assets/items/pepe_loux_caso.png',
      costGold: 800,
      ingredients: {
        ingotIcon: '/assets/items/lingote_plata_app.png',
        ingotHave: 10,
        ingotNeed: 5,
        hiltIcon: '/assets/items/fragmento de quitina.png',
        hiltHave: 6,
        hiltNeed: 2,
        kitIcon: '/assets/items/kit_de_herreria_app.png',
        kitHave: 2,
        kitNeed: 2,
      },
    },
    {
      id: 'casco_spangenhelm',
      name: 'Casco Spangenhelm de la Guardia',
      category: 'Cascos',
      level: 3,
      stars: 3,
      defense: 52,
      hp: 320,
      icon: '/assets/items/pepe_loux_caso.png',
      costGold: 1600,
      ingredients: {
        ingotIcon: '/assets/items/lingote_electrum_app.png',
        ingotHave: 5,
        ingotNeed: 4,
        hiltIcon: '/assets/items/escamas_de_cryovain.png',
        hiltHave: 8,
        hiltNeed: 2,
        kitIcon: '/assets/items/kit_de_herreria_app.png',
        kitHave: 2,
        kitNeed: 2,
      },
    },
    {
      id: 'casco_celada',
      name: 'Celada Gloriosa de Pepe Loux',
      category: 'Cascos',
      level: 4,
      stars: 4,
      defense: 82,
      hp: 500,
      icon: '/assets/items/pepe_loux_caso.png',
      costGold: 2900,
      ingredients: {
        ingotIcon: '/assets/items/lingote_hierro_estelar_app.png',
        ingotHave: 6,
        ingotNeed: 4,
        hiltIcon: '/assets/items/escamas_de_cryovain.png',
        hiltHave: 8,
        hiltNeed: 3,
        kitIcon: '/assets/items/kit_de_herreria_app.png',
        kitHave: 2,
        kitNeed: 3,
      },
    },

    // === ABALORIOS ===
    {
      id: 'abalorio_cazador',
      name: 'Amuleto del Cazador',
      category: 'Abalorios',
      level: 1,
      stars: 1,
      minAtk: 12,
      maxAtk: 12,
      hp: 70,
      icon: '/assets/items/medallon moonhaven app.png',
      costGold: 350,
      ingredients: {
        ingotIcon: '/assets/items/lingote_cobre_app.png',
        ingotHave: 8,
        ingotNeed: 3,
        hiltIcon: '/assets/items/fragmento de quitina.png',
        hiltHave: 6,
        hiltNeed: 1,
        kitIcon: '/assets/items/kit_de_joyeria_app.png',
        kitHave: 2,
        kitNeed: 1,
      },
    },
    {
      id: 'abalorio_talisman',
      name: 'Talismán de Hielo Ancestral',
      category: 'Abalorios',
      level: 2,
      stars: 2,
      minAtk: 25,
      maxAtk: 25,
      defense: 20,
      icon: '/assets/items/medallon moonhaven app.png',
      costGold: 750,
      ingredients: {
        ingotIcon: '/assets/items/lingote_plata_app.png',
        ingotHave: 10,
        ingotNeed: 4,
        hiltIcon: '/assets/items/escamas_de_cryovain.png',
        hiltHave: 8,
        hiltNeed: 1,
        kitIcon: '/assets/items/kit_de_joyeria_app.png',
        kitHave: 2,
        kitNeed: 2,
      },
    },
    {
      id: 'abalorio_insignia',
      name: 'Insignia del Mercado Negro',
      category: 'Abalorios',
      level: 3,
      stars: 3,
      minAtk: 48,
      maxAtk: 48,
      defense: 35,
      icon: '/assets/items/Insignia Mercado Negro app.png',
      costGold: 1500,
      ingredients: {
        ingotIcon: '/assets/items/lingote_electrum_app.png',
        ingotHave: 5,
        ingotNeed: 3,
        hiltIcon: '/assets/items/moneda de moonhaven.png',
        hiltHave: 4,
        hiltNeed: 2,
        kitIcon: '/assets/items/kit_de_joyeria_app.png',
        kitHave: 2,
        kitNeed: 2,
      },
    },
    {
      id: 'abalorio_medallon',
      name: 'Medallón Celestial de Moonhaven',
      category: 'Abalorios',
      level: 4,
      stars: 4,
      minAtk: 80,
      maxAtk: 80,
      hp: 380,
      icon: '/assets/items/medallon moonhaven app.png',
      costGold: 2800,
      ingredients: {
        ingotIcon: '/assets/items/lingote_oro_app.png',
        ingotHave: 8,
        ingotNeed: 4,
        hiltIcon: '/assets/items/escamas_de_cryovain.png',
        hiltHave: 8,
        hiltNeed: 3,
        kitIcon: '/assets/items/kit_de_joyeria_app.png',
        kitHave: 2,
        kitNeed: 3,
      },
    },

    // === CATEGORÍA: POCIONES ===
    {
      id: 'pocion_vida_menor',
      name: 'Poción de Vida Menor',
      category: 'Pociones',
      level: 1,
      stars: 2,
      minAtk: 250,
      maxAtk: 250,
      element: 'Natural',
      elementOrb: '/assets/items/atributo_natural.png',
      portrait: '/assets/items/vida.png',
      icon: '/assets/items/vida.png',
      costGold: 200,
      ingredients: {
        ingotIcon: '/assets/items/shop_herb.png',
        ingotHave: 12,
        ingotNeed: 3,
        hiltIcon: '/assets/items/semilla_xp.png',
        hiltHave: 8,
        hiltNeed: 2,
        kitIcon: '/assets/items/recurso_26_4x.png',
        kitHave: 5,
        kitNeed: 1,
      },
    },
    {
      id: 'pocion_sangre_escarlata',
      name: 'Poción de Sangre Escarlata',
      category: 'Pociones',
      level: 2,
      stars: 3,
      minAtk: 550,
      maxAtk: 550,
      element: 'Natural',
      elementOrb: '/assets/items/atributo_natural.png',
      portrait: '/assets/items/vida.png',
      icon: '/assets/items/vida.png',
      costGold: 450,
      ingredients: {
        ingotIcon: '/assets/items/shop_herb.png',
        ingotHave: 12,
        ingotNeed: 5,
        hiltIcon: '/assets/items/rubi_app.png',
        hiltHave: 6,
        hiltNeed: 2,
        kitIcon: '/assets/items/recurso_26_4x.png',
        kitHave: 5,
        kitNeed: 1,
      },
    },
    {
      id: 'elixir_rejuvenecimiento',
      name: 'Elixir de Rejuvenecimiento',
      category: 'Pociones',
      level: 3,
      stars: 3,
      minAtk: 950,
      maxAtk: 950,
      element: 'Divino',
      elementOrb: '/assets/items/atributo_fe.png',
      portrait: '/assets/items/boton_pocion.png',
      icon: '/assets/items/boton_pocion.png',
      costGold: 900,
      ingredients: {
        ingotIcon: '/assets/items/planta_xp.png',
        ingotHave: 10,
        ingotNeed: 4,
        hiltIcon: '/assets/items/zafiro_app.png',
        hiltHave: 5,
        hiltNeed: 2,
        kitIcon: '/assets/items/recurso_26_4x.png',
        kitHave: 5,
        kitNeed: 2,
      },
    },
    {
      id: 'lagrima_fenix_sagrado',
      name: 'Lágrima del Fénix Sagrado',
      category: 'Pociones',
      level: 4,
      stars: 4,
      minAtk: 1800,
      maxAtk: 1800,
      element: 'Divino',
      elementOrb: '/assets/items/atributo_fe.png',
      portrait: '/assets/items/raxxar_pocion.png',
      icon: '/assets/items/raxxar_pocion.png',
      costGold: 1800,
      ingredients: {
        ingotIcon: '/assets/items/planta_xp.png',
        ingotHave: 10,
        ingotNeed: 8,
        hiltIcon: '/assets/items/salvaje_gema_app.png',
        hiltHave: 4,
        hiltNeed: 3,
        kitIcon: '/assets/items/recurso_26_4x.png',
        kitHave: 5,
        kitNeed: 2,
      },
    },
    {
      id: 'frasco_eter_arcano',
      name: 'Frasco de Éter Arcano',
      category: 'Pociones',
      level: 2,
      stars: 3,
      minAtk: 25,
      maxAtk: 35,
      element: 'Arcano',
      elementOrb: '/assets/items/atributo_arcano.png',
      portrait: '/assets/items/zafiro_app.png',
      icon: '/assets/items/zafiro_app.png',
      costGold: 480,
      ingredients: {
        ingotIcon: '/assets/items/shop_herb.png',
        ingotHave: 12,
        ingotNeed: 4,
        hiltIcon: '/assets/items/zafiro_app.png',
        hiltHave: 5,
        hiltNeed: 2,
        kitIcon: '/assets/items/recurso_26_4x.png',
        kitHave: 5,
        kitNeed: 1,
      },
    },
    {
      id: 'furia_barbara_pocion',
      name: 'Brebaje de Furia Bárbara',
      category: 'Pociones',
      level: 2,
      stars: 3,
      minAtk: 35,
      maxAtk: 45,
      element: 'Profano',
      elementOrb: '/assets/items/atributo_oscuro.png',
      portrait: '/assets/items/rubi_app.png',
      icon: '/assets/items/rubi_app.png',
      costGold: 550,
      ingredients: {
        ingotIcon: '/assets/items/shop_herb.png',
        ingotHave: 12,
        ingotNeed: 5,
        hiltIcon: '/assets/items/rubi_app.png',
        hiltHave: 6,
        hiltNeed: 2,
        kitIcon: '/assets/items/recurso_26_4x.png',
        kitHave: 5,
        kitNeed: 1,
      },
    },
    {
      id: 'unguento_piel_piedra',
      name: 'Ungüento de Piel de Piedra',
      category: 'Pociones',
      level: 2,
      stars: 2,
      defense: 35,
      hp: 150,
      element: 'Natural',
      elementOrb: '/assets/items/atributo_natural.png',
      portrait: '/assets/items/planta_xp.png',
      icon: '/assets/items/planta_xp.png',
      costGold: 380,
      ingredients: {
        ingotIcon: '/assets/items/shop_herb.png',
        ingotHave: 12,
        ingotNeed: 4,
        hiltIcon: '/assets/items/semilla_xp.png',
        hiltHave: 8,
        hiltNeed: 3,
        kitIcon: '/assets/items/recurso_26_4x.png',
        kitHave: 5,
        kitNeed: 1,
      },
    },
    {
      id: 'brebaje_secreto_raxxar',
      name: 'Brebaje Secreto de Raxxar',
      category: 'Pociones',
      level: 5,
      stars: 5,
      minAtk: 60,
      maxAtk: 85,
      element: 'Arcano',
      elementOrb: '/assets/items/atributo_arcano.png',
      portrait: '/assets/items/raxxar_pocion.png',
      icon: '/assets/items/raxxar_pocion.png',
      costGold: 2600,
      ingredients: {
        ingotIcon: '/assets/items/planta_xp.png',
        ingotHave: 10,
        ingotNeed: 8,
        hiltIcon: '/assets/items/salvaje_gema_app.png',
        hiltHave: 4,
        hiltNeed: 3,
        kitIcon: '/assets/items/recurso_26_4x.png',
        kitHave: 5,
        kitNeed: 3,
      },
    },

    // === CATEGORÍA: ENCANTAMIENTOS ===
    {
      id: 'encantamiento_flamigero',
      name: 'Encantamiento de Filo Flamígero',
      category: 'Encantamientos',
      level: 2,
      stars: 3,
      minAtk: 35,
      maxAtk: 45,
      element: 'Profano',
      elementOrb: '/assets/items/atributo_oscuro.png',
      portrait: '/assets/items/rubi_app.png',
      icon: '/assets/items/rubi_app.png',
      costGold: 650,
      ingredients: {
        ingotIcon: '/assets/items/rubi_app.png',
        ingotHave: 6,
        ingotNeed: 3,
        hiltIcon: '/assets/items/fragmento de quitina.png',
        hiltHave: 10,
        hiltNeed: 2,
        kitIcon: '/assets/items/kit_de_herreria_app.png',
        kitHave: 2,
        kitNeed: 1,
      },
    },
    {
      id: 'runa_concentracion',
      name: 'Runa Arcana de Concentración',
      category: 'Encantamientos',
      level: 3,
      stars: 3,
      minAtk: 42,
      maxAtk: 54,
      element: 'Arcano',
      elementOrb: '/assets/items/atributo_arcano.png',
      portrait: '/assets/items/zafiro_app.png',
      icon: '/assets/items/zafiro_app.png',
      costGold: 850,
      ingredients: {
        ingotIcon: '/assets/items/zafiro_app.png',
        ingotHave: 5,
        ingotNeed: 3,
        hiltIcon: '/assets/items/lingote_electrum_app.png',
        hiltHave: 8,
        hiltNeed: 2,
        kitIcon: '/assets/items/kit_de_joyeria_app.png',
        kitHave: 2,
        kitNeed: 1,
      },
    },
    {
      id: 'sello_luz_sagrada',
      name: 'Sello de Luz Sagrada',
      category: 'Encantamientos',
      level: 3,
      stars: 4,
      minAtk: 50,
      maxAtk: 65,
      element: 'Divino',
      elementOrb: '/assets/items/atributo_fe.png',
      portrait: '/assets/items/salvaje_gema_app.png',
      icon: '/assets/items/salvaje_gema_app.png',
      costGold: 1400,
      ingredients: {
        ingotIcon: '/assets/items/lingote_oro_app.png',
        ingotHave: 8,
        ingotNeed: 3,
        hiltIcon: '/assets/items/salvaje_gema_app.png',
        hiltHave: 4,
        hiltNeed: 2,
        kitIcon: '/assets/items/kit_de_joyeria_app.png',
        kitHave: 2,
        kitNeed: 2,
      },
    },
    {
      id: 'glifo_escudo_espectral',
      name: 'Glifo de Escudo Espectral',
      category: 'Encantamientos',
      level: 2,
      stars: 3,
      defense: 45,
      hp: 220,
      element: 'Arcano',
      elementOrb: '/assets/items/atributo_arcano.png',
      portrait: '/assets/items/recurso_26_4x.png',
      icon: '/assets/items/recurso_26_4x.png',
      costGold: 950,
      ingredients: {
        ingotIcon: '/assets/items/lingote_plata_app.png',
        ingotHave: 10,
        ingotNeed: 3,
        hiltIcon: '/assets/items/escamas_de_cryovain.png',
        hiltHave: 8,
        hiltNeed: 2,
        kitIcon: '/assets/items/kit_de_herreria_app.png',
        kitHave: 2,
        kitNeed: 1,
      },
    },
    {
      id: 'encantamiento_astral_moonhaven',
      name: 'Encantamiento Astral de Moonhaven',
      category: 'Encantamientos',
      level: 4,
      stars: 5,
      minAtk: 78,
      maxAtk: 96,
      element: 'Arcano',
      elementOrb: '/assets/items/atributo_arcano.png',
      portrait: '/assets/items/medallon moonhaven app.png',
      icon: '/assets/items/medallon moonhaven app.png',
      costGold: 2400,
      ingredients: {
        ingotIcon: '/assets/items/lingote_oro_app.png',
        ingotHave: 8,
        ingotNeed: 5,
        hiltIcon: '/assets/items/moneda de moonhaven.png',
        hiltHave: 4,
        hiltNeed: 3,
        kitIcon: '/assets/items/kit_de_joyeria_app.png',
        kitHave: 2,
        kitNeed: 3,
      },
    },

    // === CATEGORÍA: ACEITES PARA ARMAS ===
    {
      id: 'aceite_filo_acero',
      name: 'Aceite de Filo Afilado',
      category: 'Aceites para Armas',
      level: 1,
      stars: 2,
      minAtk: 20,
      maxAtk: 26,
      element: 'Natural',
      elementOrb: '/assets/items/atributo_natural.png',
      portrait: '/assets/items/shop_herb.png',
      icon: '/assets/items/shop_herb.png',
      costGold: 280,
      ingredients: {
        ingotIcon: '/assets/items/shop_herb.png',
        ingotHave: 12,
        ingotNeed: 4,
        hiltIcon: '/assets/items/lingote_cobre_app.png',
        hiltHave: 8,
        hiltNeed: 2,
        kitIcon: '/assets/items/recurso_26_4x.png',
        kitHave: 5,
        kitNeed: 1,
      },
    },
    {
      id: 'veneno_sombra_profana',
      name: 'Veneno de Sombra Profana',
      category: 'Aceites para Armas',
      level: 2,
      stars: 3,
      minAtk: 36,
      maxAtk: 48,
      element: 'Profano',
      elementOrb: '/assets/items/atributo_oscuro.png',
      portrait: '/assets/items/fragmento de quitina.png',
      icon: '/assets/items/fragmento de quitina.png',
      costGold: 580,
      ingredients: {
        ingotIcon: '/assets/items/fragmento de quitina.png',
        ingotHave: 10,
        ingotNeed: 4,
        hiltIcon: '/assets/items/planta_xp.png',
        hiltHave: 10,
        hiltNeed: 3,
        kitIcon: '/assets/items/recurso_26_4x.png',
        kitHave: 5,
        kitNeed: 1,
      },
    },
    {
      id: 'aceite_igneo_dragon',
      name: 'Aceite Ígneo de Dragón',
      category: 'Aceites para Armas',
      level: 3,
      stars: 4,
      minAtk: 52,
      maxAtk: 68,
      element: 'Profano',
      elementOrb: '/assets/items/atributo_oscuro.png',
      portrait: '/assets/items/rubi_app.png',
      icon: '/assets/items/rubi_app.png',
      costGold: 1250,
      ingredients: {
        ingotIcon: '/assets/items/rubi_app.png',
        ingotHave: 6,
        ingotNeed: 3,
        hiltIcon: '/assets/items/fragmento de quitina.png',
        hiltHave: 10,
        hiltNeed: 4,
        kitIcon: '/assets/items/recurso_26_4x.png',
        kitHave: 5,
        kitNeed: 2,
      },
    },
    {
      id: 'unguento_congelante_cryovain',
      name: 'Ungüento Congelante de Cryovain',
      category: 'Aceites para Armas',
      level: 3,
      stars: 4,
      minAtk: 48,
      maxAtk: 64,
      element: 'Natural',
      elementOrb: '/assets/items/atributo_natural.png',
      portrait: '/assets/items/escamas_de_cryovain.png',
      icon: '/assets/items/escamas_de_cryovain.png',
      costGold: 1350,
      ingredients: {
        ingotIcon: '/assets/items/escamas_de_cryovain.png',
        ingotHave: 8,
        ingotNeed: 3,
        hiltIcon: '/assets/items/lingote_plata_app.png',
        hiltHave: 10,
        hiltNeed: 3,
        kitIcon: '/assets/items/recurso_26_4x.png',
        kitHave: 5,
        kitNeed: 2,
      },
    },
    {
      id: 'balsamo_sagrado_exorcista',
      name: 'Bálsamo Sagrado del Exorcista',
      category: 'Aceites para Armas',
      level: 4,
      stars: 5,
      minAtk: 72,
      maxAtk: 92,
      element: 'Divino',
      elementOrb: '/assets/items/atributo_fe.png',
      portrait: '/assets/items/zafiro_app.png',
      icon: '/assets/items/zafiro_app.png',
      costGold: 2200,
      ingredients: {
        ingotIcon: '/assets/items/zafiro_app.png',
        ingotHave: 5,
        ingotNeed: 3,
        hiltIcon: '/assets/items/lingote_oro_app.png',
        hiltHave: 8,
        hiltNeed: 4,
        kitIcon: '/assets/items/recurso_26_4x.png',
        kitHave: 5,
        kitNeed: 3,
      },
    },
  ]);

  // Current category items filter
  const currentCategoryItems = craftItems.filter((item) => {
    if (item.category !== tier1Category) return false;
    if (tier1Category === 'Armas' && tier2Subcategory) {
      if (item.subCategory !== tier2Subcategory) return false;
    }
    if (elementFilter) {
      if (item.element !== elementFilter) return false;
    }
    return true;
  });

  const handleFabricate = (item: CraftItemData) => {
    const ingotHave = getMaterialCount(item.ingredients.ingotIcon);
    const hiltHave = getMaterialCount(item.ingredients.hiltIcon);
    const kitHave = getMaterialCount(item.ingredients.kitIcon);

    if (gold < item.costGold) {
      sound.playSFX('hurt');
      setToastMessage('¡Oro insuficiente para forjar!');
      setTimeout(() => setToastMessage(null), 2500);
      return;
    }

    if (
      ingotHave < item.ingredients.ingotNeed ||
      hiltHave < item.ingredients.hiltNeed ||
      kitHave < item.ingredients.kitNeed
    ) {
      sound.playSFX('hurt');
      setToastMessage('¡Materiales insuficientes en el inventario!');
      setTimeout(() => setToastMessage(null), 2500);
      return;
    }

    const deducted = deductMaterials([
      { icon: item.ingredients.ingotIcon, count: item.ingredients.ingotNeed },
      { icon: item.ingredients.hiltIcon, count: item.ingredients.hiltNeed },
      { icon: item.ingredients.kitIcon, count: item.ingredients.kitNeed },
    ]);

    if (!deducted) {
      sound.playSFX('hurt');
      setToastMessage('¡Faltan materiales en el inventario!');
      setTimeout(() => setToastMessage(null), 2500);
      return;
    }

    sound.playSFX('victory');
    addGold(-item.costGold);

    // Upgrade level in local forge list
    setCraftItems((prev) =>
      prev.map((it) =>
        it.id === item.id
          ? {
              ...it,
              level: it.level + 1,
              minAtk: it.minAtk ? it.minAtk + 5 : undefined,
              maxAtk: it.maxAtk ? it.maxAtk + 8 : undefined,
              defense: it.defense ? it.defense + 6 : undefined,
              hp: it.hp ? it.hp + 50 : undefined,
              stars: Math.min(5, it.stars + 1),
            }
          : it
      )
    );

    // Save piece to persistent Shelf Inventory
    const itemRarity: 'R' | 'SR' | 'SSR' = item.stars >= 4 ? 'SSR' : item.stars >= 3 ? 'SR' : 'R';
    addShelfItem({
      id: `crafted_${item.id}_${Date.now()}`,
      name: item.name,
      category: 'equipment',
      count: 1,
      icon: item.icon,
      rarity: itemRarity,
      description: `Pieza forjada con maestría en el taller de herrería de Icespear.`,
      priceGold: Math.round(item.costGold * 0.65),
    });

    // Update Forge Milestone statistics
    setMilestoneStats((prev) => {
      const nextTotal = prev.totalCrafted + 1;
      const nextR = itemRarity === 'R' ? prev.rCount + 1 : prev.rCount;
      const nextSR = itemRarity === 'SR' ? prev.srCount + 1 : prev.srCount;
      const nextSSR = itemRarity === 'SSR' ? prev.ssrCount + 1 : prev.ssrCount;
      const nextCategories = prev.craftedCategories.includes(item.category)
        ? prev.craftedCategories
        : [...prev.craftedCategories, item.category];
      const nextElements =
        item.element && !prev.craftedElements.includes(item.element)
          ? [...prev.craftedElements, item.element]
          : prev.craftedElements;

      const updated: ForgeMilestoneStats = {
        totalCrafted: nextTotal,
        rCount: nextR,
        srCount: nextSR,
        ssrCount: nextSSR,
        craftedCategories: nextCategories,
        craftedElements: nextElements,
      };
      safeStorage.setItem('cdd_forge_milestones_stats_v1', JSON.stringify(updated));
      return updated;
    });

    setToastMessage(`¡${item.name} forjada con éxito! Guardada en el inventario.`);
    setTimeout(() => setToastMessage(null), 2800);
    setCraftModalItem(null);
  };

  // =========================================================================
  // RENDER: UNIFIED FORGE VIEW WITH AUTHENTIC BACKGROUND FRAME
  // The upper forge room (flames, swords rack, candle) and horizontal divider
  // beam remain visible, while all menus scroll masked strictly inside the lower chamber.
  // =========================================================================
  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden select-none bg-transparent">
      {/* 
        Full Blacksmith or Apothecary Background Art
        Zoomed slightly (scale-[1.05]) for Potion Shop to completely cover the canvas without any white edges
      */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none select-none z-0">
        <img
          src={backgroundSrc}
          alt={isPotionShop ? 'Botica de Pociones' : 'Taller de Herrería'}
          className={`w-full h-full ${
            isPotionShop
              ? 'object-cover scale-[1.12] -translate-y-[5%] transform origin-center'
              : 'object-fill'
          }`}
        />
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-50 bg-[#3b170c]/95 border-2 border-amber-400 text-amber-200 px-4 py-1.5 rounded-xl text-xs font-bold text-center shadow-2xl animate-fade-in pointer-events-none max-w-[90%]">
          {toastMessage}
        </div>
      )}

      {/* 
        FORGE MILESTONES BUTTON (Hitos de la Forja):
        Positioned at the upper right against the dark brick wall in front of the weapons rack,
        matching exactly image_dcf27380.png and using sprite boton_logros_forja.png!
      */}
      <button
        type="button"
        onClick={() => {
          sound.playSFX('click');
          setShowMilestonesModal(true);
        }}
        className="absolute top-[18px] right-[22px] z-30 w-11 h-11 sm:w-12 sm:h-12 cursor-pointer transition-all duration-150 transform hover:scale-110 active:scale-95 drop-shadow-[0_4px_10px_rgba(0,0,0,0.9)] hover:drop-shadow-[0_0_12px_rgba(245,158,11,0.65)] focus:outline-none"
        title={isPotionShop ? 'Hitos de la Botica (Gana Cristales)' : 'Hitos de la Forja (Gana Cristales)'}
        aria-label={isPotionShop ? 'Hitos de la Botica' : 'Hitos de la Forja'}
      >
        <img
          src="/assets/forge/boton_logros_forja.png"
          alt="Hitos"
          className="w-full h-full object-contain pointer-events-none select-none drop-shadow"
        />
        {unclaimedMilestonesCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full bg-red-600 border border-amber-300 text-[10px] font-bold text-white shadow-lg animate-bounce">
            {unclaimedMilestonesCount}
          </span>
        )}
      </button>

      {/* 
        TOP FORGE NAVIGATION BAR (Volver, Atributos y Nombre de Sección):
        Positioned at the upper horizontal wood beam strip (above the furnace scene), exactly matching reference image_3a691b49.png!
      */}
      {/* 
        TOP FORGE ATTRIBUTE FILTER ORBS:
        Centered above the furnace scene when inside Armas, Pociones, Encantamientos or Aceites.
      */}
      {(tier1Category === 'Armas' || tier1Category === 'Pociones' || tier1Category === 'Encantamientos' || tier1Category === 'Aceites para Armas') && (
        <div className="absolute top-[12px] left-0 right-0 z-30 flex items-center justify-center pointer-events-auto">
          {/* Center: Attribute / Element Filter Orbs */}
          <div className="flex items-center gap-2 px-3 py-1 bg-[#120502]/95 border-2 border-[#854d0e]/90 rounded-full shadow-[inset_0_1px_4px_rgba(0,0,0,0.9),0_2px_6px_rgba(0,0,0,0.8)]">
            <button
              onClick={() => {
                sound.playSFX('click');
                setElementFilter(elementFilter === 'Divino' ? null : 'Divino');
              }}
              className={`w-6 h-6 rounded-full cursor-pointer transition-all ${
                elementFilter === 'Divino'
                  ? 'scale-115 ring-2 ring-amber-300 drop-shadow-[0_0_8px_#f59e0b]'
                  : 'opacity-80 hover:opacity-100 hover:scale-105'
              }`}
              title="Elemento Divino (Sol)"
            >
              <img src="/assets/items/atributo_fe.png" alt="Divino" className="w-full h-full object-contain filter drop-shadow" />
            </button>

            <button
              onClick={() => {
                sound.playSFX('click');
                setElementFilter(elementFilter === 'Natural' ? null : 'Natural');
              }}
              className={`w-6 h-6 rounded-full cursor-pointer transition-all ${
                elementFilter === 'Natural'
                  ? 'scale-115 ring-2 ring-emerald-300 drop-shadow-[0_0_8px_#10b981]'
                  : 'opacity-80 hover:opacity-100 hover:scale-105'
              }`}
              title="Elemento Natural (Hoja)"
            >
              <img src="/assets/items/atributo_natural.png" alt="Natural" className="w-full h-full object-contain filter drop-shadow" />
            </button>

            <button
              onClick={() => {
                sound.playSFX('click');
                setElementFilter(elementFilter === 'Arcano' ? null : 'Arcano');
              }}
              className={`w-6 h-6 rounded-full cursor-pointer transition-all ${
                elementFilter === 'Arcano'
                  ? 'scale-115 ring-2 ring-sky-300 drop-shadow-[0_0_8px_#38bdf8]'
                  : 'opacity-80 hover:opacity-100 hover:scale-105'
              }`}
              title="Elemento Arcano (Estrella)"
            >
              <img src="/assets/items/atributo_arcano.png" alt="Arcano" className="w-full h-full object-contain filter drop-shadow" />
            </button>

            <button
              onClick={() => {
                sound.playSFX('click');
                setElementFilter(elementFilter === 'Profano' ? null : 'Profano');
              }}
              className={`w-6 h-6 rounded-full cursor-pointer transition-all ${
                elementFilter === 'Profano'
                  ? 'scale-115 ring-2 ring-purple-300 drop-shadow-[0_0_8px_#a855f7]'
                  : 'opacity-80 hover:opacity-100 hover:scale-105'
              }`}
              title="Elemento Profano (Calavera)"
            >
              <img src="/assets/items/atributo_oscuro.png" alt="Profano" className="w-full h-full object-contain filter drop-shadow" />
            </button>
          </div>
        </div>
      )}

      {/* 
        LOWER CHAMBER MASK CONTAINER:
        Strictly positioned below the horizontal wooden divider beam (top: 168px)
        and above the bottom wooden frame border (bottom: 15px), within the left and right wooden borders (16px each).
        All buttons from all forge sections are masked and scroll inside this container!
      */}
      <div
        className={`absolute ${
          isPotionShop ? 'top-[132px]' : 'top-[168px]'
        } bottom-[15px] left-[16px] right-[16px] z-10 flex flex-col overflow-hidden`}
      >
        {/* VIEW 1: MAIN CATEGORIES (tier1Category === null) */}
        {!tier1Category && (
          <ForgeMaskedSlider
            contentClassName={`py-3 flex flex-col items-center min-h-full ${
              isPotionShop
                ? 'space-y-4 sm:space-y-5 justify-start pt-3'
                : 'space-y-1.5 justify-between'
            }`}
          >
            {mainCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  sound.playSFX('click');
                  setTier1Category(cat.id);
                  setTier2Subcategory(null);
                }}
                className={`group relative w-full max-w-[355px] flex items-center justify-center cursor-pointer transition-all duration-150 transform hover:scale-[1.02] active:scale-[0.98] drop-shadow-[0_4px_10px_rgba(0,0,0,0.85)] hover:drop-shadow-[0_6px_14px_rgba(217,119,6,0.65)] focus:outline-none ${
                  isPotionShop ? 'aspect-[2084/630]' : 'aspect-[978/291]'
                }`}
                title={cat.name}
              >
                <img
                  src={cat.imageSrc}
                  alt={cat.name}
                  className="w-full h-full object-contain pointer-events-none select-none"
                />
              </button>
            ))}
          </ForgeMaskedSlider>
        )}

        {/* VIEW 2: WEAPON SUBCATEGORIES (tier1Category === 'Armas' && !tier2Subcategory) */}
        {tier1Category === 'Armas' && !tier2Subcategory && (
          <div className="relative w-full h-full flex flex-col min-h-0 overflow-hidden">
            <ForgeMaskedSlider contentClassName="space-y-2 py-1 flex flex-col items-center">
              {weaponSubcategories.map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => {
                    sound.playSFX('click');
                    setTier2Subcategory(sub.id);
                  }}
                  className="group relative w-full aspect-[870/261] max-w-[355px] flex items-center justify-center cursor-pointer transition-all duration-150 transform hover:scale-[1.015] active:scale-[0.98] drop-shadow-[0_4px_8px_rgba(0,0,0,0.85)] hover:drop-shadow-[0_6px_14px_rgba(217,119,6,0.55)] focus:outline-none"
                  title={sub.name}
                >
                  <img
                    src={sub.imageSrc}
                    alt={sub.name}
                    className="w-full h-full object-contain pointer-events-none select-none"
                  />
                </button>
              ))}
            </ForgeMaskedSlider>
          </div>
        )}

        {/* VIEW 3: CRAFTABLE ITEMS LIST (Weapons, Armors, Rings, Helmets, Amulets) */}
        {tier1Category && (tier1Category !== 'Armas' || tier2Subcategory) && (
          <div className="relative w-full h-full flex flex-col min-h-0 overflow-hidden">
            {/* Scrollable list of items */}
            <div className="relative flex-1 min-h-0 w-full overflow-hidden">
              <ForgeMaskedSlider contentClassName="space-y-1.5 py-1 flex flex-col items-center">
                {currentCategoryItems.map((item) => {
                  const isSwordOrWeapon =
                    item.subCategory === 'Espadas' ||
                    item.category === 'Armas' ||
                    item.category === 'Pociones' ||
                    item.category === 'Encantamientos' ||
                    item.category === 'Aceites para Armas';

                  if (isSwordOrWeapon) {
                    const cardBg =
                      item.subCategory === 'Lanzas' ||
                      item.name.toLowerCase().includes('lanza') ||
                      item.name.toLowerCase().includes('tridente')
                        ? '/assets/forge/btn_card_lanza.png'
                        : item.subCategory === 'Hachas' ||
                          item.subCategory === 'Martillos' ||
                          item.name.toLowerCase().includes('hacha') ||
                          item.name.toLowerCase().includes('martillo')
                        ? '/assets/forge/btn_card_berserker.png'
                        : '/assets/items/boton_espada_clean.png';

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          sound.playSFX('click');
                          setCraftModalItem(item);
                        }}
                        className="group relative w-full aspect-[1843/649] max-w-[355px] flex items-center cursor-pointer transition-all duration-150 transform hover:scale-[1.012] active:scale-[0.98] drop-shadow-[0_4px_8px_rgba(0,0,0,0.85)] hover:drop-shadow-[0_6px_14px_rgba(217,119,6,0.45)] focus:outline-none"
                        title={`${item.name} (Click para forjar)`}
                      >
                        {/* 1. Authentic Card Background: Lance for Lanzas, Berserker for Hachas/Martillos, Sword for Espadas */}
                        <img
                          src={cardBg}
                          alt=""
                          className="absolute inset-0 w-full h-full object-fill pointer-events-none select-none"
                        />

                        {/* 2. Left Portrait Square - MOVED TO THE RIGHT INSIDE BUTTON & 10% LARGER (h-[53%]) */}
                        <div className="absolute left-[7.5%] top-1/2 -translate-y-1/2 h-[53%] aspect-square rounded-[4px] overflow-hidden flex items-center justify-center shadow-md select-none">
                          {/* Warm Gold Background Asset (image_a17d132a.png in original color) */}
                          <img
                            src="/assets/forge/portrait_bg.png"
                            alt=""
                            className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none z-0"
                          />

                          {/* Wood Carved Frame (image_ca711c21.png) - UNDER the sword, level, attribute, and stars */}
                          <img
                            src="/assets/forge/portrait_frame.png"
                            alt=""
                            className="absolute inset-0 w-full h-full object-fill pointer-events-none select-none z-10"
                          />

                          {/* Loose Transparent Weapon Art (fills the box naturally, on top of frame) */}
                          <div className="absolute inset-[3%] flex items-center justify-center pointer-events-none select-none z-20">
                            <img
                              src={item.icon}
                              alt={item.name}
                              className="w-full h-full object-contain pointer-events-none select-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]"
                            />
                          </div>

                          {/* Level Badge - Top Left (on top of frame) */}
                          <div className="absolute top-0.5 left-1 z-30 text-[9px] sm:text-[10px] font-serif font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,1)] leading-none select-none pointer-events-none">
                            Lv.{item.level}
                          </div>

                          {/* Element / Attribute Orb - Top Right (on top of frame) */}
                          {item.elementOrb && (
                            <img
                              src={item.elementOrb}
                              alt=""
                              className="absolute top-0.5 right-0.5 sm:right-1 z-30 w-3 h-3 sm:w-3.5 sm:h-3.5 object-contain filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] select-none pointer-events-none"
                            />
                          )}

                          {/* 5-Star Row - Bottom (on top of frame) */}
                          <div className="absolute bottom-0.5 inset-x-0 z-30 flex items-center justify-center gap-[1px] select-none pointer-events-none">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <img
                                key={i}
                                src="/assets/forge/star_gold.png"
                                alt=""
                                className={`w-2 h-2 sm:w-2.5 sm:h-2.5 object-contain ${
                                  i < item.stars
                                    ? 'drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]'
                                    : 'brightness-[0.28] sepia-[0.8] hue-rotate-[-40deg] opacity-80'
                                }`}
                              />
                            ))}
                          </div>
                        </div>

                        {/* 3. Center Content: Weapon Name flanked by sword icons & Damage Box (NEVER CUT OFF) */}
                        <div className="absolute left-[28%] right-[27%] top-0 bottom-0 flex flex-col items-center justify-center gap-1.5 pointer-events-none select-none">
                          {/* Title Flanked by Daggers - Guaranteed no truncation */}
                          <div className="flex items-center justify-center gap-1 sm:gap-1.5 w-full max-w-full">
                            <img
                              src="/assets/items/weapons.png"
                              alt=""
                              className="w-2.5 h-3 sm:w-3 sm:h-3.5 object-contain brightness-110 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] select-none shrink-0"
                            />
                            <span
                              className={`text-white font-serif font-bold tracking-tight whitespace-nowrap drop-shadow-[0_1px_3px_rgba(0,0,0,1)] text-center ${
                                item.name.length > 22
                                  ? 'text-[9px] xs:text-[9.5px] sm:text-[10.5px]'
                                  : 'text-[10.5px] xs:text-[11.5px] sm:text-[12.5px]'
                              }`}
                            >
                              {item.name}
                            </span>
                            <img
                              src="/assets/items/weapons.png"
                              alt=""
                              className="w-2.5 h-3 sm:w-3 sm:h-3.5 object-contain brightness-110 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] select-none shrink-0"
                            />
                          </div>

                          {/* Damage Box */}
                          {item.minAtk !== undefined && (
                            <div className="relative inline-flex items-center justify-center gap-1.5 px-3 py-0.5 bg-[#051a24]/95 border border-[#144455] rounded shadow-[inset_0_1px_3px_rgba(0,0,0,0.8)]">
                              <img
                                src="/assets/items/weapons.png"
                                alt=""
                                className="w-2.5 h-3 sm:w-3 sm:h-3.5 object-contain brightness-110 select-none shrink-0"
                              />
                              <span className="text-white text-[10px] sm:text-[11px] font-mono font-bold tracking-wider">
                                {item.minAtk}-{item.maxAtk}
                              </span>
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  }

                  // Non-weapon categories fallback
                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        sound.playSFX('click');
                        setCraftModalItem(item);
                      }}
                      className="group relative w-full max-w-[355px] h-20 rounded-xl overflow-hidden border-2 border-[#b45309] p-2 flex items-center justify-between shadow-xl cursor-pointer active:scale-98 transition-all bg-[#071922]/95 hover:border-amber-400 hover:bg-[#0b2432]/95"
                    >
                      {/* Left Item Square Container - 40% smaller */}
                      <div className="relative w-11 h-11 rounded-md overflow-hidden flex items-center justify-center shrink-0 shadow-md">
                        <img
                          src="/assets/forge/portrait_bg.png"
                          alt=""
                          className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none z-0"
                        />

                        {/* Frame sits underneath */}
                        <img
                          src="/assets/forge/portrait_frame.png"
                          alt=""
                          className="absolute inset-0 w-full h-full object-fill pointer-events-none select-none z-10"
                        />

                        {/* Weapon / Item icon on top of frame */}
                        <div className="absolute inset-0 flex items-center justify-center z-20">
                          <img
                            src={item.icon}
                            alt={item.name}
                            className="w-[85%] h-[85%] object-contain group-hover:scale-105 transition-transform drop-shadow"
                          />
                        </div>

                        <span className="absolute top-0.5 left-1 text-[9px] font-bold text-white z-30 drop-shadow-[0_1px_2px_rgba(0,0,0,1)]">
                          Lv.{item.level}
                        </span>

                        {item.elementOrb && (
                          <img
                            src={item.elementOrb}
                            alt=""
                            className="absolute top-0.5 right-1 w-3 h-3 object-contain filter drop-shadow z-30"
                          />
                        )}

                        <div className="absolute bottom-0.5 inset-x-0 flex justify-center gap-[1px] z-30">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <img
                              key={i}
                              src="/assets/forge/star_gold.png"
                              alt=""
                              className={`w-1.5 h-1.5 object-contain ${
                                i < item.stars
                                  ? 'drop-shadow'
                                  : 'brightness-[0.3] sepia opacity-70'
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Center Info */}
                      <div className="flex-1 px-2.5 space-y-1">
                        <div className="font-serif font-black text-amber-100 text-xs sm:text-sm tracking-wide truncate max-w-[160px]">
                          {item.name}
                        </div>

                        {/* Stat Pill */}
                        <div className="flex items-center gap-1.5">
                          {item.defense !== undefined && (
                            <div className="relative inline-flex items-center justify-center px-1.5 py-0.5 min-w-[45px] h-5 bg-blue-950/80 border border-blue-600/60 rounded">
                              <span className="text-[10px] font-mono font-bold text-blue-200 flex items-center gap-1">
                                <Shield className="w-2.5 h-2.5 text-blue-300" /> {item.defense}
                              </span>
                            </div>
                          )}
                          {item.hp !== undefined && (
                            <div className="relative inline-flex items-center justify-center px-1.5 py-0.5 min-w-[45px] h-5 bg-emerald-950/80 border border-emerald-600/60 rounded">
                              <span className="text-[10px] font-mono font-bold text-emerald-200 flex items-center gap-1">
                                <Heart className="w-2.5 h-2.5 text-emerald-300 fill-emerald-400" /> +{item.hp}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right Cost Button Badge */}
                      <div className="flex flex-col items-end justify-center pr-1 shrink-0">
                        <span className="text-[10px] text-amber-300 font-bold group-hover:text-amber-200">Forjar</span>
                        <span className="text-xs font-mono font-black text-amber-400 flex items-center gap-0.5">
                          {item.costGold} <Coins className="w-2.5 h-2.5 text-amber-400" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </ForgeMaskedSlider>
            </div>
          </div>
        )}
      </div>


      {/* ========================================================================= */}
      {/* 4. FABRICAR MODAL                                                         */}
      {/* ========================================================================= */}
      {craftModalItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3"
          onClick={() => setCraftModalItem(null)}
        >
          {/* Main Arched Blacksmith Popup Container - 20% menos alto (396px) */}
          <div
            className="relative w-[298px] sm:w-[314px] h-[396px] sm:h-[412px] max-h-[92vh] flex flex-col items-center select-none animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Background Frame: POPUP .png */}
            <img
              src="/assets/forge/popup_forge.png"
              alt=""
              className="absolute inset-0 w-full h-full object-fill pointer-events-none select-none z-0 filter drop-shadow-[0_14px_35px_rgba(0,0,0,0.95)]"
            />

            {/* Close Button: x.png positioned at top right */}
            <button
              onClick={() => {
                sound.playSFX('click');
                setCraftModalItem(null);
              }}
              className="absolute top-[4%] right-[5%] w-8 h-8 sm:w-9 sm:h-9 cursor-pointer hover:scale-110 active:scale-95 transition-transform z-30"
              title="Cerrar Forja"
            >
              <img
                src="/assets/forge/btn_close_x.png"
                alt="Cerrar"
                className="w-full h-full object-contain filter drop-shadow-lg"
              />
            </button>

            {/* Item Showcase: portrait box bajada un 7% (de top 20% a top 27%) */}
            <div className="absolute top-[27%] left-1/2 -translate-x-1/2 w-[76px] h-[76px] sm:w-[80px] sm:h-[80px] rounded-lg overflow-hidden flex items-center justify-center select-none z-20">
              {/* Portrait background */}
              <img
                src="/assets/forge/portrait_bg.png"
                alt=""
                className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none z-0"
              />

              {/* Frame underneath */}
              <img
                src="/assets/forge/portrait_frame.png"
                alt=""
                className="absolute inset-0 w-full h-full object-fill pointer-events-none select-none z-10"
              />

              {/* Weapon Art */}
              <div className="absolute inset-[6%] flex items-center justify-center pointer-events-none select-none z-20">
                <img
                  src={craftModalItem.icon}
                  alt={craftModalItem.name}
                  className="w-full h-full object-contain pointer-events-none select-none drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]"
                />
              </div>

              {/* Lv label */}
              <span className="absolute top-1 left-1.5 text-[10px] font-serif font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,1)] z-30">
                Lv.{craftModalItem.level}
              </span>

              {/* Element orb if present */}
              {craftModalItem.elementOrb && (
                <img
                  src={craftModalItem.elementOrb}
                  alt=""
                  className="absolute top-1 right-1 w-3.5 h-3.5 object-contain filter drop-shadow z-30"
                />
              )}

              {/* 5 stars at bottom (gold stars + bronze stars) */}
              <div className="absolute bottom-1 inset-x-0 flex items-center justify-center gap-0.5 z-30">
                {Array.from({ length: 5 }).map((_, i) => (
                  <img
                    key={i}
                    src="/assets/forge/star_gold.png"
                    alt=""
                    className={`w-2.5 h-2.5 object-contain ${
                      i < craftModalItem.stars
                        ? 'drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]'
                        : 'brightness-[0.28] sepia-[0.8] hue-rotate-[-40deg] opacity-80'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* 3 Material Requirements Row with marco items.png - Dynamically read from inventory */}
            {(() => {
              const ingotHave = getMaterialCount(craftModalItem.ingredients.ingotIcon);
              const hiltHave = getMaterialCount(craftModalItem.ingredients.hiltIcon);
              const kitHave = getMaterialCount(craftModalItem.ingredients.kitIcon);

              return (
                <div className="absolute top-[51%] left-1/2 -translate-x-1/2 flex items-center justify-center gap-1.5 sm:gap-2 z-20">
                  {/* Slot 1: Ingot / Primary Material */}
                  <div className="relative w-[70px] sm:w-[74px] h-[76px] sm:h-[80px] flex items-center justify-center select-none">
                    <img
                      src="/assets/forge/marco_items.png"
                      alt=""
                      className="absolute inset-0 w-full h-full object-fill pointer-events-none select-none z-0"
                    />
                    {/* Centered Item Icon */}
                    <div className="absolute top-[8%] inset-x-0 h-[60%] flex items-center justify-center z-10 pointer-events-none">
                      <img
                        src={craftModalItem.ingredients.ingotIcon}
                        alt=""
                        className="w-7 h-7 sm:w-8 sm:h-8 object-contain drop-shadow"
                      />
                    </div>
                    {/* Quantity in bottom carved plate */}
                    <div className="absolute bottom-[8%] inset-x-0 h-[22%] flex items-center justify-center z-10 pointer-events-none">
                      <span
                        className={`text-[10px] sm:text-[11px] font-mono font-bold tracking-tight drop-shadow-[0_1px_2px_rgba(0,0,0,1)] ${
                          ingotHave >= craftModalItem.ingredients.ingotNeed
                            ? 'text-white'
                            : 'text-red-500'
                        }`}
                      >
                        {ingotHave}/{craftModalItem.ingredients.ingotNeed}
                      </span>
                    </div>
                  </div>

                  {/* Slot 2: Sword Hilt / Secondary Material */}
                  <div className="relative w-[70px] sm:w-[74px] h-[76px] sm:h-[80px] flex items-center justify-center select-none">
                    <img
                      src="/assets/forge/marco_items.png"
                      alt=""
                      className="absolute inset-0 w-full h-full object-fill pointer-events-none select-none z-0"
                    />
                    {/* Centered Item Icon */}
                    <div className="absolute top-[8%] inset-x-0 h-[60%] flex items-center justify-center z-10 pointer-events-none">
                      <img
                        src={craftModalItem.ingredients.hiltIcon || '/assets/aistudio/mango_de_espada_ITEM_80f48554.png'}
                        alt=""
                        className="w-7 h-7 sm:w-8 sm:h-8 object-contain drop-shadow"
                      />
                    </div>
                    {/* Quantity in bottom carved plate */}
                    <div className="absolute bottom-[8%] inset-x-0 h-[22%] flex items-center justify-center z-10 pointer-events-none">
                      <span
                        className={`text-[10px] sm:text-[11px] font-mono font-bold tracking-tight drop-shadow-[0_1px_2px_rgba(0,0,0,1)] ${
                          hiltHave >= craftModalItem.ingredients.hiltNeed
                            ? 'text-white'
                            : 'text-red-500'
                        }`}
                      >
                        {hiltHave}/{craftModalItem.ingredients.hiltNeed}
                      </span>
                    </div>
                  </div>

                  {/* Slot 3: Blacksmith Kit / Tool */}
                  <div className="relative w-[70px] sm:w-[74px] h-[76px] sm:h-[80px] flex items-center justify-center select-none">
                    <img
                      src="/assets/forge/marco_items.png"
                      alt=""
                      className="absolute inset-0 w-full h-full object-fill pointer-events-none select-none z-0"
                    />
                    {/* Centered Item Icon */}
                    <div className="absolute top-[8%] inset-x-0 h-[60%] flex items-center justify-center z-10 pointer-events-none">
                      <img
                        src={craftModalItem.ingredients.kitIcon}
                        alt=""
                        className="w-7 h-7 sm:w-8 sm:h-8 object-contain drop-shadow"
                      />
                    </div>
                    {/* Quantity in bottom carved plate */}
                    <div className="absolute bottom-[8%] inset-x-0 h-[22%] flex items-center justify-center z-10 pointer-events-none">
                      <span
                        className={`text-[10px] sm:text-[11px] font-mono font-bold tracking-tight drop-shadow-[0_1px_2px_rgba(0,0,0,1)] ${
                          kitHave >= craftModalItem.ingredients.kitNeed
                            ? 'text-white'
                            : 'text-red-500'
                        }`}
                      >
                        {kitHave}/{craftModalItem.ingredients.kitNeed}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* FABRICAR Button: x2 más ancho (w-[276px] sm:w-[286px]) using clean trimmed asset */}
            <div className="absolute bottom-[6.5%] left-1/2 -translate-x-1/2 w-[276px] sm:w-[286px] h-[48px] sm:h-[52px] z-20">
              <button
                onClick={() => handleFabricate(craftModalItem)}
                className="relative w-full h-full flex items-center justify-center cursor-pointer active:scale-95 transition-transform group"
              >
                <img
                  src="/assets/forge/btn_fabricar_clean.png"
                  alt="FABRICAR"
                  className="absolute inset-0 w-full h-full object-fill rounded-md filter drop-shadow-md"
                />
                <span className="relative z-10 text-white font-sans font-black text-base sm:text-lg tracking-widest uppercase drop-shadow-[0_2px_3px_rgba(0,0,0,0.95)]">
                  FABRICAR
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. FORGE MILESTONES MODAL */}
      <ForgeMilestonesModal
        isOpen={showMilestonesModal}
        onClose={() => setShowMilestonesModal(false)}
        stats={milestoneStats}
        claimedIds={claimedMilestones}
        onClaim={handleClaimMilestone}
        onClaimAll={handleClaimAllMilestones}
      />
    </div>
  );
};
