import React, { useLayoutEffect, useRef, useState } from 'react';
import { SPRITE_ANCHOR } from '../data/spriteAnchor';
import { SPRITE_BOUNDS } from '../data/spriteBounds';
import type { ActiveGachaEffect } from '../types/gachaCombatEffects';
import {
  STATUS_AURA_SPRITE_ASSETS,
  StatusAuraManager,
  StatusAuraSvgFilterDefs,
  getAuraConfigForCondition,
  getStatusSpriteShaderFilter,
  normalizeConditionKey,
  type AuraAnchorBox,
  type ConditionKey,
} from './StatusAuraManager';

export const STATUS_VFX_ASSETS: readonly string[] = STATUS_AURA_SPRITE_ASSETS;

export const StatusShadersSvgDefs = StatusAuraSvgFilterDefs;

export { getStatusSpriteShaderFilter, normalizeConditionKey };
export type { ConditionKey };

export interface StatusConditionsVfxOverlayProps {
  activeEffect: ActiveGachaEffect | null;
  cueKey: number;
  durationMs?: number;
  spriteUrl: string;
  spriteImgRef: React.RefObject<HTMLImageElement | null>;
  scaleKey?: string | number;
  disabled?: boolean;
  persistent?: boolean;
}

export const StatusConditionsVfxOverlay: React.FC<StatusConditionsVfxOverlayProps> = ({
  activeEffect,
  cueKey,
  durationMs = 450,
  spriteUrl,
  spriteImgRef,
  scaleKey,
  disabled = false,
  persistent = false,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const auraConfig = disabled ? null : getAuraConfigForCondition(activeEffect);

  const [box, setBox] = useState<AuraAnchorBox>({
    hostW: 149,
    hostH: 256,
    footX: 74.5,
    footY: 250,
    bodyBotY: 250,
    headX: 74.5,
    headY: 44,
    crownY: 8,
    centerX: 74.5,
    torsoX: 74.5,
    torsoY: 129,
    bodyH: 242,
    bodyW: 96,
    contourPx: Array.from({ length: 16 }, (_, i) => {
      const t = i / 15;
      const half = 26 + 22 * Math.sin(Math.PI * t);
      return [74.5 - half, 74.5 + half] as const;
    }),
  });

  const recomputeBox = () => {
    const host = containerRef.current;
    const img = spriteImgRef.current;
    if (!host || !img) return;
    const hostRect = host.getBoundingClientRect();
    const imgRect = img.getBoundingClientRect();
    if (!hostRect.width || !hostRect.height || !imgRect.width || !imgRect.height) return;

    // Convertir coordenadas de pantalla a píxeles CSS locales sin escala del host
    // (evita doble escala en enemigos con scale-105 o animaciones de entrada/vuelo).
    const localHostW = host.offsetWidth || hostRect.width;
    const localHostH = host.offsetHeight || hostRect.height;
    const invScaleX = hostRect.width > 0 ? localHostW / hostRect.width : 1;
    const invScaleY = hostRect.height > 0 ? localHostH / hostRect.height : 1;

    const imgLeft = (imgRect.left - hostRect.left) * invScaleX;
    const imgTop = (imgRect.top - hostRect.top) * invScaleY;
    const imgW = imgRect.width * invScaleX;
    const imgH = imgRect.height * invScaleY;

    const anchor = SPRITE_ANCHOR[spriteUrl] ?? { c: 0.5, b: 0.98, hx: 0.5, hy: 0.17 };
    const bounds = SPRITE_BOUNDS[spriteUrl];
    const centerRatioX = bounds ? bounds.cx : (anchor.c + anchor.hx) * 0.5;
    const widthRatio = bounds ? bounds.w : 0.6;
    const crownRatioY = bounds ? bounds.headTopY : Math.max(0.02, anchor.hy - 0.1);
    const bodyBotRatioY = bounds ? bounds.bodyBotY : anchor.b;

    const footX = imgLeft + anchor.c * imgW;
    const footY = imgTop + anchor.b * imgH;
    const bodyBotY = imgTop + bodyBotRatioY * imgH;
    const headX = imgLeft + anchor.hx * imgW;
    const headY = imgTop + anchor.hy * imgH;
    const crownY = imgTop + crownRatioY * imgH;
    const centerX = imgLeft + centerRatioX * imgW;
    const bodyH = Math.max(44, bodyBotY - crownY);
    const bodyW = Math.max(36, widthRatio * imgW);
    const contourPx: ReadonlyArray<readonly [number, number]> = bounds?.contour?.length
      ? bounds.contour.map(([l, r]) => [imgLeft + l * imgW, imgLeft + r * imgW] as const)
      : Array.from({ length: 16 }, (_, i) => {
          const t = i / 15;
          const half = bodyW * (0.28 + 0.22 * Math.sin(Math.PI * t));
          return [centerX - half, centerX + half] as const;
        });

    setBox({
      hostW: localHostW,
      hostH: localHostH,
      footX,
      footY,
      bodyBotY,
      headX,
      headY,
      crownY,
      centerX,
      torsoX: centerX,
      torsoY: crownY + bodyH * 0.5,
      bodyH,
      bodyW,
      contourPx,
    });
  };

  useLayoutEffect(() => {
    recomputeBox();
    const img = spriteImgRef.current;
    const host = containerRef.current;
    const onLoad = () => recomputeBox();
    if (img) img.addEventListener('load', onLoad);
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && host) {
      ro = new ResizeObserver(() => recomputeBox());
      ro.observe(host);
      if (img) ro.observe(img);
    }
    const rafId = window.requestAnimationFrame(recomputeBox);
    return () => {
      window.cancelAnimationFrame(rafId);
      if (img) img.removeEventListener('load', onLoad);
      if (ro) ro.disconnect();
    };
  }, [spriteUrl, scaleKey, auraConfig?.key, cueKey]);

  if (!auraConfig) return null;

  return (
    <div
      key={`status-aura-host-${auraConfig.key}-${cueKey}`}
      ref={containerRef}
      className="absolute inset-0 pointer-events-none z-[28] overflow-visible select-none"
      aria-hidden="true"
    >
      <StatusAuraManager
        config={auraConfig}
        cueKey={cueKey}
        durationMs={durationMs}
        box={box}
        persistent={persistent}
      />
    </div>
  );
};
