import { customers } from '../data/customers';
import { recipes, type RecipeId } from '../data/recipes';
import { dayTarget } from './progression';
import { conversationFor } from './story';
import type { State, Order } from './state';
export function createOrder(s: State, now = Date.now()): Order | null {
  if (s.phase !== 'open' || s.orders.length >= 3 || s.stats.served + s.orders.length >= dayTarget(s.day)) return null;
  const pool = customers.filter(c => s.day >= (c.arrivalDay??1) && !s.orders.some(o => o.customerId === c.id));
  const newcomer=customers.find(c=>c.arrivalDay===s.day);
  const customer = newcomer && s.stats.served === 0 && !s.orders.length ? newcomer : pool[(s.day - 1 + s.stats.served + s.orders.length) % pool.length];
  const order: Order = { id: s.nextOrderId++, customerId: customer.id, recipeId: customer.favorite, extra: null, createdAt: now, patience: 1, accepted: false, clarified: false };
  const conversation = conversationFor(s, order);
  const requested = conversation?.goal ?? s.menu[(s.day * 3 + s.stats.served * 5 + s.orders.length) % s.menu.length];
  order.recipeId = s.menu.includes(requested) ? requested : s.menu[(s.day + s.stats.served + s.orders.length) % s.menu.length] as RecipeId;
  const extras = recipes[order.recipeId].extras.filter(extra => !recipes[order.recipeId].steps.some(step => step.type === 'ingredient' && step.ingredient === extra));
  if (s.day >= 3 && (s.stats.served + s.orders.length) % 2 === 0 && extras.length) order.extra = extras[(s.day + s.stats.served) % extras.length];
  return order;
}
