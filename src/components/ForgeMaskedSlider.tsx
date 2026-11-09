import React, { useRef, useState, useEffect, useCallback } from 'react';

interface ForgeMaskedSliderProps {
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}

export const ForgeMaskedSlider: React.FC<ForgeMaskedSliderProps> = ({
  children,
  className = '',
  contentClassName = '',
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0); // 0 to 1
  const [canScroll, setCanScroll] = useState(false);
  const [thumbHeight, setThumbHeight] = useState(42);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef(0);
  const dragStartScrollTop = useRef(0);

  // Recalculate metrics accurately
  const updateMetrics = useCallback(() => {
    const content = contentRef.current;
    const track = trackRef.current;
    if (!content) return;

    const { scrollTop, scrollHeight, clientHeight } = content;
    const isOverflowing = scrollHeight > clientHeight + 4;
    setCanScroll(isOverflowing);

    if (!isOverflowing || clientHeight === 0) {
      setScrollProgress(0);
      setThumbHeight(42);
      return;
    }

    const trackHeight = track ? track.clientHeight : clientHeight;
    const ratio = clientHeight / scrollHeight;
    // Keep the thumb at a clean, elegant RPG grip size between 34px and 64px
    const calculatedThumbHeight = Math.max(34, Math.min(64, trackHeight * ratio));
    setThumbHeight(calculatedThumbHeight);

    const maxScroll = scrollHeight - clientHeight;
    const progress = maxScroll > 0 ? scrollTop / maxScroll : 0;
    setScrollProgress(Math.max(0, Math.min(1, progress)));
  }, []);

  useEffect(() => {
    updateMetrics();
    const content = contentRef.current;
    if (!content) return;

    const resizeObserver = new ResizeObserver(() => {
      updateMetrics();
    });

    resizeObserver.observe(content);
    return () => resizeObserver.disconnect();
  }, [updateMetrics, children]);

  const handleScroll = () => {
    updateMetrics();
  };

  // Drag thumb handler
  const handleThumbPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    dragStartY.current = e.clientY;
    if (contentRef.current) {
      dragStartScrollTop.current = contentRef.current.scrollTop;
    }
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleThumbPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const content = contentRef.current;
    const track = trackRef.current;
    if (!content || !track) return;

    const deltaY = e.clientY - dragStartY.current;
    const trackHeight = track.clientHeight;
    const availableTrack = trackHeight - thumbHeight;

    if (availableTrack <= 0) return;

    const maxScroll = content.scrollHeight - content.clientHeight;
    const scrollDelta = (deltaY / availableTrack) * maxScroll;
    content.scrollTop = dragStartScrollTop.current + scrollDelta;
  };

  const handleThumbPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Ignored
      }
    }
  };

  // Jump to click position on track
  const handleTrackPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const track = trackRef.current;
    const content = contentRef.current;
    if (!track || !content) return;

    const rect = track.getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    const trackHeight = rect.height;
    const availableTrack = trackHeight - thumbHeight;

    if (availableTrack <= 0) return;

    const targetOffset = clickY - thumbHeight / 2;
    const progress = Math.max(0, Math.min(1, targetOffset / availableTrack));
    const maxScroll = content.scrollHeight - content.clientHeight;
    content.scrollTop = progress * maxScroll;
  };

  // Calculate thumb top offset in pixels
  const currentTrackHeight = trackRef.current ? trackRef.current.clientHeight : 250;
  const availableTrack = Math.max(0, currentTrackHeight - thumbHeight);
  const thumbTop = availableTrack * scrollProgress;

  return (
    <div className={`relative w-full h-full overflow-hidden select-none ${className}`}>
      {/* 
        Scrollable clipped content container:
        Masks all children strictly within this chamber.
        When scrolling, content slides smoothly under the top beam and bottom border.
      */}
      <div
        ref={contentRef}
        onScroll={handleScroll}
        className={`w-full h-full overflow-y-auto no-scrollbar scroll-smooth pr-3 ${contentClassName}`}
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {children}
      </div>

      {/* 
        Vertical RPG Slider:
        Shown only when content overflows the lower chamber.
        Discreet, authentic fantasy track and draggable bronze/gold pill.
      */}
      <div
        ref={trackRef}
        onPointerDown={handleTrackPointerDown}
        className={`absolute right-0.5 top-1 bottom-1 w-2.5 bg-[#0b0301]/85 border border-[#78350f]/80 rounded-full shadow-[inset_0_2px_4px_rgba(0,0,0,0.95)] cursor-pointer z-30 flex justify-center touch-none transition-opacity duration-200 ${
          canScroll ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        title="Deslizar"
      >
        {/* Center groove line */}
        <div className="w-[1px] h-full bg-[#b45309]/30" />

        {/* Draggable Slider Thumb / Handle */}
        <div
          onPointerDown={handleThumbPointerDown}
          onPointerMove={handleThumbPointerMove}
          onPointerUp={handleThumbPointerUp}
          onPointerCancel={handleThumbPointerUp}
          style={{
            top: `${thumbTop}px`,
            height: `${thumbHeight}px`,
          }}
          className={`absolute w-3.5 -left-[2px] rounded-full bg-gradient-to-b from-[#fcd34d] via-[#d97706] to-[#78350f] border border-[#fef08a] shadow-[0_2px_5px_rgba(0,0,0,0.9),_inset_0_1px_1px_rgba(255,255,255,0.7)] cursor-grab active:cursor-grabbing transition-transform flex items-center justify-center touch-none ${
            isDragging
              ? 'brightness-125 shadow-[0_0_10px_rgba(251,191,36,0.95)] scale-110'
              : 'hover:brightness-110'
          }`}
        >
          {/* Center grip bead */}
          <div className="w-1.5 h-1 rounded-full bg-[#451a03] pointer-events-none" />
        </div>
      </div>
    </div>
  );
};
