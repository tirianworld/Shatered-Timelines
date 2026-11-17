import React, { useState, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { sound } from '../services/soundService';
import { Compass, X } from 'lucide-react';

type PlaneCategoryTab = 'carta' | 'interiores' | 'elementales' | 'exteriores';
type PlayablePlaneId = 'plano_material' | 'plano_suenos';

interface PlaneLoreEntry {
  id: string;
  name: string;
  shortName: string;
  tab: Exclude<PlaneCategoryTab, 'carta'>;
  category: string;
  description: string;
  unlockHint: string;
  portrait: string;
  portraitClass?: string;
  playablePlaneId?: PlayablePlaneId;
  chartPos?: { xPercent: number; yPercent: number; size: 'lg' | 'md' | 'sm' };
}

const COSMOLOGICAL_PLANES: PlaneLoreEntry[] = [
  {
    id: 'plano_material',
    name: 'Plano Material',
    shortName: 'Material',
    tab: 'interiores',
    category: 'Núcleo Cosmológico · Mundo Mortal',
    description:
      'El plano mortal donde se alzan la Aldea de Icespear, Glimmerstone y la Mansión Ferton. Hogar de Caldo de Dragón y ancla de los ecos planares.',
    unlockHint: 'Siempre accesible desde la Rosa de los Vientos.',
    portrait: '/assets/backgrounds/icespear_icono_inkarnate.webp',
    playablePlaneId: 'plano_material',
    chartPos: { xPercent: 50, yPercent: 50, size: 'lg' },
  },
  {
    id: 'plano_suenos',
    name: 'Plano de los Sueños',
    shortName: 'Sueños',
    tab: 'interiores',
    category: 'Plano Onírico · Dominio de Varianthel',
    description:
      'Islas flotantes de cristal violeta, cascadas estelares y ruinas oníricas bajo la mirada del Príncipe Varianthel. Aquí se alza El Coliseo de los Sueños.',
    unlockHint: 'Completa la Misión 21 («El Coliseo de los Sueños y Varianthel») en el Capítulo V para abrir este portal.',
    portrait: '/assets/portraits/coliseo_onirico_thumb.webp',
    playablePlaneId: 'plano_suenos',
    chartPos: { xPercent: 40, yPercent: 34, size: 'md' },
  },
  {
    id: 'feywild',
    name: 'Feywild',
    shortName: 'Feywild',
    tab: 'interiores',
    category: 'Plano Eco · Floresta Feérica',
    description:
      'Reflejo desbordante y salvaje del mundo mortal, bañado en crepúsculo perpetuo, magia feérica y cortes de archifatas.',
    unlockHint: 'Las sendas hacia la Floresta Feérica permanecen selladas en este ciclo astral.',
    portrait: '/assets/portraits/plano_feywild_thumb.webp',
    chartPos: { xPercent: 63, yPercent: 43, size: 'md' },
  },
  {
    id: 'shadowfell',
    name: 'Shadowfell',
    shortName: 'Shadowfell',
    tab: 'interiores',
    category: 'Plano Eco · Páramo Sombrío',
    description:
      'Reflejo sombrío y ceniciento del Plano Material, envuelto en nieblas perpetuas donde los recuerdos pierden su color y calor.',
    unlockHint: 'Los umbrales del Páramo Sombrío aguardan ser descifrados más allá del Velo.',
    portrait: '/assets/portraits/plano_shadowfell_thumb.webp',
    chartPos: { xPercent: 46, yPercent: 66, size: 'md' },
  },
  {
    id: 'plano_agua',
    name: 'Plano del Agua',
    shortName: 'Agua',
    tab: 'elementales',
    category: 'Plano Elemental Cardinal · Norte',
    description:
      'Océano infinito sin fondo ni superficie fija, surcado por corrientes abisales, arrecifes bioluminiscentes y ciudadelas marid.',
    unlockHint: 'Corriente elemental sellada por la Rosa de los Vientos.',
    portrait: '/assets/portraits/plano_agua_thumb.webp',
    chartPos: { xPercent: 50, yPercent: 14, size: 'md' },
  },
  {
    id: 'plano_tierra',
    name: 'Plano de la Tierra',
    shortName: 'Tierra',
    tab: 'elementales',
    category: 'Plano Elemental Cardinal · Este',
    description:
      'Cordilleras interminables de granito, cavernas de gemas vivientes y vetas minerales custodiadas por dao y titanes pétreos.',
    unlockHint: 'Corriente elemental sellada por la Rosa de los Vientos.',
    portrait: '/assets/portraits/plano_tierra_thumb.webp',
    chartPos: { xPercent: 84, yPercent: 49, size: 'md' },
  },
  {
    id: 'plano_fuego',
    name: 'Plano del Fuego',
    shortName: 'Fuego',
    tab: 'elementales',
    category: 'Plano Elemental Cardinal · Sur',
    description:
      'Mares de brasas incandescentes, cielos de ceniza dorada y la legendaria Ciudad de Bronce gobernada por sultanes efrit.',
    unlockHint: 'Corriente elemental sellada por la Rosa de los Vientos.',
    portrait: '/assets/portraits/elemental_fuego_icono.webp',
    chartPos: { xPercent: 50, yPercent: 85, size: 'md' },
  },
  {
    id: 'plano_aire',
    name: 'Plano del Aire',
    shortName: 'Aire',
    tab: 'elementales',
    category: 'Plano Elemental Cardinal · Oeste',
    description:
      'Bóveda celeste sin límites donde islas suspendidas navegan entre vientos alisios, tempestades eléctricas y palacios djinn.',
    unlockHint: 'Corriente elemental sellada por la Rosa de los Vientos.',
    portrait: '/assets/portraits/elemental_aire_thumb.webp',
    chartPos: { xPercent: 17, yPercent: 49, size: 'md' },
  },
  {
    id: 'semiplano_hielo',
    name: 'Semiplano del Hielo',
    shortName: 'Hielo',
    tab: 'elementales',
    category: 'Semiplano Paraelemental · Aire y Agua',
    description:
      'Frontera glaciar donde los vendavales del Aire congelan las mareas del Agua en catedrales de escarcha eterna.',
    unlockHint: 'Frontera paraelemental sellada en el anillo interior.',
    portrait: '/assets/backgrounds/cueva_congelada.webp',
    chartPos: { xPercent: 25, yPercent: 24, size: 'sm' },
  },
  {
    id: 'semiplano_barro',
    name: 'Semiplano del Barro',
    shortName: 'Barro',
    tab: 'elementales',
    category: 'Semiplano Paraelemental · Agua y Tierra',
    description:
      'Extensión pantanosa y fangosa nacida de la confluencia constante entre la roca viva y las aguas primordiales.',
    unlockHint: 'Frontera paraelemental sellada en el anillo interior.',
    portrait: '/assets/backgrounds/minas_glimmerstone_profunda.webp',
    chartPos: { xPercent: 75, yPercent: 24, size: 'sm' },
  },
  {
    id: 'semiplano_magma',
    name: 'Semiplano de la Magma',
    shortName: 'Magma',
    tab: 'elementales',
    category: 'Semiplano Paraelemental · Tierra y Fuego',
    description:
      'Ríos de lava fundida y basaltos humeantes donde la piedra misma arde como hierro líquido.',
    unlockHint: 'Frontera paraelemental sellada en el anillo interior.',
    portrait: '/assets/backgrounds/despacho_ferton_llamas.webp',
    chartPos: { xPercent: 75, yPercent: 74, size: 'sm' },
  },
  {
    id: 'semiplano_ceniza',
    name: 'Semiplano de la Ceniza',
    shortName: 'Ceniza',
    tab: 'elementales',
    category: 'Semiplano Paraelemental · Fuego y Aire',
    description:
      'Desiertos grises de rescoldos apagados arrastrados por vendavales secos en los confines del fuego.',
    unlockHint: 'Frontera paraelemental sellada en el anillo interior.',
    portrait: '/assets/backgrounds/mansion_ferton_cenizas.webp',
    chartPos: { xPercent: 25, yPercent: 74, size: 'sm' },
  },
  {
    id: 'semiplano_polvo',
    name: 'Semiplano del Polvo',
    shortName: 'Polvo',
    tab: 'elementales',
    category: 'Semiplano Paraelemental',
    description:
      'Dunas de polvo seco y estático suspendido en quietud absoluta entre la Tierra y los vientos menores.',
    unlockHint: 'Frontera paraelemental sellada en el anillo interior.',
    portrait: '/assets/backgrounds/cueva_titan_underdark.webp',
  },
  {
    id: 'semiplano_vapor',
    name: 'Semiplano del Vapor',
    shortName: 'Vapor',
    tab: 'elementales',
    category: 'Semiplano Paraelemental',
    description:
      'Brumas hirvientes y nubes densas donde el agua y el calor danzan entre géiseres suspendidos en el cielo.',
    unlockHint: 'Frontera paraelemental sellada en el anillo interior.',
    portrait: '/assets/backgrounds/segunda_camara_aire.webp',
  },
  {
    id: 'quasiplanos',
    name: 'Quasiplanos Elementales',
    shortName: 'Quasiplanos',
    tab: 'elementales',
    category: 'Abisal · Glacial · Tormenta · Cristal · Sal · Foresta · Humo · Metal',
    description:
      'Nueve reinos fronterizos donde la materia elemental cristaliza en formas singulares: Abisal, Glacial, Tormenta, Arrecife, Cristal, Sal, Foresta, Humo y Metal.',
    unlockHint: 'Nueve dominios menores accesibles únicamente por convergencia elemental.',
    portrait: '/assets/backgrounds/tercera_camara_portal_suenos.webp',
  },
  {
    id: 'plano_astral',
    name: 'Plano Astral',
    shortName: 'Astral',
    tab: 'exteriores',
    category: 'Mar Plateado Cosmológico',
    description:
      'El océano plateado del pensamiento que envuelve los Planos Interiores y tiende puentes hacia los dominios exteriores.',
    unlockHint: 'Navegable solo mediante navíos astrales o conjuros de proyección.',
    portrait: '/assets/portraits/plano_astral_thumb.webp',
  },
  {
    id: 'paraiso',
    name: 'Paraíso',
    shortName: 'Paraíso',
    tab: 'exteriores',
    category: 'Plano Exterior Superior',
    description:
      'Cumbres luminosas, cascadas doradas y valles serenos donde moran las huestes celestiales y los espíritus justos.',
    unlockHint: 'Dominio exterior fuera del alcance mortal actual.',
    portrait: '/assets/portraits/plano_paraiso_thumb.webp',
  },
  {
    id: 'purgatorio',
    name: 'Purgatorio',
    shortName: 'Purgatorio',
    tab: 'exteriores',
    category: 'Plano Exterior Liminal',
    description:
      'Mesetas doradas y mares tranquilos de prueba suspendidos entre el Mar Astral y los reinos eternos.',
    unlockHint: 'Dominio exterior fuera del alcance mortal actual.',
    portrait: '/assets/backgrounds/salon_mansion_baron.webp',
  },
  {
    id: 'nueve_infiernos',
    name: 'Los Nueve Infiernos',
    shortName: '9 Infiernos',
    tab: 'exteriores',
    category: 'Plano Exterior Infernal',
    description:
      'Nueve círculos de basalto, lava y hierro forjados bajo la férrea jerarquía de los archidiablos.',
    unlockHint: 'Los pactos infernales mantienen cerradas sus puertas férreas.',
    portrait: '/assets/backgrounds/despacho_ferton_llamas.webp',
  },
  {
    id: 'el_abismo',
    name: 'El Abismo',
    shortName: 'El Abismo',
    tab: 'exteriores',
    category: 'Plano Exterior Caótico',
    description:
      'Fosa infinita de caos primordial y corrupción demoníaca de donde emergen horrores como el Bulezau.',
    unlockHint: 'Abismo sellado para proteger el equilibrio del Plano Material.',
    portrait: '/assets/portraits/bulezau_thumb.webp',
  },
];

export const PlanesView: React.FC = () => {
  const {
    activeWorldPlane,
    setActiveWorldPlane,
    isDreamPlaneUnlocked,
    navigateTo,
  } = useGame();

  const effectivePlane: PlayablePlaneId =
    activeWorldPlane === 'plano_suenos' && isDreamPlaneUnlocked
      ? 'plano_suenos'
      : 'plano_material';

  const [activeTab, setActiveTab] = useState<PlaneCategoryTab>('carta');
  const [selectedChartPlaneId, setSelectedChartPlaneId] = useState<string>(effectivePlane);
  const [lockedNoticePlane, setLockedNoticePlane] = useState<PlaneLoreEntry | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const isDraggingContentRef = useRef(false);
  const contentStartYRef = useRef(0);
  const contentScrollStartRef = useRef(0);

  const handleContentPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest('button')) return;
    const el = scrollContainerRef.current;
    if (!el) return;
    isDraggingContentRef.current = true;
    contentStartYRef.current = e.clientY;
    contentScrollStartRef.current = el.scrollTop;
  };

  const handleContentPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingContentRef.current) return;
    const el = scrollContainerRef.current;
    if (!el) return;
    const dy = e.clientY - contentStartYRef.current;
    el.scrollTop = contentScrollStartRef.current - dy;
  };

  const handleContentPointerUp = () => {
    isDraggingContentRef.current = false;
  };

  const isPlaneUnlocked = (plane: PlaneLoreEntry): boolean => {
    if (plane.id === 'plano_material') return true;
    if (plane.id === 'plano_suenos') return isDreamPlaneUnlocked;
    return false;
  };

  const handleSelectTab = (tab: PlaneCategoryTab) => {
    sound.playSFX('click');
    setActiveTab(tab);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  };

  const handlePlaneAction = (plane: PlaneLoreEntry) => {
    sound.playSFX('click');
    if (plane.playablePlaneId && isPlaneUnlocked(plane)) {
      if (effectivePlane !== plane.playablePlaneId) {
        setActiveWorldPlane(plane.playablePlaneId);
      }
      navigateTo('world');
      return;
    }
    setLockedNoticePlane(plane);
  };

  const unlockedCount = COSMOLOGICAL_PLANES.filter(isPlaneUnlocked).length;
  const chartPlanes = COSMOLOGICAL_PLANES.filter((p) => p.chartPos);
  const outerQuickPlanes = COSMOLOGICAL_PLANES.filter((p) => p.tab === 'exteriores');
  const selectedChartPlane =
    COSMOLOGICAL_PLANES.find((p) => p.id === selectedChartPlaneId) ?? COSMOLOGICAL_PLANES[0];
  const filteredPlanes =
    activeTab === 'carta'
      ? [selectedChartPlane]
      : COSMOLOGICAL_PLANES.filter((p) => p.tab === activeTab);

  const renderPlaneCard = (plane: PlaneLoreEntry) => {
    const unlocked = isPlaneUnlocked(plane);
    const isActiveHere = Boolean(plane.playablePlaneId && effectivePlane === plane.playablePlaneId);

    if (unlocked) {
      return (
        <div
          key={plane.id}
          onClick={() => handlePlaneAction(plane)}
          className="relative w-full h-[98px] sm:h-[102px] rounded-xl overflow-hidden flex items-center px-3 sm:px-3.5 py-2 shadow-md shrink-0 cursor-pointer hover:brightness-105 active:scale-[0.99] transition-all"
        >
          <img
            src="/assets/items/HISTORIA NIVEL BOTON.webp"
            alt=""
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none z-0"
          />
          <div className="relative z-10 w-[68px] h-[68px] sm:w-[72px] sm:h-[72px] rounded-xl overflow-hidden bg-[#100703] border-[2.5px] border-[#9e521e] shrink-0 shadow-[inset_0_2px_4px_rgba(0,0,0,0.85),0_2px_4px_rgba(0,0,0,0.5)] flex items-center justify-center">
            <img
              src={plane.portrait}
              alt={plane.name}
              referrerPolicy="no-referrer"
              className={`w-full h-full object-cover pointer-events-none select-none ${
                plane.portraitClass || ''
              }`}
            />
          </div>
          <div className="relative z-10 flex-1 min-w-0 pl-3 pr-2 flex flex-col justify-center space-y-0.5">
            <h4 className="font-serif font-black text-xs sm:text-[13px] text-[#3d1908] truncate drop-shadow-[0_1px_0_rgba(255,255,255,0.4)]">
              {plane.name}
            </h4>
            <p className="text-[8.5px] sm:text-[9px] font-black uppercase tracking-wide text-[#7c3511] truncate">
              {plane.category}
            </p>
            <p className="text-[9.5px] sm:text-[10px] text-[#4d240e] leading-snug font-medium line-clamp-2">
              {plane.description}
            </p>
          </div>
          <div className="relative z-10 flex flex-col items-center justify-center shrink-0 pl-1">
            {isActiveHere ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePlaneAction(plane);
                }}
                className="w-[82px] sm:w-[88px] py-1.5 px-2 rounded-lg border border-amber-300/70 bg-gradient-to-b from-[#166534] via-[#15803d] to-[#14532d] shadow-[0_2px_8px_rgba(20,83,45,0.65)] hover:brightness-110 active:scale-95 transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5"
                title={`Volver al mapa de ${plane.name}`}
              >
                <img
                  src="/assets/items/estrella_mejora.webp"
                  alt=""
                  referrerPolicy="no-referrer"
                  className="w-3.5 h-3.5 object-contain drop-shadow"
                />
                <span className="text-[9.5px] font-black uppercase tracking-wider text-amber-100 drop-shadow-[0_1px_1px_rgba(0,0,0,0.9)] leading-tight whitespace-nowrap">
                  ACTIVO
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePlaneAction(plane);
                }}
                className="w-[82px] sm:w-[88px] py-2 px-2 rounded-lg border border-[#fed7aa]/50 bg-gradient-to-b from-[#f97316] via-[#ea580c] to-[#c2410c] shadow-[0_2px_8px_rgba(234,88,12,0.6)] hover:brightness-110 active:scale-95 transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5"
                title={`Viajar a ${plane.name}`}
              >
                <Compass className="w-3.5 h-3.5 text-amber-100 drop-shadow" />
                <span className="text-[10px] font-black uppercase tracking-wider text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.9)] leading-tight whitespace-nowrap">
                  VIAJAR
                </span>
              </button>
            )}
          </div>
        </div>
      );
    }

    return (
      <div
        key={plane.id}
        onClick={() => handlePlaneAction(plane)}
        className="relative w-full h-[94px] sm:h-[98px] rounded-xl overflow-hidden flex items-center px-3 sm:px-3.5 py-2 bg-[#180a04]/90 border border-[#4a1c0b] shadow-inner shrink-0 cursor-pointer hover:brightness-110 active:scale-[0.99] transition-all"
      >
        <div className="relative w-[64px] h-[64px] rounded-xl overflow-hidden bg-[#0c0402] border-2 border-[#381406] shrink-0 shadow-inner flex items-center justify-center">
          <img
            src={plane.portrait}
            alt={plane.name}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover opacity-45 grayscale-[35%] pointer-events-none select-none"
          />
          <img
            src="/assets/items/CANDADO.webp"
            alt="Sellado"
            referrerPolicy="no-referrer"
            className="absolute w-5 h-5.5 object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)] pointer-events-none"
          />
        </div>
        <div className="relative flex-1 min-w-0 pl-3 pr-2 flex flex-col justify-center space-y-0.5">
          <h4 className="font-serif font-black text-xs sm:text-[13px] text-amber-100/90 truncate">
            {plane.name}
          </h4>
          <p className="text-[8.5px] font-bold uppercase tracking-wide text-amber-400/80 truncate">
            {plane.category}
          </p>
          <p className="text-[9.5px] text-stone-300/85 leading-snug line-clamp-2">
            {plane.description}
          </p>
        </div>
        <div className="relative flex flex-col items-center justify-center gap-1 pr-0.5 shrink-0 w-[76px]">
          <img
            src="/assets/items/CANDADO.webp"
            alt="Sellado"
            referrerPolicy="no-referrer"
            className="w-4 h-4.5 object-contain drop-shadow opacity-90"
          />
          <span className="text-[9.5px] font-black uppercase tracking-wider text-stone-300 drop-shadow-[0_1px_1px_rgba(0,0,0,0.9)] whitespace-nowrap">
            SELLADO
          </span>
        </div>
      </div>
    );
  };

  const tabs: Array<{ id: PlaneCategoryTab; topLabel: string; subLabel: string }> = [
    { id: 'carta', topLabel: 'CARTA', subLabel: 'COSMOLÓGICA' },
    { id: 'interiores', topLabel: 'PLANOS', subLabel: 'INTERIORES' },
    { id: 'elementales', topLabel: 'ELEMENTOS', subLabel: 'SEMIPLANOS' },
    { id: 'exteriores', topLabel: 'ASTRAL Y', subLabel: 'EXTERIORES' },
  ];

  return (
    <div className="relative w-full h-full flex flex-col justify-start bg-transparent select-none overflow-hidden">
      {/* 1. Hand-painted carved wooden planar board background */}
      <img
        src="/assets/backgrounds/fondo_rosa_vientos.webp"
        alt="Tablón de la Rosa de los Vientos"
        referrerPolicy="no-referrer"
        className="absolute inset-0 w-full h-full object-cover object-top pointer-events-none select-none z-0"
      />

      {/* 2. Top wooden plank tabs aligned strictly over the top wooden bar (0.8% -> 13.3% of image width) */}
      <div className="relative z-20 w-full px-[4.5%] shrink-0">
        <div className="w-full" style={{ paddingTop: '1.0%' }}>
          <div className="relative w-full" style={{ paddingTop: '12.6%' }}>
            <div className="absolute inset-0 flex items-center gap-1.5">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => handleSelectTab(tab.id)}
                    className={`relative flex-1 h-full max-h-[42px] rounded-md flex flex-col items-center justify-center cursor-pointer transition-all px-1 ${
                      isActive
                        ? 'brightness-115 scale-[1.03] drop-shadow-[0_0_10px_rgba(192,132,252,0.95)]'
                        : 'brightness-90 hover:brightness-110 drop-shadow-[0_1px_4px_rgba(0,0,0,0.7)]'
                    }`}
                  >
                    <img
                      src="/assets/items/boton_historia.webp"
                      alt=""
                      draggable={false}
                      referrerPolicy="no-referrer"
                      className="absolute inset-0 w-full h-full object-cover rounded-md pointer-events-none"
                    />
                    <span
                      className={`relative z-10 text-[8px] font-black uppercase leading-tight drop-shadow-[0_1px_1px_rgba(0,0,0,0.95)] whitespace-nowrap ${
                        isActive ? 'text-amber-100' : 'text-[#d6c2a5]'
                      }`}
                    >
                      {tab.topLabel}
                    </span>
                    <span
                      className={`relative z-10 text-[6.5px] font-bold uppercase leading-tight tracking-tight drop-shadow-[0_1px_1px_rgba(0,0,0,0.95)] whitespace-nowrap truncate max-w-full ${
                        isActive ? 'text-purple-200' : 'text-stone-300'
                      }`}
                    >
                      {tab.subLabel}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Panoramic Astral Sea & Astrolabe Window Spacer (locked to background width ratio) */}
      <div className="relative z-10 w-full shrink-0 pointer-events-none" style={{ paddingTop: '20.6%' }} />

      {/* 4. Main Content Area on Carved Wooden Planks */}
      <div className="relative z-10 w-full flex-1 flex flex-col px-[4.5%] pb-2 overflow-hidden min-h-0">
        {/* Dark Wood Summary Bar */}
        <div className="relative w-full rounded-2xl p-2 sm:p-2.5 bg-[#170803]/90 border-2 border-[#4a1c0b] shadow-[inset_0_2px_6px_rgba(0,0,0,0.7),0_3px_8px_rgba(0,0,0,0.7)] flex items-center justify-between gap-2.5 shrink-0 my-1">
          <div className="flex-1 min-w-0 space-y-0.5">
            <div className="flex items-center justify-between text-[10px] font-black text-[#d6c2a5] tracking-wide uppercase">
              <span className="truncate">ROSA DE LOS VIENTOS</span>
              <span className="font-mono tabular-nums text-amber-300 shrink-0 ml-2">
                {unlockedCount}/{COSMOLOGICAL_PLANES.length}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-serif font-black text-amber-100 truncate">
                {effectivePlane === 'plano_suenos'
                  ? 'Plano de los Sueños'
                  : 'Plano Material · Icespear'}
              </p>
              <button
                type="button"
                onClick={() => {
                  sound.playSFX('click');
                  navigateTo('world');
                }}
                className="px-2.5 py-1 rounded-md border border-amber-500/60 bg-[#2b1007] hover:bg-[#3d180c] text-amber-200 hover:text-white text-[9px] font-black uppercase tracking-wider shrink-0 cursor-pointer active:scale-95 transition-all whitespace-nowrap"
              >
                VER MAPA
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              sound.playSFX('click');
              navigateTo('world');
            }}
            className="relative w-11 h-11 rounded-xl bg-[#120502] border-2 border-[#4a1c0b] flex items-center justify-center shrink-0 shadow-md cursor-pointer hover:scale-105 active:scale-95 transition-transform"
            title="Volver al Mapa del Mundo"
          >
            <img
              src="/assets/items/rosa_vientos_icon.webp"
              alt="Volver al Mapa"
              referrerPolicy="no-referrer"
              className="w-9 h-9 object-contain drop-shadow-[0_0_6px_rgba(192,132,252,0.65)]"
            />
          </button>
        </div>

        {/* Scrollable Content */}
        <div
          ref={scrollContainerRef}
          onPointerDown={handleContentPointerDown}
          onPointerMove={handleContentPointerMove}
          onPointerUp={handleContentPointerUp}
          onPointerCancel={handleContentPointerUp}
          onPointerLeave={handleContentPointerUp}
          className="w-full flex-1 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden scroll-smooth flex flex-col gap-2.5 mt-1 pb-28 cursor-grab active:cursor-grabbing touch-pan-y"
        >
          {activeTab === 'carta' && (
            <>
              {/* Interactive Painted Cosmology Wheel */}
              <div className="relative w-full max-w-[274px] aspect-square mx-auto rounded-xl border-[3px] border-[#4a1c0b] bg-[#0d0618] shadow-[0_6px_18px_rgba(0,0,0,0.85)] overflow-hidden shrink-0">
                <img
                  src="/assets/backgrounds/rosa_vientos_carta_astral.webp"
                  alt="Carta Cosmológica de los Planos"
                  draggable={false}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover pointer-events-none select-none"
                />

                {chartPlanes.map((plane) => {
                  const pos = plane.chartPos!;
                  const isSelected = selectedChartPlaneId === plane.id;
                  const isActiveHere = Boolean(
                    plane.playablePlaneId && effectivePlane === plane.playablePlaneId
                  );
                  const unlocked = isPlaneUnlocked(plane);
                  const sizeClasses =
                    pos.size === 'lg'
                      ? 'w-11 h-11'
                      : pos.size === 'md'
                      ? 'w-8 h-8'
                      : 'w-6.5 h-6.5';

                  return (
                    <button
                      key={plane.id}
                      type="button"
                      onClick={() => {
                        sound.playSFX('click');
                        setSelectedChartPlaneId(plane.id);
                      }}
                      style={{
                        left: `${pos.xPercent}%`,
                        top: `${pos.yPercent}%`,
                      }}
                      className={`absolute -translate-x-1/2 -translate-y-1/2 ${sizeClasses} rounded-full cursor-pointer transition-transform focus:outline-none flex items-center justify-center ${
                        isSelected
                          ? 'ring-2 ring-amber-300 bg-amber-300/20 scale-115 shadow-[0_0_14px_rgba(251,191,36,0.95)] z-20'
                          : isActiveHere
                          ? 'ring-2 ring-emerald-300/90 bg-emerald-400/15 hover:scale-110 z-10'
                          : unlocked
                          ? 'ring-1 ring-purple-200/75 bg-purple-400/10 hover:scale-110 hover:ring-amber-200 z-10'
                          : 'hover:ring-2 hover:ring-amber-200/80 hover:bg-black/25 hover:scale-110 z-10'
                      }`}
                      title={plane.name}
                      aria-label={plane.name}
                    >
                      {isSelected && (
                        <span className="sr-only">{plane.name}</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Outer Realms Wooden Strip (Astral & Outer Realms not inside inner wheel) */}
              <div className="flex items-center gap-1 shrink-0">
                {outerQuickPlanes.map((plane) => {
                  const isSelected = selectedChartPlaneId === plane.id;
                  return (
                    <button
                      key={plane.id}
                      type="button"
                      onClick={() => {
                        sound.playSFX('click');
                        setSelectedChartPlaneId(plane.id);
                      }}
                      className={`relative flex-1 h-7 rounded-md flex items-center justify-center px-1 cursor-pointer transition-all overflow-hidden ${
                        isSelected
                          ? 'brightness-120 ring-1 ring-amber-300 shadow-[0_0_8px_rgba(251,191,36,0.75)]'
                          : 'brightness-85 hover:brightness-110'
                      }`}
                      title={plane.name}
                    >
                      <img
                        src="/assets/items/boton_historia.webp"
                        alt=""
                        draggable={false}
                        referrerPolicy="no-referrer"
                        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                      />
                      <span
                        className={`relative z-10 text-[7.5px] font-black uppercase truncate drop-shadow-[0_1px_1px_rgba(0,0,0,0.95)] ${
                          isSelected ? 'text-amber-100' : 'text-[#d6c2a5]'
                        }`}
                      >
                        {plane.shortName}
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* Selected Plane Card (on Carta tab) or Full Category Cards (on other tabs) */}
          {filteredPlanes.map(renderPlaneCard)}
        </div>
      </div>

      {/* 5. Sealed Realm Notice Modal (Matching QuestView wooden chest modal style) */}
      {lockedNoticePlane && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setLockedNoticePlane(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 select-none"
        >
          <div className="relative w-full max-w-xs bg-[#240c03] border-4 border-[#78350f] rounded-2xl p-4 text-center text-stone-200 shadow-2xl space-y-3">
            <button
              type="button"
              onClick={() => setLockedNoticePlane(null)}
              className="absolute top-2.5 right-2.5 text-stone-400 hover:text-white cursor-pointer"
              aria-label="Cerrar aviso"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="relative w-20 h-20 mx-auto rounded-xl overflow-hidden border-2 border-[#9e521e] bg-[#100703] flex items-center justify-center">
              <img
                src={lockedNoticePlane.portrait}
                alt={lockedNoticePlane.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover opacity-55"
              />
              <img
                src="/assets/items/CANDADO.webp"
                alt="Sellado"
                referrerPolicy="no-referrer"
                className="absolute w-7 h-8 object-contain drop-shadow-lg"
              />
            </div>

            <div className="space-y-1">
              <h3 className="font-serif font-black text-base text-amber-300 drop-shadow">
                {lockedNoticePlane.name}
              </h3>
              <p className="text-[10px] font-bold uppercase tracking-wider text-purple-300">
                {lockedNoticePlane.category}
              </p>
            </div>

            <p className="text-xs text-stone-300 leading-relaxed">
              {lockedNoticePlane.description}
            </p>

            <div className="py-2 px-3 rounded-lg bg-black/50 border border-[#521c08] text-[11px] text-amber-200/95 font-medium">
              {lockedNoticePlane.unlockHint}
            </div>

            <button
              type="button"
              onClick={() => {
                sound.playSFX('click');
                setLockedNoticePlane(null);
              }}
              className="w-full py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:brightness-110 text-white font-black rounded-lg text-xs uppercase tracking-wider cursor-pointer shadow-lg active:scale-95 transition-transform"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
