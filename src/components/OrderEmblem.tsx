import React, { useId } from 'react';
import { decodeEmblem, getPalette, getSymbolIcon, isEmblemCode, SHAPE_PATHS } from '../utils/orderEmblems';

interface OrderEmblemProps {
  emblem: string;
  className?: string;
  iconClassName?: string;
}

/**
 * Emblema heráldico de la Orden. Si el valor guardado es un código se dibuja en vectorial
 * (forma + degradado + símbolo); si es una ruta antigua se muestra la imagen tal cual.
 */
export const OrderEmblem: React.FC<OrderEmblemProps> = ({ emblem, className = '', iconClassName = '' }) => {
  const gradientId = `emblem-grad-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;

  if (!isEmblemCode(emblem)) {
    return (
      <img
        src={emblem}
        alt=""
        className={`object-contain ${className}`}
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).src = '/assets/items/Recurso 287@4x.png';
        }}
      />
    );
  }

  const selection = decodeEmblem(emblem);
  const shape = SHAPE_PATHS[selection.shape];
  const palette = getPalette(selection.palette);
  const Icon = getSymbolIcon(selection.symbol);

  return (
    <div className={`relative ${className}`}>
      <svg viewBox="0 0 64 64" className="absolute inset-0 w-full h-full" aria-hidden="true">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0.4" y2="1">
            <stop offset="0%" stopColor={palette.from} />
            <stop offset="100%" stopColor={palette.to} />
          </linearGradient>
        </defs>
        <path d={shape.outer} fill={`url(#${gradientId})`} stroke={palette.rim} strokeWidth="3" strokeLinejoin="round" />
        {shape.inner && (
          <path
            d={shape.inner}
            fill="none"
            stroke={palette.rim}
            strokeWidth="1.4"
            strokeLinejoin="round"
            opacity="0.5"
          />
        )}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <Icon
          className={`w-1/2 h-1/2 drop-shadow-[0_1px_2px_rgba(0,0,0,0.65)] ${iconClassName}`}
          style={{ color: palette.glyph }}
          strokeWidth={2.2}
        />
      </div>
    </div>
  );
};
