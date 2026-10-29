export type GraphicsMode = 'auto' | 'light';
export const GRAPHICS_KEY = 'komorebi.graphics.v1';
export interface GameDisplay { width: number; height: number; density: number; pixelsWide: number; pixelsHigh: number }
/** Match physical screen pixels rather than multiplying the logical art size by DPR. */
export function gameDisplay(cssWidth: number, cssHeight: number, dpr: number, mobile: boolean, light = false): GameDisplay | null {
  if (![cssWidth, cssHeight, dpr].every(Number.isFinite) || cssWidth < 1 || cssHeight < 1 || dpr <= 0) return null;
  const width = mobile && cssWidth / cssHeight <= 1.15 ? 640 : 1120;
  const height = mobile ? width * cssHeight / cssWidth : 730;
  const fit = mobile ? cssWidth / width : Math.min(cssWidth / width, cssHeight / height);
  const budget = light ? 900_000 : mobile ? 1_600_000 : 3_000_000;
  const density = Math.min(fit * Math.min(dpr, light ? 1 : 2), Math.sqrt(budget / (width * height)), 2048 / Math.max(width, height));
  return { width, height, density, pixelsWide: Math.max(1, Math.floor(width * density)), pixelsHigh: Math.max(1, Math.floor(height * density)) };
}
export function appleMobile() { return typeof navigator !== 'undefined' && (/iPhone|iPad|iPod/.test(navigator.userAgent) || navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); }
export function graphicsMode(storage?: Pick<Storage, 'getItem'>, preferLight = appleMobile()): GraphicsMode {
  try { const saved = (storage ?? globalThis.localStorage).getItem(GRAPHICS_KEY); if (saved === 'light' || saved === 'auto') return saved; } catch {}
  return preferLight ? 'light' : 'auto';
}
export function saveGraphics(mode: GraphicsMode) { try { localStorage.setItem(GRAPHICS_KEY, mode); return true; } catch { return false; } }
