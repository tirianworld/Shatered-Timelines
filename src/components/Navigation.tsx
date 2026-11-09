import React from 'react';
import { soundManager } from '../services/audioService';
import {
  Flame,
  Sparkles,
  Swords,
  Shield,
  Compass,
  Anvil,
  Briefcase,
  Store
} from 'lucide-react';

export type TabType =
  | 'taberna'
  | 'gacha'
  | 'combate'
  | 'heroes'
  | 'patrullas'
  | 'herreria'
  | 'inventario'
  | 'tienda';

interface NavigationProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentTab, onSelectTab }) => {
  const tabs = [
    { id: 'taberna' as TabType, label: 'Taberna', icon: Flame, badge: 'Hub' },
    { id: 'gacha' as TabType, label: 'Invocaciones', icon: Sparkles, highlight: true },
    { id: 'combate' as TabType, label: 'Combate', icon: Swords, badge: '4v4' },
    { id: 'heroes' as TabType, label: 'Héroes', icon: Shield },
    { id: 'patrullas' as TabType, label: 'Patrullas', icon: Compass },
    { id: 'herreria' as TabType, label: 'Forja', icon: Anvil },
    { id: 'inventario' as TabType, label: 'Mochila', icon: Briefcase },
    { id: 'tienda' as TabType, label: 'Mercado', icon: Store }
  ];

  const handleTabClick = (tab: TabType) => {
    soundManager.playClick();
    onSelectTab(tab);
  };

  return (
    <nav className="bg-stone-950/95 border-b border-amber-950/80 sticky top-[57px] z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-2 overflow-x-auto scrollbar-none flex items-center justify-start sm:justify-center gap-1 sm:gap-2 py-1.5">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium text-xs sm:text-sm whitespace-nowrap transition-all duration-150 relative ${
                isActive
                  ? 'bg-gradient-to-r from-amber-900/80 to-amber-950 text-amber-200 border border-amber-500/80 shadow-[0_0_12px_rgba(245,158,11,0.25)] font-bold scale-[1.02]'
                  : tab.highlight
                  ? 'bg-purple-950/40 border border-purple-700/50 text-purple-200 hover:bg-purple-900/50 hover:text-purple-100'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900/60 border border-transparent'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : tab.highlight ? 'text-purple-400' : 'text-stone-400'}`} />
              <span>{tab.label}</span>
              {tab.badge && !isActive && (
                <span className="text-[9px] px-1 py-0.2 bg-stone-800 text-stone-300 rounded font-semibold border border-stone-700">
                  {tab.badge}
                </span>
              )}
              {tab.highlight && !isActive && (
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping absolute -top-0.5 -right-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
