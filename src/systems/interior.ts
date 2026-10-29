import { decorById, movableItems } from '../data/decorations';
import type { Decoration, State } from './state';
export interface Interior { floor: string; wall: string; grid: boolean; furniture: (Decoration & { hidden?: boolean })[] }
export function newInterior(): Interior {
  return { floor: 'floor-cedar', wall: 'wall-cream', grid: false, furniture: [{ id: 'table-round', x: 125, y: 535 }, { id: 'chair-wood', x: 124, y: 635 }, { id: 'stool-a', x: 463, y: 680 }, { id: 'stool-b', x: 689, y: 680 }, { id: 'stool-c', x: 911, y: 680 }] };
}
export function ownedItem(s: State, id: string): boolean { return !!decorById(id)?.base || s.owned.includes(id); }
export function visibleDecor(s: State): Decoration[] { return [...s.interior.furniture.filter(d => !d.hidden), ...s.decorations]; }
export function placeable(s: State, id: string): boolean { const item = decorById(id); return !!item && ownedItem(s, id) && !['upgrade', 'floor', 'wall'].includes(item.type); }
export function placement(s: State, id: string, x: number, y: number): { x: number; y: number } | null {
  if (!placeable(s, id) || !Number.isFinite(x) || !Number.isFinite(y)) return null;
  const clamp = (n: number, low: number, high: number) => Math.max(low, Math.min(high, n));
  const type = decorById(id)!.type;
  if (type === 'furniture' || type === 'rug' || type === 'aquarium') {
    if (y >= 650) { x = clamp(x, 350, 1010); y = clamp(y, 665, 700); }
    else { x = clamp(x, 85, 240); y = clamp(y, 455, 640); }
  } else if (type === 'windchime' || type === 'lantern') { x = clamp(x, 80, 1040); y = clamp(y, 90, 320); }
  else { x = clamp(x, 80, 1040); y = clamp(y, 140, 610); }
  if (s.interior.grid) { x = Math.round(x / 20) * 20; y = Math.round(y / 20) * 20; }
  return { x, y };
}
export function applyStyle(s: State, id: string): boolean {
  const item = decorById(id); if (!item || !ownedItem(s, id) || !['floor', 'wall'].includes(item.type)) return false;
  s.interior[item.type as 'floor' | 'wall'] = id; return true;
}
export function storeItem(s: State, id: string): boolean {
  if (!placeable(s, id)) return false;
  const base = s.interior.furniture.find(d => d.id === id);
  if (base) { if (base.hidden) return false; base.hidden = true; return true; }
  const i = s.decorations.findIndex(d => d.id === id); if (i < 0) return false;
  s.decorations.splice(i, 1); return true;
}
export function flipItem(s: State, id: string): boolean {
  const item = [...s.interior.furniture, ...s.decorations].find(d => d.id === id);
  if (!item || ('hidden' in item && item.hidden)) return false; item.flipped = !item.flipped; return true;
}
