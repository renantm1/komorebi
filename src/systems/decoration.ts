import type { State } from './state';
import { placement } from './interior';
export function place(state: State, id: string, x: number, y: number): boolean {
  const point = placement(state, id, x, y); if (!point) return false;
  const base = state.interior.furniture.find(d => d.id === id);
  if (base) { base.x = point.x; base.y = point.y; base.hidden = false; return true; }
  const d = state.decorations.find(d => d.id === id);
  if (d) { d.x = point.x; d.y = point.y; } else state.decorations.push({ id, ...point });
  return true;
}
