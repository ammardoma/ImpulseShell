import React from 'react';
import { hexToRgba } from './m3Engine';
import { M3Palette, SurfaceMaterialType } from '../types/shell';

export interface SurfaceMaterialMeta {
  id: SurfaceMaterialType;
  name: string;
  tagline: string;
  detail: string;
}

export const SURFACE_MATERIALS: SurfaceMaterialMeta[] = [
  {
    id: 'liquid_glass',
    name: 'Liquid Glass',
    tagline: 'Refractive specular rim + clear optical sheen',
    detail: 'Low-haze high-saturation glass with bright specular edge highlights',
  },
  {
    id: 'frosted_glass',
    name: 'Frosted Glass',
    tagline: 'Heavy matte blur + diffused ice grain',
    detail: 'Deep gaussian scatter that softly obscures wallpaper detail even at high transparency',
  },
  {
    id: 'acrylic_mica',
    name: 'Mica Tinted',
    tagline: 'Material You tonal bleed + satin depth',
    detail: 'Infuses primary wallpaper pigment directly into a soft translucent M3 surface',
  },
  {
    id: 'solid_m3',
    name: 'Solid M3',
    tagline: 'Opaque tonal elevation + zero blur overhead',
    detail: 'Pure Material 3 surface containers with minimum GPU fillrate',
  },
];

// Subtle inline SVG grain for authentic frosted glass texture
const FROST_NOISE_DATA_URI =
  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.06'/%3E%3C/svg%3E\")";

export function getSurfaceStyles(
  material: SurfaceMaterialType,
  transparencyPct: number,
  palette: M3Palette,
  darkMode: boolean,
  options?: {
    elevation?: 'bar' | 'window' | 'overlay';
    borderWidth?: number;
    borderColorOverride?: string;
    blurPasses?: number;
  }
): React.CSSProperties {
  const clampedTrans = Math.max(0, Math.min(85, transparencyPct));
  const opacity = 1 - clampedTrans / 100;
  const elevation = options?.elevation ?? 'bar';
  const passesFactor = 0.75 + ((options?.blurPasses ?? 3) - 1) * 0.14;

  const baseHex =
    elevation === 'overlay'
      ? palette.surfaceContainerLow
      : elevation === 'window'
        ? palette.surfaceContainerLow
        : palette.surfaceContainer;

  if (material === 'solid_m3') {
    // Solid M3 respects slight dim if user cranks transparency above 65%, otherwise crisp opaque M3
    const solidAlpha = Math.max(0.88, Math.min(1, opacity + 0.35));
    return {
      backgroundColor: hexToRgba(baseHex, solidAlpha),
      border: `${options?.borderWidth ?? 1}px solid ${
        options?.borderColorOverride ?? hexToRgba(palette.outlineVariant, 0.7)
      }`,
      boxShadow: darkMode
        ? '0 12px 32px -12px rgba(0, 0, 0, 0.55)'
        : '0 10px 28px -12px rgba(0, 0, 0, 0.16)',
    };
  }

  if (material === 'liquid_glass') {
    // Liquid glass stays cleaner & more refractive with crisp specular edge & diagonal sheen
    const liquidAlpha = Math.max(0.12, opacity * 0.78);
    const blurPx = Math.round((6 + clampedTrans * 0.08) * passesFactor);
    const sheenTop = darkMode ? 'rgba(255, 255, 255, 0.16)' : 'rgba(255, 255, 255, 0.52)';
    const sheenMid = darkMode ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.12)';
    const specularBorder =
      options?.borderColorOverride ??
      (darkMode ? 'rgba(255, 255, 255, 0.24)' : 'rgba(255, 255, 255, 0.68)');

    return {
      backgroundColor: hexToRgba(baseHex, liquidAlpha),
      backgroundImage: `linear-gradient(135deg, ${sheenTop} 0%, ${sheenMid} 48%, transparent 100%)`,
      backdropFilter: `blur(${blurPx}px) saturate(195%) contrast(106%)`,
      WebkitBackdropFilter: `blur(${blurPx}px) saturate(195%) contrast(106%)`,
      border: `${options?.borderWidth ?? 1}px solid ${specularBorder}`,
      boxShadow: darkMode
        ? 'inset 0 1px 0 rgba(255,255,255,0.28), inset 0 -1px 0 rgba(255,255,255,0.06), 0 16px 38px -12px rgba(0,0,0,0.52)'
        : 'inset 0 1px 0 rgba(255,255,255,0.85), inset 0 -1px 0 rgba(0,0,0,0.05), 0 14px 34px -12px rgba(0,0,0,0.18)',
    };
  }

  if (material === 'frosted_glass') {
    // Frosted glass uses deep diffuse blur, milky scattering tint, and subtle micro-grain
    const frostedAlpha = Math.max(0.22, opacity * 0.9);
    const blurPx = Math.round((22 + clampedTrans * 0.22) * passesFactor);
    const frostTint = darkMode ? 'rgba(255, 255, 255, 0.045)' : 'rgba(255, 255, 255, 0.28)';

    return {
      backgroundColor: hexToRgba(baseHex, frostedAlpha),
      backgroundImage: `${FROST_NOISE_DATA_URI}, linear-gradient(180deg, ${frostTint}, ${frostTint})`,
      backdropFilter: `blur(${blurPx}px) saturate(118%)`,
      WebkitBackdropFilter: `blur(${blurPx}px) saturate(118%)`,
      border: `${options?.borderWidth ?? 1}px solid ${
        options?.borderColorOverride ?? hexToRgba(palette.outlineVariant, 0.55)
      }`,
      boxShadow: darkMode
        ? 'inset 0 0 0 1px rgba(255,255,255,0.04), 0 12px 32px -12px rgba(0,0,0,0.48)'
        : 'inset 0 0 0 1px rgba(255,255,255,0.35), 0 10px 28px -12px rgba(0,0,0,0.14)',
    };
  }

  // acrylic_mica: Tinted with primaryContainer pigment for M3 wallpaper bleed
  const micaAlpha = Math.max(0.2, opacity * 0.88);
  const blurPx = Math.round((16 + clampedTrans * 0.14) * passesFactor);
  const pigment = hexToRgba(palette.primaryContainer, darkMode ? 0.28 : 0.36);

  return {
    backgroundColor: hexToRgba(baseHex, micaAlpha),
    backgroundImage: `linear-gradient(160deg, ${pigment} 0%, transparent 72%)`,
    backdropFilter: `blur(${blurPx}px) saturate(155%)`,
    WebkitBackdropFilter: `blur(${blurPx}px) saturate(155%)`,
    border: `${options?.borderWidth ?? 1}px solid ${
      options?.borderColorOverride ?? hexToRgba(palette.primary, 0.28)
    }`,
    boxShadow: darkMode
      ? '0 14px 34px -12px rgba(0,0,0,0.5)'
      : '0 12px 30px -12px rgba(0,0,0,0.15)',
  };
}
