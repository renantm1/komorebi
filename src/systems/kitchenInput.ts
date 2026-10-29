import type { Gesture } from '../data/recipes';
export const COOK_WINDOW = { minimum: 500, idealStart: 1500, idealEnd: 3300, scale: 5000 } as const;
export interface Motion { dx: number; dy: number; distance: number; heldMs: number }
export function measureGesture(type: Gesture, motion: Motion) {
  const { dx, dy, distance, heldMs } = motion;
  let progress = 0;
  if (type === 'shape') progress = distance / 100;
  else if (type === 'roll') progress = Math.abs(dx) / 150;
  else if (type === 'fold') progress = Math.min(Math.abs(dx) / 80, Math.abs(dy) / 60);
  else if (type === 'toss') progress = -dy / 85;
  else if (type === 'cook' || type === 'fry') progress = heldMs / COOK_WINDOW.minimum;
  const timed = type === 'cook' || type === 'fry';
  const quality = !timed || heldMs >= COOK_WINDOW.idealStart && heldMs <= COOK_WINDOW.idealEnd ? 1 : Math.max(.6, 1 - Math.abs(heldMs - 2300) / 8000);
  return { complete: progress >= 1 - 1e-6, progress: Math.max(0, Math.min(1, progress)), quality };
}
