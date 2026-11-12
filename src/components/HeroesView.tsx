import React, { useState, useMemo } from 'react';
import { useGame } from '../context/GameContext';
import { sound } from '../services/soundService';
import { X, Check, Heart, Search, Eye, Users, Zap, Shield, Sparkles, BookOpen, Lock } from 'lucide-react';
import { INITIAL_HEROES } from '../data/heroesData';
import { HeroCleanAura, CleanVFXStatus } from './CleanHeroVisualEffects';
import { DND_DAMAGE_TYPES_REGISTRY, DndDamageType, DND_DAMAGE_TYPES_LIST } from '../types/dndCombatDamage';
import { DndDamageCodexModal } from './DndDamageCodexModal';
import { HeroPageView } from './HeroPageView';

type SortOption = 'cc' | 'vida' | 'damage' | 'bond';

export interface CanonicalHeroItem {
  id: string;
  name: string;
  title: string;
  rarity: 'UR' | 'SSR' | 'SR' | 'R';
  attribute: 'Divino' | 'Natural' | 'Profano' | 'Arcano';
  portrait: string;
  frame: string;
  orb: string;
  level: number;
  hp: number;
  attack: number;
  defense: number;
  cc: number;
  isLocked?: boolean;
  bio?: string;
}

/** Filtro sepia para retratos, marcos y orbes de los héroes bloqueados. */
const LOCKED_TINT = 'sepia saturate-[0.45] brightness-[0.78] contrast-[0.95]';

export const CANONICAL_HEROES_LIST: CanonicalHeroItem[] = [
  // --- ROW 1 (5 heroes - Matching image_582628df.png) ---
  {
    id: 'edacorn',
    name: 'Edacorn',
    title: 'Vanguardia de Acero',
    rarity: 'SSR',
    attribute: 'Natural',
    portrait: '/assets/portraits/edacorn_icono.png',
    frame: '/assets/ui/marco_ssr.png',
    orb: '/assets/items/atributo natural.png',
    level: 1,
    hp: 1380,
    attack: 245,
    defense: 235,
    cc: 1520,
    bio: 'Vanguardia de acero de la Guardia de Icespear: yelmo alado, gola de malla y peto forjado para resistir el hielo de Cryovain.',
  },
  {
    id: 'chispo_deez',
    name: 'Chispo Deez',
    title: 'Paladín Enano Alado',
    rarity: 'SR',
    attribute: 'Divino',
    portrait: '/assets/portraits/chispo_deez_icono.png',
    frame: '/assets/ui/marco_sr.png',
    orb: '/assets/items/atributo fe.png',
    level: 1,
    hp: 1450,
    attack: 275,
    defense: 250,
    cc: 1420,
    bio: 'Noble Paladín enano bendecido por la llama celestial. Empuña su imponente martillo de guerra y yelmo alado ceremonial para proteger a sus aliados y purgar a los impíos.',
  },
  {
    id: 'kurogame',
    name: 'Kurogame',
    title: 'Guardián Acorazado',
    rarity: 'SR',
    attribute: 'Divino',
    portrait: '/assets/portraits/kurogame_icono.png',
    frame: '/assets/ui/marco_sr.png',
    orb: '/assets/items/atributo fe.png',
    level: 1,
    hp: 1200,
    attack: 260,
    defense: 230,
    cc: 1380,
    bio: 'Caballero impasible de armadura negra, consagrado a la defensa sagrada de los bastiones de Moonhaven.',
  },
  {
    id: 'pepe_loux',
    name: 'Pepe Loux',
    title: 'Gran Cruzado Veterano',
    rarity: 'SR',
    attribute: 'Natural',
    portrait: '/assets/portraits/pepe_loux.png',
    frame: '/assets/ui/marco_sr.png',
    orb: '/assets/items/atributo natural.png',
    level: 1,
    hp: 1450,
    attack: 280,
    defense: 250,
    cc: 1480,
    bio: 'Veterano de mil batallas con su capa escarlata, custodio de los bosques ancestrales y la tierra natal.',
  },
  {
    id: 'luminor',
    name: 'Luminor',
    title: 'Campeón de la Flor de Lis',
    rarity: 'SR',
    attribute: 'Arcano',
    portrait: '/assets/portraits/luminor_icono.png',
    frame: '/assets/ui/marco_sr.png',
    orb: '/assets/items/atributo arcano.png',
    level: 1,
    hp: 1100,
    attack: 310,
    defense: 190,
    cc: 1340,
    bio: 'Espadachín noble dotado de esgrima estelar, su hoja corta el velo de la magia con gracia incomparable.',
  },
  {
    id: 'gromock',
    name: 'Gromock',
    title: 'Señor de la Horda Orco',
    rarity: 'SR',
    attribute: 'Profano',
    portrait: '/assets/portraits/gromock_icono.png',
    frame: '/assets/ui/marco_sr.png',
    orb: '/assets/items/atributo OSCURO.png',
    level: 1,
    hp: 1380,
    attack: 295,
    defense: 210,
    cc: 1470,
    bio: 'Brutal caudillo orco revestido de hierro oxidado y amuletos de cráneos, señor absoluto de la batalla.',
  },

  // --- ROW 2 (5 heroes - Matching image_582628df.png) ---
  {
    id: 'giovani',
    name: 'Giovani Vázquez',
    title: 'Bribón Emplumado',
    rarity: 'SR',
    attribute: 'Profano',
    portrait: '/assets/portraits/giovani_vazquez_icono.png',
    frame: '/assets/ui/marco_sr.png',
    orb: '/assets/items/atributo OSCURO.png',
    level: 1,
    hp: 980,
    attack: 310,
    defense: 160,
    cc: 1267,
    bio: 'Astuto explorador con pico rapaz y manto violeta, maestro de los trucos de sombras y emboscadas.',
  },
  {
    id: 'el_baron',
    name: 'El Barón',
    title: 'Señor del Mercado Negro',
    rarity: 'SSR',
    attribute: 'Profano',
    portrait: '/assets/portraits/el_baron_icono.png',
    frame: '/assets/ui/marco_ssr.png',
    orb: '/assets/items/atributo OSCURO.png',
    level: 1,
    hp: 1400,
    attack: 360,
    defense: 240,
    cc: 1680,
    bio: 'Magnate de la alta sociedad y hechicero del grimorio carmesí. Sus contratos rigen el destino de los reinos.',
  },
  {
    id: 'wrathion',
    name: 'Wrathion',
    title: 'Sombra Dracónica',
    rarity: 'R',
    attribute: 'Divino',
    portrait: '/assets/portraits/wrathion_icono.png',
    frame: '/assets/ui/marco_r.png',
    orb: '/assets/items/atributo fe.png',
    level: 1,
    hp: 850,
    attack: 220,
    defense: 140,
    cc: 1003,
    bio: 'Ser nacido del eclipse primordial, sus ojos ámbar observan desde las profundidades del plano celestial.',
  },
  {
    id: 'widow',
    name: 'Widow',
    title: 'Drow Asesina',
    rarity: 'R',
    attribute: 'Natural',
    portrait: '/assets/portraits/widow_icono.png',
    frame: '/assets/ui/marco_r.png',
    orb: '/assets/items/atributo natural.png',
    level: 1,
    hp: 820,
    attack: 240,
    defense: 130,
    cc: 1013,
    bio: 'Letal cazadora de las profundidades subterráneas, sus dagas envenenadas no conocen el perdón.',
  },
  {
    id: 'prometeo',
    name: 'Prometeo',
    title: 'Cazador de Sangre Ígneo',
    rarity: 'SSR',
    attribute: 'Profano',
    portrait: '/assets/portraits/prometeo.png',
    frame: '/assets/ui/marco_sr.png',
    orb: '/assets/items/atributo OSCURO.png',
    level: 1,
    hp: 1180,
    attack: 350,
    defense: 180,
    cc: 1410,
    bio: 'Tiefling Cazador de Sangre (Blood Hunter) y piromante. Empuña una espada de fuego verde; causa 10% de daño adicional contra enemigos sangrantes.',
  },

  // --- ROW 3 (5 heroes - Matching image_582628df.png) ---
  {
    id: 'barled',
    name: 'Barled',
    title: 'Pícaro de la Frontera',
    rarity: 'SR',
    attribute: 'Arcano',
    portrait: '/assets/portraits/barled.png',
    frame: '/assets/ui/marco_sr.png',
    orb: '/assets/items/atributo arcano.png',
    level: 1,
    hp: 1150,
    attack: 300,
    defense: 185,
    cc: 1325,
    bio: 'Aventurero carismático y veloz espadachín, siempre listo con una sonrisa burlona y un golpe certero.',
  },
  {
    id: 'kairon',
    name: 'Kairon',
    title: 'Pistolero Errante',
    rarity: 'UR',
    attribute: 'Natural',
    portrait: '/assets/portraits/kairon.png',
    frame: '/assets/ui/marco_ur.png',
    orb: '/assets/items/atributo natural.png',
    level: 1,
    hp: 1200,
    attack: 310,
    defense: 185,
    cc: 1420,
    bio: 'Pistolero con dos pistolas duales de tiro rápido y una espada larga a dos manos, letal a cualquier distancia.',
  },
  {
    id: 'ragnavaldr',
    name: 'Ragnavaldr',
    title: 'Bárbaro Druida',
    rarity: 'UR',
    attribute: 'Natural',
    portrait: '/assets/portraits/ragnavaldr.png',
    frame: '/assets/ui/marco_ur.png',
    orb: '/assets/items/atributo natural.png',
    level: 1,
    hp: 1420,
    attack: 305,
    defense: 240,
    cc: 1510,
    bio: 'Bárbaro druida con dos lanzas ceremoniales. Entra en furia otorgando bufos de daño y resistencia a todo el equipo, y precipita cuchillos de hielo desde el cielo que congelan a los enemigos.',
  },
  {
    id: 'red_lion',
    name: 'Red Lion',
    title: 'Guerrero Demonio Carmesí',
    rarity: 'SR',
    attribute: 'Profano',
    portrait: '/assets/portraits/red_lion_portrait.png',
    frame: '/assets/ui/marco_sr.png',
    orb: '/assets/items/atributo OSCURO.png',
    level: 1,
    hp: 1320,
    attack: 310,
    defense: 200,
    cc: 1460,
    bio: 'Bestia demoníaca con melena roja llameante y cornamenta oscura, señor temible de las legiones de asalto.',
  },
  {
    id: 'smurph_draco',
    name: 'Smurph Draco',
    title: 'Hechicero Dracónico',
    rarity: 'SSR',
    attribute: 'Arcano',
    portrait: '/assets/portraits/smurph_draco.png',
    frame: '/assets/ui/marco_ssr.png',
    orb: '/assets/items/atributo arcano.png',
    level: 1,
    hp: 1140,
    attack: 345,
    defense: 165,
    cc: 1420,
    bio: 'Hechicero dracónico de escamas azul cobalto y alas imponentes. Domina el arte del vuelo sigiloso con aterrizajes demoledores de superhéroe, la invocación de bolas de fuego dracónicas y la exhalación de devastadores relámpagos por sus fauces.',
  },

  // --- ROW 4+ ---
  {
    id: 'magordito',
    name: 'Magordito',
    title: 'Nigromante Oscuro',
    rarity: 'SR',
    attribute: 'Profano',
    portrait: '/assets/portraits/Magordito.png',
    frame: '/assets/ui/marco_sr.png',
    orb: '/assets/items/atributo OSCURO.png',
    level: 1,
    hp: 1350,
    attack: 310,
    defense: 210,
    cc: 1460,
    bio: 'Temido maestro de las artes necróticas que doblega la energía de la muerte, desintegrando a sus adversarios con rayos profanos y castigos espectrales.',
  },
  {
    id: 'alma_fellas',
    name: 'Alma Fellas',
    title: 'Búho Sabio Arcano',
    rarity: 'SR',
    attribute: 'Arcano',
    portrait: '/assets/portraits/alma_fellas.png',
    frame: '/assets/ui/marco_sr.png',
    orb: '/assets/items/atributo arcano.png',
    level: 1,
    hp: 950,
    attack: 315,
    defense: 160,
    cc: 1267,
    bio: 'Erudito búho místico con gafas y sombrero de mago picudo, conoce los secretos de todas las estrellas.',
  },
  {
    id: 'roxanne',
    name: 'Roxanne',
    title: 'Barda de la Lira y el Rapier',
    rarity: 'SR',
    attribute: 'Arcano',
    portrait: '/assets/portraits/roxanne.png',
    frame: '/assets/ui/marco_sr.png',
    orb: '/assets/items/atributo arcano.png',
    level: 1,
    hp: 1040,
    attack: 295,
    defense: 180,
    cc: 1297,
    bio: 'Virtuosa barda kitsune que combina el encanto hipnótico de su lira dorada con magia rosada y la velocidad de su rapier.',
  },
  {
    id: 'edacorn',
    name: 'Edacorn',
    title: 'Vanguardia de Acero',
    rarity: 'SSR',
    attribute: 'Natural',
    portrait: '/assets/portraits/edacorn_icono.png',
    frame: '/assets/ui/marco_ssr.png',
    orb: '/assets/items/atributo natural.png',
    level: 1,
    hp: 1380,
    attack: 320,
    defense: 215,
    cc: 1490,
    bio: 'Ágil y mortífero espadachín de dagas gemelas, maestro del sigilo y el contraataque fulminante.',
  },
  {
    id: 'arlem_diaz',
    name: 'Arlem Díaz',
    title: 'Monje de los Cien Golpes',
    rarity: 'SSR',
    attribute: 'Profano',
    portrait: '/assets/items/arlem capa.png',
    frame: '/assets/ui/marco_ssr.png',
    orb: '/assets/items/atributo OSCURO.png',
    level: 1,
    hp: 1250,
    attack: 300,
    defense: 200,
    cc: 1450,
    bio: 'Monje místico que asciende el rango de las cartas de sus aliados, purifica con fuego primordial y sana heridas de batalla.',
  },
];

export const HeroesView: React.FC = () => {
  const { team, setTeamSlot, navigateTo, heroes: ownedHeroes } = useGame();

  // Solo los héroes desbloqueados son jugables; el resto se muestra bloqueado.
  const ownedHeroIds = useMemo(() => new Set(ownedHeroes.map((h) => h.id)), [ownedHeroes]);

  const [filterCarouselIndex, setFilterCarouselIndex] = useState(0);
  const [activeFilterId, setActiveFilterId] = useState<string>('cc');
  const [showStats, setShowStats] = useState(false);
  const [partyMode, setPartyMode] = useState(false);
  const [selectedHero, setSelectedHero] = useState<CanonicalHeroItem | null>(null);
  const [heroPageId, setHeroPageId] = useState<string | null>(null);
  const [filterRarity, setFilterRarity] = useState<string>('ALL');
  const [filterAttribute, setFilterAttribute] = useState<string>('ALL');
  const [filterDndDamage, setFilterDndDamage] = useState<string>('ALL');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [previewStatus, setPreviewStatus] = useState<CleanVFXStatus>('frozen');
  const [showDndCodex, setShowDndCodex] = useState(false);
  const [selectedDndCodexType, setSelectedDndCodexType] = useState<DndDamageType | undefined>(undefined);

  // 5 Authentic top filter cards: CC, Vida, Damage, Bond, Defense
  const allFilterCards = [
    { id: 'cc', label: 'CC', img: '/assets/items/Combat Class.png' },
    { id: 'vida', label: 'Vida', img: '/assets/items/vida_ui.png' },
    { id: 'damage', label: 'Damage', img: '/assets/items/dano_ui.png' },
    { id: 'bond', label: 'Bond', img: '/assets/items/recurso_18_4x_ui.png' },
    { id: 'defense', label: 'Defense', img: '/assets/items/defense_ui.png' },
  ];

  // Exactly 4 filter cards visible on the wooden plaque at a time
  const visibleFilterCards = allFilterCards.slice(filterCarouselIndex, filterCarouselIndex + 4);

  // Shift top filter carousel between [CC, Vida, Damage, Bond] and [Vida, Damage, Bond, Defense]
  const maxCarouselIndex = allFilterCards.length - 4; // 1
  const handlePrevFilter = () => {
    sound.playSFX('click');
    setFilterCarouselIndex((prev) => (prev > 0 ? prev - 1 : maxCarouselIndex));
  };

  const handleNextFilter = () => {
    sound.playSFX('click');
    setFilterCarouselIndex((prev) => (prev < maxCarouselIndex ? prev + 1 : 0));
  };

  // Heroes list remains canonical and never re-sorted by arrows or filter badges
  const sortedHeroes = useMemo(() => {
    let list = [...CANONICAL_HEROES_LIST];

    if (filterRarity !== 'ALL') {
      list = list.filter((h) => h.rarity === filterRarity);
    }
    if (filterAttribute !== 'ALL') {
      list = list.filter((h) => h.attribute === filterAttribute);
    }
    if (filterDndDamage !== 'ALL') {
      list = list.filter((h) => {
        const full = INITIAL_HEROES.find((ih) => ih.id === h.id);
        return full?.skills.some((s) => s.dndDamageType === filterDndDamage);
      });
    }

    // Los héroes desbloqueados van primero; dentro de cada grupo se mantiene el orden canónico.
    return list.sort(
      (a, b) => Number(!ownedHeroIds.has(a.id)) - Number(!ownedHeroIds.has(b.id))
    );
  }, [filterRarity, filterAttribute, filterDndDamage, ownedHeroIds]);

  const handleToggleTeam = (heroId: string) => {
    sound.playSFX('click');
    const existingIdx = team.indexOf(heroId);
    if (existingIdx !== -1) {
      setTeamSlot(existingIdx, null);
    } else {
      const emptyIdx = team.findIndex((slot) => slot === null);
      if (emptyIdx !== -1) {
        setTeamSlot(emptyIdx, heroId);
      } else {
        setTeamSlot(3, heroId);
      }
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col justify-start bg-transparent p-1.5 sm:p-2 space-y-1 select-none overflow-hidden">
      {/* 1. TOP WOODEN SORT/FILTER BAR (Authentic recurso_24_4x.png Wooden Board) */}
      <div className="relative w-full h-[72px] sm:h-[80px] overflow-hidden rounded-xl flex items-center justify-between px-2 sm:px-3 shrink-0 shadow-xl border-2 border-[#541e0b] bg-[#3a180b]">
        {/* Carved Wood Plaque Asset (wide wood board) */}
        <img
          src="/assets/items/recurso_24_4x.png"
          alt=""
          className="absolute inset-0 w-full h-[180%] -top-[52%] object-cover pointer-events-none select-none drop-shadow"
        />

        {/* Left Wooden Arrow Button (<) - Shifts top filter badges */}
        <button
          type="button"
          onClick={handlePrevFilter}
          className="relative z-10 w-8 h-12 sm:w-9 sm:h-14 flex items-center justify-center cursor-pointer active:scale-90 transition-transform shrink-0"
          title="Filtro Anterior"
          aria-label="Filtro Anterior"
        >
          <img
            src="/assets/items/recurso_25_4x.png"
            alt="Anterior"
            className="w-full h-full object-contain filter drop-shadow scale-x-[-1]"
          />
        </button>

        {/* 4 Visible Filter Badges (CC, Vida, Damage, Bond) - LARGER ICONS */}
        <div className="relative z-10 grid grid-cols-4 gap-2 sm:gap-3 flex-1 h-full items-center justify-items-center px-1 sm:px-2">
          {visibleFilterCards.map((card) => {
            const isSelected = activeFilterId === card.id;
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => {
                  sound.playSFX('click');
                  setActiveFilterId(card.id);
                }}
                className={`group relative h-full flex flex-col items-center justify-center cursor-pointer transition-all ${
                  isSelected
                    ? 'scale-108 drop-shadow-[0_0_12px_rgba(251,191,36,0.95)] filter brightness-115'
                    : 'opacity-85 hover:opacity-100 hover:scale-103'
                }`}
                title={card.label}
              >
                <img
                  src={card.img}
                  alt={card.label}
                  className="w-auto h-[54px] sm:h-[62px] max-h-[82%] object-contain drop-shadow"
                />
              </button>
            );
          })}
        </div>

        {/* Right Wooden Arrow Button (>) - Shifts top filter badges */}
        <button
          type="button"
          onClick={handleNextFilter}
          className="relative z-10 w-8 h-12 sm:w-9 sm:h-14 flex items-center justify-center cursor-pointer active:scale-90 transition-transform shrink-0"
          title="Siguiente Filtro"
          aria-label="Siguiente Filtro"
        >
          <img
            src="/assets/items/recurso_25_4x.png"
            alt="Siguiente"
            className="w-full h-full object-contain filter drop-shadow"
          />
        </button>
      </div>

      {/* 2. EXACT 4 COLORED BUTTONS ROW (Matching Image 2: Red Afecto, Blue Filtros, Green stats, Brown PARTY) */}
      <div className="grid grid-cols-4 gap-1.5 sm:gap-2 px-0.5 shrink-0 h-8 sm:h-8.5 items-center my-0.5">
        {/* Button 1: Afecto (Red button) */}
        <button
          type="button"
          onClick={() => {
            sound.playSFX('click');
            setActiveFilterId((prev) => (prev === 'bond' ? 'cc' : 'bond'));
          }}
          className={`h-full flex items-center justify-center gap-1 sm:gap-1.5 px-1.5 rounded-lg border-2 transition-all cursor-pointer ${
            activeFilterId === 'bond'
              ? 'bg-[#991b1b] border-[#ef4444] text-white shadow-[0_0_10px_rgba(239,68,68,0.7)] scale-102'
              : 'bg-[#7f1d1d]/90 border-[#991b1b] text-stone-200 hover:text-white hover:bg-[#991b1b]'
          }`}
          title="Afecto"
        >
          <Heart className="w-3.5 h-3.5 text-rose-300 fill-rose-400 shrink-0 drop-shadow" />
          <span className="text-[11px] sm:text-xs font-black tracking-wide text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
            Afecto
          </span>
        </button>

        {/* Button 2: Filtros (Blue button) */}
        <button
          type="button"
          onClick={() => {
            sound.playSFX('click');
            setShowFilterModal(true);
          }}
          className="h-full flex items-center justify-center gap-1 sm:gap-1.5 px-1.5 rounded-lg border-2 bg-[#1d4ed8]/90 border-[#3b82f6] text-white hover:bg-[#2563eb] transition-all cursor-pointer shadow-md active:scale-95"
          title="Filtros"
        >
          <Search className="w-3.5 h-3.5 text-sky-200 shrink-0 drop-shadow" />
          <span className="text-[11px] sm:text-xs font-black tracking-wide text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
            Filtros
          </span>
        </button>

        {/* Button 3: stats (Green button) */}
        <button
          type="button"
          onClick={() => {
            sound.playSFX('click');
            setShowStats((prev) => !prev);
          }}
          className={`h-full flex items-center justify-center gap-1 sm:gap-1.5 px-1.5 rounded-lg border-2 transition-all cursor-pointer ${
            showStats
              ? 'bg-[#15803d] border-[#22c55e] text-white shadow-[0_0_10px_rgba(34,197,94,0.7)] scale-102'
              : 'bg-[#14532d]/90 border-[#15803d] text-emerald-100 hover:text-white hover:bg-[#15803d]'
          }`}
          title="Mostrar Estadísticas"
        >
          <Eye className="w-3.5 h-3.5 text-emerald-200 shrink-0 drop-shadow" />
          <span className="text-[11px] sm:text-xs font-black tracking-wide text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] lowercase">
            stats
          </span>
        </button>

        {/* Button 4: PARTY (Brown button) */}
        <button
          type="button"
          onClick={() => {
            sound.playSFX('click');
            navigateTo('party');
          }}
          className="h-full flex items-center justify-center gap-1 sm:gap-1.5 px-1.5 rounded-lg border-2 border-[#92400e] bg-[#78350f]/90 text-amber-200 hover:text-white hover:bg-[#92400e] transition-all cursor-pointer shadow-md active:scale-95"
          title="Equipo / Party"
        >
          <Users className="w-3.5 h-3.5 text-amber-300 shrink-0 drop-shadow" />
          <span className="text-[11px] sm:text-xs font-black tracking-wide text-amber-100 drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
            PARTY
          </span>
        </button>
      </div>

      {/* Party Assignment Notice when Party Mode is enabled */}
      {partyMode && (
        <div className="bg-[#451a03] border-2 border-amber-400 text-amber-200 p-1.5 rounded-xl text-center shadow-lg text-[10px] sm:text-[11px] font-bold shrink-0">
          Modo Equipo Activo: Toca un héroe para añadirlo o quitarlo de las 4 ranuras de combate.
          <div className="flex items-center justify-center gap-1.5 mt-1">
            {team.map((slotId, idx) => {
              const h = CANONICAL_HEROES_LIST.find((hero) => hero.id === slotId);
              return (
                <div
                  key={idx}
                  className="w-7 h-7 rounded border border-amber-500/80 bg-black/60 flex items-center justify-center overflow-hidden text-[9px] font-bold text-stone-300"
                >
                  {h ? (
                    <img src={h.portrait} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. MAIN HERO PARCHMENT CONTAINER ENCLOSED BY MARCO_6770fadb.png FRAME */}
      <div className="relative flex-1 w-full rounded-[22px] sm:rounded-[26px] overflow-hidden flex flex-col min-h-0 bg-[#deb77c] shadow-2xl mb-20 sm:mb-22">
        {/* Authentic Parchment Texture Background Asset */}
        <img
          src="/assets/backgrounds/fondo_personajes.png"
          alt=""
          className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none opacity-95"
        />

        {/* Authentic Inner Double-Line Looped Border Asset (fondo_basec.png) */}
        <img
          src="/assets/backgrounds/fondo_basec.png"
          alt=""
          className="absolute inset-3 w-[calc(100%-24px)] h-[calc(100%-24px)] object-cover pointer-events-none select-none mix-blend-multiply opacity-65 z-0"
        />

        {/* USER FRAME ASSET: MARCO_6770fadb.png enclosing the heroes parchment paper */}
        <img
          src="/assets/aistudio/MARCO_6770fadb.png"
          alt="Marco Pergamino"
          className="absolute inset-0 w-full h-full object-fill pointer-events-none select-none z-20 drop-shadow-xl"
        />

        {/* Scrollable Hero Cards Area - Padded so cards sit comfortably inside MARCO_6770fadb.png */}
        <div className="relative z-10 w-full h-full pt-4 px-4 pb-3 overflow-y-auto no-scrollbar flex flex-col justify-start">
          {/* 5-Column Grid */}
          <div className="grid grid-cols-5 gap-1 sm:gap-1.5">
            {sortedHeroes.map((hero) => {
              const inTeam = team.includes(hero.id);
              const isLocked = !ownedHeroIds.has(hero.id);

              return (
                <div
                  key={hero.id}
                  onClick={() => {
                    if (isLocked) return;
                    if (partyMode) {
                      handleToggleTeam(hero.id);
                    } else {
                      // Abre directamente la página de héroe en la pestaña Descripción.
                      sound.playSFX('click');
                      setHeroPageId(hero.id);
                    }
                  }}
                  onContextMenu={(e) => {
                    // Mantener pulsado (o clic derecho) abre la ficha clásica del héroe.
                    e.preventDefault();
                    if (isLocked || partyMode) return;
                    sound.playSFX('click');
                    setSelectedHero(hero);
                  }}
                  className={`relative aspect-square cursor-pointer transition-transform duration-100 active:scale-95 hover:scale-102 select-none ${
                    inTeam ? 'ring-2 ring-emerald-500 rounded-lg' : ''
                  } ${isLocked ? 'cursor-not-allowed opacity-70' : ''}`}
                  title={isLocked ? `${hero.name} · bloqueado` : `${hero.name} · mantén pulsado para la ficha`}
                >
                  {/* Underneath: Hero Portrait safely contained inside the frame */}
                  <div className="absolute inset-[3px] sm:inset-[3.5px] rounded-[5px] overflow-hidden bg-[#18110c] flex items-center justify-center">
                    <img
                      src={hero.portrait}
                      alt={hero.name}
                      className={`w-full h-full object-cover object-center ${isLocked ? LOCKED_TINT : ''}`}
                    />
                  </div>

                  {/* Overlaid Authentic Frame PNG (with bottom-left rarity emblem) */}
                  <img
                    src={hero.frame}
                    alt={hero.rarity}
                    className={`absolute inset-0 w-full h-full object-contain pointer-events-none z-10 ${
                      isLocked ? LOCKED_TINT : ''
                    }`}
                  />

                  {/* Top-Right Authentic Element Bead Orb */}
                  <img
                    src={hero.orb}
                    alt={hero.attribute}
                    className={`absolute top-0 right-0 w-[30%] h-[30%] object-contain z-20 pointer-events-none drop-shadow ${
                      isLocked ? LOCKED_TINT : ''
                    }`}
                  />

                  {/* In-Team Indicator Checkmark */}
                  {inTeam && (
                    <div className="absolute top-0.5 left-0.5 z-30 w-3.5 h-3.5 rounded-full bg-emerald-500 border border-white flex items-center justify-center text-white shadow">
                      <Check className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}

                  {/* Candado de héroe bloqueado */}
                  {isLocked && (
                    <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
                      <div
                        className={`w-6 h-6 rounded-full bg-black/80 border border-amber-700/70 flex items-center justify-center shadow ${LOCKED_TINT}`}
                      >
                        <Lock className="w-3 h-3 text-amber-300/80" />
                      </div>
                    </div>
                  )}

                  {/* Stats overlay if stats button is toggled */}
                  {showStats && !isLocked && (
                    <div className="absolute inset-x-0 bottom-0 z-20 bg-black/85 text-center text-[7.5px] font-mono font-bold text-amber-300 py-0.2">
                      CC:{hero.cc}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Empty bottom parchment area showing the authentic parchment and bottom double border lines */}
          <div className="flex-1 w-full min-h-[60px]" />
        </div>
      </div>

      {/* 4. HERO PROFILE MODAL (Using fondo_personajes_1.png) */}
      {selectedHero && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedHero(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 select-none animate-fade-in"
        >
          <div className="relative w-full max-w-[380px] h-[82vh] max-h-[680px] flex flex-col">
            {/* Authentic Hero Sheet Background Asset (fondo_personajes_1.png) */}
            <img
              src="/assets/backgrounds/fondo_personajes_1.png"
              alt=""
              className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none select-none drop-shadow-2xl"
            />

            {/* Red Wax Seal Close Button */}
            <button
              type="button"
              onClick={() => {
                sound.playSFX('click');
                setSelectedHero(null);
              }}
              className="absolute -top-3 -right-3 z-30 w-12 h-12 cursor-pointer hover:scale-105 active:scale-95 transition-transform group"
              title="Cerrar"
            >
              <img
                src="/assets/ui/sello_cerrar.png"
                alt="Cerrar"
                className="w-full h-full object-contain filter group-hover:brightness-110 drop-shadow"
              />
            </button>

            {/* Modal Content Structured on top of the Sheet */}
            <div className="relative z-10 w-full h-full pt-10 pb-6 px-7 flex flex-col justify-between overflow-y-auto no-scrollbar">
              {/* Top Hero Section */}
              <div className="flex flex-col items-center text-center">
                <div className="relative w-24 h-24 mb-2">
                  <div className="absolute inset-0 rounded overflow-hidden bg-black/40">
                    <img
                      src={selectedHero.portrait}
                      alt={selectedHero.name}
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                  <img
                    src={selectedHero.frame}
                    alt=""
                    className="absolute inset-0 w-full h-full object-contain pointer-events-none z-10"
                  />
                  <img
                    src={selectedHero.orb}
                    alt=""
                    className="absolute top-0 right-0 w-7 h-7 object-contain z-20 pointer-events-none drop-shadow"
                  />
                  {/* Biblioteca de Efectos Visuales CSS/SVG Clean asignada dinámicamente */}
                  <HeroCleanAura status={previewStatus} />
                </div>

                <h3 className="font-serif font-black text-amber-950 text-base leading-tight uppercase tracking-wider drop-shadow-[0_1px_0_rgba(255,255,255,0.6)]">
                  {selectedHero.name}
                </h3>
                <p className="text-xs text-[#6e3713] font-semibold">{selectedHero.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#4a1c06] text-amber-200">
                    NIVEL {selectedHero.level}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-700 text-white">
                    {selectedHero.attribute}
                  </span>
                </div>

                {/* SELECTOR INTERACTIVO DE ESTADO DINÁMICO (Partículas sutiles) */}
                <div className="w-full mt-2.5 flex flex-col items-center bg-[#4a1e09]/10 p-2 rounded-xl border border-[#7a3e1a]/25">
                  <div className="flex items-center justify-between w-full px-1 mb-1.5">
                    <span className="text-[10px] font-black uppercase text-[#5a250a] tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-600" /> Partículas de Estado:
                    </span>
                    <span className="text-[9px] font-bold text-amber-900 bg-amber-200/60 px-1.5 py-0.2 rounded font-mono">
                      Partículas
                    </span>
                  </div>
                  <div className="flex items-center gap-1 flex-wrap justify-center">
                    {[
                      { id: 'frozen', label: 'Glacial', icon: '❄️', activeStyle: 'bg-sky-100 text-sky-800 border-sky-500 shadow-[0_0_8px_#38bdf8]' },
                      { id: 'stunned', label: 'Aturdido', icon: '⚡', activeStyle: 'bg-amber-100 text-amber-900 border-amber-500 shadow-[0_0_8px_#fbbf24]' },
                      { id: 'atk_buff', label: 'Ígneo', icon: '🔥', activeStyle: 'bg-orange-100 text-orange-900 border-orange-500 shadow-[0_0_8px_#f97316]' },
                      { id: 'shield', label: 'Égida', icon: '🛡️', activeStyle: 'bg-cyan-100 text-cyan-900 border-cyan-500 shadow-[0_0_8px_#06b6d4]' },
                      { id: 'poison', label: 'Veneno', icon: '🧪', activeStyle: 'bg-emerald-100 text-emerald-900 border-emerald-500 shadow-[0_0_8px_#10b981]' },
                      { id: 'regen', label: 'Sagrado', icon: '🌿', activeStyle: 'bg-green-100 text-green-900 border-green-500 shadow-[0_0_8px_#34d399]' },
                      { id: 'haste', label: 'Celeridad', icon: '💨', activeStyle: 'bg-yellow-100 text-yellow-900 border-yellow-500 shadow-[0_0_8px_#eab308]' },
                      { id: 'none', label: 'Limpio', icon: '⚪', activeStyle: 'bg-stone-100 text-stone-700 border-stone-400' },
                    ].map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => {
                          sound.playSFX('click');
                          setPreviewStatus(st.id as CleanVFXStatus);
                        }}
                        className={`px-2 py-0.5 rounded-full text-[9px] font-black border transition-all cursor-pointer ${
                          previewStatus === st.id
                            ? `${st.activeStyle} scale-105 font-black ring-1 ring-amber-700`
                            : 'bg-white/40 text-[#6e3713] border-[#7a3e1a]/20 hover:bg-white/70'
                        }`}
                      >
                        <span className="mr-0.5">{st.icon}</span>
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Stats Section */}
              <div className="mt-4 bg-[#4a1e09]/10 p-2.5 rounded-lg border border-[#7a3e1a]/30">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex justify-between">
                    <span className="font-bold text-[#5c2a0d]">Vida (HP):</span>
                    <span className="font-mono font-black text-amber-950">{selectedHero.hp}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold text-[#5c2a0d]">Ataque:</span>
                    <span className="font-mono font-black text-amber-950">{selectedHero.attack}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold text-[#5c2a0d]">Defensa:</span>
                    <span className="font-mono font-black text-amber-950">{selectedHero.defense}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold text-[#5c2a0d]">Clase Combate:</span>
                    <span className="font-mono font-black text-amber-950">{selectedHero.cc}</span>
                  </div>
                </div>
              </div>

              {/* Bio / Information */}
              <div className="mt-3 text-[11px] text-[#4f240a] font-medium leading-snug">
                {selectedHero.bio}
              </div>

              {/* Combat Skills Section */}
              {(() => {
                const heroFullData = INITIAL_HEROES.find((h) => h.id === selectedHero.id);
                const skills = heroFullData?.skills || [
                  {
                    id: `${selectedHero.id}_s1`,
                    name: 'Ataque Táctico',
                    description: 'Descarga ofensiva de precisión.',
                    cooldown: 0,
                    damageMultiplier: 1.5,
                    targetType: 'single_enemy' as const,
                    effectType: 'damage' as const,
                  },
                  {
                    id: `${selectedHero.id}_s2`,
                    name: 'Habilidad de Apoyo',
                    description: 'Canalización táctica de combate.',
                    cooldown: 2,
                    damageMultiplier: 0,
                    healMultiplier: 1.2,
                    targetType: 'all_allies' as const,
                    effectType: 'heal' as const,
                  },
                  {
                    id: `${selectedHero.id}_ult`,
                    name: 'Definitiva Suprema',
                    description: 'Despliegue colosal de máximo poder.',
                    cooldown: 4,
                    damageMultiplier: 2.4,
                    targetType: 'all_enemies' as const,
                    effectType: 'damage' as const,
                  },
                ];

                return (
                  <div className="mt-3 w-full space-y-1.5">
                    <div className="flex items-center justify-between px-0.5">
                      <span className="text-[11px] font-serif font-black uppercase tracking-wider text-[#4a1c06] flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5 text-amber-800" />
                        Habilidades de Combate
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDndCodexType(undefined);
                          setShowDndCodex(true);
                        }}
                        className="text-[9px] font-bold text-amber-900 hover:text-amber-950 bg-amber-200/90 border border-amber-800/40 px-2 py-0.5 rounded cursor-pointer transition-transform hover:scale-105 active:scale-95 flex items-center gap-1 shadow-xs"
                      >
                        <BookOpen className="w-2.5 h-2.5" />
                        Códice D&D
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      {skills.map((skill, sIdx) => {
                        const isUlt = sIdx === 2;
                        const dndMeta = skill.dndDamageType ? DND_DAMAGE_TYPES_REGISTRY[skill.dndDamageType] : null;

                        return (
                          <div
                            key={skill.id}
                            className="p-2 rounded-lg bg-[#4a1e09]/10 border border-[#7a3e1a]/30"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs font-black uppercase tracking-wide text-[#3d1604]">
                                  {skill.name}
                                </span>
                                {isUlt && (
                                  <span className="px-1 py-0.2 rounded-xs bg-red-800 text-[8px] font-black text-amber-100 uppercase tracking-widest">
                                    ULT
                                  </span>
                                )}
                                {dndMeta && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedDndCodexType(skill.dndDamageType);
                                      setShowDndCodex(true);
                                    }}
                                    className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[8px] font-black uppercase tracking-wider border shadow-xs cursor-pointer hover:brightness-125 transition-all"
                                    style={{
                                      backgroundColor: `${dndMeta.colorHex}25`,
                                      borderColor: dndMeta.colorHex,
                                      color: dndMeta.colorHex,
                                    }}
                                    title={`Tipo de Daño D&D: ${dndMeta.nameEs} (${dndMeta.gachaMechanicName})`}
                                  >
                                    <span>{dndMeta.icon}</span>
                                    <span>{dndMeta.nameEs}</span>
                                    <span className="opacity-70 text-[7px]">ℹ</span>
                                  </button>
                                )}
                              </div>

                              <div className="flex items-center gap-1">
                                {skill.damageMultiplier > 0 && (
                                  <span className="text-[9px] font-mono font-black px-1.5 py-0.5 rounded bg-[#4a1c06] text-amber-200">
                                    ⚔ {Math.round(skill.damageMultiplier * 100)}%
                                  </span>
                                )}
                                {skill.healMultiplier && skill.healMultiplier > 0 ? (
                                  <span className="text-[9px] font-mono font-black px-1.5 py-0.5 rounded bg-emerald-900 text-emerald-100">
                                    💚 +{Math.round(skill.healMultiplier * 100)}%
                                  </span>
                                ) : null}
                                <span className="text-[8.5px] font-bold text-[#6e3713] bg-[#deb77c]/80 px-1 py-0.5 rounded border border-[#7a3e1a]/20">
                                  {skill.cooldown === 0 ? 'CD: 0T' : `CD: ${skill.cooldown}T`}
                                </span>
                              </div>
                            </div>

                            <p className="text-[10px] leading-snug text-[#4f240a]">
                              {skill.description}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Página de héroe (clon de la escena de Unity) */}
              <div className="mt-3 flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => {
                    sound.playSFX('click');
                    setHeroPageId(selectedHero.id);
                    setSelectedHero(null);
                  }}
                  className="w-full px-4 py-1.5 rounded-lg bg-[#2b1207] border border-[#8a4419] text-[11px] font-black uppercase tracking-[0.12em] text-amber-200 hover:bg-[#3a1708] hover:border-amber-500 active:scale-95 transition-all cursor-pointer"
                >
                  Página de héroe
                </button>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleTeam(selectedHero.id)}
                  className="relative px-4 py-1.5 text-xs font-black text-amber-950 uppercase tracking-wide cursor-pointer hover:brightness-110 active:scale-95 transition-transform flex items-center justify-center shadow-md"
                >
                  <img
                    src="/assets/items/BOTON BOTON TIENDA.png"
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover rounded pointer-events-none"
                  />
                  <span className="relative z-10 drop-shadow-[0_1px_0_rgba(255,255,255,0.4)]">
                    {team.includes(selectedHero.id) ? 'Quitar del Equipo' : 'Asignar al Equipo'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PÁGINA DE HÉROE (clon de Arlem_Díaz_HeroPage de Unity) */}
      {heroPageId && (
        <HeroPageView
          key={heroPageId}
          heroId={heroPageId}
          onClose={() => setHeroPageId(null)}
        />
      )}

      {/* 5. FILTER MODAL */}
      {showFilterModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowFilterModal(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-fade-in"
        >
          <div className="relative w-full max-w-xs bg-[#240c03] border-4 border-[#78350f] rounded-2xl p-4 text-stone-200 shadow-2xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-amber-900/60">
              <h4 className="font-serif font-black text-amber-300 text-sm uppercase tracking-wider">
                Filtros de Héroes
              </h4>
              <button
                type="button"
                onClick={() => setShowFilterModal(false)}
                className="text-stone-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter by Rarity */}
            <div>
              <p className="text-xs font-bold text-amber-400 mb-1.5">Rareza:</p>
              <div className="grid grid-cols-4 gap-1.5">
                {['ALL', 'SSR', 'SR', 'R'].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setFilterRarity(r)}
                    className={`py-1 text-xs font-black rounded border cursor-pointer ${
                      filterRarity === r
                        ? 'bg-amber-600 border-amber-300 text-white shadow'
                        : 'bg-[#150602] border-[#5a210c] text-stone-400 hover:text-white'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter by Attribute */}
            <div>
              <p className="text-xs font-bold text-amber-400 mb-1.5">Atributo:</p>
              <div className="grid grid-cols-3 gap-1.5">
                {['ALL', 'Divino', 'Natural', 'Arcano', 'Profano'].map((attr) => (
                  <button
                    key={attr}
                    type="button"
                    onClick={() => setFilterAttribute(attr)}
                    className={`py-1 text-[11px] font-black rounded border cursor-pointer ${
                      filterAttribute === attr
                        ? 'bg-amber-600 border-amber-300 text-white shadow'
                        : 'bg-[#150602] border-[#5a210c] text-stone-400 hover:text-white'
                    }`}
                  >
                    {attr}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter by D&D Damage Type */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs font-bold text-amber-400">Tipo de Daño D&D:</p>
                <button
                  type="button"
                  onClick={() => {
                    setShowFilterModal(false);
                    setSelectedDndCodexType(undefined);
                    setShowDndCodex(true);
                  }}
                  className="text-[9px] font-bold text-amber-300 hover:text-white underline cursor-pointer"
                >
                  Ver Códice Completo
                </button>
              </div>
              <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1">
                <button
                  type="button"
                  onClick={() => setFilterDndDamage('ALL')}
                  className={`px-2 py-0.5 text-[10px] font-black rounded border cursor-pointer ${
                    filterDndDamage === 'ALL'
                      ? 'bg-amber-600 border-amber-300 text-white shadow'
                      : 'bg-[#150602] border-[#5a210c] text-stone-400 hover:text-white'
                  }`}
                >
                  TODOS
                </button>
                {DND_DAMAGE_TYPES_LIST.map((typeId) => {
                  const typeMeta = DND_DAMAGE_TYPES_REGISTRY[typeId];
                  return (
                    <button
                      key={typeId}
                      type="button"
                      onClick={() => setFilterDndDamage(typeId)}
                      className={`px-1.5 py-0.5 text-[9px] font-black rounded border cursor-pointer flex items-center gap-1 ${
                        filterDndDamage === typeId
                          ? 'border-white text-white shadow font-bold'
                          : 'border-[#5a210c] text-stone-300 hover:text-white'
                      }`}
                      style={{
                        backgroundColor: filterDndDamage === typeId ? `${typeMeta.colorHex}80` : '#150602',
                      }}
                    >
                      <span>{typeMeta.icon}</span>
                      <span>{typeMeta.nameEs}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowFilterModal(false)}
              className="w-full mt-2 py-1.5 bg-[#451a03] hover:bg-[#5a2405] text-amber-200 border border-amber-500/80 rounded-lg text-xs font-black uppercase tracking-wider cursor-pointer"
            >
              Aplicar Filtros
            </button>
          </div>
        </div>
      )}

      {/* D&D DAMAGE CODEX MODAL */}
      {showDndCodex && (
        <DndDamageCodexModal
          initialSelectedType={selectedDndCodexType}
          onClose={() => setShowDndCodex(false)}
        />
      )}
    </div>
  );
};
