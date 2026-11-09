import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useGame } from '../context/GameContext';
import { sound } from '../services/soundService';
import { safeStorage } from '../utils/storage';
import { X, Sparkles, Clock, RefreshCw, PackageCheck } from 'lucide-react';

type ShopCategory = 'oro' | 'mejora' | 'fabricacion' | 'comida';

interface ShopItem {
  id: string;
  name: string;
  category: 'mejora' | 'fabricacion' | 'comida';
  cost: number;
  icon: string;
  description: string;
  givesCrystals?: number;
  isDaily?: boolean;
}

interface PromoBundle {
  id: string;
  title: string;
  subtitle: string;
  bannerImage: string;
  cost: number;
  rewardCrystals: number;
  items: { name: string; count: number; icon: string }[];
  description: string;
}

const STORAGE_RESET_KEY = 'cdd_shop_reset_target_v2';
const STORAGE_SEED_KEY = 'cdd_shop_rotation_seed_v2';

// Core staples always available in the store
const FIXED_CORE_ITEMS: ShopItem[] = [
  // Gems / Mejora
  {
    id: 'gem_rubi',
    name: 'Rubí',
    category: 'mejora',
    cost: 1000,
    icon: '/assets/items/rubi_app.png',
    description: 'Gema imbuida de calor volcánico para despertar habilidades de fuego.',
  },
  {
    id: 'gem_diamante',
    name: 'Diamante',
    category: 'mejora',
    cost: 1000,
    icon: '/assets/items/diamante_app.png',
    description: 'Gema indestructible para ascender estrellas de héroes legendarios.',
  },
  // Metals / Fabricación
  {
    id: 'ingot_hierro',
    name: 'Lingote de Hierro',
    category: 'fabricacion',
    cost: 200,
    icon: '/assets/items/lingote_app.png',
    description: 'Lingote de hierro templado indispensable para forjar espadas y armaduras.',
  },
  {
    id: 'mango_espada',
    name: 'Mango de Espada',
    category: 'fabricacion',
    cost: 150,
    icon: '/assets/aistudio/mango_de_espada_ITEM_80f48554.png',
    description: 'Mango artesanal con guarda de bronce y empuñadura de cuero para forjar espadas.',
  },
  {
    id: 'ingot_cobre',
    name: 'Cobre',
    category: 'fabricacion',
    cost: 350,
    icon: '/assets/items/lingote_cobre_app.png',
    description: 'Lingote maleable para forjar armas iniciales y accesorios.',
  },
  {
    id: 'ingot_plata',
    name: 'Plata',
    category: 'fabricacion',
    cost: 500,
    icon: '/assets/items/lingote_plata_app.png',
    description: 'Plata bendecida por los sacerdotes del Bastión de Icespear.',
  },
  {
    id: 'mango_lanza',
    name: 'Mango de Lanza',
    category: 'fabricacion',
    cost: 150,
    icon: '/assets/items/mango_lanza.png',
    description: 'Asta resistente reforzada para montar puntas de lanza y tridentes.',
  },
  {
    id: 'mango_hacha_martillo',
    name: 'Mango de Hacha y Martillo',
    category: 'fabricacion',
    cost: 150,
    icon: '/assets/items/mango_hacha_martillo.png',
    description: 'Mango reforzado de madera oscura y engarces de bronce anaranjado para hachas y martillos.',
  },
  {
    id: 'fragmento_quitina',
    name: 'Fragmento de Quitina',
    category: 'fabricacion',
    cost: 250,
    icon: '/assets/items/fragmento de quitina.png',
    description: 'Caparazón orgánico hiperresistente cosechado de colosos de hielo.',
  },
  {
    id: 'ingot_electrum',
    name: 'Electrum',
    category: 'fabricacion',
    cost: 650,
    icon: '/assets/items/lingote_electrum_app.png',
    description: 'Aleación noble de oro y plata de gran afinidad arcana.',
  },
  {
    id: 'ingot_oro',
    name: 'Oro Fundido',
    category: 'fabricacion',
    cost: 800,
    icon: '/assets/items/lingote_oro_app.png',
    description: 'Lingote macizo para forja de reliquias de la Casa Loux.',
  },
  // Kits / Fabricación
  {
    id: 'kit_herreria',
    name: 'Kit herrería',
    category: 'fabricacion',
    cost: 150,
    icon: '/assets/items/kit_de_herreria_app.png',
    description: 'Herramientas básicas para temple de aceros y espadas.',
  },
  {
    id: 'kit_joyeria',
    name: 'Kit Joyería',
    category: 'fabricacion',
    cost: 150,
    icon: '/assets/items/kit_de_joyeria_app.png',
    description: 'Alicates de precisión para engarzar anillos y amuletos.',
  },
  {
    id: 'lomo_libro',
    name: 'Lomo de Grimorio',
    category: 'fabricacion',
    cost: 200,
    icon: '/assets/items/lomo_libro.png',
    description: 'Lomo de cuero reforzado y escamas para encuadernar grimorios.',
  },
  {
    id: 'kit_inscripcion',
    name: 'Kit de Inscripción',
    category: 'fabricacion',
    cost: 250,
    icon: '/assets/items/kit_de_inscripcion_app.png',
    description: 'Tintas rúnicas, plumas y pergaminos para encantar grimorios.',
  },
  // Food / Comida
  {
    id: 'food_ramen',
    name: 'Ramen',
    category: 'comida',
    cost: 200,
    icon: '/assets/items/ramen.png',
    description: 'Caldo humeante con fideos y huevo que restaura energía vital.',
  },
  {
    id: 'food_pan_ajo',
    name: 'Panes de ajo',
    category: 'comida',
    cost: 150,
    icon: '/assets/items/panes_de_ajo.png',
    description: 'Tostadas crujientes con mantequilla y ajo aromatizado.',
  },
];

// Pool of rotating items that change every 24 hours
const ROTATING_POOLS = {
  mejora: [
    {
      id: 'rot_amatista',
      name: 'Amatista',
      category: 'mejora' as const,
      cost: 1000,
      icon: '/assets/items/amatista_app.png',
      description: 'Cristal prismático para resonar con el portal astral.',
      givesCrystals: 100,
    },
    {
      id: 'rot_esmeralda',
      name: 'Esmeralda',
      category: 'mejora' as const,
      cost: 1000,
      icon: '/assets/items/esmeralda_app.png',
      description: 'Joya forestal que canaliza la vitalidad de los manantiales.',
    },
    {
      id: 'rot_zafiro',
      name: 'Zafiro',
      category: 'mejora' as const,
      cost: 1000,
      icon: '/assets/items/zafiro_app.png',
      description: 'Gema de agua profunda para encantar báculos y grimorios.',
    },
    {
      id: 'rot_gema_recuerdo',
      name: 'Gema Recuerdo',
      category: 'mejora' as const,
      cost: 1500,
      icon: '/assets/items/gema_del_recuerdo.png',
      description: 'Reliquia milenaria que almacena memorias de héroes caídos.',
    },
    {
      id: 'rot_arcano_gema',
      name: 'Gema Arcana',
      category: 'mejora' as const,
      cost: 1250,
      icon: '/assets/items/arcano_gema_app.png',
      description: 'Condensado de pura energía mística para ascensos arcanos.',
    },
    {
      id: 'rot_divino_gema',
      name: 'Gema Divina',
      category: 'mejora' as const,
      cost: 1400,
      icon: '/assets/items/divino_gema_app.png',
      description: 'Resplandor bendito otorgado por el Tribunal Sagrado.',
    },
    {
      id: 'rot_ascuas_salvajes',
      name: 'Ascuas Salvajes',
      category: 'mejora' as const,
      cost: 850,
      icon: '/assets/items/ascuas_salvajes.png',
      description: 'Fuego indómito de bestias abisales para despertar talentos.',
    },
    {
      id: 'rot_botella_xp_3',
      name: 'Botella XP III',
      category: 'mejora' as const,
      cost: 600,
      icon: '/assets/items/botella_experiencia_lvl_3.png',
      description: 'Elixir de sabiduría pura para acelerar el ascenso heroico.',
    },
    {
      id: 'rot_polvo_onirico',
      name: 'Polvo Onírico',
      category: 'mejora' as const,
      cost: 500,
      icon: '/assets/items/polvo_onirico.png',
      description: 'Polvo de estrellas que refuerza el espíritu de batalla.',
    },
  ],
  fabricacion: [
    {
      id: 'rot_ingot_electrum',
      name: 'Electrum',
      category: 'fabricacion' as const,
      cost: 650,
      icon: '/assets/items/lingote_electrum_app.png',
      description: 'Aleación noble de oro y plata de gran afinidad arcana.',
    },
    {
      id: 'rot_ingot_oro',
      name: 'Oro Fundido',
      category: 'fabricacion' as const,
      cost: 800,
      icon: '/assets/items/lingote_oro_app.png',
      description: 'Lingote macizo para forja de reliquias de la Casa Loux.',
    },
    {
      id: 'rot_ingot_mithrill',
      name: 'Mithrill',
      category: 'fabricacion' as const,
      cost: 1200,
      icon: '/assets/items/lingote_mithrill_app.png',
      description: 'Metal legendario, liviano como pluma y duro como dragón.',
    },
    {
      id: 'rot_hierro_estelar',
      name: 'Hierro Estelar',
      category: 'fabricacion' as const,
      cost: 950,
      icon: '/assets/items/lingote_hierro_estelar_app.png',
      description: 'Hierro caído del firmamento con propiedades antimagia.',
    },
    {
      id: 'rot_netherita',
      name: 'Netherita',
      category: 'fabricacion' as const,
      cost: 1800,
      icon: '/assets/items/lingote_netherita_app.png',
      description: 'Lingote forjado en el núcleo abisal, prácticamente indestructible.',
    },
    {
      id: 'rot_escamas_cryovain',
      name: 'Escamas Cryovain',
      category: 'fabricacion' as const,
      cost: 1100,
      icon: '/assets/items/escamas_de_cryovain.png',
      description: 'Escamas del dragón blanco de las cumbres heladas.',
    },
    {
      id: 'rot_sedas_exoticas',
      name: 'Sedas Exóticas',
      category: 'fabricacion' as const,
      cost: 750,
      icon: '/assets/items/sedas_exoticas_app.png',
      description: 'Fibras arcanas para túnicas mágicas de hechiceros.',
    },
    {
      id: 'rot_fragmento_quitina',
      name: 'Quitina Fuerte',
      category: 'fabricacion' as const,
      cost: 600,
      icon: '/assets/items/fragmento_de_quitina.png',
      description: 'Placas resistentes para corazas ligeras de cazador.',
    },
    {
      id: 'rot_kit_inscripcion',
      name: 'Kit Inscripción',
      category: 'fabricacion' as const,
      cost: 150,
      icon: '/assets/items/kit_de_inscripcion_app.png',
      description: 'Tintas rúnicas y pergaminos para encantar grimorios.',
    },
    {
      id: 'rot_kit_peleteria',
      name: 'Kit Peletería',
      category: 'fabricacion' as const,
      cost: 150,
      icon: '/assets/items/kit_de_peleteria_app.png',
      description: 'Agujas y tendones para curtir corazas de cuero y quitina.',
    },
  ],
  comida: [
    {
      id: 'rot_food_shushi',
      name: 'Sushi Dragón',
      category: 'comida' as const,
      cost: 300,
      icon: '/assets/items/shushi.png',
      description: 'Rollos frescos de salmón de las profundidades árticas.',
    },
    {
      id: 'rot_food_pizza',
      name: 'Pizza Horno',
      category: 'comida' as const,
      cost: 400,
      icon: '/assets/items/pizza.png',
      description: 'Horneada a leña con queso fundido y orégano silvestre.',
    },
    {
      id: 'rot_food_hamburguesa',
      name: 'Hamburguesa',
      category: 'comida' as const,
      cost: 350,
      icon: '/assets/items/hamburguesa.png',
      description: 'Deliciosa hamburguesa artesanal con carne de las colinas.',
    },
    {
      id: 'rot_food_paella',
      name: 'Paella Jaime',
      category: 'comida' as const,
      cost: 450,
      icon: '/assets/items/palla.png',
      description: 'Arroz al azafrán con marisco fresco cocinado por el chef.',
    },
    {
      id: 'rot_food_quesarito',
      name: 'Quesarito',
      category: 'comida' as const,
      cost: 320,
      icon: '/assets/items/quesarito.png',
      description: 'Burrito tostado rebosante de cuatro quesos fundidos.',
    },
    {
      id: 'rot_food_mcbites',
      name: 'McBites Fuego',
      category: 'comida' as const,
      cost: 280,
      icon: '/assets/items/mcbites.png',
      description: 'Bocados crujientes con especias picantes del desierto.',
    },
    {
      id: 'rot_food_arepas',
      name: 'Arepas Reina',
      category: 'comida' as const,
      cost: 220,
      icon: '/assets/items/arepas.png',
      description: 'Masa de maíz dorada rellena de pollo y aguacate.',
    },
    {
      id: 'rot_food_tortitas',
      name: 'Tortitas Dulces',
      category: 'comida' as const,
      cost: 260,
      icon: '/assets/items/tortitas.png',
      description: 'Torre de tortitas esponjosas bañadas en sirope dorado.',
    },
    {
      id: 'rot_food_kebab',
      name: 'Kebab Especiado',
      category: 'comida' as const,
      cost: 400,
      icon: '/assets/items/kebab.png',
      description: 'Pan de pita relleno de carne asada y salsa tártara.',
    },
    {
      id: 'rot_food_tortilla',
      name: 'Tortilla Casera',
      category: 'comida' as const,
      cost: 350,
      icon: '/assets/items/tortilla_patata.png',
      description: 'Tortilla de patatas tradicional recién cuajada y jugosa.',
    },
  ],
};

// Deterministic selection based on daily seed
function pickDailyItems<T>(pool: T[], seed: number, count: number): T[] {
  const result: T[] = [];
  const copy = [...pool];
  let s = Math.abs(seed);
  for (let i = 0; i < count && copy.length > 0; i++) {
    s = (s * 9301 + 49297) % 233280;
    const idx = Math.floor((s / 233280) * copy.length);
    result.push(copy.splice(idx, 1)[0]);
  }
  return result;
}

// Reusable Ornate Golden Shelf Divider matching the container lines in the reference
const OrnateShelfDivider: React.FC = () => (
  <div className="relative w-full flex items-center justify-center my-1 shrink-0 pointer-events-none select-none">
    <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-[#d97706]/70 to-transparent" />
    <div className="absolute w-2 h-2 rotate-45 border border-amber-400 bg-[#78350f] shadow-[0_0_4px_rgba(245,158,11,0.8)]" />
  </div>
);

export const ShopView: React.FC = () => {
  const { gold, addGold, addCrystals, addShelfItem } = useGame();
  const [selectedCategory, setSelectedCategory] = useState<ShopCategory>('oro');
  const [purchaseToast, setPurchaseToast] = useState<{ message: string; success: boolean } | null>(null);
  const [selectedPromo, setSelectedPromo] = useState<PromoBundle | null>(null);
  const [isRotating, setIsRotating] = useState(false);

  // 24-Hour Reset State
  const [nextResetTime, setNextResetTime] = useState<number>(() => {
    const saved = safeStorage.getItem(STORAGE_RESET_KEY);
    const now = Date.now();
    if (saved) {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed) && parsed > now) {
        return parsed;
      }
    }
    const next = now + 24 * 60 * 60 * 1000;
    safeStorage.setItem(STORAGE_RESET_KEY, next.toString());
    return next;
  });

  const [rotationSeed, setRotationSeed] = useState<number>(() => {
    const saved = safeStorage.getItem(STORAGE_SEED_KEY);
    if (saved) {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed)) return parsed;
    }
    const daySeed = Math.floor(Date.now() / (24 * 60 * 60 * 1000));
    safeStorage.setItem(STORAGE_SEED_KEY, daySeed.toString());
    return daySeed;
  });

  const [timeRemaining, setTimeRemaining] = useState<number>(() => {
    return Math.max(0, Math.floor((nextResetTime - Date.now()) / 1000));
  });

  // Cycle reset handler
  const executeReset = useCallback(
    (manual: boolean = false) => {
      const now = Date.now();
      const newNext = now + 24 * 60 * 60 * 1000;
      const newSeed = rotationSeed + 1;

      safeStorage.setItem(STORAGE_RESET_KEY, newNext.toString());
      safeStorage.setItem(STORAGE_SEED_KEY, newSeed.toString());

      setNextResetTime(newNext);
      setRotationSeed(newSeed);
      setTimeRemaining(24 * 60 * 60);

      if (manual) {
        sound.playSFX('upgrade');
        setIsRotating(true);
        setTimeout(() => setIsRotating(false), 600);
        setPurchaseToast({
          message: '¡Tienda reseteada! Nuevos materiales disponibles hoy.',
          success: true,
        });
        setTimeout(() => setPurchaseToast(null), 3000);
      }
    },
    [rotationSeed]
  );

  // Live 1-second countdown ticker
  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = Math.max(0, Math.floor((nextResetTime - Date.now()) / 1000));
      setTimeRemaining(remaining);

      if (remaining <= 0) {
        executeReset(false);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [nextResetTime, executeReset]);

  // Format seconds into HH:MM:SS
  const formatRemainingTime = (totalSec: number): string => {
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Compute daily rotating items for today's seed
  const dailyRotatingItems = useMemo(() => {
    const rotatingGems = pickDailyItems(ROTATING_POOLS.mejora, rotationSeed * 7 + 1, 2).map((i) => ({
      ...i,
      isDaily: true,
    }));
    const rotatingMetals = pickDailyItems(ROTATING_POOLS.fabricacion, rotationSeed * 13 + 3, 2).map((i) => ({
      ...i,
      isDaily: true,
    }));
    const rotatingFoods = pickDailyItems(ROTATING_POOLS.comida, rotationSeed * 19 + 5, 2).map((i) => ({
      ...i,
      isDaily: true,
    }));

    return {
      mejora: rotatingGems,
      fabricacion: rotatingMetals,
      comida: rotatingFoods,
    };
  }, [rotationSeed]);

  // The 3 Canonical Rows of 4 items each for the 'ORO' view (matching image_abcac5c6.png)
  const canonicalRows: ShopItem[][] = useMemo(() => {
    return [
      // Row 1: The 4 Classic Gems (Rubí, Amatista, Diamante, Esmeralda)
      [
        {
          id: 'gem_rubi',
          name: 'Rubí',
          category: 'mejora',
          cost: 1000,
          icon: '/assets/items/rubi_app.png',
          description: 'Gema imbuida de calor volcánico para despertar habilidades de fuego.',
        },
        {
          id: 'rot_amatista',
          name: 'Amatista',
          category: 'mejora',
          cost: 1000,
          icon: '/assets/items/amatista_app.png',
          description: 'Cristal prismático para resonar con el portal astral.',
        },
        {
          id: 'gem_diamante',
          name: 'Diamante',
          category: 'mejora',
          cost: 1000,
          icon: '/assets/items/diamante_app.png',
          description: 'Gema indestructible para ascender estrellas de héroes legendarios.',
        },
        {
          id: 'rot_esmeralda',
          name: 'Esmeralda',
          category: 'mejora',
          cost: 1000,
          icon: '/assets/items/esmeralda_app.png',
          description: 'Joya forestal que canaliza la vitalidad de los manantiales.',
        },
      ],
      // Row 2: The 4 Core Metal Ingots (Cobre, Plata, Electrum, Oro)
      [
        {
          id: 'ingot_cobre',
          name: 'Cobre',
          category: 'fabricacion',
          cost: 350,
          icon: '/assets/items/lingote_cobre_app.png',
          description: 'Lingote maleable para forjar armas iniciales y accesorios.',
        },
        {
          id: 'ingot_plata',
          name: 'Plata',
          category: 'fabricacion',
          cost: 500,
          icon: '/assets/items/lingote_plata_app.png',
          description: 'Plata bendecida por los sacerdotes del Bastión de Icespear.',
        },
        {
          id: 'rot_ingot_electrum',
          name: 'Electrum',
          category: 'fabricacion',
          cost: 650,
          icon: '/assets/items/lingote_electrum_app.png',
          description: 'Aleación noble de oro y plata de gran afinidad arcana.',
        },
        {
          id: 'rot_ingot_oro',
          name: 'Oro',
          category: 'fabricacion',
          cost: 800,
          icon: '/assets/items/lingote_oro_app.png',
          description: 'Lingote macizo para forja de reliquias de la Casa Loux.',
        },
      ],
      // Row 3: The 4 Artisan Kits (Kit herrería, Kit Inscripción, Kit Joyería, Kit peletería)
      [
        {
          id: 'kit_herreria',
          name: 'Kit herrería',
          category: 'fabricacion',
          cost: 150,
          icon: '/assets/items/kit_de_herreria_app.png',
          description: 'Herramientas básicas para temple de aceros y espadas.',
        },
        {
          id: 'rot_kit_inscripcion',
          name: 'Kit Inscripcio',
          category: 'fabricacion',
          cost: 150,
          icon: '/assets/items/kit_de_inscripcion_app.png',
          description: 'Tintas rúnicas y pergaminos para encantar grimorios.',
        },
        {
          id: 'kit_joyeria',
          name: 'Kit Joyería',
          category: 'fabricacion',
          cost: 150,
          icon: '/assets/items/kit_de_joyeria_app.png',
          description: 'Alicates de precisión para engarzar anillos y amuletos.',
        },
        {
          id: 'rot_kit_peleteria',
          name: 'Kit peletería',
          category: 'fabricacion',
          cost: 150,
          icon: '/assets/items/kit_de_peleteria_app.png',
          description: 'Agujas y tendones para curtir corazas de cuero y quitina.',
        },
      ],
    ];
  }, []);

  // Category specific items chunked into rows of 4
  const categoryRows: ShopItem[][] = useMemo(() => {
    if (selectedCategory === 'oro') return canonicalRows;

    const fixedForCategory = FIXED_CORE_ITEMS.filter((i) => i.category === selectedCategory);
    const dailyForCategory = dailyRotatingItems[selectedCategory];
    const poolRemaining = ROTATING_POOLS[selectedCategory]
      .filter((i) => !dailyForCategory.some((d) => d.id === i.id))
      .map((i) => ({ ...i, isDaily: false }));

    const all = [...dailyForCategory, ...fixedForCategory, ...poolRemaining];
    const rows: ShopItem[][] = [];
    for (let i = 0; i < all.length; i += 4) {
      rows.push(all.slice(i, i + 4));
    }
    return rows;
  }, [selectedCategory, canonicalRows, dailyRotatingItems]);

  // 3 Promotional Bundles matching the 3 top banners
  const promoBundles: PromoBundle[] = [
    {
      id: 'bundle_pablo',
      title: 'Ingredientes Extraplanares',
      subtitle: 'Mejora Mágica Avanzada',
      bannerImage: '/assets/items/baner_pablo.png',
      cost: 5000,
      rewardCrystals: 500,
      items: [
        { name: 'Rubí', count: 5, icon: '/assets/items/rubi_app.png' },
        { name: 'Amatista', count: 5, icon: '/assets/items/amatista_app.png' },
        { name: 'Diamante', count: 5, icon: '/assets/items/diamante_app.png' },
        { name: 'Esmeralda', count: 5, icon: '/assets/items/esmeralda_app.png' },
        { name: 'Botella XP III', count: 8, icon: '/assets/items/botella_experiencia_lvl_3.png' },
      ],
      description:
        'Lote exclusivo de alquimia celestial preparado por Pablo. Acelera el despertar y las habilidades de tus héroes.',
    },
    {
      id: 'bundle_anibal',
      title: 'Materiales Exclusivos',
      subtitle: 'Forja y Metalurgia Real',
      bannerImage: '/assets/items/banner_anibal.png',
      cost: 4500,
      rewardCrystals: 400,
      items: [
        { name: 'Cobre', count: 10, icon: '/assets/items/lingote_cobre_app.png' },
        { name: 'Plata', count: 10, icon: '/assets/items/lingote_plata_app.png' },
        { name: 'Electrum', count: 8, icon: '/assets/items/lingote_electrum_app.png' },
        { name: 'Oro', count: 6, icon: '/assets/items/lingote_oro_app.png' },
        { name: 'Kit Herrería', count: 4, icon: '/assets/items/kit_de_herreria_app.png' },
      ],
      description:
        'Compilación de tomos y metales selectos supervisados por Aníbal. Ideal para forjar armamento de alto rango.',
    },
    {
      id: 'bundle_jaime',
      title: 'Lote de Alimentos Gourmet',
      subtitle: 'Gran Banquete de la Taberna',
      bannerImage: '/assets/items/banner_jaime.png',
      cost: 3000,
      rewardCrystals: 300,
      items: [
        { name: 'Ramen', count: 6, icon: '/assets/items/ramen.png' },
        { name: 'Pizza', count: 4, icon: '/assets/items/pizza.png' },
        { name: 'Hamburguesa', count: 4, icon: '/assets/items/hamburguesa.png' },
        { name: 'Panes de Ajo', count: 8, icon: '/assets/items/panes_de_ajo.png' },
      ],
      description:
        'El festín más abundante de Icespear cocinado por Jaime. Restaura el vigor y llena las alforjas de tu grupo.',
    },
  ];

  const handleBuyItem = (item: ShopItem) => {
    if (gold >= item.cost) {
      sound.playSFX('coin');
      addGold(-item.cost);
      if (item.givesCrystals) {
        addCrystals(item.givesCrystals);
      }

      // Map category to inventory
      let shelfCategory: 'materials' | 'food' | 'tools' = 'materials';
      if (item.category === 'comida') {
        shelfCategory = 'food';
      } else if (item.category === 'fabricacion') {
        shelfCategory = item.id.includes('kit') || item.name.toLowerCase().includes('kit') ? 'tools' : 'materials';
      } else {
        shelfCategory = 'materials';
      }

      addShelfItem({
        id: item.id,
        name: item.name,
        category: shelfCategory,
        count: 1,
        icon: item.icon,
        description: item.description,
        priceGold: Math.round(item.cost * 0.6),
        rarity: item.cost >= 1000 ? 'SSR' : item.cost >= 500 ? 'SR' : 'R',
        effectType: shelfCategory === 'food' ? 'xp' : undefined,
        effectValue: shelfCategory === 'food' ? 300 : undefined,
      });

      setPurchaseToast({
        message: `¡Has comprado ${item.name}! Guardado en el inventario.`,
        success: true,
      });
      setTimeout(() => setPurchaseToast(null), 2500);
    } else {
      sound.playSFX('hurt');
      setPurchaseToast({
        message: `¡Oro insuficiente para ${item.name}!`,
        success: false,
      });
      setTimeout(() => setPurchaseToast(null), 2500);
    }
  };

  const handleBuyBundle = (bundle: PromoBundle) => {
    if (gold >= bundle.cost) {
      sound.playSFX('victory');
      addGold(-bundle.cost);
      addCrystals(bundle.rewardCrystals);

      // Save each item from the purchased bundle into the shelf inventory
      bundle.items.forEach((it) => {
        let cat: 'materials' | 'food' | 'tools' = 'materials';
        const lower = it.name.toLowerCase();
        if (lower.includes('kit')) {
          cat = 'tools';
        } else if (
          lower.includes('ramen') ||
          lower.includes('pizza') ||
          lower.includes('hamburguesa') ||
          lower.includes('pan') ||
          lower.includes('ajo')
        ) {
          cat = 'food';
        } else {
          cat = 'materials';
        }

        addShelfItem({
          name: it.name,
          category: cat,
          count: it.count,
          icon: it.icon,
          description: `Obtenido del lote especial: ${bundle.title}.`,
          rarity: 'SSR',
          priceGold: 200,
          effectType: cat === 'food' ? 'xp' : undefined,
          effectValue: cat === 'food' ? 350 : undefined,
        });
      });

      setPurchaseToast({
        message: `¡Adquirido: ${bundle.title}! Artículos guardados en el inventario.`,
        success: true,
      });
      setSelectedPromo(null);
      setTimeout(() => setPurchaseToast(null), 3000);
    } else {
      sound.playSFX('hurt');
      setPurchaseToast({
        message: '¡No tienes suficiente oro para este lote!',
        success: false,
      });
      setTimeout(() => setPurchaseToast(null), 2500);
    }
  };

  return (
    <div className="relative w-full h-full flex-1 flex flex-col justify-start bg-transparent select-none overflow-hidden overscroll-none">
      {/* 1. TOP APOTHECARY SHELF WITH INTEGRATED CARVED PLAQUE & 24H TIMER */}
      <div className="relative w-full aspect-[887/290] shrink-0 select-none overflow-hidden">
        {/* Authentic apothecary shelf artwork (bottles, lantern, skull, potion, chest, beam) */}
        <img
          src="/assets/backgrounds/tienda_apothecary_shelf.png"
          alt="Estantería Tienda"
          className="absolute inset-0 w-full h-full object-fill pointer-events-none select-none z-0"
        />

        {/* Integrated Octagonal Plaque with Title & 24h Countdown */}
        <div className="absolute top-[12.5%] -translate-y-[5px] left-1/2 -translate-x-1/2 w-[46%] max-w-[195px] z-10 flex flex-col items-center justify-center pointer-events-auto">
          {/* Carved Wood Plaque Title */}
          <h1 className="relative -top-[2%] font-serif font-black text-amber-100 text-[10px] sm:text-[11px] tracking-[0.2em] uppercase leading-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]">
            TIENDA
          </h1>

          {/* 24-Hour Reset Countdown Text */}
          <div className="flex items-center justify-center mt-[1%]">
            <span className="text-[7.2px] sm:text-[7.6px] font-bold text-[#facc15] tracking-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)] leading-none text-center">
              La tienda se resetea en{' '}
              <span className="font-mono text-amber-200 font-bold">{formatRemainingTime(timeRemaining)}</span>
            </span>
          </div>
        </div>
      </div>

      {/* 2. 4 CATEGORY BUTTONS (SITTING RIGHT UNDER THE SHELF BEAM) */}
      <div className="relative z-20 w-full px-[5.5%] sm:px-[6%] shrink-0 my-1">
        <div className="grid grid-cols-4 gap-1 sm:gap-1.5">
          {/* CATEGORY 1: ORO */}
          <button
            type="button"
            onClick={() => {
              sound.playSFX('click');
              setSelectedCategory('oro');
            }}
            className={`relative aspect-[1136/984] w-full flex flex-col items-center justify-center p-0.5 cursor-pointer transition-all active:scale-95 group ${
              selectedCategory === 'oro'
                ? 'brightness-120 drop-shadow-[0_0_8px_rgba(245,158,11,0.85)] scale-[1.02]'
                : 'opacity-85 hover:opacity-100'
            }`}
          >
            <img
              src="/assets/items/BOTON TIENDA 2.png"
              alt="Fondo Botón"
              className="absolute inset-0 w-full h-full object-fill pointer-events-none"
            />
            {/* Active Glow Frame */}
            {selectedCategory === 'oro' && (
              <div className="absolute inset-0.5 rounded border border-amber-400/90 shadow-[0_0_8px_rgba(251,191,36,0.7)] pointer-events-none" />
            )}
            <div className="relative z-10 flex flex-col items-center justify-center gap-0.5 mt-0.5">
              <img
                src="/assets/items/moneda_de_moonhaven.png"
                alt="Oro"
                className="w-5 h-5 sm:w-5.5 sm:h-5.5 object-contain drop-shadow"
              />
              <span className="text-[8px] sm:text-[8.5px] font-black text-amber-200 uppercase tracking-wider drop-shadow-[0_1px_2px_rgba(0,0,0,1)] leading-none">
                ORO
              </span>
            </div>
          </button>

          {/* CATEGORY 2: MEJORA */}
          <button
            type="button"
            onClick={() => {
              sound.playSFX('click');
              setSelectedCategory('mejora');
            }}
            className={`relative aspect-[1136/984] w-full flex flex-col items-center justify-center p-0.5 cursor-pointer transition-all active:scale-95 group ${
              selectedCategory === 'mejora'
                ? 'brightness-120 drop-shadow-[0_0_8px_rgba(245,158,11,0.85)] scale-[1.02]'
                : 'opacity-85 hover:opacity-100'
            }`}
          >
            <img
              src="/assets/items/BOTON TIENDA 2.png"
              alt="Fondo Botón"
              className="absolute inset-0 w-full h-full object-fill pointer-events-none"
            />
            {selectedCategory === 'mejora' && (
              <div className="absolute inset-0.5 rounded border border-amber-400/90 shadow-[0_0_8px_rgba(251,191,36,0.7)] pointer-events-none" />
            )}
            <div className="relative z-10 flex flex-col items-center justify-center gap-0.5 mt-0.5">
              <img
                src="/assets/items/icono_mejora_tienda.png"
                alt="Mejora"
                className="w-5 h-5 sm:w-5.5 sm:h-5.5 object-contain drop-shadow"
              />
              <span className="text-[8px] sm:text-[8.5px] font-black text-amber-200 uppercase tracking-wider drop-shadow-[0_1px_2px_rgba(0,0,0,1)] leading-none">
                MEJORA
              </span>
            </div>
          </button>

          {/* CATEGORY 3: FABRICACIÓN */}
          <button
            type="button"
            onClick={() => {
              sound.playSFX('click');
              setSelectedCategory('fabricacion');
            }}
            className={`relative aspect-[1136/984] w-full flex flex-col items-center justify-center p-0.5 cursor-pointer transition-all active:scale-95 group ${
              selectedCategory === 'fabricacion'
                ? 'brightness-120 drop-shadow-[0_0_8px_rgba(245,158,11,0.85)] scale-[1.02]'
                : 'opacity-85 hover:opacity-100'
            }`}
          >
            <img
              src="/assets/items/BOTON TIENDA 2.png"
              alt="Fondo Botón"
              className="absolute inset-0 w-full h-full object-fill pointer-events-none"
            />
            {selectedCategory === 'fabricacion' && (
              <div className="absolute inset-0.5 rounded border border-amber-400/90 shadow-[0_0_8px_rgba(251,191,36,0.7)] pointer-events-none" />
            )}
            <div className="relative z-10 flex flex-col items-center justify-center gap-0.5 mt-0.5">
              <img
                src="/assets/items/lingote_plata_app.png"
                alt="Fabricación"
                className="w-5 h-5 sm:w-5.5 sm:h-5.5 object-contain drop-shadow"
              />
              <span className="text-[6.5px] sm:text-[7px] font-black text-amber-200 uppercase tracking-tight drop-shadow-[0_1px_2px_rgba(0,0,0,1)] leading-none">
                FABRICACIÓN
              </span>
            </div>
          </button>

          {/* CATEGORY 4: COMIDA */}
          <button
            type="button"
            onClick={() => {
              sound.playSFX('click');
              setSelectedCategory('comida');
            }}
            className={`relative aspect-[1136/984] w-full flex flex-col items-center justify-center p-0.5 cursor-pointer transition-all active:scale-95 group ${
              selectedCategory === 'comida'
                ? 'brightness-120 drop-shadow-[0_0_8px_rgba(245,158,11,0.85)] scale-[1.02]'
                : 'opacity-85 hover:opacity-100'
            }`}
          >
            <img
              src="/assets/items/BOTON TIENDA 2.png"
              alt="Fondo Botón"
              className="absolute inset-0 w-full h-full object-fill pointer-events-none"
            />
            {selectedCategory === 'comida' && (
              <div className="absolute inset-0.5 rounded border border-amber-400/90 shadow-[0_0_8px_rgba(251,191,36,0.7)] pointer-events-none" />
            )}
            <div className="relative z-10 flex flex-col items-center justify-center gap-0.5 mt-0.5">
              <img
                src="/assets/items/ramen.png"
                alt="Comida"
                className="w-5 h-5 sm:w-5.5 sm:h-5.5 object-contain drop-shadow"
              />
              <span className="text-[8px] sm:text-[8.5px] font-black text-amber-200 uppercase tracking-wider drop-shadow-[0_1px_2px_rgba(0,0,0,1)] leading-none">
                COMIDA
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* 4. MAIN STORE ITEMS VIEWPORT (CLEAN TRANSPARENT OVERLAY ON BACKGROUND IMAGE) */}
      <div className="relative z-10 w-full flex-1 min-h-0 px-[4.5%] pb-14 flex flex-col overflow-hidden">
        {/* SCROLL VIEWPORT: All shop elements displayed directly over the authentic shop background */}
        <div className="relative w-full flex-1 min-h-0 overflow-y-auto overflow-x-hidden no-scrollbar px-0.5 pt-0.5 pb-2 flex flex-col">
            {/* Shelf 1: 3 Promotional Banners (Pablo, Aníbal, Jaime) displayed in 'oro' tab */}
            {selectedCategory === 'oro' && (
              <>
                <div className="grid grid-cols-3 gap-1.5 sm:gap-2 w-full shrink-0">
                  {promoBundles.map((promo) => (
                    <button
                      key={promo.id}
                      type="button"
                      onClick={() => {
                        sound.playSFX('click');
                        setSelectedPromo(promo);
                      }}
                      className="relative aspect-[1047/1503] w-full rounded overflow-hidden cursor-pointer hover:scale-[1.02] active:scale-95 transition-transform drop-shadow-[0_3px_6px_rgba(0,0,0,0.8)]"
                      title={promo.title}
                    >
                      <img
                        src={promo.bannerImage}
                        alt={promo.title}
                        className="w-full h-full object-fill pointer-events-none select-none"
                      />
                    </button>
                  ))}
                </div>

                {/* Ornate Golden Shelf Divider between Banners and Row 1 */}
                <OrnateShelfDivider />
              </>
            )}

            {/* Shelves 2, 3, 4: Rows of 4 items with authentic shelf dividers */}
            {categoryRows.map((row, rowIndex) => (
              <React.Fragment key={`row-${rowIndex}`}>
                <div className="grid grid-cols-4 gap-1.5 sm:gap-2 w-full shrink-0">
                  {row.map((item) => (
                    <div
                      key={item.id}
                      className={`relative aspect-[1407/1677] w-full flex flex-col items-center justify-between p-1 rounded shadow-md group transition-transform hover:scale-[1.02] ${
                        item.isDaily ? 'ring-1 ring-amber-400/50' : ''
                      }`}
                    >
                      {/* Daily Rotating Material Ribbon / Badge */}
                      {item.isDaily && (
                        <div className="absolute -top-1 -right-1 z-20 flex items-center gap-0.5 px-1 py-[1px] bg-gradient-to-r from-amber-500 via-yellow-300 to-amber-500 text-[#1a0802] font-black text-[6.5px] leading-none rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.8)] ring-1 ring-amber-700/80 animate-pulse">
                          <Sparkles className="w-1.5 h-1.5 text-[#2c1303]" />
                          <span>¡HOY!</span>
                        </div>
                      )}

                      {/* Item Frame (BOTON TIENDA.png) */}
                      <img
                        src="/assets/items/BOTON TIENDA.png"
                        alt="Marco"
                        className="absolute inset-0 w-full h-full object-fill pointer-events-none select-none z-0"
                      />

                      {/* Top: Item Title */}
                      <div className="relative z-10 w-full pt-1 text-center px-0.5">
                        <span className="font-sans font-bold text-[8px] sm:text-[9px] text-amber-100 tracking-tight leading-none truncate block drop-shadow-[0_1px_2px_rgba(0,0,0,1)]">
                          {item.name}
                        </span>
                      </div>

                      {/* Center: Item Icon */}
                      <div className="relative z-10 flex-1 flex items-center justify-center my-0.5 w-full min-h-[42px] sm:min-h-[46px] px-1">
                        <img
                          src={item.icon}
                          alt={item.name}
                          className="max-h-[42px] sm:max-h-[46px] max-w-[42px] sm:max-w-[46px] w-auto h-auto object-contain filter drop-shadow-[0_3px_6px_rgba(0,0,0,0.9)] group-hover:scale-108 transition-transform"
                        />
                      </div>

                      {/* Bottom: Price Button (BOTON BOTON TIENDA.png) */}
                      <button
                        type="button"
                        onClick={() => handleBuyItem(item)}
                        className="relative z-10 w-[92%] h-[18px] sm:h-[20px] flex items-center justify-center cursor-pointer hover:brightness-110 active:scale-95 transition-all mb-0.5 shadow-sm"
                        title={`Comprar por ${item.cost} Oro`}
                      >
                        <img
                          src="/assets/items/BOTON BOTON TIENDA.png"
                          alt="Comprar"
                          className="absolute inset-0 w-full h-full object-fill rounded pointer-events-none"
                        />
                        <div className="relative z-10 flex items-center justify-center gap-1 px-1">
                          <img
                            src="/assets/items/moneda_de_moonhaven.png"
                            alt="Oro"
                            className="w-3 h-3 sm:w-3.5 sm:h-3.5 object-contain"
                          />
                          <span className="font-mono font-black text-[9px] sm:text-[10px] text-[#2c1303] leading-none drop-shadow-[0_1px_0_rgba(255,255,255,0.4)]">
                            {item.cost}
                          </span>
                        </div>
                      </button>
                    </div>
                  ))}
                </div>

                {/* Divider between shelves (omitted after the very last row) */}
                {rowIndex < categoryRows.length - 1 && <OrnateShelfDivider />}
              </React.Fragment>
            ))}
          </div>
      </div>

      {/* FLOATING PURCHASE CONFIRMATION TOAST */}
      {purchaseToast && (
        <div
          className={`fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl border-2 text-xs font-bold shadow-2xl flex items-center gap-2 animate-fade-in pointer-events-none ${
            purchaseToast.success
              ? 'bg-[#2b1407] border-amber-400 text-amber-200'
              : 'bg-red-950/95 border-red-600 text-red-200'
          }`}
        >
          {purchaseToast.success ? (
            <PackageCheck className="w-4 h-4 text-emerald-400" />
          ) : (
            <X className="w-4 h-4 text-red-400" />
          )}
          <span>{purchaseToast.message}</span>
        </div>
      )}

      {/* PROMOTIONAL BUNDLE DETAIL MODAL */}
      {selectedPromo && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedPromo(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 select-none animate-fade-in"
        >
          <div className="relative w-full max-w-sm rounded-2xl p-4 bg-[#230e06] border-2 border-amber-600 shadow-[0_10px_30px_rgba(0,0,0,0.9)] space-y-3">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setSelectedPromo(null)}
              className="absolute top-2.5 right-2.5 text-stone-400 hover:text-white p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="text-center space-y-0.5 pt-1">
              <span className="text-[10px] uppercase font-bold text-amber-400 tracking-widest">
                OFERTA EXCLUSIVA
              </span>
              <h3 className="font-serif font-black text-amber-100 text-base">
                {selectedPromo.title}
              </h3>
              <p className="text-[11px] text-amber-300/80 font-medium">
                {selectedPromo.subtitle}
              </p>
            </div>

            {/* Banner Artwork Preview */}
            <div className="w-full h-36 rounded-xl overflow-hidden border border-amber-700/60 shadow-inner">
              <img
                src={selectedPromo.bannerImage}
                alt={selectedPromo.title}
                className="w-full h-full object-cover object-top"
              />
            </div>

            {/* Description */}
            <p className="text-xs text-stone-300 leading-relaxed text-center">
              {selectedPromo.description}
            </p>

            {/* Included Items Pill Grid */}
            <div className="bg-[#150702] border border-[#481c09] rounded-xl p-2.5 space-y-1.5">
              <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wide flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                Contenido del Paquete:
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {selectedPromo.items.map((it, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-1.5 bg-[#250f06] border border-[#5a250c] rounded-lg px-2 py-1"
                  >
                    <img src={it.icon} alt="" className="w-5 h-5 object-contain" />
                    <span className="text-[11px] font-bold text-stone-200">
                      {it.name} <span className="text-amber-400 font-mono">x{it.count}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-1 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedPromo(null)}
                className="flex-1 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-bold cursor-pointer transition-all"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => handleBuyBundle(selectedPromo)}
                className="flex-1 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-[#1a0802] font-serif font-black text-xs cursor-pointer shadow-lg transition-all flex items-center justify-center gap-1.5"
              >
                <img
                  src="/assets/items/moneda_de_moonhaven.png"
                  alt="Oro"
                  className="w-4 h-4 object-contain"
                />
                <span>Comprar ({selectedPromo.cost.toLocaleString()})</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
