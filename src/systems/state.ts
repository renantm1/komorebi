import {newInterior,type Interior} from './interior';
import {newLedger,type Ledger} from './milestones';
import { type IngredientId, type RecipeId, ingredients, recipes, recipeIds } from '../data/catalog';
export interface Order { id: number; customerId: string; recipeId: RecipeId; extra: IngredientId | null; createdAt: number; patience: number; accepted: boolean; clarified: boolean }
export interface Dish { recipeId: RecipeId; step: number; added: IngredientId[]; skill: number[]; actions: number; ready: boolean }
export interface Decoration { id: string; x: number; y: number; flipped?: boolean }
export interface DayStats { revenue: number; tips: number; served: number; quality: number; rent: number }
export interface StoryState { read: string[]; replies: Record<string, number>; affinity: Record<string, number>; completed: string[]; letters: string[] }
export interface State {
  tutorial?: 'active' | 'dismissed' | 'completed';
  version: 3; day: number; phase: 'morning' | 'open' | 'night'; money: number; xp: number; reputation: number;
  menu: RecipeId[]; orders: Order[]; nextOrderId: number; dish: Dish | null; stats: DayStats;
  decorations: Decoration[]; owned: string[]; upgrades: string[]; relationships: Record<string, number>;
  completedEvents: string[]; settings: { relaxed: boolean; volume: number; music: boolean; musicVolume: number; track: number; ambience: boolean };
  lastSummary: string[]; story: StoryState; interior: Interior; ledger: Ledger;
}
export const emptyStats = (): DayStats => ({ revenue: 0, tips: 0, served: 0, quality: 0, rent: 0 });
export const emptyStory = (): StoryState => ({ read: [], replies: {}, affinity: {}, completed: [], letters: [] });
export function newState(): State {
  return { version: 3, interior: newInterior(), ledger: newLedger(), day: 1, phase: 'morning', money: 15000, xp: 0, reputation: 3.5, menu: [...recipeIds], orders: [], nextOrderId: 1, dish: null, stats: emptyStats(), decorations: [], owned: [], upgrades: [], relationships: {}, completedEvents: [], settings: { relaxed: true, volume: .6, music: true, musicVolume: .55, track: 0, ambience: true }, lastSummary: [], story: emptyStory() };
}
export function dishSteps(dish: Dish, extra: IngredientId | null) {
  const steps = [...recipes[dish.recipeId].steps];
  if (extra && !steps.some(s => s.type === 'ingredient' && s.ingredient === extra)) steps.push({ type: 'ingredient', ingredient: extra, label: `Finalize com ${ingredients[extra].name.toLowerCase()}` });
  return steps;
}
export { dayTarget, level, eventFor } from './progression';
