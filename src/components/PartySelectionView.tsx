import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { sound } from '../services/soundService';
import { Check, X } from 'lucide-react';
import { CANONICAL_HEROES_LIST, CanonicalHeroItem } from './HeroesView';

const STORAGE_PARTIES_KEY = 'cdd_gacha_v2_party_presets_v3';

interface PartySelectionViewProps {
  onClose?: () => void;
}

export const PartySelectionView: React.FC<PartySelectionViewProps> = ({ onClose }) => {
  const { team, setEntireTeam, goBack } = useGame();

  // 5 Party Presets (each with 4 slots)
  const [parties, setParties] = useState<(string | null)[][]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PARTIES_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === 5) {
          return parsed;
        }
      }
    } catch {
      // Ignore JSON error
    }

    // Default: Party 1 initialized with current team (or Gromock if empty), others empty
    const defaultParty1 = team.length === 4 ? [...team] : ['gromock', null, null, null];
    return [
      defaultParty1,
      [null, null, null, null],
      [null, null, null, null],
      [null, null, null, null],
      [null, null, null, null],
    ];
  });

  const [activePreset, setActivePreset] = useState<number>(0);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);

  // Current active 4-hero slots
  const currentSlots = parties[activePreset] || [null, null, null, null];

  // Save parties to localStorage and sync current party with GameContext team
  const saveAndSyncParties = (newParties: (string | null)[][], presetIdx = activePreset) => {
    setParties(newParties);
    try {
      localStorage.setItem(STORAGE_PARTIES_KEY, JSON.stringify(newParties));
    } catch {
      // Ignore
    }
    const activeTeam = newParties[presetIdx] || [null, null, null, null];
    setEntireTeam(activeTeam);
  };

  // Switch between presets 1 to 5
  const handleSelectPreset = (idx: number) => {
    sound.playSFX('click');
    setActivePreset(idx);
    setSelectedSlotIndex(null);
    const presetTeam = parties[idx] || [null, null, null, null];
    setEntireTeam(presetTeam);
  };

  // Click on one of the 4 big slots
  const handleSlotClick = (slotIdx: number) => {
    sound.playSFX('click');
    if (selectedSlotIndex === slotIdx) {
      // If already selected and empty or occupied, keep selected or toggle
      setSelectedSlotIndex(null);
    } else {
      setSelectedSlotIndex(slotIdx);
    }
  };

  // Remove hero from specific slot
  const handleRemoveHero = (slotIdx: number) => {
    sound.playSFX('click');
    const newParties = parties.map((p, pIdx) => {
      if (pIdx === activePreset) {
        const nextSlots = [...p];
        nextSlots[slotIdx] = null;
        return nextSlots;
      }
      return p;
    });
    saveAndSyncParties(newParties);
    if (selectedSlotIndex === slotIdx) {
      setSelectedSlotIndex(null);
    }
  };

  // Assign or remove hero from party when tapping in the bottom grid
  const handleHeroGridClick = (hero: CanonicalHeroItem) => {
    const existingSlotIdx = currentSlots.indexOf(hero.id);

    // If hero is already in the team -> remove them
    if (existingSlotIdx !== -1) {
      sound.playSFX('click');
      handleRemoveHero(existingSlotIdx);
      return;
    }

    sound.playSFX('coin');

    // Determine target slot
    let targetIdx = selectedSlotIndex;

    // If no slot explicitly selected or target slot is already filled and we want next available
    if (targetIdx === null || targetIdx < 0 || targetIdx >= 4) {
      const firstEmpty = currentSlots.findIndex((id) => id === null);
      targetIdx = firstEmpty !== -1 ? firstEmpty : 0;
    }

    const newParties = parties.map((p, pIdx) => {
      if (pIdx === activePreset) {
        const nextSlots = [...p];
        nextSlots[targetIdx!] = hero.id;
        return nextSlots;
      }
      return p;
    });

    saveAndSyncParties(newParties);

    // Advance selection to next empty slot if any
    const updatedSlots = newParties[activePreset];
    const nextEmpty = updatedSlots.findIndex((id, i) => id === null && i !== targetIdx);
    if (nextEmpty !== -1) {
      setSelectedSlotIndex(nextEmpty);
    } else {
      setSelectedSlotIndex(null);
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col select-none overflow-hidden bg-[#1c0803]">
      {/* Authentic Carved Wood Background */}
      <img
        src="/assets/items/recurso_8_4x.png"
        alt=""
        className="absolute inset-0 w-full h-full object-fill pointer-events-none z-0"
      />

      {/* 1. TOP PARTY PRESETS BAR (1) (2) (3) (4) (5) */}
      <div className="relative z-10 w-full bg-[#0a0302] border-b-2 border-[#2b0d04] py-2 px-4 flex items-center justify-center gap-3 sm:gap-4 shrink-0 shadow-md">
        {[0, 1, 2, 3, 4].map((idx) => {
          const isCurrent = activePreset === idx;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectPreset(idx)}
              className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center cursor-pointer transition-all duration-150 active:scale-95 ${
                isCurrent
                  ? 'bg-[#3d1607] border-2 border-[#f59e0b] shadow-[0_0_10px_rgba(245,158,11,0.7)] ring-1 ring-amber-300 text-amber-100 font-black text-sm sm:text-base font-serif scale-105'
                  : 'bg-[#180703] border-2 border-[#6d2a0e] text-stone-300 hover:text-white hover:border-amber-600 font-bold text-sm sm:text-base font-serif opacity-85 hover:opacity-100'
              }`}
              title={`Equipo ${idx + 1}`}
            >
              <span className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">{idx + 1}</span>
            </button>
          );
        })}
      </div>

      {/* 2. TOP SECTION: 2x2 LARGE PARTY SLOTS IN CARVED WOOD CONTAINER */}
      <div className="relative z-10 mx-3 mt-2 mb-1 shrink-0">
        <div className="w-full rounded-[22px] border-[3.5px] border-[#7a320f] bg-[#220c04]/95 p-2 shadow-[inset_0_0_16px_rgba(0,0,0,0.85),0_8px_20px_rgba(0,0,0,0.7)]">
          <div className="grid grid-cols-2 gap-2 w-full">
            {[0, 1, 2, 3].map((slotIdx) => {
              const heroId = currentSlots[slotIdx];
              const hero = CANONICAL_HEROES_LIST.find((h) => h.id === heroId);
              const isSelected = selectedSlotIndex === slotIdx;

              return (
                <div
                  key={slotIdx}
                  onClick={() => handleSlotClick(slotIdx)}
                  className={`relative aspect-[1/1.25] rounded-[13px] overflow-hidden border-[2.5px] transition-all duration-150 cursor-pointer shadow-[inset_0_0_0_1px_rgba(244,170,91,0.18),0_3px_7px_rgba(0,0,0,0.55)] ${
                    isSelected
                      ? 'border-[#f5a623] ring-2 ring-amber-400 shadow-[0_0_14px_rgba(245,158,11,0.75)] scale-[1.01]'
                      : 'border-[#8a3b16] hover:border-[#bd6a29]'
                  } ${hero ? 'bg-[#180905]' : 'bg-[#120502]'}`}
                >
                  {hero ? (
                    <>
                      {/* Character Portrait cleanly filling the slot */}
                      <img
                        src={hero.portrait}
                        alt={hero.name}
                        className="w-full h-full object-cover object-top select-none pointer-events-none"
                      />

                      {/* Remove Button on Top Right */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveHero(slotIdx);
                        }}
                        className="absolute top-1.5 right-1.5 z-30 w-5.5 h-5.5 rounded-full bg-black/80 border border-amber-400/90 text-amber-200 hover:bg-red-900 hover:border-red-400 hover:text-white flex items-center justify-center text-[10px] font-black shadow transition-transform active:scale-95 cursor-pointer"
                        title="Quitar del equipo"
                      >
                        <X className="w-3 h-3 stroke-[3]" />
                      </button>

                      {/* Subtle Hero Nameplate at Bottom */}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/65 to-transparent pt-4 pb-1.5 px-1 text-center pointer-events-none border-b border-amber-700/30">
                        <span className="text-[10px] font-black text-amber-200 font-serif tracking-wide drop-shadow truncate block">
                          {hero.name}
                        </span>
                      </div>
                    </>
                  ) : (
                    /* Empty Dark Slot */
                    <div className="w-full h-full flex flex-col items-center justify-center">
                      <div className="w-7 h-7 rounded-full border border-amber-900/30 flex items-center justify-center text-stone-700/60 font-serif font-black text-xs select-none">
                        {slotIdx + 1}
                      </div>
                      {isSelected && (
                        <span className="text-[9px] font-bold text-amber-400 mt-1 animate-pulse tracking-wide">
                          Elige héroe
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. BOTTOM SECTION: 5-COLUMN HERO CARDS GRID IN CARVED WOOD CONTAINER */}
      <div className="relative z-10 flex-1 min-h-0 mx-3 mb-2 flex flex-col">
        <div className="w-full h-full rounded-[22px] border-[3.5px] border-[#8a3b16] bg-[#220c04]/95 p-2 sm:p-2.5 flex flex-col min-h-0 shadow-[inset_0_0_16px_rgba(0,0,0,0.85),0_8px_20px_rgba(0,0,0,0.7)]">
          {/* Scrollable Hero Cards Area */}
          <div className="flex-1 w-full overflow-y-auto no-scrollbar pt-0.5">
            <div className="grid grid-cols-5 gap-1 sm:gap-1.5 pb-2">
              {CANONICAL_HEROES_LIST.map((hero) => {
                const inTeam = currentSlots.includes(hero.id);

                return (
                  <div
                    key={hero.id}
                    onClick={() => handleHeroGridClick(hero)}
                    className={`relative aspect-square cursor-pointer transition-transform duration-100 active:scale-95 hover:scale-105 select-none ${
                      inTeam ? 'ring-2 ring-emerald-400 rounded-lg scale-[0.98]' : ''
                    }`}
                    title={`${hero.name} (${hero.rarity} - ${hero.attribute})`}
                  >
                    {/* Hero Portrait contained neatly inside the frame */}
                    <div className="absolute inset-[2.5px] rounded-[4px] overflow-hidden bg-[#18110c] flex items-center justify-center">
                      <img
                        src={hero.portrait}
                        alt={hero.name}
                        className="w-full h-full object-cover object-center"
                      />
                    </div>

                    {/* Authentic Overlaid Rarity Frame PNG */}
                    <img
                      src={hero.frame}
                      alt={hero.rarity}
                      className="absolute inset-0 w-full h-full object-contain pointer-events-none z-10"
                    />

                    {/* Top-Right Element Bead Orb */}
                    <img
                      src={hero.orb}
                      alt={hero.attribute}
                      className="absolute top-0 right-0 w-[30%] h-[30%] object-contain z-20 pointer-events-none drop-shadow"
                    />

                    {/* In-Team Indicator Checkmark Badge */}
                    {inTeam && (
                      <div className="absolute top-0.5 left-0.5 z-30 w-3.5 h-3.5 rounded-full bg-emerald-600 border border-white flex items-center justify-center text-white shadow">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
