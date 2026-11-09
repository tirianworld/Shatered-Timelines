import React from 'react';
import { useGame } from '../context/GameContext';
import { sound } from '../services/soundService';

interface NavButtonConfig {
  id: string;
  label: string;
  imageSrc: string;
}

export const GameFooter: React.FC = () => {
  const { currentTab, navigateTo, setIsOptionsOpen } = useGame();

  const navButtons: NavButtonConfig[] = [
    { id: 'quest', label: 'QUEST', imageSrc: '/assets/items/quest tarot.png' },
    { id: 'heroes', label: 'HEROES', imageSrc: '/assets/items/Recurso 2@4x.png' },
    { id: 'santuario', label: 'SANTUARIO', imageSrc: '/assets/items/santuario.png' },
    { id: 'draw', label: 'DRAW', imageSrc: '/assets/items/DRAW BUTTON.png' },
    { id: 'shop', label: 'SHOP', imageSrc: '/assets/items/Recurso 3@4x.png' },
    { id: 'options', label: 'OPTIONS', imageSrc: '/assets/items/Options Idl.png' },
  ];

  const handleTabClick = (id: string) => {
    sound.playSFX('click');
    if (id === 'options') {
      setIsOptionsOpen(true);
    } else {
      navigateTo(id);
    }
  };

  return (
    <footer className="absolute bottom-0 inset-x-0 z-40 select-none pointer-events-none flex flex-col justify-end">
      {/* Background Carved Wood Bar Sprite - Extends -left-3, -right-3, and -bottom-2 to flush with all edges */}
      <div className="absolute -left-3 -right-3 -bottom-2 h-[105px] sm:h-[115px] pointer-events-none overflow-hidden flex items-end">
        <img
          src="/assets/items/baarra_abajo.png"
          alt=""
          className="w-full h-full object-cover object-bottom drop-shadow-[0_-6px_16px_rgba(0,0,0,0.9)]"
        />
        {/* Solid matching wood grounding strip at bottom to guarantee 100% solid contact */}
        <div className="absolute inset-x-0 bottom-0 h-2.5 bg-[#290e05]" />
      </div>

      {/* 6 Circular Nav Buttons Row */}
      <div className="relative z-10 w-full max-w-[412px] mx-auto px-1 sm:px-1.5 pt-1 pb-2 sm:pb-2.5 flex items-end justify-between gap-0.5 pointer-events-auto">
        {navButtons.map((btn) => {
          const isActive =
            currentTab === btn.id ||
            (btn.id === 'santuario' && ['santuario', 'camp', 'world', 'tavern', 'forge'].includes(currentTab)) ||
            (btn.id === 'quest' && currentTab === 'combat') ||
            (btn.id === 'draw' && currentTab === 'gacha');

          return (
            <button
              key={btn.id}
              onClick={() => handleTabClick(btn.id)}
              className={`group relative flex-1 flex flex-col items-center justify-end cursor-pointer transition-all duration-150 active:scale-95 ${
                isActive
                  ? '-translate-y-2 scale-110 drop-shadow-[0_4px_10px_rgba(251,191,36,0.65)]'
                  : 'hover:-translate-y-0.5 hover:scale-105 opacity-90 hover:opacity-100 drop-shadow-[0_2px_6px_rgba(0,0,0,0.85)]'
              }`}
              title={btn.label}
            >
              <img
                src={btn.imageSrc}
                alt={btn.label}
                className="w-13 h-13 sm:w-14 sm:h-14 object-contain filter transition-transform"
              />
            </button>
          );
        })}
      </div>
    </footer>
  );
};
