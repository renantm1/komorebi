import { milestones } from '../data/milestones';
import { customers } from '../data/customers';
import { decorById } from '../data/decorations';
import type { State } from './state';
export interface Ledger { served: number; dishes: Record<string, number>; claimed: string[] }
export const newLedger = (): Ledger => ({ served: 0, dishes: {}, claimed: [] });
export function milestoneStatus(s: State, id: string) {
  const goal = milestones.find(g => g.id === id); if (!goal) return null;
  const progress = goal.kind === 'served' ? s.ledger.served : goal.kind === 'friends' ? customers.slice(0, 6).filter(c => (s.relationships[c.id] ?? 0) > 0).length : goal.kind === 'stories' ? s.story.completed.length : goal.kind === 'recipes' ? Object.values(s.ledger.dishes).filter(n => n > 0).length : s.day;
  return { ...goal, progress: Math.min(progress, goal.target), complete: progress >= goal.target, claimed: s.ledger.claimed.includes(id) };
}
export function claimMilestone(s: State, id: string): string | null {
  const goal = milestoneStatus(s, id); if (!goal?.complete || goal.claimed) return null;
  s.ledger.claimed.push(id);
  if (!s.owned.includes(goal.reward)) s.owned.push(goal.reward);
  return `${goal.title}: ${decorById(goal.reward)!.name} agora faz parte da sua coleção.`;
}
