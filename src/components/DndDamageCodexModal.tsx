import React, { useState } from 'react';
import { X, Sparkles, BookOpen, Shield, Swords, Zap, Flame, Skull, Heart } from 'lucide-react';
import {
  DndDamageType,
  DND_DAMAGE_TYPES_LIST,
  DND_DAMAGE_TYPES_REGISTRY,
  DndDamageTypeMeta,
} from '../types/dndCombatDamage';
import { sound } from '../services/soundService';
import { VectorFxIcon, DND_DAMAGE_VECTOR_MAP } from './VectorFx';

export interface DndDamageCodexModalProps {
  isOpen?: boolean;
  onClose: () => void;
  initialType?: DndDamageType;
  initialSelectedType?: DndDamageType;
}

export const DndDamageCodexModal: React.FC<DndDamageCodexModalProps> = ({
  isOpen = true,
  onClose,
  initialType,
  initialSelectedType,
}) => {
  const [selectedType, setSelectedType] = useState<DndDamageType>(
    initialSelectedType || initialType || 'fire'
  );
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'physical' | 'elemental' | 'mystic'>('all');

  if (!isOpen) return null;

  const physicalTypes: DndDamageType[] = ['bludgeoning', 'piercing', 'slashing'];
  const elementalTypes: DndDamageType[] = ['fire', 'cold', 'lightning', 'thunder', 'acid', 'poison'];
  const mysticTypes: DndDamageType[] = ['necrotic', 'radiant', 'force', 'psychic'];

  const filteredList = DND_DAMAGE_TYPES_LIST.filter((t) => {
    if (categoryFilter === 'physical') return physicalTypes.includes(t);
    if (categoryFilter === 'elemental') return elementalTypes.includes(t);
    if (categoryFilter === 'mystic') return mysticTypes.includes(t);
    return true;
  });

  const activeMeta: DndDamageTypeMeta =
    DND_DAMAGE_TYPES_REGISTRY[selectedType] || DND_DAMAGE_TYPES_REGISTRY.force;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-2 sm:p-4 select-none animate-in fade-in zoom-in-95"
    >
      <div
        className="relative w-full max-w-[390px] h-[92vh] max-h-[720px] flex flex-col rounded-2xl border-2 border-amber-600 bg-[#160603] text-stone-200 shadow-[0_0_40px_rgba(245,158,11,0.5)] overflow-hidden"
      >
        {/* Header with Title and Close Button */}
        <div className="relative px-3 py-2.5 bg-gradient-to-r from-[#2a0e05] via-[#3a1508] to-[#2a0e05] border-b border-amber-800/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xl">📜</span>
            <div className="flex flex-col text-left">
              <h3 className="text-xs sm:text-sm font-serif font-black text-amber-200 uppercase tracking-wider flex items-center gap-1.5">
                <span>Compendio de Daños D&D</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-900/80 border border-amber-500/50 text-amber-300 font-mono">
                  13 TIPOS
                </span>
              </h3>
              <p className="text-[9.5px] text-stone-400 font-mono">
                Mecánicas tácticas de Dungeons & Dragons en formato Gacha RPG
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              sound.playSFX('click');
              onClose();
            }}
            className="w-7 h-7 rounded-full bg-stone-900/80 hover:bg-stone-800 border border-amber-700/60 text-stone-300 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="px-2 pt-2 pb-1 bg-stone-950/70 border-b border-amber-950 flex items-center gap-1 shrink-0 overflow-x-auto no-scrollbar">
          {[
            { id: 'all', label: 'Todos (13)', icon: '✦' },
            { id: 'physical', label: 'Físicos (3)', icon: '⚔️' },
            { id: 'elemental', label: 'Elementales (6)', icon: '🔥' },
            { id: 'mystic', label: 'Místicos (4)', icon: '🔮' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                sound.playSFX('click');
                setCategoryFilter(cat.id as any);
              }}
              className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider cursor-pointer whitespace-nowrap transition-all flex items-center gap-1 ${
                categoryFilter === cat.id
                  ? 'bg-amber-600 text-stone-950 border border-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.6)]'
                  : 'bg-stone-900/90 text-stone-400 border border-amber-950 hover:text-stone-200'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* 13 Icons Quick Select Row with Vector SVGs */}
        <div className="px-2 py-1.5 bg-[#1f0904] border-b border-amber-950 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          {filteredList.map((t) => {
            const meta = DND_DAMAGE_TYPES_REGISTRY[t];
            const isSelected = selectedType === t;
            const vectorMeta = DND_DAMAGE_VECTOR_MAP[t];
            return (
              <button
                key={t}
                onClick={() => {
                  sound.playSFX('click');
                  setSelectedType(t);
                }}
                style={{
                  borderColor: isSelected ? meta.colorHex : 'rgba(120, 53, 15, 0.4)',
                  boxShadow: isSelected ? `0 0 12px ${meta.colorHex}` : undefined,
                }}
                className={`relative w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-transform cursor-pointer border p-1 ${
                  isSelected
                    ? 'scale-110 bg-black/90 brightness-125'
                    : 'bg-stone-900/60 opacity-75 hover:opacity-100 hover:scale-105'
                }`}
                title={meta.nameEs}
              >
                {vectorMeta ? (
                  <VectorFxIcon
                    src={vectorMeta.svg}
                    gradient={vectorMeta.gradient}
                    glow={isSelected ? meta.colorHex : undefined}
                    glowSize={8}
                    className="w-5 h-5"
                  />
                ) : (
                  <span>{meta.icon}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Content Details Area */}
        <div className="flex-1 p-3 overflow-y-auto space-y-2.5 text-left no-scrollbar">
          {/* Active Card Hero Banner */}
          <div
            style={{
              borderColor: activeMeta.colorHex,
              background: `linear-gradient(135deg, ${activeMeta.colorHex}22, rgba(20, 8, 4, 0.95))`,
              boxShadow: `0 0 20px ${activeMeta.colorHex}40`,
            }}
            className="p-3 rounded-xl border-2 flex items-center justify-between"
          >
            <div className="flex items-center gap-2.5">
              <div
                style={{ backgroundColor: `${activeMeta.colorHex}33`, borderColor: activeMeta.colorHex }}
                className="w-12 h-12 rounded-xl border flex items-center justify-center shadow-inner relative overflow-hidden"
              >
                {DND_DAMAGE_VECTOR_MAP[selectedType] ? (
                  <VectorFxIcon
                    src={DND_DAMAGE_VECTOR_MAP[selectedType].svg}
                    gradient={DND_DAMAGE_VECTOR_MAP[selectedType].gradient}
                    glow={activeMeta.colorHex}
                    glowSize={14}
                    className="w-8 h-8"
                  />
                ) : (
                  <span className="text-2xl">{activeMeta.icon}</span>
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-mono uppercase tracking-widest text-stone-400">
                  {activeMeta.nameEn} (D&D 5e)
                </span>
                <h4
                  style={{ color: activeMeta.colorHex }}
                  className="text-base sm:text-lg font-serif font-black tracking-wide uppercase drop-shadow"
                >
                  {activeMeta.nameEs}
                </h4>
              </div>
            </div>

            <div
              style={{
                borderColor: activeMeta.colorHex,
                backgroundColor: 'rgba(0,0,0,0.7)',
                color: activeMeta.colorHex,
              }}
              className="px-2 py-1 rounded-full border text-[9px] font-black uppercase tracking-wider font-mono shadow-sm"
            >
              {activeMeta.procBannerText.split(':')[0]}
            </div>
          </div>

          {/* Gacha Mechanic Highlight Box */}
          <div className="p-3 rounded-xl bg-black/70 border border-amber-900/60 space-y-1.5">
            <div className="flex items-center gap-1.5 text-amber-300 text-xs font-black uppercase tracking-wide">
              <Zap className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Mecánica Gacha Táctica</span>
            </div>
            <div
              style={{ color: activeMeta.colorHex }}
              className="text-xs font-black font-serif tracking-wide"
            >
              {activeMeta.gachaMechanicName}
            </div>
            <p className="text-[11px] leading-relaxed text-stone-200">
              {activeMeta.gachaMechanicSummary}
            </p>
          </div>

          {/* Tactical In-Depth Guide */}
          <div className="p-3 rounded-xl bg-stone-950/80 border border-stone-800 space-y-1.5">
            <div className="flex items-center gap-1.5 text-stone-300 text-xs font-black uppercase tracking-wide">
              <BookOpen className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Reglas de Combate & Fórmulas</span>
            </div>
            <p className="text-[11px] leading-relaxed text-stone-300">
              {activeMeta.tacticalDescription}
            </p>
          </div>

          {/* Table of Synergies and Procs */}
          <div className="p-3 rounded-xl bg-[#200a04] border border-amber-950 space-y-2">
            <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider block">
              Detalles del Disparo (Proc) en Combate:
            </span>
            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
              <div className="p-2 rounded bg-black/60 border border-white/5 flex flex-col">
                <span className="text-stone-400 font-sans text-[9px]">Aviso en Pantalla</span>
                <span style={{ color: activeMeta.colorHex }} className="font-bold truncate">
                  {activeMeta.floatingBadge}
                </span>
              </div>
              <div className="p-2 rounded bg-black/60 border border-white/5 flex flex-col">
                <span className="text-stone-400 font-sans text-[9px]">Sonido de Impacto</span>
                <span className="text-amber-200 font-bold uppercase truncate">
                  {activeMeta.soundCue}
                </span>
              </div>
            </div>
          </div>

          {/* Quick reference guide of all 13 types */}
          <div className="pt-2">
            <span className="text-[10px] font-black uppercase text-stone-400 tracking-wider block mb-2">
              Índice Rápido de los 13 Tipos de Daño:
            </span>
            <div className="space-y-1.5">
              {DND_DAMAGE_TYPES_LIST.map((typeKey) => {
                const m = DND_DAMAGE_TYPES_REGISTRY[typeKey];
                const isCur = selectedType === typeKey;
                return (
                  <button
                    key={typeKey}
                    onClick={() => {
                      sound.playSFX('click');
                      setSelectedType(typeKey);
                    }}
                    className={`w-full p-2 rounded-lg border text-left flex items-center justify-between cursor-pointer transition-all ${
                      isCur
                        ? 'bg-amber-950/70 border-amber-400 shadow-md'
                        : 'bg-black/40 border-stone-800/80 hover:bg-stone-900/60'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">{m.icon}</span>
                      <div className="flex flex-col">
                        <span
                          style={{ color: isCur ? m.colorHex : '#e7e5e4' }}
                          className="text-xs font-black font-serif"
                        >
                          {m.nameEs}
                        </span>
                        <span className="text-[9px] text-stone-400 font-mono">
                          {m.gachaMechanicName.split('+')[0].split('(')[0]}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-stone-400">
                      {isCur ? '▶' : '›'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Close Button */}
        <div className="p-2.5 bg-[#1e0803] border-t border-amber-950 shrink-0">
          <button
            onClick={() => {
              sound.playSFX('click');
              onClose();
            }}
            className="w-full py-2 bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-stone-950 font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer shadow-md transition-transform active:scale-95"
          >
            Entendido • Volver al Bastión
          </button>
        </div>
      </div>
    </div>
  );
};
