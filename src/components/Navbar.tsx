import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { sound } from '../services/soundService';
import { Volume2, VolumeX, Sparkles, Shield, Coins, Gem, Compass, Swords, Hammer, Beer, ShoppingBag, Home } from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    gold,
    summonCrystals,
    astralShards,
    currentTab,
    setCurrentTab,
    idleEarningsAvailable,
    claimIdleEarnings,
  } = useGame();

  const [isMuted, setIsMuted] = useState(sound.getIsMuted());

  const handleToggleSound = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
    if (!muted) {
      sound.playBGM();
    }
  };

  const navItems = [
    { id: 'camp', label: 'Campamento', icon: Home },
    { id: 'gacha', label: 'Invocación', icon: Sparkles, badge: astralShards >= 100 ? '¡Listo!' : undefined },
    { id: 'combat', label: 'Combate', icon: Swords },
    { id: 'heroes', label: 'Héroes & Equipo', icon: Shield },
    { id: 'patrol', label: 'Patrullas', icon: Compass },
    { id: 'forge', label: 'Herrería', icon: Hammer },
    { id: 'tavern', label: 'Taberna', icon: Beer },
    { id: 'shop', label: 'Tienda', icon: ShoppingBag },
  ];

  return (
    <header className="sticky top-0 z-40 bg-stone-950/95 border-b border-amber-900/40 backdrop-blur-md shadow-2xl">
      {/* Top Bar: Title & Resources */}
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Game Logo & Branding */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-600 via-red-900 to-black border-2 border-amber-500/60 flex items-center justify-center shadow-lg shadow-amber-950/50">
            <span className="font-serif font-black text-amber-300 text-xl tracking-tighter">CDD</span>
          </div>
          <div>
            <h1 className="font-serif font-black text-lg text-amber-200 tracking-wider flex items-center gap-2">
              CDD GACHA 2
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-950 border border-red-800 text-red-300 uppercase tracking-widest font-sans font-semibold">
                Dark Fantasy RPG
              </span>
            </h1>
            <p className="text-[11px] text-stone-400 hidden sm:block">
              Crónicas de Icespear &bull; Invocaciones y Combate Táctico
            </p>
          </div>
        </div>

        {/* Currencies & Controls */}
        <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
          {/* Idle Gold Box */}
          {idleEarningsAvailable > 0 && (
            <button
              onClick={() => claimIdleEarnings()}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-500/20 border border-amber-500/50 hover:bg-amber-500/30 text-amber-300 text-xs font-medium animate-pulse cursor-pointer transition-all"
              title="Reclamar tributo acumulado de la ciudad"
            >
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span>+{idleEarningsAvailable} Oro</span>
            </button>
          )}

          {/* Gold */}
          <div className="flex items-center gap-1.5 bg-stone-900/90 px-3 py-1 rounded-md border border-stone-800 shadow-inner">
            <Coins className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-mono font-bold text-amber-100">{gold.toLocaleString()}</span>
          </div>

          {/* Cristales del Recuerdo */}
          <div className="flex items-center gap-1.5 bg-stone-900/90 px-3 py-1 rounded-md border border-stone-800 shadow-inner" title="Cristales del Recuerdo">
            <img src="/assets/items/gema_del_recuerdo.png" alt="Cristales del Recuerdo" className="w-4 h-4 object-contain" />
            <span className="text-xs font-mono font-bold text-cyan-300">{astralShards.toLocaleString()}</span>
          </div>

          {/* Audio Toggle */}
          <button
            onClick={handleToggleSound}
            className={`p-2 rounded-lg border transition-all cursor-pointer ${
              isMuted
                ? 'bg-stone-900 border-stone-800 text-stone-500 hover:text-stone-300'
                : 'bg-amber-950/40 border-amber-800 text-amber-400 shadow-sm shadow-amber-900/50 hover:bg-amber-900/40'
            }`}
            title={isMuted ? 'Activar música y efectos de sonido' : 'Silenciar sonido'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 animate-bounce" />}
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav className="max-w-7xl mx-auto px-2 border-t border-stone-800/60 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1 py-1.5 min-w-max">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  sound.playSFX('click');
                  setCurrentTab(item.id);
                }}
                className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-amber-900/70 to-red-950/70 text-amber-200 border border-amber-600/60 shadow-lg shadow-amber-950/40'
                    : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900/60 border border-transparent'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-400' : 'text-stone-500'}`} />
                <span>{item.label}</span>
                {item.badge && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-[9px] bg-red-600 text-white font-bold animate-pulse">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </header>
  );
};
