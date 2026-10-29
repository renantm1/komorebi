import { conversations, letters } from '../data/story';
import { recipes } from '../data/recipes';
import { customers } from '../data/customers';
import type { State, Order } from './state';
export function conversationFor(s: State, order: Order) {
  const visit = s.relationships[order.customerId] ?? 0;
  return conversations.find(c => c.customerId === order.customerId && c.visit <= visit && (c.day??1)<=s.day && !s.story.completed.includes(c.id)) ?? null;
}
export function activeLetter(s: State) { return letters.filter(l => l.day <= s.day && !s.story.read.includes(l.id)).at(-1) ?? null; }
export function answerConversation(s: State, choice: number): string | null {
  const order = s.orders[0]; if (!order) return null;
  const c = conversationFor(s, order); if (!c || !c.choices[choice] || s.story.replies[String(order.id)] !== undefined) return null;
  s.story.replies[String(order.id)] = choice;
  s.story.affinity[order.customerId] = (s.story.affinity[order.customerId] ?? 0) + 1;
  return c.choices[choice].reply;
}
export function completeConversation(s: State, order: Order, quality: number): string | null {
  const c = conversationFor(s, order);
  if (!c || quality < .7 || order.recipeId !== c.goal || s.story.completed.includes(c.id)) return null;
  s.story.completed.push(c.id);
  if (!c.reward || s.owned.includes(c.reward)) return `Uma memória guardada: ${c.title}.`;
  s.owned.push(c.reward);
  const positions: Record<string, [number, number]> = { flowers: [400, 425], plant: [190, 410], art: [780, 250], lantern: [745, 100], windchime:[370,180], bookcase:[190,520], bonsai:[385,425], banner:[750,250] };
  const [x, y] = positions[c.reward] ?? [400, 420];
  s.decorations.push({ id: c.reward, x, y });
  return `${customers.find(x => x.id === order.customerId)!.name} deixou um presente para a casa. Já está no salão!`;
}
export function requestText(s: State, order: Order): string {
  const recipe = recipes[order.recipeId];
  const intros = ['Hoje eu precisava de um lugar assim.', 'O cheirinho me trouxe até aqui.', 'Posso ficar um pouco perto da janela?', 'Que bom encontrar a porta aberta.', 'Trouxe um pouco de fome e uma boa história.'];
  return `${intros[(order.id + s.day) % intros.length]} ${order.clarified ? `Quero ${recipe.name.toLowerCase()}.` : `Um ${recipe.name.toLowerCase()}, por favor.`}${order.extra ? ` Com ${order.extra === 'sesame' ? 'gergelim' : order.extra === 'scallion' ? 'cebolinha' : 'shimeji'} a mais.` : ''}`;
}
