import React, { useRef, useState } from 'react';
import { BookOpen, Lock } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { sound } from '../services/soundService';
import { QUEST_TOMES, QuestTomeEntry } from '../data/questTomesData';
import libraryAlcoveCartoonyBg from '../assets/images/library_alcove_cartoony_bg_1794928529559.jpg';

interface QuestLibraryViewProps {
  onSelectTome: (tomeId: string) => void;
}

const SHELF_META: Record<1 | 2 | 3, { label: string; caption: string }> = {
  1: {
    label: 'Balda I',
    caption: 'Historia disponible',
  },
  2: {
    label: 'Balda II',
    caption: 'Historia disponible',
  },
  3: {
    label: 'Balda III',
    caption: 'Archivo sellado',
  },
};

export const QuestLibraryView: React.FC<QuestLibraryViewProps> = ({ onSelectTome }) => {
  const { isMissionCompleted } = useGame();
  const [lockedNotice, setLockedNotice] = useState<string | null>(null);
  const [shakingTomeId, setShakingTomeId] = useState<string | null>(null);
  const noticeTimerRef = useRef<number | null>(null);

  // Drag-to-scroll inside the bookcase
  const scrollRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const didDragRef = useRef(false);
  const startYRef = useRef(0);
  const startScrollRef = useRef(0);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    const target = e.target as HTMLElement;
    if (target.closest('button')) return;
    isDraggingRef.current = true;
    didDragRef.current = false;
    startYRef.current = e.clientY;
    startScrollRef.current = scrollRef.current?.scrollTop || 0;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || !scrollRef.current) return;
    const deltaY = e.clientY - startYRef.current;
    if (Math.abs(deltaY) > 5) {
      didDragRef.current = true;
    }
    scrollRef.current.scrollTop = startScrollRef.current - deltaY;
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
    window.setTimeout(() => {
      didDragRef.current = false;
    }, 40);
  };

  const handleTomePress = (tome: QuestTomeEntry) => {
    if (didDragRef.current) return;

    if (!tome.unlocked) {
      sound.playSFX('click');
      setShakingTomeId(tome.id);
      setLockedNotice(
        `${tome.title} aún está sellado. Explora los tomos disponibles en las baldas superiores.`
      );
      window.setTimeout(() => setShakingTomeId(null), 320);
      if (noticeTimerRef.current) {
        window.clearTimeout(noticeTimerRef.current);
      }
      noticeTimerRef.current = window.setTimeout(() => {
        setLockedNotice(null);
      }, 3200);
      return;
    }

    sound.playSFX('click');
    onSelectTome(tome.id);
  };

  const shelves: (1 | 2 | 3)[] = [1, 2, 3];

  return (
    <div className="relative w-full h-full flex flex-col justify-start bg-[#261005] select-none overflow-hidden">
      {/* Cartoony Stylized Bookcase Backdrop */}
      <img
        src={libraryAlcoveCartoonyBg}
        alt="Estantería de Crónicas"
        referrerPolicy="no-referrer"
        className="absolute inset-0 w-full h-full object-cover object-top pointer-events-none select-none z-0"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-b from-[#1f0b04]/55 via-[#240d04]/38 to-[#160702]/82 pointer-events-none z-0"
      />

      {/* Scrollable Bookshelf Baldas (starts directly at top without header box) */}
      <div
        ref={scrollRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className="relative z-10 flex-1 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden px-3.5 pt-3 pb-28 space-y-4 cursor-grab active:cursor-grabbing touch-pan-y"
      >
        {shelves.map((shelfNum) => {
          const shelfTomes = QUEST_TOMES.filter((t) => t.shelfIndex === shelfNum);
          const meta = SHELF_META[shelfNum];

          return (
            <section key={shelfNum} aria-label={meta.label} className="relative">
              {/* Shelf Label Bar (clean unboxed cartoony wood text) */}
              <div className="flex items-center justify-between px-2 mb-1.5 text-[11px]">
                <span className="font-serif font-black text-amber-100 tracking-wide drop-shadow-[0_2px_2px_rgba(0,0,0,0.95)]">
                  {meta.label}
                </span>
                <span className="font-semibold text-amber-200/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)]">
                  {meta.caption}
                </span>
              </div>

              {/* Cartoony Stylized Recessed Wooden Shelf Niche */}
              <div className="relative rounded-t-xl bg-gradient-to-b from-[#2f1307]/88 via-[#441c0a]/85 to-[#54230c]/90 border-x-2 border-t-2 border-[#230c03] px-2.5 pt-2.5 pb-1 shadow-[inset_0_8px_16px_rgba(0,0,0,0.65)]">
                {shelfTomes.some((t) => t.unlocked) ? (
                  /* Featured Shelf: Active Cartoony Tome + Mission-Style Parchment Plaque */
                  <div className="space-y-3">
                    {shelfTomes.map((tome) => {
                      const completedCount = tome.missionIds.filter((id) =>
                        isMissionCompleted(id)
                      ).length;
                      const totalCount = tome.missionIds.length;
                      const pct =
                        totalCount > 0 ? Math.min(100, Math.round((completedCount / totalCount) * 100)) : 0;

                      return (
                        <div
                          key={tome.id}
                          className="flex items-end gap-2.5 pb-0.5"
                        >
                          {/* Upright Cartoony Hardcover Tome */}
                          <button
                            type="button"
                            onClick={() => handleTomePress(tome)}
                            aria-label={`Abrir ${tome.title}`}
                            className="group relative w-[108px] shrink-0 aspect-[3/4] rounded-r-lg rounded-l-[4px] overflow-hidden bg-[#1e3a5f] border-2 border-[#230c03] shadow-[4px_6px_0_rgba(20,7,2,0.75)] cursor-pointer transition-transform duration-200 hover:-translate-y-1 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-amber-300"
                          >
                            <img
                              src={tome.coverImage}
                              alt={tome.title}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
                            />
                            <div
                              aria-hidden="true"
                              className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/85 via-black/40 to-transparent pointer-events-none"
                            />
                            <div className="absolute inset-x-1.5 bottom-1.5 text-left pointer-events-none">
                              <span className="block font-serif font-black text-[9.5px] leading-tight text-amber-100 drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)] line-clamp-2">
                                {tome.id === 'omega_icespear'
                                  ? 'Consejo Omega: Icespear'
                                  : tome.title}
                              </span>
                            </div>
                          </button>

                          {/* Mission-Style Parchment Synopsis Card */}
                          <div className="relative flex-1 min-w-0 rounded-xl overflow-hidden border-2 border-[#230c03] shadow-[0_4px_0_rgba(20,7,2,0.7)] p-2.5 flex flex-col justify-between space-y-2">
                            <img
                              src="/assets/items/HISTORIA NIVEL BOTON.webp"
                              alt=""
                              referrerPolicy="no-referrer"
                              className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none z-0"
                            />

                            <div className="relative z-10 space-y-1">
                              <div className="flex items-center gap-1.5 text-[10px] text-[#5c2a0f] font-bold">
                                <span>{tome.tomeNumber}</span>
                                <span aria-hidden="true">·</span>
                                <span className="truncate">{tome.arcType}</span>
                              </div>
                              <h2 className="font-serif font-black text-[13.5px] leading-tight text-[#3d1908] text-balance drop-shadow-[0_1px_0_rgba(255,255,255,0.45)]">
                                {tome.title}
                              </h2>
                              <p className="text-[10px] leading-snug text-[#4d240e] font-medium line-clamp-3">
                                {tome.synopsis}
                              </p>
                            </div>

                            {/* Real Progress Bar */}
                            <div className="relative z-10 space-y-1">
                              <div className="flex items-center justify-between text-[10px] text-[#3d1908] font-mono font-bold tabular-nums">
                                <span>
                                  {tome.chaptersCount === 1 ? '1 Capítulo' : `${tome.chaptersCount} Capítulos`}
                                </span>
                                <span>
                                  {totalCount > 0 ? `${completedCount}/${totalCount} (${pct}%)` : 'Sin misiones'}
                                </span>
                              </div>
                              <div className="w-full h-2.5 rounded-full bg-[#1a0803] border border-[#521c08] p-[1.5px] overflow-hidden shadow-inner">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-[#dc2626] via-[#ea580c] to-[#f59e0b] transition-all duration-300"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>

                            {/* Mission-Style Vibrant Orange CTA */}
                            <button
                              type="button"
                              onClick={() => handleTomePress(tome)}
                              className="relative z-10 w-full min-h-[38px] py-1.5 px-4 rounded-lg border-2 border-[#fed7aa]/60 bg-gradient-to-b from-[#f97316] via-[#ea580c] to-[#c2410c] text-white font-black text-[11px] uppercase tracking-wider shadow-[0_2px_0_#7c2d12,0_4px_10px_rgba(234,88,12,0.5)] hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-amber-200"
                            >
                              <BookOpen className="w-3.5 h-3.5 shrink-0" />
                              <span>Abrir Tomo</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* Balda II & III: Sealed Cartoony Grimoires with Mission-Style Parchment Labels */
                  <div className="grid grid-cols-2 gap-2.5 pb-0.5">
                    {shelfTomes.map((tome) => {
                      const isShaking = shakingTomeId === tome.id;
                      return (
                        <button
                          key={tome.id}
                          type="button"
                          onClick={() => handleTomePress(tome)}
                          className={`group relative flex items-end gap-2 text-left rounded-xl p-1.5 bg-[#230d05]/70 border-2 border-[#3b1808] hover:border-[#7c3f18] transition-transform duration-150 cursor-pointer active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-amber-300 ${
                            isShaking ? '-translate-x-1' : ''
                          }`}
                          title={`${tome.title} (Próximamente)`}
                        >
                          {/* Sealed Cartoony Grimoire */}
                          <div className="relative w-[60px] shrink-0 aspect-[3/4] rounded-r-md rounded-l-[3px] overflow-hidden bg-[#2b150b] border-2 border-[#1f0b03] shadow-[2px_4px_0_rgba(15,5,1,0.8)]">
                            <img
                              src={tome.coverImage}
                              alt={tome.title}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover brightness-95 group-hover:brightness-105 transition-all duration-200"
                            />
                          </div>

                          {/* Clean Cartoony Bookplate Info */}
                          <div className="flex-1 min-w-0 pb-0.5 space-y-0.5">
                            <div className="flex items-center gap-1 text-[9.5px] font-bold text-amber-300/90">
                              <Lock className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                              <span className="truncate">{tome.tomeNumber}</span>
                            </div>
                            <div className="font-serif font-black text-[11.5px] leading-tight text-amber-50 line-clamp-2 drop-shadow-[0_1px_1px_rgba(0,0,0,0.9)]">
                              {tome.title}
                            </div>
                            <div className="text-[9.5px] text-stone-300/85 leading-snug truncate">
                              {tome.arcType}
                            </div>
                            <div className="text-[9.5px] font-bold text-orange-300 pt-0.5">
                              Próximamente
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Cartoony Carved Oak Shelf Plank ("Balda") */}
              <div
                aria-hidden="true"
                className="relative h-4 w-full rounded-b-md bg-gradient-to-b from-[#a85923] via-[#7c3912] to-[#4b1e07] border-2 border-[#230c03] shadow-[0_6px_0_rgba(18,6,2,0.85),0_12px_18px_rgba(0,0,0,0.75)]"
              >
                <div className="absolute inset-x-2 top-[1px] h-[2px] rounded-full bg-amber-200/30" />
              </div>
            </section>
          );
        })}
      </div>

      {/* Inline Sealed-Tome Feedback Banner */}
      {lockedNotice && (
        <div
          role="status"
          className="absolute bottom-[106px] inset-x-4 z-30 rounded-xl bg-[#2a1005]/95 border-2 border-amber-400/75 px-3.5 py-2.5 text-center text-[11.5px] font-medium leading-snug text-amber-100 shadow-[0_6px_18px_rgba(0,0,0,0.9)] pointer-events-none"
        >
          {lockedNotice}
        </div>
      )}
    </div>
  );
};
