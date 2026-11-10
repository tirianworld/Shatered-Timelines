import React from 'react';

export type TimeOfDay = 'dawn' | 'day' | 'dusk' | 'night';

interface SantuarioLightingProps {
  timeOfDay: TimeOfDay;
}

export const SantuarioLighting: React.FC<SantuarioLightingProps> = ({ timeOfDay }) => {
  // Lighting multipliers and styles based on phase
  const getAtmosphereConfig = () => {
    switch (timeOfDay) {
      case 'dawn':
        return {
          tintOverlay: 'bg-gradient-to-b from-amber-400/20 via-orange-300/10 to-indigo-950/15 mix-blend-color-burn',
          skyWash: 'bg-gradient-to-b from-amber-200/25 via-pink-400/15 to-transparent',
          lightOpacity: 'opacity-55',
          hearthOpacity: 'opacity-70',
          showStars: false,
          showAurora: false,
          imageFilter: 'brightness(0.95) contrast(1.04) saturate(1.08) hue-rotate(-6deg)',
        };
      case 'day':
        return {
          tintOverlay: 'bg-sky-200/5 mix-blend-overlay',
          skyWash: 'bg-gradient-to-b from-sky-300/10 via-amber-100/5 to-transparent',
          lightOpacity: 'opacity-20',
          hearthOpacity: 'opacity-45',
          showStars: false,
          showAurora: false,
          imageFilter: 'brightness(1.02) contrast(1.02) saturate(1.05)',
        };
      case 'dusk':
        return {
          tintOverlay: 'bg-gradient-to-b from-orange-600/35 via-rose-900/25 to-purple-950/30 mix-blend-multiply',
          skyWash: 'bg-gradient-to-b from-amber-500/35 via-rose-500/25 to-indigo-900/20',
          lightOpacity: 'opacity-85',
          hearthOpacity: 'opacity-90',
          showStars: true,
          showAurora: false,
          imageFilter: 'brightness(0.86) contrast(1.12) saturate(1.22) hue-rotate(-12deg)',
        };
      case 'night':
      default:
        return {
          tintOverlay: 'bg-gradient-to-b from-[#060c24]/75 via-[#081230]/65 to-[#040816]/80 mix-blend-multiply',
          skyWash: 'bg-gradient-to-b from-[#09153a]/80 via-[#0a1842]/50 to-transparent',
          lightOpacity: 'opacity-100',
          hearthOpacity: 'opacity-100',
          showStars: true,
          showAurora: true,
          imageFilter: 'brightness(0.66) contrast(1.18) saturate(0.88) hue-rotate(8deg)',
        };
    }
  };

  const config = getAtmosphereConfig();

  // Coordinates of twinkling stars (in sky area 3% to 26% top)
  const stars = [
    { top: '5%', left: '14%', anim: 'animate-star-1', size: 'w-1.5 h-1.5' },
    { top: '8%', left: '28%', anim: 'animate-star-2', size: 'w-1 h-1' },
    { top: '4%', left: '42%', anim: 'animate-star-3', size: 'w-2 h-2' },
    { top: '11%', left: '55%', anim: 'animate-star-1', size: 'w-1 h-1' },
    { top: '6%', left: '72%', anim: 'animate-star-2', size: 'w-1.5 h-1.5' },
    { top: '9%', left: '88%', anim: 'animate-star-3', size: 'w-2 h-2' },
    { top: '15%', left: '20%', anim: 'animate-star-2', size: 'w-1 h-1' },
    { top: '18%', left: '38%', anim: 'animate-star-1', size: 'w-1.5 h-1.5' },
    { top: '14%', left: '64%', anim: 'animate-star-3', size: 'w-1 h-1' },
    { top: '17%', left: '82%', anim: 'animate-star-2', size: 'w-1.5 h-1.5' },
    { top: '22%', left: '48%', anim: 'animate-star-1', size: 'w-1 h-1' },
  ];

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden transition-all duration-1000 ease-in-out">
      {/* Dynamic Image Filter Style applicator via pseudo-layer */}
      <style dangerouslySetInnerHTML={{
        __html: `
          #santuario-bg-art {
            filter: ${config.imageFilter};
            transition: filter 1.2s cubic-bezier(0.4, 0, 0.2, 1);
          }
        `
      }} />

      {/* 1. Global Ambient Tint Overlay (Atmospheric Color Grading) */}
      <div className={`absolute inset-0 ${config.tintOverlay} transition-all duration-1000`} />
      <div className={`absolute inset-0 ${config.skyWash} transition-all duration-1000`} />

      {/* 2. Night Sky Elements: Moon, Stars & Aurora */}
      {config.showStars && (
        <div className={`absolute inset-0 transition-opacity duration-1000 ${timeOfDay === 'night' ? 'opacity-100' : 'opacity-40'}`}>
          {/* Subtle Moon Glow in upper sky */}
          {timeOfDay === 'night' && (
            <div className="absolute top-[4%] left-[12%] -translate-x-1/2 -translate-y-1/2 w-28 h-28 rounded-full bg-radial from-amber-100/25 via-blue-200/10 to-transparent blur-md" />
          )}

          {/* Twinkling Starlight Points */}
          {stars.map((star, idx) => (
            <div
              key={idx}
              className={`absolute rounded-full bg-white shadow-[0_0_6px_rgba(255,255,255,0.9)] ${star.anim} ${star.size}`}
              style={{ top: star.top, left: star.left }}
            />
          ))}

          {/* Northern Lights / Aurora over mountain peaks */}
          {config.showAurora && (
            <div className="absolute top-[7%] left-[10%] right-[10%] h-[18%] opacity-40 blur-xl animate-aurora pointer-events-none bg-gradient-to-r from-emerald-400/25 via-cyan-400/35 to-teal-300/20 rounded-full mix-blend-screen" />
          )}
        </div>
      )}

      {/* 3. Daytime / Dawn subtle snow glimmer */}
      {(timeOfDay === 'day' || timeOfDay === 'dawn') && (
        <div className="absolute inset-0 opacity-25">
          <div className="absolute top-[35%] left-[25%] w-1.5 h-1.5 bg-white rounded-full animate-star-1 blur-[0.5px]" />
          <div className="absolute top-[52%] left-[45%] w-1 h-1 bg-white rounded-full animate-star-2 blur-[0.5px]" />
          <div className="absolute top-[70%] left-[75%] w-1.5 h-1.5 bg-white rounded-full animate-star-3 blur-[0.5px]" />
        </div>
      )}

      {/* 4. ANIMATED LIGHT SOURCES & POINT LIGHTS */}
      {/* Light Container with dynamic phase opacity */}
      <div className={`absolute inset-0 transition-opacity duration-1000 ${config.lightOpacity}`}>
        
        {/* ======================================================== */}
        {/* A. FOREGROUND STONE PILLAR LANTERNS (Primary Highlights) */}
        {/* ======================================================== */}
        
        {/* Left Stone Pillar Lantern (top: ~77.8%, left: ~17.5%) */}
        <div className="absolute top-[77.8%] left-[17.5%] -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
          {/* Broad Ambient Warmth casting on snow & stone */}
          <div className="absolute w-44 h-44 rounded-full bg-radial from-amber-400/40 via-amber-500/15 to-transparent blur-lg mix-blend-screen animate-lantern-a" />
          {/* Intense Glow Core */}
          <div className="absolute w-12 h-14 rounded-full bg-radial from-yellow-100 via-amber-300/80 to-transparent blur-xs animate-lantern-a" />
          {/* Center Flame Pinpoint */}
          <div className="w-4 h-5 rounded-full bg-yellow-100 shadow-[0_0_12px_#fef08a,0_0_24px_#f59e0b] animate-lantern-a" />
        </div>

        {/* Right Stone Pillar Lantern (top: ~84.5%, left: ~67.8%) */}
        <div className="absolute top-[84.5%] left-[67.8%] -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
          {/* Broad Ambient Warmth casting on cobblestone path */}
          <div className="absolute w-48 h-48 rounded-full bg-radial from-amber-400/40 via-amber-500/15 to-transparent blur-lg mix-blend-screen animate-lantern-b" />
          {/* Intense Glow Core */}
          <div className="absolute w-14 h-16 rounded-full bg-radial from-yellow-100 via-amber-300/80 to-transparent blur-xs animate-lantern-b" />
          {/* Center Flame Pinpoint */}
          <div className="w-4 h-5 rounded-full bg-yellow-100 shadow-[0_0_14px_#fef08a,0_0_26px_#f59e0b] animate-lantern-b" />
        </div>

        {/* ======================================================== */}
        {/* B. BLACKSMITH FORGE (Blazing Open Hearth & Embers)       */}
        {/* ======================================================== */}
        
        {/* Forge Open Hearth (top: ~66.2%, left: ~16.5%) */}
        <div className={`absolute top-[66.2%] left-[16.5%] -translate-x-1/2 -translate-y-1/2 flex items-center justify-center transition-opacity duration-700 ${config.hearthOpacity}`}>
          {/* Roaring Furnace Broad Radiance */}
          <div className="absolute w-36 h-32 rounded-full bg-radial from-orange-500/50 via-red-500/25 to-transparent blur-lg mix-blend-screen animate-forge-hearth" />
          {/* Burning Coal Firebox */}
          <div className="w-10 h-7 rounded-sm bg-gradient-to-t from-red-600 via-orange-400 to-yellow-200 blur-[1px] shadow-[0_0_20px_#ea580c,0_0_35px_#f59e0b] animate-forge-hearth" />
          
          {/* Rising Glowing Embers from Forge Fire */}
          <div className="absolute -top-3 left-1 w-1.5 h-1.5 rounded-full bg-yellow-200 shadow-[0_0_6px_#f97316] animate-ember-1" />
          <div className="absolute -top-5 -left-1 w-1 h-1 rounded-full bg-orange-300 shadow-[0_0_4px_#ef4444] animate-ember-2" />
          <div className="absolute -top-8 left-3 w-1.5 h-1.5 rounded-full bg-amber-200 shadow-[0_0_6px_#eab308] animate-ember-3" />
        </div>

        {/* Blacksmith Upper Dormer Window (top: ~54.8%, left: ~23%) */}
        <div className="absolute top-[54.8%] left-[23%] -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
          <div className="absolute w-14 h-14 rounded-full bg-radial from-amber-400/40 to-transparent blur-xs mix-blend-screen animate-window-glow" />
          <div className="w-5 h-6 rounded-t-full bg-yellow-200/90 shadow-[0_0_12px_#fbbf24] blur-[0.8px] animate-window-glow" />
        </div>

        {/* Blacksmith Left Side Window (top: ~62%, left: ~4.5%) */}
        <div className="absolute top-[62%] left-[4.5%] -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
          <div className="w-4 h-6 rounded-t-sm bg-amber-300/85 shadow-[0_0_10px_#d97706] blur-[0.8px] animate-window-glow" />
        </div>

        {/* ======================================================== */}
        {/* C. TAVERN OF MAGORDITO (Warm Windows & Hanging Lantern)  */}
        {/* ======================================================== */}

        {/* Tavern Upper Dormer Window (top: ~66.2%, left: ~67.5%) */}
        <div className="absolute top-[66.2%] left-[67.5%] -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
          <div className="absolute w-16 h-16 rounded-full bg-radial from-amber-400/45 to-transparent blur-xs mix-blend-screen animate-window-glow" />
          <div className="w-6 h-7 rounded-t-full bg-yellow-100/90 shadow-[0_0_14px_#f59e0b] blur-[0.6px] animate-window-glow" />
        </div>

        {/* Tavern Ground Left Window (top: ~74%, left: ~63.8%) */}
        <div className="absolute top-[74%] left-[63.8%] -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
          <div className="absolute w-16 h-16 rounded-full bg-radial from-amber-400/45 to-transparent blur-xs mix-blend-screen animate-window-glow" />
          <div className="w-6 h-6 rounded bg-yellow-100/90 shadow-[0_0_14px_#f59e0b] blur-[0.6px] animate-window-glow" />
        </div>

        {/* Tavern Ground Right Window (top: ~74%, left: ~89.2%) */}
        <div className="absolute top-[74%] left-[89.2%] -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
          <div className="absolute w-14 h-14 rounded-full bg-radial from-amber-400/40 to-transparent blur-xs mix-blend-screen animate-window-glow" />
          <div className="w-5 h-6 rounded bg-yellow-200/85 shadow-[0_0_12px_#d97706] blur-[0.6px] animate-window-glow" />
        </div>

        {/* Tavern Corner Lantern (top: ~74.5%, left: ~52.8%) */}
        <div className="absolute top-[74.5%] left-[52.8%] -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
          <div className="absolute w-14 h-14 rounded-full bg-radial from-amber-400/50 to-transparent blur-xs mix-blend-screen animate-lantern-a" />
          <div className="w-3 h-4 rounded-full bg-yellow-100 shadow-[0_0_10px_#fbbf24] animate-lantern-a" />
        </div>

        {/* Tavern Chimney Floating Embers (top: ~50%, left: ~84%) */}
        <div className="absolute top-[50%] left-[84%] -translate-x-1/2 -translate-y-1/2">
          <div className="absolute w-1 h-1 rounded-full bg-amber-300 shadow-[0_0_4px_#f97316] animate-ember-2" />
          <div className="absolute left-2 w-1 h-1 rounded-full bg-orange-400 shadow-[0_0_4px_#ef4444] animate-ember-3" />
        </div>

        {/* ======================================================== */}
        {/* D. GUILD MANOR / CENTRAL ESTATE (Upper Windows & Lamps)  */}
        {/* ======================================================== */}

        {/* Manor Top Dormer Window (top: ~39.8%, left: ~60.5%) */}
        <div className="absolute top-[39.8%] left-[60.5%] -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
          <div className="absolute w-14 h-14 rounded-full bg-radial from-amber-400/45 to-transparent blur-xs mix-blend-screen animate-window-glow" />
          <div className="w-5 h-6 rounded-t-full bg-yellow-100/90 shadow-[0_0_12px_#f59e0b] blur-[0.6px] animate-window-glow" />
        </div>

        {/* Manor Middle Row Windows (top: ~45.5%, left: ~58.5% & ~63% & ~66%) */}
        <div className="absolute top-[45.5%] left-[58.5%] -translate-x-1/2 -translate-y-1/2">
          <div className="w-3.5 h-4.5 rounded-t-sm bg-yellow-200/85 shadow-[0_0_8px_#f59e0b] blur-[0.5px] animate-window-glow" />
        </div>
        <div className="absolute top-[45.5%] left-[63%] -translate-x-1/2 -translate-y-1/2">
          <div className="w-3.5 h-4.5 rounded-t-sm bg-yellow-200/85 shadow-[0_0_8px_#f59e0b] blur-[0.5px] animate-window-glow" />
        </div>
        <div className="absolute top-[45.5%] left-[66%] -translate-x-1/2 -translate-y-1/2">
          <div className="w-3.5 h-4.5 rounded-t-sm bg-yellow-200/85 shadow-[0_0_8px_#f59e0b] blur-[0.5px] animate-window-glow" />
        </div>

        {/* Manor Right Wing Window (top: ~45%, left: ~83%) */}
        <div className="absolute top-[45%] left-[83%] -translate-x-1/2 -translate-y-1/2">
          <div className="w-4 h-5 rounded-t-sm bg-yellow-200/85 shadow-[0_0_10px_#f59e0b] blur-[0.5px] animate-window-glow" />
        </div>

        {/* Manor Archway Lanterns (top: ~52.8%, left: ~51.5% and ~75.8%) */}
        <div className="absolute top-[52.8%] left-[51.5%] -translate-x-1/2 -translate-y-1/2">
          <div className="absolute w-10 h-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-radial from-amber-400/40 to-transparent blur-xs animate-lantern-b" />
          <div className="w-2.5 h-3.5 rounded-full bg-yellow-100 shadow-[0_0_8px_#fbbf24] animate-lantern-b" />
        </div>
        <div className="absolute top-[52.8%] left-[75.8%] -translate-x-1/2 -translate-y-1/2">
          <div className="w-3 h-4 rounded-t-sm bg-yellow-200/80 shadow-[0_0_8px_#d97706] blur-[0.5px] animate-window-glow" />
        </div>

        {/* ======================================================== */}
        {/* E. CASTLE OF ICESPEAR (Watchtower Beacons)              */}
        {/* ======================================================== */}
        
        {/* Left Stone Castle Tower Windows (top: ~23.5%, left: ~11.5% and top: ~27.5%, left: ~28%) */}
        <div className="absolute top-[23.5%] left-[11.5%] -translate-x-1/2 -translate-y-1/2">
          <div className="w-3.5 h-6 rounded-t-full bg-amber-200/80 shadow-[0_0_8px_#f59e0b] blur-[0.6px] animate-lantern-a" />
        </div>
        <div className="absolute top-[27.5%] left-[28%] -translate-x-1/2 -translate-y-1/2">
          <div className="w-3 h-5 rounded-t-full bg-amber-200/80 shadow-[0_0_8px_#f59e0b] blur-[0.6px] animate-lantern-b" />
        </div>

        {/* High Mountain Fortress Slit Windows (top: ~18.5%, left: ~70% and top: ~21.5%, left: ~78.5%) */}
        <div className="absolute top-[18.5%] left-[70%] -translate-x-1/2 -translate-y-1/2">
          <div className="w-2 h-4 rounded-sm bg-amber-300/85 shadow-[0_0_6px_#fbbf24] blur-[0.4px] animate-lantern-a" />
        </div>
        <div className="absolute top-[21.5%] left-[78.5%] -translate-x-1/2 -translate-y-1/2">
          <div className="w-2 h-4 rounded-sm bg-amber-300/85 shadow-[0_0_6px_#fbbf24] blur-[0.4px] animate-lantern-b" />
        </div>

      </div>
    </div>
  );
};
