import React, { useEffect, useState } from 'react';
import { PlayGamesAchievement } from '../types/playGames';
import { playGames } from '../services/playGamesService';
import { Trophy, X } from 'lucide-react';

export const PlayGamesAchievementBanner: React.FC = () => {
  const [currentAchievement, setCurrentAchievement] = useState<PlayGamesAchievement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const unsubscribe = playGames.subscribeToAchievements((ach) => {
      setCurrentAchievement(ach);
      setIsVisible(true);

      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 4500);

      return () => clearTimeout(timer);
    });

    return () => unsubscribe();
  }, []);

  if (!currentAchievement || !isVisible) return null;

  return (
    <div
      onClick={() => setIsVisible(false)}
      className="fixed top-2 inset-x-2 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-50 max-w-sm w-full mx-auto cursor-pointer animate-in fade-in slide-in-from-top-6 duration-300 select-none"
    >
      <div className="bg-[#0b2416] border-2 border-[#16a34a] shadow-[0_8px_24px_rgba(0,0,0,0.85)] rounded-2xl p-2.5 flex items-center justify-between gap-3 text-white backdrop-blur-md">
        {/* Play Games Green Emblem */}
        <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-700 flex items-center justify-center shrink-0 shadow-inner border border-emerald-300/40">
          <Trophy className="w-5 h-5 text-amber-200" />
          <span className="absolute -bottom-1 -right-1 text-[11px] leading-none">
            {currentAchievement.icon}
          </span>
        </div>

        {/* Text Details */}
        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
              Google Play Games
            </span>
            <span className="w-1 h-1 rounded-full bg-emerald-500" />
            <span className="text-[10px] text-emerald-300 font-mono">
              +{currentAchievement.xpReward} XP
            </span>
          </div>
          <div className="text-xs font-black text-white truncate tracking-wide">
            {currentAchievement.title}
          </div>
          <div className="text-[10.5px] text-emerald-200/80 truncate">
            {currentAchievement.description}
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsVisible(false);
          }}
          className="text-emerald-400/80 hover:text-white p-1"
          aria-label="Cerrar notificación"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
