import React, { useEffect, useRef, useState } from 'react';
import { useGame } from '../context/GameContext';
import { sound } from '../services/soundService';
import { safeStorage } from '../utils/storage';
import { Heart, Sparkles, X, Swords, FlaskConical, Castle } from 'lucide-react';
import { AuctionHouseModal } from './AuctionHouseModal';
import goldDungeonBoardImg from '../assets/images/gold_dungeon_board_1795079409642.jpg';
import {
  GOLD_RUN_BOONS,
  GOLD_RUN_CHAPTERS,
  GOLD_RUN_LEVELS_PER_CHAPTER,
  goldRunLevelDropMission,
  goldRunLevelMissionId,
  goldRunLevelSourceMission,
  loadGoldRun,
  startGoldRun,
  type GoldRunState,
} from '../data/goldRun';

interface GoldDungeonMission {
  id: string;
  progressId: string;
  /** Capítulo temático de la mazmorra (es lo que se navega en el farmeo). */
  chapter: number;
  /** Escala interna de resistencia enemiga; ya no se muestra como dificultad. */
  powerTier: 1 | 2 | 3;
  title: string;
  goldReward: number;
  description: string;
  portrait: string;
  portraitClass?: string;
  isMidasStatuePortrait?: boolean;
  directCombat?: boolean;
  roomBadgeLabel?: string;
  actionLabel?: string;
  dropPreview?: {
    name: string;
    icon: string;
    count: number;
  };
  locked?: boolean;
}

const goldChapterTheme = (chapter: number): string =>
  GOLD_RUN_CHAPTERS.find((c) => c.id === chapter)?.theme ?? '';

/**
 * Metadatos de cada tramo de oleadas. Las diez salas del capítulo heredan su pool de
 * enemigos, su retrato y su paga: una tarjeta por sala, más la del jefe si la hay.
 */
const MIDAS_LEVEL_SOURCE_META: Record<
  string,
  { label: string; portrait: string; portraitClass: string; gold: number }
> = {
  midas_dungeon_easy_insectos: {
    label: 'Enjambre Venenoso',
    portrait: '/assets/portraits/insecto_joya_thumb.webp',
    portraitClass: 'scale-[1.08] object-cover object-center',
    gold: 650,
  },
  midas_dungeon_easy_aurumvorax: {
    label: 'Guardia Áurea',
    portrait: '/assets/portraits/escorpion_aureo_thumb.webp',
    portraitClass: 'scale-[1.08] object-cover object-center',
    gold: 950,
  },
  midas_dungeon_n2_c1_kobolds_alados: {
    label: 'Tundra de Escarcha',
    portrait: '/assets/portraits/tundra_lobo_thumb.webp',
    portraitClass: 'scale-[1.08] object-cover object-center',
    gold: 1100,
  },
  midas_dungeon_n2_c2_escudos_dragon: {
    label: 'Escudos de Dragón',
    portrait: '/assets/portraits/kobold_escudo_rojo_thumb.webp',
    portraitClass: 'scale-[1.08] object-cover object-center',
    gold: 1350,
  },
  midas_dungeon_n2_c3_dracos_guardianes: {
    label: 'Jauría Carmesí',
    portrait: '/assets/portraits/draco_guardian_rojo_thumb.webp',
    portraitClass: 'scale-[1.08] object-cover object-center',
    gold: 1650,
  },
  midas_dungeon_n2_c4_semidragones_rojos: {
    label: 'Campeones del Fuego',
    portrait: '/assets/portraits/semidragon_rojo_veterano_thumb.webp',
    portraitClass: 'scale-[1.08] object-cover object-center',
    gold: 2100,
  },
  midas_dungeon_n2_c5_horda_ignivrax: {
    label: 'Antesala del Tirano',
    portrait: '/assets/portraits/semidragon_rojo_veterano_thumb.webp',
    portraitClass: 'scale-[1.08] object-cover object-center',
    gold: 2650,
  },
};

const MIDAS_LEVEL_DROPS: Record<string, { name: string; icon: string; count: number }> = {
  midas_dungeon_easy_insectos: {
    name: 'Bichos del Tesoro',
    icon: '/assets/items/ing_bichos_tesoro.webp',
    count: 3,
  },
  midas_dungeon_easy_aurumvorax: {
    name: 'Carne Áurea',
    icon: '/assets/items/ing_carne_aurea.webp',
    count: 3,
  },
  midas_dungeon_n2_c1_kobolds_alados: {
    name: 'Escama Dracónica Roja',
    icon: '/assets/portraits/kobold_escudo_rojo_thumb.webp',
    count: 2,
  },
  midas_dungeon_n2_c2_escudos_dragon: {
    name: 'Escama Dracónica Roja',
    icon: '/assets/portraits/kobold_escudo_rojo_thumb.webp',
    count: 3,
  },
  midas_dungeon_n2_c3_dracos_guardianes: {
    name: 'Escama de Draco Guardián',
    icon: '/assets/portraits/draco_guardian_rojo_thumb.webp',
    count: 3,
  },
  midas_dungeon_n2_c4_semidragones_rojos: {
    name: 'Blasón de Sangre Dracónica',
    icon: '/assets/portraits/semidragon_rojo_veterano_thumb.webp',
    count: 2,
  },
  midas_dungeon_n2_c5_horda_ignivrax: {
    name: 'Blasón de Sangre Dracónica',
    icon: '/assets/portraits/semidragon_rojo_veterano_thumb.webp',
    count: 3,
  },
};

const GOLD_LEVEL_MISSIONS: GoldDungeonMission[] = GOLD_RUN_CHAPTERS.flatMap((chapter) =>
  Array.from({ length: GOLD_RUN_LEVELS_PER_CHAPTER }, (_, index): GoldDungeonMission => {
    const level = index + 1;
    const id = goldRunLevelMissionId(chapter.id, level);
    const source = goldRunLevelSourceMission(chapter.id, level);
    const meta =
      MIDAS_LEVEL_SOURCE_META[source] ?? MIDAS_LEVEL_SOURCE_META.midas_dungeon_easy_insectos;
    const drop = MIDAS_LEVEL_DROPS[goldRunLevelDropMission(id) ?? ''];
    return {
      id,
      progressId: id,
      chapter: chapter.id,
      powerTier: (chapter.id <= 1 ? 1 : 2) as 1 | 2 | 3,
      title: `Nivel ${level} · ${meta.label}`,
      goldReward: meta.gold,
      description: `Sala ${level} de ${GOLD_RUN_LEVELS_PER_CHAPTER} de ${chapter.theme}. Un único combate con la vida y los orbes que traigas de la expedición.`,
      portrait: meta.portrait,
      portraitClass: meta.portraitClass,
      directCombat: true,
      roomBadgeLabel: 'Sala única',
      actionLabel: 'ENTRAR',
      dropPreview: drop,
      locked: false,
    };
  })
);

/** Jefes y extras: siguen cerrando el capítulo cuando lo haya. */
const GOLD_BOSS_MISSIONS: GoldDungeonMission[] = [
  {
    id: 'midas_dungeon_boss_caballero',
    progressId: 'midas_dungeon_boss_caballero',
    chapter: 2,
    powerTier: 3,
    title: 'Jefe del Capítulo II: El Caballero de Escarcha',
    goldReward: 18000,
    description:
      'El guardián de la bóveda helada. Su lanza eterna congela la sangre y, cada dos turnos, convoca a la fiera de la Tundra de la que más cargas de escarcha arrastres: lobo, zorro, conejo o ciervo.',
    portrait: '/assets/portraits/caballero_escarcha_boss_thumb.webp',
    portraitClass: 'scale-[1.08] object-cover object-center',
    directCombat: true,
    roomBadgeLabel: 'Jefe Final · Capítulo II',
    actionLabel: 'JEFE',
    dropPreview: {
      name: 'Punta de la Lanza Eterna',
      icon: '/assets/portraits/caballero_escarcha_boss_thumb.webp',
      count: 1,
    },
    locked: false,
  },
  {
    id: 'midas_dungeon_boss_mimico',
    progressId: 'midas_dungeon_boss_mimico',
    chapter: 1,
    powerTier: 1,
    title: 'Jefe del Capítulo I: Aracnia, la Viuda Enjoyada',
    goldReward: 12000,
    description:
      'La antigua araña acorazada de la bóveda, reconvertida en una viuda enjoyada de oro macizo y gemas. Sus garras y su escupitajo de bilis esmeralda inyectan ponzoña acumulable en vez de fuego, y su diluvio de veneno remata a los héroes distraídos.',
    portrait: '/assets/portraits/arana_joya_boss_thumb.webp',
    portraitClass: 'scale-[1.08] object-cover object-center',
    directCombat: true,
    roomBadgeLabel: 'Jefe Final · Capítulo I',
    actionLabel: 'JEFE',
    dropPreview: {
      name: 'Cofre Maldito',
      icon: '/assets/combat/mimico_cofre_normal.webp',
      count: 1,
    },
    locked: false,
  },
  {
    id: 'midas_dungeon_boss_ignivrax',
    progressId: 'midas_dungeon_boss_ignivrax',
    chapter: 6,
    powerTier: 3,
    title: 'Jefe: Ignivrax, El Tirano Carmesí',
    goldReward: 35000,
    description:
      'Un colosal dragón rojo de cuernos de obsidiana fundida que custodia el final de la Cámara Áurea. Sus zarpazos, mordiscos incandescentes, pisotones sísmicos y aliento de fuego infernal calcinan la arena; atácale sin tregua cuando alce su Manto de Brasas para impedir que regenere.',
    portrait: '/assets/portraits/ignivrax_boss_thumb.webp',
    portraitClass: 'scale-[1.08] object-cover object-center',
    directCombat: true,
    roomBadgeLabel: 'Jefe Final · Capítulo VI',
    actionLabel: 'JEFE',
    dropPreview: {
      name: 'Corazón Ígneo de Ignivrax',
      icon: '/assets/portraits/ignivrax_boss_thumb.webp',
      count: 1,
    },
    locked: false,
  },
  {
    id: 'midas_dungeon_hard',
    progressId: 'midas_dungeon_hard',
    chapter: 6,
    powerTier: 3,
    title: 'El Tesoro Supremo de Midas',
    goldReward: 25000,
    description:
      'Próximamente: el sagrario oculto donde Midas guarda su mayor fortuna entre líneas temporales.',
    portrait: '/assets/items/CANDADO.webp',
    portraitClass: 'scale-[0.88] object-contain opacity-90',
    locked: true,
  },
];

const GOLD_DUNGEON_MISSIONS: GoldDungeonMission[] = GOLD_RUN_CHAPTERS.flatMap((chapter) => [
  ...GOLD_LEVEL_MISSIONS.filter((mission) => mission.chapter === chapter.id),
  ...GOLD_BOSS_MISSIONS.filter((mission) => mission.chapter === chapter.id),
]);

export const TrainingBastionHub: React.FC<{ onBackToLibrary: () => void; standalone?: boolean }> = ({ onBackToLibrary: _onBackToLibrary, standalone }) => {
  const {
    navigateTo,
    idleEarningsAvailable,
    claimIdleEarnings,
    activeSanctuary,
    setActiveSanctuary,
    questProgress,
    isMissionCompleted,
    setPendingMissionLaunch,
    addGold,
    addCrystals,
  } = useGame();

  const [bastionView, setBastionView] = useState<'hub' | 'gold_missions'>(() =>
    safeStorage.getItem('cdd_midas_open_chapter_menu_on_return') === 'true'
      ? 'gold_missions'
      : 'hub'
  );
  // La marca solo sirve para el regreso inmediato desde una victoria de Midas.
  useEffect(() => {
    safeStorage.setItem('cdd_midas_open_chapter_menu_on_return', 'false');
  }, []);
  const [goldChapter, setGoldChapter] = useState<number>(() => loadGoldRun().chapter);
  const [goldRun, setGoldRun] = useState<GoldRunState>(() => loadGoldRun());

  // La expedición se relee al entrar al menú de oro y al volver del combate.
  useEffect(() => {
    if (bastionView !== 'gold_missions') return;
    const run = loadGoldRun();
    setGoldRun(run);
    setGoldChapter((prev) => (run.finished ? prev : run.chapter));
  }, [bastionView]);
  const [showGoldChestModal, setShowGoldChestModal] = useState(false);
  const [goldChestClaimed, setGoldChestClaimed] = useState<boolean>(
    () => safeStorage.getItem('cdd_gold_dungeon_chest_claimed') === 'true'
  );
  const goldScrollRef = useRef<HTMLDivElement>(null);
  const isGoldListDragging = useRef(false);
  const goldListStartY = useRef(0);
  const goldListStartScroll = useRef(0);

  const [showBondModal, setShowBondModal] = useState(false);
  const [showBlessingModal, setShowBlessingModal] = useState(false);
  const [showAuctionHouseModal, setShowAuctionHouseModal] = useState(false);
  const [claimedNotice, setClaimedNotice] = useState<string | null>(null);
  const [undergroundNotice, setUndergroundNotice] = useState<{
    title: string;
    subtitle: string;
    desc: string;
    iconType: 'swords' | 'potion' | 'castle';
  } | null>(null);

  const handleClaimTribute = () => {
    if (idleEarningsAvailable > 0) {
      const amt = claimIdleEarnings();
      setClaimedNotice(`¡Has reclamado +${amt.toLocaleString()} Oro de tributo!`);
      setTimeout(() => setClaimedNotice(null), 3000);
    }
  };

  const handleUndergroundElementClick = (type: 'pozos' | 'subastas' | 'pociones' | 'baron') => {
    sound.playSFX('click');
    switch (type) {
      case 'pozos':
        sound.playSFX('attack');
        setUndergroundNotice({
          title: 'Pozos de Pelea',
          subtitle: 'Arena Clandestina de Gladiadores',
          desc: 'Los combates a muerte y apuestas clandestinas se forjan en esta arena de piedra circular. Los mejores guerreros del Mercado Negro se miden en combates sin piedad.',
          iconType: 'swords',
        });
        break;
      case 'subastas':
        sound.playSFX('coin');
        navigateTo('auction');
        break;
      case 'pociones':
        sound.playSFX('skill');
        navigateTo('potions');
        break;
      case 'baron':
        sound.playSFX('baron');
        setUndergroundNotice({
          title: 'Mazmorra de la Mansión del Barón',
          subtitle: 'Fortaleza Cavernosa del Tirano',
          desc: 'En lo más alto de la caverna subterránea se erige la opulenta mansión del Barón. En sus calabozos húmedos y criptas secretas se custodian los secretos de su linaje.',
          iconType: 'castle',
        });
        break;
    }
  };

  // ----------------------------------------------------------------------
  // UNDERGROUND SANCTUARY (MERCADO NEGRO) VIEW
  // ----------------------------------------------------------------------
  // Abierto como tomo propio siempre muestra el menú del Bastión: el Mercado Negro solo
  // aparece cuando se entra desde el Santuario con esa sección activa.
  if (!standalone && activeSanctuary === 'mercado_negro') {
    return (
      <div className="relative w-full h-full min-h-[580px] flex-1 flex flex-col justify-between overflow-hidden select-none">
        {/* Full Cavern Black Market Sanctuary Illustrated Artwork */}
        <img
          src="/assets/aistudio/image_159218c1.webp"
          alt="Santuario Subterráneo del Mercado Negro"
          className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none select-none"
        />

        {/* Top Header - Badges only, without any top switcher cartel */}
        <div className="relative z-10 p-2.5 sm:p-3 flex items-center justify-between gap-2">
          {/* Top Left Floating Badges */}
          <div className="flex items-center gap-2">
            {/* Vínculos / Bonds */}
            <button
              onClick={() => {
                sound.playSFX('click');
                setShowBondModal(true);
              }}
              className="w-10 h-10 rounded-full bg-gradient-to-b from-[#8f280a] to-[#3a0d02] border-2 border-[#d97706] shadow-xl flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 transition-transform"
              title="Vínculos y Afecto de Héroes"
            >
              <div className="w-7 h-7 rounded-full bg-[#f8fafc] border border-[#cbd5e1] flex items-center justify-center p-0.5 shadow-inner">
                <svg viewBox="0 0 24 24" className="w-full h-full text-purple-900 fill-current">
                  <path d="M12 2C6.48 2 2 6.48 2 12c0 4.41 2.87 8.19 6.84 9.5.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.15-1.11-1.46-1.11-1.46-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.89 1.52 2.34 1.08 2.91.83.09-.65.35-1.08.63-1.33-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.99 1.03-2.69-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02.8-.22 1.65-.33 2.5-.33.85 0 1.7.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.6 1.03 2.69 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.75c0 .27.18.58.69.48A10.02 10.02 0 0 0 22 12c0-5.52-4.48-10-10-10z" />
                </svg>
              </div>
            </button>

            {/* Hexagon Crest Badge (Tribute) */}
            <button
              onClick={() => {
                sound.playSFX('click');
                setShowBlessingModal(true);
              }}
              className="relative w-10 h-10 rounded-full cursor-pointer hover:scale-105 active:scale-95 transition-transform"
              title="Tributo Subterráneo"
            >
              <img
                src="/assets/items/Insignia Mercado Negro app.webp"
                alt="Insignia"
                className="w-full h-full object-contain filter drop-shadow-xl"
              />
              {idleEarningsAvailable > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-500 border border-white text-[7px] font-black text-black flex items-center justify-center animate-bounce shadow">
                  !
                </span>
              )}
            </button>

            {/* Inventory Button */}
            <button
              onClick={() => {
                sound.playSFX('click');
                navigateTo('inventory');
              }}
              className="h-8 w-22 cursor-pointer hover:scale-106 active:scale-95 transition-transform"
              title="Inventario"
            >
              <img
                src="/assets/items/Inventary_Button.webp"
                alt="Inventario"
                className="w-full h-full object-contain filter drop-shadow-xl"
              />
            </button>
          </div>
        </div>

        {/* Floating Notice Banner for tribute claim */}
        {claimedNotice && (
          <div className="absolute top-14 left-1/2 -translate-x-1/2 z-30 bg-[#3b170c] border-2 border-amber-400 text-amber-200 px-4 py-1.5 rounded-lg text-xs font-bold shadow-2xl animate-fade-in pointer-events-none">
            {claimedNotice}
          </div>
        )}

        {/* Interactive Invisible Hotspots over the Buildings & Elements - No visual indicators or overlays */}
        <div className="relative z-10 flex-1 w-full pointer-events-auto">
          {/* 1. Mazmorra de la mansión del Barón (arriba del todo) */}
          <button
            onClick={() => handleUndergroundElementClick('baron')}
            className="absolute top-[2%] left-[44%] w-[52%] h-[24%] cursor-pointer focus:outline-none"
            title="Mansión del Barón"
            aria-label="Mazmorra de la Mansión del Barón"
          />

          {/* 2. Casa de subastas con mazo en el techo (arriba izquierda) */}
          <button
            onClick={() => handleUndergroundElementClick('subastas')}
            className="absolute top-[22%] left-[0%] w-[42%] h-[26%] cursor-pointer focus:outline-none"
            title="Casa de Subastas"
            aria-label="Casa de Subastas"
          />

          {/* 3. Pozos de pelea (centro) */}
          <button
            onClick={() => handleUndergroundElementClick('pozos')}
            className="absolute top-[50%] left-[18%] w-[64%] h-[21%] rounded-full cursor-pointer focus:outline-none"
            title="Pozos de Pelea"
            aria-label="Pozos de Pelea"
          />

          {/* 4. Tienda de pociones y encantamientos con sello arcano (abajo derecha) */}
          <button
            onClick={() => handleUndergroundElementClick('pociones')}
            className="absolute top-[58%] right-[0%] w-[50%] h-[32%] cursor-pointer focus:outline-none"
            title="Tienda de Pociones y Encantamientos"
            aria-label="Tienda de Pociones y Encantamientos"
          />
        </div>

        {/* Bottom Right: Button to return to Santuario (using the Santuario button from WorldMapView instead of World button) */}
        <div className="relative z-20 self-end mb-20 mr-2 sm:mb-22 sm:mr-3 pointer-events-auto">
          <button
            onClick={() => {
              sound.playSFX('click');
              setActiveSanctuary('icespear');
            }}
            className="group relative flex flex-col items-center cursor-pointer hover:scale-106 active:scale-95 transition-transform"
            title="Volver al Santuario de Icespear"
          >
            <img
              src="/assets/backgrounds/icespear SANTUARIO BUTTON.webp"
              alt="Volver al Santuario"
              className="w-16 h-16 sm:w-18 sm:h-18 object-contain filter drop-shadow-2xl"
            />
          </button>
        </div>

        {/* Underground Feature Detail Modal (No logic yet) */}
        {undergroundNotice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-4 animate-fade-in">
            <div className="wood-frame max-w-sm w-full p-5 rounded-2xl space-y-4 text-center border-2 border-amber-600 shadow-2xl">
              <div className="flex items-center justify-between pb-2 border-b border-amber-900/60">
                <div className="flex items-center gap-2 text-amber-200 font-serif font-black text-sm">
                  {undergroundNotice.iconType === 'swords' && <Swords className="w-5 h-5 text-red-400" />}
                  {undergroundNotice.iconType === 'potion' && <FlaskConical className="w-5 h-5 text-purple-400" />}
                  {undergroundNotice.iconType === 'castle' && <Castle className="w-5 h-5 text-amber-400" />}
                  <span>{undergroundNotice.title}</span>
                </div>
                <button
                  onClick={() => setUndergroundNotice(null)}
                  className="text-stone-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="inline-block px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-semibold">
                {undergroundNotice.subtitle}
              </div>

              <p className="text-xs text-stone-300 leading-relaxed text-left bg-[#1b0a04] p-3 rounded-xl border border-[#521c08]">
                {undergroundNotice.desc}
              </p>

              <div className="text-[10px] text-amber-400/80 font-mono tracking-wider uppercase">
                ✦ En construcción ✦
              </div>

              <button
                onClick={() => setUndergroundNotice(null)}
                className="w-full py-2 bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-600 hover:to-amber-500 text-white font-bold text-xs rounded-lg shadow-md cursor-pointer transition-all"
              >
                Entendido
              </button>
            </div>
          </div>
        )}

        {/* Common Sanctuary Modals */}
        {showBondModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-4">
            <div className="wood-frame max-w-sm w-full p-5 rounded-2xl space-y-4 text-center border-2 border-amber-700 shadow-2xl">
              <div className="flex items-center justify-between pb-2 border-b border-amber-900/60">
                <div className="flex items-center gap-2 text-amber-200 font-serif font-black text-sm">
                  <Heart className="w-4 h-4 text-red-500 fill-current" />
                  <span>Vínculos de Compañerismo</span>
                </div>
                <button onClick={() => setShowBondModal(false)} className="text-stone-400 hover:text-white cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-stone-300 leading-relaxed">
                Pasa tiempo con tus héroes en la taberna y completa misiones conjuntas para desbloquear estadísticas pasivas.
              </p>
              <div className="bg-[#1b0a04] border border-[#521c08] rounded-xl p-3 text-left space-y-2 text-xs">
                <div className="flex items-center justify-between text-stone-300">
                  <span>Magordito (Afecto Lv.4)</span>
                  <span className="text-cyan-400 font-bold">+8% Daño Necrótico</span>
                </div>
                <div className="flex items-center justify-between text-stone-300">
                  <span>Pepe Loux (Afecto Lv.3)</span>
                  <span className="text-amber-400 font-bold">+8% Defensa</span>
                </div>
                <div className="flex items-center justify-between text-stone-300">
                  <span>Kairon (Afecto Lv.5)</span>
                  <span className="text-amber-400 font-bold">+10% Daño Sagrado</span>
                </div>
              </div>
              <button
                onClick={() => setShowBondModal(false)}
                className="w-full py-2 bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-600 hover:to-amber-500 text-white font-bold text-xs rounded-lg shadow-md cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}

        {showBlessingModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-4">
            <div className="wood-frame max-w-sm w-full p-5 rounded-2xl space-y-4 text-center border-2 border-amber-700 shadow-2xl">
              <div className="flex items-center justify-between pb-2 border-b border-amber-900/60">
                <div className="flex items-center gap-2 text-amber-200 font-serif font-black text-sm">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Tributo del Santuario</span>
                </div>
                <button onClick={() => setShowBlessingModal(false)} className="text-stone-400 hover:text-white cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-stone-300 leading-relaxed">
                El Santuario acumula tributo de oro de manera pasiva mientras exploras o descansas.
              </p>
              <div className="bg-[#1b0a04] border border-[#521c08] rounded-xl p-4 text-center space-y-2">
                <span className="text-xs text-stone-400 uppercase tracking-widest">Tributo Acumulado</span>
                <div className="text-2xl font-mono font-black text-amber-300">
                  +{idleEarningsAvailable.toLocaleString()} Oro
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    handleClaimTribute();
                    setShowBlessingModal(false);
                  }}
                  disabled={idleEarningsAvailable <= 0}
                  className={`flex-1 py-2 font-bold text-xs rounded-lg shadow-md transition-all ${
                    idleEarningsAvailable > 0
                      ? 'bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-black cursor-pointer'
                      : 'bg-stone-800 text-stone-500 cursor-not-allowed'
                  }`}
                >
                  Reclamar Tributo
                </button>
                <button
                  onClick={() => setShowBlessingModal(false)}
                  className="py-2 px-4 bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs rounded-lg cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Auction House Modal */}
        <AuctionHouseModal
          isOpen={showAuctionHouseModal}
          onClose={() => setShowAuctionHouseModal(false)}
        />
      </div>
    );
  }

  // ----------------------------------------------------------------------
  // GOLD DUNGEON MISSIONS VIEW (Story-board layout with dungeon stone theme)
  // ----------------------------------------------------------------------
  if (bastionView === 'gold_missions') {
    const runChapter = goldRun.finished ? 6 : goldRun.chapter;
    const currentChapter =
      GOLD_RUN_CHAPTERS.find((c) => c.id === goldChapter) ?? GOLD_RUN_CHAPTERS[0];
    const visibleGoldMissions = GOLD_DUNGEON_MISSIONS.filter(
      (m) => m.chapter === currentChapter.id
    );
    const chapterMissions = visibleGoldMissions.filter((m) => !m.locked);
    const chapterClearedCount = chapterMissions.filter((m) =>
      goldRun.cleared.includes(m.progressId)
    ).length;
    const chapterTotalCount = chapterMissions.length;
    const isGoldDungeonFullyCompleted = goldRun.finished;
    const lastBoon = goldRun.lastBoon
      ? GOLD_RUN_BOONS.find((b) => b.id === goldRun.lastBoon) ?? null
      : null;
    const runBoons = goldRun.boons
      .map((id) => GOLD_RUN_BOONS.find((b) => b.id === id))
      .filter((b): b is (typeof GOLD_RUN_BOONS)[number] => Boolean(b));

    // Igual que en la historia principal: solo se puede iniciar la primera
    // misión disponible; cada victoria abre la siguiente sala del capítulo.
    const isGoldMissionUnlocked = (mission: GoldDungeonMission): boolean => {
      if (mission.locked || mission.chapter > runChapter) return false;
      const chapterMissions = visibleGoldMissions;
      const missionIndex = chapterMissions.findIndex((item) => item.progressId === mission.progressId);
      if (missionIndex <= 0) return missionIndex === 0;
      const previousMission = chapterMissions[missionIndex - 1];
      return goldRun.cleared.includes(previousMission.progressId);
    };

    const handleLaunchGoldMission = (
      mission: GoldDungeonMission,
      forceDestination?: 'story' | 'combat'
    ) => {
      if (!isGoldMissionUnlocked(mission)) {
        sound.playSFX('click');
        return;
      }
      sound.playSFX('click');
      if (mission.chapter > runChapter) return;
      if (!loadGoldRun().active) setGoldRun(startGoldRun());
      const alreadyDone = goldRun.cleared.includes(mission.progressId);
      setPendingMissionLaunch({
        missionId: mission.id,
        destination: mission.directCombat ? 'combat' : forceDestination ?? (alreadyDone ? 'combat' : 'story'),
        difficultyTier: mission.powerTier,
      });
      navigateTo('party');
    };

    const handleClaimGoldChest = () => {
      sound.playSFX('victory');
      if (!goldChestClaimed && isGoldDungeonFullyCompleted) {
        addGold(15000);
        addCrystals(300);
        setGoldChestClaimed(true);
        safeStorage.setItem('cdd_gold_dungeon_chest_claimed', 'true');
      }
      setShowGoldChestModal(true);
    };

    const handleGoldPointerDown = (e: React.PointerEvent) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      const target = e.target as HTMLElement;
      if (target.closest('button')) return;
      isGoldListDragging.current = true;
      goldListStartY.current = e.clientY;
      goldListStartScroll.current = goldScrollRef.current?.scrollTop || 0;
    };

    const handleGoldPointerMove = (e: React.PointerEvent) => {
      if (!isGoldListDragging.current || !goldScrollRef.current) return;
      const deltaY = e.clientY - goldListStartY.current;
      goldScrollRef.current.scrollTop = goldListStartScroll.current - deltaY;
    };

    const handleGoldPointerUp = () => {
      isGoldListDragging.current = false;
    };

    return (
      <div className="relative w-full h-full flex flex-col justify-start bg-transparent select-none overflow-hidden">
        {/* 1. FULL-BLEED STONE DUNGEON BOARD BACKGROUND */}
        <img
          src={goldDungeonBoardImg}
          alt="Mazmorra de Oro"
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover object-top pointer-events-none select-none z-0"
        />

        {/* 2. TOP STONE HEADER BAND (0% to 20.8% of image width) */}
        <div className="relative z-20 w-full px-[4.5%] shrink-0">
          <div className="w-full" style={{ paddingTop: '1.8%' }}>
            <div className="relative w-full" style={{ paddingTop: '18.2%' }}>
              <div className="absolute inset-0 flex items-center">
                <div className="w-full flex items-center gap-1.5 h-10 sm:h-11">
                  <div className="flex-1 flex gap-1.5 h-full overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                    {GOLD_RUN_CHAPTERS.map((chapter) => {
                      const isActive = goldChapter === chapter.id;
                      const isChapterLocked = chapter.id > runChapter;
                      const isChapterCleared = chapter.id < runChapter;
                      return (
                        <button
                          key={chapter.id}
                          type="button"
                          disabled={isChapterLocked}
                          onClick={() => {
                            sound.playSFX('click');
                            if (isChapterLocked) return;
                            setGoldChapter(chapter.id);
                          }}
                          className={`relative h-full shrink-0 min-w-[56px] rounded-md border flex flex-col items-center justify-center px-1 transition-all ${
                            isChapterLocked
                              ? 'border-stone-800/90 bg-gradient-to-b from-[#1a1d24] via-[#14171d] to-[#0d1014] opacity-60 cursor-not-allowed'
                              : isActive
                              ? 'border-amber-400/90 bg-gradient-to-b from-[#3a3f4d] via-[#272b36] to-[#171a22] scale-[1.03] shadow-[0_0_10px_rgba(245,158,11,0.55),inset_0_1px_0_rgba(255,255,255,0.2)] cursor-pointer'
                              : 'border-stone-600/80 bg-gradient-to-b from-[#282c36] via-[#1c2028] to-[#12151b] hover:border-stone-400/80 brightness-95 hover:brightness-110 shadow-[0_2px_5px_rgba(0,0,0,0.65)] cursor-pointer'
                          }`}
                        >
                          <span
                            className={`text-[8.5px] sm:text-[9.5px] font-black uppercase leading-tight drop-shadow-[0_1px_1px_rgba(0,0,0,0.95)] ${
                              isActive ? 'text-amber-200' : 'text-stone-200'
                            }`}
                          >
                            {isChapterLocked ? '🔒' : isChapterCleared ? `✓ ${chapter.numeral}` : chapter.numeral}
                          </span>
                          <span
                            className={`text-[6.5px] sm:text-[7.5px] font-bold uppercase leading-tight tracking-wider drop-shadow-[0_1px_1px_rgba(0,0,0,0.95)] ${
                              isActive ? 'text-amber-300' : 'text-stone-400'
                            }`}
                          >
                            {chapter.short}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. FRAMED ANCIENT GOLD VAULT ARTWORK SPACER (stone frame ends at 72.4% of width -> 20.0% + 53.2% = 73.2%) */}
        <div className="relative z-10 w-full shrink-0 pointer-events-none" style={{ paddingTop: '53.2%' }} />

        {/* 4. MAIN CONTENT AREA ON STONE SLABS */}
        <div className="relative z-10 w-full flex-1 flex flex-col px-[4%] sm:px-[4.5%] pb-2 overflow-hidden min-h-0">
          {/* STONE PROGRESS BAR & TREASURE CHEST */}
          <div className="relative w-full rounded-2xl p-2 sm:p-2.5 bg-[#12151c]/92 border-2 border-[#475569]/80 shadow-[inset_0_2px_6px_rgba(0,0,0,0.8),0_3px_10px_rgba(0,0,0,0.75)] flex items-center justify-between gap-2.5 shrink-0 my-1">
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between text-[10px] sm:text-[10.5px] font-black text-amber-100/90 tracking-wide uppercase">
                <span>EXPEDICIÓN • {currentChapter.theme}</span>
                <span className="font-mono text-amber-200 text-[10px] sm:text-[10.5px]">
                  {chapterClearedCount}/{chapterTotalCount}
                </span>
              </div>

              <div className="relative w-full h-4 sm:h-4.5 rounded-full bg-[#090b10] border border-[#334155] p-0.5 overflow-hidden shadow-inner">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#b45309] via-[#f59e0b] to-[#fde047] shadow-[0_0_10px_rgba(245,158,11,0.8)] transition-all duration-500"
                  style={{
                    width: `${chapterTotalCount > 0 ? Math.min(100, (chapterClearedCount / chapterTotalCount) * 100) : 0}%`,
                  }}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleClaimGoldChest}
              className={`relative w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#0b0e14] border-2 border-[#475569] flex items-center justify-center shrink-0 shadow-md cursor-pointer hover:scale-105 active:scale-95 transition-transform ${
                isGoldDungeonFullyCompleted && !goldChestClaimed ? 'ring-2 ring-amber-400/90 animate-pulse' : ''
              }`}
              title="Cofre de la Diosa Midas"
            >
              <img
                src="/assets/items/cofre_cerrado.webp"
                alt="Cofre de Midas"
                className="w-8.5 h-8.5 sm:w-9 sm:h-9 object-contain drop-shadow-[0_0_8px_rgba(245,158,11,0.85)]"
              />
            </button>
          </div>

          {/* ESTADO DE LA EXPEDICIÓN (ROGUELITE) */}
          <div className="relative w-full rounded-xl px-2.5 py-1.5 bg-[#0b0e14]/92 border border-[#475569]/80 flex items-center justify-between gap-2 shrink-0 text-[9px] font-black uppercase tracking-wide">
            <span className="text-amber-200">CAP {currentChapter.id}</span>
            <span className="text-emerald-300 font-mono">❤ {Math.round(goldRun.hpPct * 100)}%</span>
            <span className="text-sky-300 font-mono">🔮 {goldRun.orbs}</span>
            <span className="text-amber-100 font-mono truncate">
              {runBoons.length > 0 ? runBoons.map((b) => b.icon).join(' ') : 'SIN POWER-UPS'}
            </span>
            {goldRun.finished && (
              <button
                type="button"
                onClick={() => {
                  sound.playSFX('victory');
                  setGoldRun(startGoldRun());
                  setGoldChapter(1);
                }}
                className="px-2 py-1 rounded-md bg-amber-500 hover:bg-amber-400 text-black font-black text-[8.5px] cursor-pointer"
              >
                NUEVA EXPEDICIÓN
              </button>
            )}
          </div>
          {lastBoon && (
            <div className="relative w-full flex items-center gap-1.5 px-1 pt-1 pb-0.5 text-[8.5px] font-black uppercase text-amber-200 shrink-0">
              <span>ÚLTIMO POWER-UP:</span>
              <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/50">
                {lastBoon.icon} {lastBoon.name}
              </span>
            </div>
          )}

          {/* SCROLLABLE GOLD MISSIONS LIST */}
          <div
            ref={goldScrollRef}
            onPointerDown={handleGoldPointerDown}
            onPointerMove={handleGoldPointerMove}
            onPointerUp={handleGoldPointerUp}
            onPointerCancel={handleGoldPointerUp}
            onPointerLeave={handleGoldPointerUp}
            className="w-full flex-1 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden scroll-smooth flex flex-col gap-2.5 sm:gap-3 mt-1.5 pb-28 sm:pb-32 cursor-grab active:cursor-grabbing touch-pan-y"
          >
            {visibleGoldMissions.map((mission) => {
              const isLocked = !isGoldMissionUnlocked(mission);
              const isCompleted = !isLocked && goldRun.cleared.includes(mission.progressId);
              const earnedStars = isCompleted
                ? Math.max(0, Math.min(3, questProgress.stars?.[mission.progressId] ?? 3))
                : 0;

              // Las misiones cerradas usan el mismo diseño de candado que Historia:
              // silueta oscura, descripción atenuada y candado visible a la derecha.
              if (isLocked) {
                return (
                  <div
                    key={mission.progressId}
                    className="relative w-full h-[90px] sm:h-[94px] rounded-xl overflow-hidden flex items-center px-3 sm:px-3.5 py-2 bg-[#180a04]/90 border border-[#3b170c] shadow-inner opacity-85 shrink-0"
                  >
                    <div className="relative w-14 h-14 sm:w-15 sm:h-15 rounded-lg overflow-hidden bg-[#0c0402] border-2 border-[#381406] shrink-0 shadow-inner flex items-center justify-center">
                      <div className="w-7 h-7 rounded-full bg-[#1c0a03] mb-1.5" />
                      <div className="absolute bottom-0.5 w-9 h-4.5 rounded-t-full bg-[#1c0a03]" />
                      <img
                        src="/assets/items/CANDADO.webp"
                        alt="Bloqueado"
                        className="absolute w-5 h-5.5 object-contain drop-shadow"
                      />
                    </div>
                    <div className="relative flex-1 min-w-0 pl-3 flex flex-col justify-center space-y-0.5">
                      <h4 className="font-serif font-black text-xs sm:text-[13px] text-stone-300 truncate">
                        {mission.title}
                      </h4>
                      <p className="text-[9px] sm:text-[9.5px] text-stone-400 font-medium line-clamp-1">
                        {mission.description}
                      </p>
                    </div>
                    <div className="relative flex items-center gap-1.5 pr-1.5 shrink-0">
                      <span className="text-[10px] sm:text-[10.5px] font-black uppercase tracking-wider text-[#ef4444] drop-shadow-[0_1px_1px_rgba(0,0,0,0.9)]">
                        BLOQUEADO
                      </span>
                      <img
                        src="/assets/items/CANDADO.webp"
                        alt="Bloqueado"
                        className="w-4 h-4.5 object-contain drop-shadow"
                      />
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={mission.progressId}
                  onClick={() => !isLocked && handleLaunchGoldMission(mission)}
                  className={`relative w-full h-[98px] sm:h-[102px] rounded-xl overflow-hidden flex items-center px-3 sm:px-3.5 py-2 sm:py-2.5 shrink-0 border-2 ${
                    isLocked
                      ? 'border-[#333947] bg-gradient-to-b from-[#1b1f27] via-[#14171e] to-[#0e1016] opacity-75 cursor-default'
                      : 'border-[#525b6e] bg-gradient-to-b from-[#292e3a] via-[#1c2029] to-[#13161d] cursor-pointer hover:brightness-110 hover:border-amber-500/60 active:scale-[0.99]'
                  } shadow-[inset_0_1px_0_rgba(255,255,255,0.12),inset_0_-2px_6px_rgba(0,0,0,0.75),0_4px_10px_rgba(0,0,0,0.7)] transition-all`}
                >
                  {/* Carved dungeon stone inner bevel highlight */}
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(251,191,36,0.08),transparent_55%)] pointer-events-none" />

                  {/* Portrait */}
                  <div
                    className={`relative z-10 w-[68px] h-[68px] sm:w-[72px] sm:h-[72px] rounded-xl overflow-hidden bg-[#0c0f15] border-[2.5px] ${
                      isLocked ? 'border-stone-600' : 'border-[#b45309]'
                    } shrink-0 shadow-[inset_0_2px_4px_rgba(0,0,0,0.9),0_2px_6px_rgba(0,0,0,0.65)] flex items-center justify-center`}
                  >
                    <img
                      src={mission.portrait}
                      alt={mission.title}
                      referrerPolicy="no-referrer"
                      style={
                        mission.isMidasStatuePortrait
                          ? { filter: 'sepia(0.78) saturate(2.1) brightness(1.06) contrast(1.06)' }
                          : undefined
                      }
                      className={`w-full h-full pointer-events-none select-none transition-transform duration-300 ${
                        mission.portraitClass || 'object-contain scale-[1.5] origin-top'
                      }`}
                    />
                  </div>

                  {/* Details */}
                  <div className="relative z-10 flex-1 min-w-0 pl-3 pr-2 flex flex-col justify-center space-y-0.5 sm:space-y-1">
                    <div className="flex flex-col items-start gap-1">
                      <h4 className="max-w-full font-serif font-black text-xs sm:text-[13px] text-amber-100 truncate drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)]">
                        {mission.title}
                      </h4>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-1.5 py-0.2 rounded-full font-sans font-black text-[7px] uppercase tracking-wide bg-amber-900/90 text-amber-200 border border-amber-500/40">
                          {isLocked ? 'Próximamente' : mission.roomBadgeLabel || 'Semiplano · 10 Salas'}
                        </span>
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full font-mono font-black text-[7.5px] bg-[#0b0e14]/90 text-amber-300 border border-amber-500/40">
                          <img src="/assets/items/moneda_de_moonhaven.webp" alt="" referrerPolicy="no-referrer" className="w-2.5 h-2.5 object-contain" />
                          +{mission.goldReward.toLocaleString()} Oro
                        </span>
                        {!isLocked && mission.dropPreview && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full font-sans font-black text-[7px] bg-purple-950/90 text-purple-200 border border-purple-400/40">
                            <img src={mission.dropPreview.icon} alt="" referrerPolicy="no-referrer" className="w-2.5 h-2.5 object-contain" />
                            +{mission.dropPreview.count} {mission.dropPreview.name}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-[9.5px] sm:text-[10px] text-stone-300 leading-snug font-medium line-clamp-2">
                      {mission.description}
                    </p>
                    <span className="text-[9px] sm:text-[9.5px] font-bold tracking-wide leading-none pt-0.5 text-amber-300/90 truncate max-w-full">
                      {goldChapterTheme(mission.chapter)}
                    </span>
                  </div>

                  {/* Right Action Column */}
                  <div className="relative z-10 flex flex-col items-center justify-center shrink-0 pl-1 gap-1">
                    {isLocked ? (
                      <div className="w-[86px] sm:w-[92px] py-2 px-2 rounded-lg border border-stone-600/80 bg-[#0d1017] text-stone-400 flex flex-col items-center justify-center gap-0.5">
                        <span className="text-[8.5px] font-black uppercase tracking-wider leading-tight">
                          BLOQUEADA
                        </span>
                      </div>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLaunchGoldMission(mission);
                          }}
                          className="w-[86px] sm:w-[92px] py-1.5 px-2 rounded-lg border border-[#fde68a]/50 bg-gradient-to-b from-[#f59e0b] via-[#d97706] to-[#92400e] shadow-[0_2px_8px_rgba(217,119,6,0.55)] hover:brightness-110 active:scale-95 transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5"
                          title={`Entrar a ${mission.title}`}
                        >
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3].map((starIdx) => (
                              <img
                                key={starIdx}
                                src={
                                  earnedStars >= starIdx
                                    ? '/assets/items/estrella_mejora.webp'
                                    : '/assets/items/estrella_bronce.webp'
                                }
                                alt=""
                                className="w-3 h-3 sm:w-3.5 sm:h-3.5 object-contain drop-shadow"
                              />
                            ))}
                          </div>
                          <span className="text-[10px] sm:text-[10.5px] font-black uppercase tracking-wider text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.9)] leading-tight">
                            {mission.actionLabel ?? (mission.directCombat ? 'JEFE' : isCompleted ? 'COMBATE' : 'ENTRAR')}
                          </span>
                        </button>
                        {isCompleted && !mission.directCombat && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLaunchGoldMission(mission, 'story');
                            }}
                            className="w-[86px] sm:w-[92px] py-0.5 px-2 rounded border border-amber-500/40 bg-[#0e121a]/90 hover:bg-amber-950/60 text-amber-200 text-[8.5px] font-black uppercase tracking-wider cursor-pointer transition-colors"
                            title="Volver a ver la visión de Midas"
                          >
                            VER HISTORIA
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* GOLD DUNGEON CHEST MODAL */}
        {showGoldChestModal && (
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowGoldChestModal(false);
            }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 select-none animate-fade-in"
          >
            <div className="relative w-full max-w-xs bg-[#141821] border-4 border-[#475569] rounded-2xl p-4 text-center text-stone-200 shadow-2xl space-y-3">
              <button
                type="button"
                onClick={() => setShowGoldChestModal(false)}
                className="absolute top-2.5 right-2.5 text-stone-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex justify-center pt-2">
                <img
                  src="/assets/items/cofre_abierto.webp"
                  alt="Cofre de la Diosa Midas"
                  className="w-20 h-20 object-contain drop-shadow-[0_0_15px_rgba(245,158,11,0.85)]"
                />
              </div>

              <h3 className="font-serif font-black text-base uppercase text-amber-300 drop-shadow">
                {isGoldDungeonFullyCompleted
                  ? '¡Cofre de la Diosa Midas!'
                  : 'Cofre de la Mazmorra de Midas'}
              </h3>

              <p className="text-xs text-stone-300">
                {isGoldDungeonFullyCompleted
                  ? '¡Has superado todas las pruebas y oleadas de la Mazmorra de Midas y reclamado el gran botín!'
                  : 'Supera los seis capítulos de la expedición para abrir este cofre.'}
              </p>

              <div className="flex items-center justify-center gap-4 py-2 bg-[#0b0e14] rounded-lg border border-[#334155]">
                <div className="flex items-center gap-1.5 text-xs font-black text-amber-400 font-mono">
                  <span>+15,000</span>
                  <img src="/assets/items/moneda_de_moonhaven.webp" alt="Oro" className="w-3.5 h-3.5 object-contain" />
                </div>
                <div className="flex items-center gap-1.5 text-xs font-black text-sky-400 font-mono">
                  <span>+300</span>
                  <img src="/assets/items/gema_del_recuerdo.webp" alt="Gemas" className="w-3.5 h-3.5 object-contain" />
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowGoldChestModal(false)}
                className="w-full py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:brightness-110 text-white font-black rounded-lg text-xs uppercase tracking-wider cursor-pointer shadow-lg active:scale-95 transition-transform"
              >
                Aceptar
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ----------------------------------------------------------------------
  // SURFACE ICESPEAR SANCTUARY VIEW
  // ----------------------------------------------------------------------
  return (
    <div className="relative w-full h-full min-h-0 flex-1 flex flex-col overflow-hidden select-none bg-[#090d18]">
      {/* Fondo de Icespear reutilizado del santuario original */}
      <img
        src="/assets/backgrounds/icespear_luces.webp"
        alt="Icespear"
        className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#07101e]/55 via-[#08101d]/35 to-[#05070d]/90 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(69,139,190,0.28),transparent_58%)] pointer-events-none" />

      {claimedNotice && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-40 bg-[#3b170c] border-2 border-amber-400 text-amber-200 px-4 py-1.5 rounded-lg text-xs font-bold shadow-2xl pointer-events-none">
          {claimedNotice}
        </div>
      )}

      {/* Tablero de actividades: tarjetas ilustradas con navegación real */}
      <div className="relative z-10 flex-1 min-h-0 overflow-y-auto no-scrollbar px-2.5 pt-1 pb-2 space-y-[7px]">
        <div className="px-1 flex items-end justify-between">
          <div>
            <div className="text-[9px] uppercase tracking-[0.28em] text-sky-200/80 font-bold">Bastión de Entrenamiento</div>
            <h2 className="text-[19px] leading-tight font-serif font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]">Centro de entrenamiento</h2>
          </div>
          <div className="text-[9px] uppercase tracking-widest text-amber-200/80 pb-1">Aventuras</div>
        </div>

        {/* Actividad destacada */}
        <button
          onClick={() => { sound.playSFX('click'); navigateTo('quest'); }}
          className="group relative w-full h-[126px] overflow-hidden rounded-lg border-[3px] border-[#b1844b] shadow-[0_5px_14px_rgba(0,0,0,0.8)] text-left ring-1 ring-black/70"
          title="Misiones especiales"
        >
          <img src="/assets/backgrounds/fondo_quest.webp" alt="" className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#17051e]/95 via-[#25072e]/45 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-white/5" />
          <div className="absolute left-4 bottom-3">
            <span className="inline-block rounded-full border border-fuchsia-200/60 bg-fuchsia-950/75 px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.2em] text-fuchsia-100">Contenido especial</span>
            <div className="mt-1 text-[21px] font-serif font-black italic text-white drop-shadow-[0_2px_3px_#000]">Misiones especiales</div>
            <div className="text-[9px] font-semibold text-amber-100/90">Explora mazmorras y desafíos</div>
          </div>
          <div className="absolute right-3 bottom-3 rounded-full border border-amber-200/70 bg-black/55 px-3 py-1 text-[9px] font-black text-amber-100">ENTRAR ›</div>
        </button>

        {/* Farmeo de oro: cartel de la Mazmorra de Midas */}
        <button
          onClick={() => { sound.playSFX('coin'); setBastionView('gold_missions'); }}
          className="group relative block w-full text-left bg-transparent border-0 p-0 cursor-pointer"
          title="Mazmorra de Midas"
        >
          <img
            src="/assets/backgrounds/mazmorra_midas_boton.webp"
            alt="Mazmorra de Midas"
            className="block w-full h-auto transition-transform duration-300 group-hover:scale-[1.02] drop-shadow-[0_6px_14px_rgba(0,0,0,0.55)]"
          />
        </button>

        {/* Evolución y mejora */}
        <div className="grid grid-cols-2 gap-[7px]">
          <button
            onClick={() => { sound.playSFX('click'); navigateTo('heroes'); }}
            className="group relative h-[112px] overflow-hidden rounded-lg border-[3px] border-[#a77b49] shadow-[0_5px_13px_rgba(0,0,0,0.75)] text-left ring-1 ring-black/70"
            title="Evolucionar héroes"
          >
            <img src="/assets/backgrounds/fondo_personajes.webp" alt="" className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#100718]/95 via-[#160c20]/30 to-transparent" />
            <img src="/assets/items/ascender boton.webp" alt="" className="absolute left-1 top-1 w-12 h-12 object-contain drop-shadow-lg" />
            <div className="absolute left-2 bottom-2">
              <div className="text-[17px] leading-none font-serif font-black italic text-white drop-shadow-[0_2px_3px_#000]">Evolucionar</div>
              <div className="text-[8px] font-bold text-amber-200 mt-1">Despierta su potencial</div>
            </div>
            <span className="absolute right-2 top-2 text-amber-200 text-lg drop-shadow">›</span>
          </button>

          <button
            onClick={() => { sound.playSFX('skill'); navigateTo('forge'); }}
            className="group relative z-10 h-[112px] w-full bg-transparent border-0 p-0 cursor-pointer active:scale-[0.97]"
            title="Mejora de equipo"
          >
            <img
              src="/assets/backgrounds/granja_xp_boton.webp"
              alt="Mejora"
              className="absolute inset-0 block w-full h-full -translate-y-2 scale-y-[1.18] rounded-lg object-fill transition-transform duration-300 group-hover:-translate-y-2 group-hover:scale-y-[1.22] group-hover:scale-x-[1.03] drop-shadow-[0_5px_12px_rgba(0,0,0,0.55)]"
            />
          </button>
        </div>

        {/* Evento de batalla */}
        <button
          onClick={() => { sound.playSFX('click'); navigateTo('quest'); }}
          className="group relative w-full h-[82px] overflow-hidden rounded-lg border-[3px] border-[#b18b50] shadow-[0_5px_13px_rgba(0,0,0,0.75)] text-left ring-1 ring-black/70"
          title="Eventos de batalla"
        >
          <img src="/assets/backgrounds/fondo_historia.webp" alt="" className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#071827]/90 via-[#102b38]/45 to-[#17080a]/55" />
          <div className="absolute left-3 bottom-2">
            <div className="text-[18px] leading-none font-serif font-black italic text-white drop-shadow-[0_2px_3px_#000]">Evento de batalla</div>
            <div className="text-[8px] font-bold text-sky-100 mt-1">Desafíos y recompensas especiales</div>
          </div>
          <div className="absolute right-3 top-2 rounded-md border border-cyan-200/70 bg-cyan-950/75 px-2 py-1 text-[8px] font-black text-cyan-100">EVENTO</div>
          <span className="absolute right-3 bottom-2 text-amber-100 text-lg">›</span>
        </button>

      </div>

      {/* Bond / Affection Modal */}
      {showBondModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-4">
          <div className="wood-frame max-w-sm w-full p-5 rounded-2xl space-y-4 text-center border-2 border-amber-700 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-amber-900/60">
              <div className="flex items-center gap-2 text-amber-200 font-serif font-black text-sm">
                <Heart className="w-4 h-4 text-red-500 fill-current" />
                <span>Vínculos de Compañerismo</span>
              </div>
              <button
                onClick={() => setShowBondModal(false)}
                className="text-stone-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-stone-300 leading-relaxed">
              Pasa tiempo con tus héroes en la taberna y completa misiones conjuntas para desbloquear diálogos especiales y estadísticas pasivas de combate.
            </p>
            <div className="bg-[#1b0a04] border border-[#521c08] rounded-xl p-3 text-left space-y-2 text-xs">
              <div className="flex items-center justify-between text-stone-300">
                <span>Magordito (Afecto Lv.4)</span>
                <span className="text-cyan-400 font-bold">+8% Daño Necrótico</span>
              </div>
              <div className="flex items-center justify-between text-stone-300">
                <span>Pepe Loux (Afecto Lv.3)</span>
                <span className="text-amber-400 font-bold">+8% Defensa</span>
              </div>
              <div className="flex items-center justify-between text-stone-300">
                <span>Kairon (Afecto Lv.5)</span>
                <span className="text-amber-400 font-bold">+10% Daño Sagrado</span>
              </div>
            </div>
            <button
              onClick={() => setShowBondModal(false)}
              className="w-full py-2 bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-600 hover:to-amber-500 text-white font-bold text-xs rounded-lg shadow-md cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Blessing / Tribute Modal */}
      {showBlessingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-4">
          <div className="wood-frame max-w-sm w-full p-5 rounded-2xl space-y-4 text-center border-2 border-amber-700 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-amber-900/60">
              <div className="flex items-center gap-2 text-amber-200 font-serif font-black text-sm">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Tributo del Santuario</span>
              </div>
              <button
                onClick={() => setShowBlessingModal(false)}
                className="text-stone-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-stone-300 leading-relaxed">
              El Santuario de Icespear acumula tributo de oro de manera pasiva mientras exploras o descansas.
            </p>
            <div className="bg-[#1b0a04] border border-[#521c08] rounded-xl p-4 text-center space-y-2">
              <span className="text-xs text-stone-400 uppercase tracking-widest">Tributo Acumulado</span>
              <div className="text-2xl font-mono font-black text-amber-300">
                +{idleEarningsAvailable.toLocaleString()} Oro
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  handleClaimTribute();
                  setShowBlessingModal(false);
                }}
                disabled={idleEarningsAvailable <= 0}
                className={`flex-1 py-2 font-bold text-xs rounded-lg shadow-md transition-all ${
                  idleEarningsAvailable > 0
                    ? 'bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-black cursor-pointer'
                    : 'bg-stone-800 text-stone-500 cursor-not-allowed'
                  }`}
              >
                Reclamar Tributo
              </button>
              <button
                onClick={() => setShowBlessingModal(false)}
                className="py-2 px-4 bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs rounded-lg cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
