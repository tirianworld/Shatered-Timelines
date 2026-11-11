import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useGame } from '../context/GameContext';
import { sound } from '../services/soundService';
import {
  Swords,
  X,
  Shield,
  FlaskConical,
  Beer,
  Anvil,
  Skull,
  MapPin,
  Sparkles,
} from 'lucide-react';

export interface MapInteractiveLocation {
  id: string;
  name: string;
  subtitle: string;
  typeBadge: string;
  badgeStyle: string;
  description: string;
  top: string; // percentage string
  left: string; // percentage string
  widthPercent: number; // width relative to map canvas
  aspectRatio: string;
  imageSrc: string;
  actionLabel: string;
  actionIcon?: 'swords' | 'skull' | 'mapPin';
  action: () => void;
  quickLinks?: Array<{
    label: string;
    icon: 'potions' | 'tavern' | 'forge' | 'santuario' | 'quest';
    action: () => void;
  }>;
}

export const WorldMapView: React.FC = () => {
  const { navigateTo, setSelectedCombatMissionId, setActiveSanctuary, questProgress } = useGame();
  const [selectedLocation, setSelectedLocation] = useState<MapInteractiveLocation | null>(null);

  // Base dimensions matching icespear_map_8551bb2c (2048 x 1255 ratio = 1.6318)
  const baseWidth = 1224;
  const baseHeight = 750;
  const mapWidth = baseWidth;
  const mapHeight = baseHeight;

  // Container & Pan state
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 407, height: 680 });
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  // Drag tracking refs
  const isDraggingRef = useRef(false);
  const pointerStartRef = useRef({ x: 0, y: 0 });
  const panStartRef = useRef({ x: 0, y: 0 });
  const dragDistanceRef = useRef(0);
  const pointerCapturedRef = useRef(false);
  const lastClickTimestampRef = useRef(0);

  // Update container size on mount / resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setContainerSize({
          width: containerRef.current.clientWidth || 407,
          height: containerRef.current.clientHeight || 680,
        });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Clamping helper
  const clampPan = useCallback(
    (x: number, y: number, currentMapW: number, currentMapH: number) => {
      const minX = Math.min(0, containerSize.width - currentMapW);
      const minY = Math.min(0, containerSize.height - currentMapH);
      const clampedX = Math.min(0, Math.max(minX, x));
      const clampedY = Math.min(0, Math.max(minY, y));
      return { x: clampedX, y: clampedY };
    },
    [containerSize.width, containerSize.height]
  );

  // Center on Aldea & Santuario village
  const centerOnSantuario = useCallback(
    (currentMapW = mapWidth, currentMapH = mapHeight) => {
      // Aldea is located around left: 59.2%, top: 57.5%
      const villageX = currentMapW * 0.592;
      const villageY = currentMapH * 0.575;
      const targetX = -(villageX - containerSize.width / 2);
      const targetY = -(villageY - containerSize.height / 2);
      setPan(clampPan(targetX, targetY, currentMapW, currentMapH));
    },
    [containerSize.width, containerSize.height, mapWidth, mapHeight, clampPan]
  );


  // Initialize position centered on Aldea village on load
  useEffect(() => {
    centerOnSantuario();
  }, [containerSize.width, containerSize.height]);

  // Pointer event handlers for drag-to-pan
  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    // Don't hijack if clicking any button or interactive element
    const target = e.target as HTMLElement;
    if (target.closest('.map-control-btn') || target.closest('.map-location-btn')) {
      return;
    }

    isDraggingRef.current = true;
    dragDistanceRef.current = 0;
    pointerCapturedRef.current = false;
    pointerStartRef.current = { x: e.clientX, y: e.clientY };
    panStartRef.current = { x: pan.x, y: pan.y };
    setIsDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - pointerStartRef.current.x;
    const dy = e.clientY - pointerStartRef.current.y;
    dragDistanceRef.current = Math.hypot(dx, dy);

    // Only capture pointer once drag threshold is passed to preserve child click events
    if (dragDistanceRef.current > 6 && !pointerCapturedRef.current) {
      try {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        pointerCapturedRef.current = true;
      } catch {}
    }

    const nextX = panStartRef.current.x + dx;
    const nextY = panStartRef.current.y + dy;
    setPan(clampPan(nextX, nextY, mapWidth, mapHeight));
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsDragging(false);

    if (pointerCapturedRef.current) {
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
      pointerCapturedRef.current = false;
    }
  };

  // Silverpeack (Pico de Plata) se abre al terminar el Capítulo II: La Minas.
  const isSilverpeackUnlocked =
    questProgress.completedMissions.includes('m7_epilogo_aldea') ||
    questProgress.completedMissions.includes('m6_puerta_laberinto') ||
    questProgress.chapter >= 3;

  const handleLocationClick = (loc: MapInteractiveLocation) => {
    const now = Date.now();
    if (now - lastClickTimestampRef.current < 250) return;
    lastClickTimestampRef.current = now;
    sound.playSFX('click');
    setSelectedLocation(loc);
  };

  // Authentic Interactive Locations over the Map
  const locations: MapInteractiveLocation[] = [
    {
      id: 'aldea_icespear',
      name: 'Aldea de Icespear',
      subtitle: 'Santuario Principal & Campamento',
      typeBadge: 'Zona Segura • Refugio, Forja & Taberna',
      badgeStyle: 'bg-emerald-950/90 border-emerald-500/80 text-emerald-200',
      description:
        'El corazón del asentamiento helado bajo la sombra del castillo. Aquí se ubican el Gran Santuario, la Forja rúnica del enano, la Taberna de Arlem y la Botica de Pociones de Raxxar.',
      top: '58.0%',
      left: '59.2%',
      widthPercent: 12,
      aspectRatio: '1 / 1',
      imageSrc: '/assets/backgrounds/icespear_icono_inkarnate.png',
      actionLabel: 'Entrar al Gran Santuario',
      actionIcon: 'mapPin',
      action: () => {
        navigateTo('santuario');
      },
      quickLinks: [
        {
          label: 'Taberna de Arlem',
          icon: 'tavern',
          action: () => navigateTo('tavern'),
        },
        {
          label: 'Forja Rúnica',
          icon: 'forge',
          action: () => navigateTo('forge'),
        },
        {
          label: 'Botica de Pociones',
          icon: 'potions',
          action: () => navigateTo('potions'),
        },
      ],
    },
    {
      id: 'asalto_orco',
      name: 'Asalto Orco • Paso Helado',
      subtitle: '¡Emergencia! Familia Tiefling Acorralada',
      typeBadge: 'Misión Aleatoria • Banda Caníbal',
      badgeStyle: 'bg-red-950/90 border-red-500/80 text-red-200 animate-pulse',
      description:
        '¡Una horda de orcos voraces liderada por el Caudillo Gorrak ha acorralado a una madre tiefling y a su pequeña hija! Claman que nunca han probado la carne de tiefling y pretenden devorarlas vivas. ¡Caldo de Dragón debe intervenir de inmediato!',
      top: '38.0%',
      left: '36.0%',
      widthPercent: 13,
      aspectRatio: '1 / 1',
      imageSrc: '/assets/combat/asalto_orco_badge.png',
      actionLabel: '¡Socorrer a las Tieflings!',
      actionIcon: 'swords',
      action: () => {
        setSelectedCombatMissionId('evento_asalto_orco');
        navigateTo('story');
      },
      quickLinks: [
        {
          label: 'Ver Misiones',
          icon: 'quest',
          action: () => navigateTo('quest'),
        },
      ],
    },
    {
      id: 'emboscada_bandidos',
      name: 'Vado de los Riscos',
      subtitle: 'Emboscada de Forajidos',
      typeBadge: 'Misión de Mapa • Ladrones de Camino',
      badgeStyle: 'bg-amber-950/90 border-amber-500/80 text-amber-200',
      description:
        'Un paso estrecho flanqueado por peñascos donde bandidos y salteadores acechan a las caravanas con virotes y dagas envenenadas.',
      top: '68.0%',
      left: '38.0%',
      widthPercent: 13,
      aspectRatio: '1 / 1',
      imageSrc: '/assets/combat/emboscada_bandidos_badge.png',
      actionLabel: '¡Repeler a los Bandidos!',
      actionIcon: 'swords',
      action: () => {
        setSelectedCombatMissionId('evento_emboscada_bandidos');
        navigateTo('story');
      },
      quickLinks: [
        {
          label: 'Ver Misiones',
          icon: 'quest',
          action: () => navigateTo('quest'),
        },
      ],
    },
  ];

  if (isSilverpeackUnlocked) {
    locations.push({
      id: 'silverpeack',
      name: 'Silverpeack · Pico de Plata',
      subtitle: 'Antigua colonia minera de Glimmerstone',
      typeBadge: 'Nuevo Santuario • Colonia Minera',
      badgeStyle: 'bg-violet-950/90 border-violet-400/80 text-violet-200',
      description:
        'Tras las Puertas Selladas, la vieja colonia enana de plata sigue en pie bajo el pico: puentes de piedra, cristales azules, una taberna de madera y los raíles que bajan hasta las galerías. La puerta arcana del fondo aún guarda el sello de Lloth.',
      top: '30.0%',
      left: '74.0%',
      widthPercent: 12,
      aspectRatio: '1 / 1',
      imageSrc: '/assets/backgrounds/cuevas de icespear.png',
      actionLabel: 'Entrar a Silverpeack',
      actionIcon: 'mapPin',
      action: () => {
        setActiveSanctuary('silverpeack');
        navigateTo('santuario');
      },
      quickLinks: [
        {
          label: 'Patrullas de la Mina',
          icon: 'quest',
          action: () => navigateTo('patrol'),
        },
        {
          label: 'Herrería de Silverpeack',
          icon: 'forge',
          action: () => navigateTo('forge'),
        },
        {
          label: 'Taberna del Pico',
          icon: 'tavern',
          action: () => navigateTo('tavern'),
        },
      ],
    });
  }

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{ touchAction: 'none' }}
      className={`relative w-full h-full min-h-[580px] flex-1 overflow-hidden select-none touch-none bg-[#101413] ${
        isDragging ? 'cursor-grabbing' : 'cursor-grab'
      }`}
    >
      {/* Draggable Map Plane (Artwork + Interactive Site Buttons) */}
      <div
        style={{
          width: `${mapWidth}px`,
          height: `${mapHeight}px`,
          transform: `translate3d(${pan.x}px, ${pan.y}px, 0)`,
          transition: isDragging ? 'none' : 'transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)',
        }}
        className="relative will-change-transform pointer-events-auto"
      >
        {/* World Map Artwork: icespear_map_8551bb2c.jpg */}
        <img
          src="/assets/aistudio/icespear_map_8551bb2c.jpg"
          alt="Mapa del Mundo Icespear"
          draggable={false}
          className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none select-none"
        />

        {/* Interactive Locations Layer */}
        <div className="absolute inset-0 pointer-events-auto">
          {locations.map((loc) => (
            <button
              key={loc.id}
              type="button"
              onPointerDown={(e) => {
                e.stopPropagation();
              }}
              onClick={(e) => {
                e.stopPropagation();
                handleLocationClick(loc);
              }}
              style={{
                top: loc.top,
                left: loc.left,
                width: `${loc.widthPercent}%`,
              }}
              className="map-location-btn absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group focus:outline-none z-20 flex flex-col items-center touch-manipulation active:scale-95 transition-transform"
              title={loc.name}
            >
              {/* Illustrated Icon with Hover Aura */}
              <div
                style={{ aspectRatio: loc.aspectRatio }}
                className="relative w-full rounded-full transition-transform duration-150 group-hover:scale-115"
              >
                <div className="absolute inset-0 rounded-full bg-amber-500/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                <img
                  src={loc.imageSrc}
                  alt={loc.name}
                  draggable={false}
                  className="w-full h-full object-contain pointer-events-none select-none drop-shadow-[0_4px_14px_rgba(0,0,0,0.95)]"
                />
              </div>
            </button>
          ))}
        </div>
      </div>


      {/* Bottom Right: Circular SANTUARIO Cabin Button (Positioned safely above bottom footer) */}
      <div className="absolute bottom-24 right-3 z-30 pointer-events-auto">
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            sound.playSFX('click');
            navigateTo('santuario');
          }}
          className="map-control-btn group relative flex flex-col items-center cursor-pointer hover:scale-106 active:scale-95 transition-transform"
          title="Volver al Santuario"
        >
          <img
            src="/assets/backgrounds/icespear SANTUARIO BUTTON.png"
            alt="SANTUARIO"
            className="w-16 h-16 sm:w-18 sm:h-18 object-contain filter drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)]"
          />
        </button>
      </div>

      {/* Location Details Fantasy Popover Modal */}
      {selectedLocation && (
        <div
          onClick={() => setSelectedLocation(null)}
          className="absolute inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-4 pointer-events-auto select-none"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="wood-frame max-w-xs w-full p-4 sm:p-5 rounded-2xl space-y-3 text-center border-2 border-amber-600/80 shadow-[0_0_40px_rgba(0,0,0,0.95)] animate-in fade-in zoom-in-95 duration-150"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-2 border-b border-amber-900/60">
              <div className="flex flex-col text-left">
                <span className="text-amber-200 font-serif font-black text-sm">
                  {selectedLocation.name}
                </span>
                <span className="text-[10px] text-stone-400 font-mono">
                  {selectedLocation.subtitle}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLocation(null)}
                className="text-stone-400 hover:text-white p-1 rounded hover:bg-stone-800/60 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Location Illustration Preview */}
            <div className="relative w-full h-28 bg-[#160703] rounded-xl border border-amber-800/60 flex items-center justify-center overflow-hidden p-2">
              <div className="absolute inset-0 bg-radial from-amber-500/15 to-transparent pointer-events-none" />
              <img
                src={selectedLocation.imageSrc}
                alt={selectedLocation.name}
                className="max-h-full max-w-full object-contain filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]"
              />
            </div>

            {/* Type & Threat Badge */}
            <div className="flex justify-center">
              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1 shadow-sm ${selectedLocation.badgeStyle}`}
              >
                <Shield className="w-3 h-3" />
                {selectedLocation.typeBadge}
              </span>
            </div>

            {/* Atmospheric Lore Description */}
            <p className="text-xs text-stone-300 leading-relaxed text-left bg-black/40 p-2.5 rounded-lg border border-amber-950/40">
              {selectedLocation.description}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  sound.playSFX('click');
                  const act = selectedLocation.action;
                  setSelectedLocation(null);
                  act();
                }}
                className="w-full py-2.5 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-400 text-stone-950 font-black text-xs rounded-xl shadow-lg cursor-pointer flex items-center justify-center gap-1.5 transition-transform active:scale-95"
              >
                {selectedLocation.actionIcon === 'skull' ? (
                  <Skull className="w-4 h-4 text-stone-950" />
                ) : selectedLocation.actionIcon === 'mapPin' ? (
                  <MapPin className="w-4 h-4 text-stone-950" />
                ) : (
                  <Swords className="w-4 h-4 text-stone-950" />
                )}
                <span>{selectedLocation.actionLabel}</span>
              </button>

              {/* Quick Links for Locations */}
              {selectedLocation.quickLinks && selectedLocation.quickLinks.length > 0 && (
                <div className="grid grid-cols-1 gap-1.5 pt-1">
                  {selectedLocation.quickLinks.map((ql, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        sound.playSFX('click');
                        setSelectedLocation(null);
                        ql.action();
                      }}
                      className="w-full py-1.5 px-3 bg-[#241108] hover:bg-[#32170b] border border-amber-800/60 hover:border-amber-600/80 text-amber-200 font-serif font-bold text-[11px] rounded-lg shadow-sm cursor-pointer flex items-center justify-center gap-1.5 transition-colors active:scale-95"
                    >
                      {ql.icon === 'potions' && <FlaskConical className="w-3.5 h-3.5 text-emerald-400" />}
                      {ql.icon === 'tavern' && <Beer className="w-3.5 h-3.5 text-amber-400" />}
                      {ql.icon === 'forge' && <Anvil className="w-3.5 h-3.5 text-orange-400" />}
                      {ql.icon === 'santuario' && <Sparkles className="w-3.5 h-3.5 text-yellow-400" />}
                      {ql.icon === 'quest' && <Swords className="w-3.5 h-3.5 text-amber-400" />}
                      <span>{ql.label}</span>
                    </button>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={() => setSelectedLocation(null)}
                className="py-1.5 px-3 bg-stone-800/90 hover:bg-stone-700 text-stone-300 font-bold text-xs rounded-xl cursor-pointer transition-colors mt-0.5"
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
