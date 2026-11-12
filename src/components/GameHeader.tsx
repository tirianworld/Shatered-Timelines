import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { Check, Edit3, Gamepad2 } from 'lucide-react';
import { sound } from '../services/soundService';

export const GameHeader: React.FC = () => {
  const {
    gold,
    summonCrystals,
    astralShards,
    playerName,
    setPlayerName,
    goBack,
    setIsMailboxOpen,
    mailItems,
    openPlayGames,
  } = useGame();

  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(playerName);

  const unreadMailCount = mailItems.filter((m) => !m.claimed).length;

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempName.trim()) {
      setPlayerName(tempName.trim());
    }
    setIsEditingName(false);
  };

  return (
    <header className="relative z-30 select-none bg-[#240e06] border-b-2 border-[#3d1405] shadow-xl w-full">
      {/* Exact 403x65 banner layout matching screenshot */}
      <div className="relative w-full max-w-[412px] mx-auto aspect-[403/65] overflow-hidden">
        {/* Authentic banner sprite: wood frame, carved wheel, arrow button, mail button, pill frames & gem/coin icons */}
        <img
          src="/assets/items/banner_superior_base.png"
          alt="Barra Superior"
          className="w-full h-full object-contain pointer-events-none select-none"
        />

        {/* 1. Left Back Button (Interactive Overlay) */}
        <button
          type="button"
          onClick={() => {
            sound.playSFX('click');
            goBack();
          }}
          className="absolute left-[1.2%] top-[12.3%] w-[11.8%] h-[73.8%] rounded cursor-pointer group transition-transform active:scale-95"
          title="Volver"
          aria-label="Volver"
        >
          {/* Subtle highlight sheen on hover */}
          <div className="w-full h-full rounded opacity-0 group-hover:opacity-100 bg-white/10 transition-opacity" />
        </button>

        {/* 2. Top-Left Pill: Player Name */}
        <div
          className="absolute left-[15.0%] top-[16.5%] w-[25.2%] h-[28.5%] flex items-center justify-center cursor-pointer group"
          onClick={() => {
            if (!isEditingName) {
              setTempName(playerName);
              setIsEditingName(true);
            }
          }}
          title="Haz clic para editar tu nombre"
        >
          {isEditingName ? (
            <form onSubmit={handleSaveName} className="flex items-center justify-center w-full h-full px-1">
              <input
                type="text"
                value={tempName}
                maxLength={12}
                autoFocus
                onChange={(e) => setTempName(e.target.value)}
                onBlur={handleSaveName}
                className="w-full bg-transparent text-[11px] sm:text-xs text-white font-bold text-center outline-none"
              />
              <button type="submit" className="text-emerald-300">
                <Check className="w-2.5 h-2.5" />
              </button>
            </form>
          ) : (
            <div className="flex items-center justify-center gap-1 w-full px-1">
              <span className="text-[11px] sm:text-xs font-bold text-white tracking-wide truncate drop-shadow-[0_1px_1px_rgba(0,0,0,0.95)]">
                {playerName}
              </span>
              <Edit3 className="w-2 h-2 text-stone-300 opacity-0 group-hover:opacity-75 transition-opacity" />
            </div>
          )}
        </div>

        {/* 3. Bottom-Left Pill: Summon Crystals / Green Gemstone Number */}
        <div className="absolute left-[20.2%] top-[56.5%] w-[20.0%] h-[28.5%] flex items-center justify-end pr-1.5 pointer-events-none">
          <span className="text-[11px] sm:text-xs font-mono font-bold text-white tracking-tight truncate leading-none drop-shadow-[0_1px_1px_rgba(0,0,0,0.95)]">
            {summonCrystals.toLocaleString()}
          </span>
        </div>

        {/* 4. Top-Right Pill: Gold Coins Number */}
        <div className="absolute left-[64.5%] top-[16.5%] w-[19.8%] h-[28.5%] flex items-center justify-end pr-1.5 pointer-events-none">
          <span className="text-[11px] sm:text-xs font-mono font-bold text-white tracking-tight truncate leading-none drop-shadow-[0_1px_1px_rgba(0,0,0,0.95)]">
            {gold.toLocaleString()}
          </span>
        </div>

        {/* 5. Bottom-Right Pill: Astral Shards / Blue Diamond Number */}
        <div className="absolute left-[64.5%] top-[56.5%] w-[19.8%] h-[28.5%] flex items-center justify-end pr-1.5 pointer-events-none">
          <span className="text-[11px] sm:text-xs font-mono font-bold text-white tracking-tight truncate leading-none drop-shadow-[0_1px_1px_rgba(0,0,0,0.95)]">
            {astralShards.toLocaleString()}
          </span>
        </div>

        {/* Central Wheel: Google Play Games Button */}
        <button
          type="button"
          onClick={() => {
            sound.playSFX('click');
            openPlayGames();
          }}
          className="absolute left-[44.2%] top-[12.3%] w-[11.6%] h-[73.8%] rounded-full cursor-pointer group transition-transform active:scale-95 flex items-center justify-center z-10"
          title="Google Play Games (Logros, Marcadores y Nube)"
          aria-label="Google Play Games"
        >
          <div className="w-full h-full rounded-full opacity-0 group-hover:opacity-100 bg-emerald-500/25 transition-opacity" />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-4 h-4 rounded-full bg-emerald-950/85 border border-emerald-400/90 flex items-center justify-center shadow-lg group-hover:scale-115 transition-transform">
              <Gamepad2 className="w-2.5 h-2.5 text-emerald-300" />
            </div>
          </div>
        </button>

        {/* 6. Right Mail Button (Interactive Overlay) */}
        <button
          type="button"
          onClick={() => {
            sound.playSFX('click');
            setIsMailboxOpen(true);
          }}
          className="absolute left-[86.2%] top-[12.3%] w-[11.8%] h-[73.8%] rounded cursor-pointer group transition-transform active:scale-95"
          title="Buzón de Mensajes"
          aria-label="Buzón de Mensajes"
        >
          {/* Subtle highlight sheen on hover */}
          <div className="w-full h-full rounded opacity-0 group-hover:opacity-100 bg-white/10 transition-opacity" />

          {/* Unread Mail Bubble */}
          {unreadMailCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-600 border border-white text-[9px] font-black text-white flex items-center justify-center animate-bounce shadow">
              {unreadMailCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};
