import { customers, recipes, ingredients, type IngredientId, type RecipeId } from '../data/catalog';
import { letters } from '../data/story';
import { newState, emptyStats, dishSteps, dayTarget, eventFor, type State } from './state';
import { SaveStore } from './save';
import { createOrder } from './orders';
import { dishQuality, payment } from './economy';
import { purchase } from './shop';
import { place } from './decoration';
import { answerConversation, completeConversation } from './story';
import {applyStyle,ownedItem,storeItem,flipItem} from './interior';
import {claimMilestone} from './milestones';
import {decorById} from '../data/decorations';
export interface KitchenFeedback { message: string; kind: 'success' | 'hint' | 'warning' }
export type GameView = 'restaurant' | 'kitchen' | 'decorate';
export class KitchenGame extends EventTarget {
  state: State; view: GameView = 'restaurant'; hasSave: boolean; paused = false; notice = ''; placing: string | null = null; selectedDecoration: string | null = null;
  kitchenFeedback: KitchenFeedback | null = null;
  feedback(message: string, kind: KitchenFeedback['kind'] = 'hint') { this.kitchenFeedback = { message, kind }; this.dispatchEvent(new Event('kitchen-feedback')); }
  constructor(public saves = new SaveStore()) { super(); const saved = saves.load(); this.state = saved ?? newState(); this.hasSave = !!saved; }
  changed() { const saved = this.saves.save(this.state); this.hasSave = saved || this.hasSave; this.dispatchEvent(new Event('change')); }
  message(text: string) { this.notice = text; this.dispatchEvent(new Event('notice')); }
  reset() { this.kitchenFeedback=null;this.state = newState(); this.view = 'restaurant'; this.placing = null; this.selectedDecoration=null; this.changed(); }
  open() { if (this.state.phase !== 'morning') return; this.state.phase = 'open'; this.spawnOrder(); this.changed(); }
  spawnOrder() { const order = createOrder(this.state); if (!order) return; this.state.orders.push(order); this.changed(); }
  acceptOrder() { const o = this.state.orders[0]; if (!o || this.state.phase !== 'open') return; o.accepted = true; this.changed(); }
  clarifyOrder() { const o = this.state.orders[0]; if (!o) return; o.clarified = true; this.changed(); }
  reply(choice: number) { const text = answerConversation(this.state, choice); if (text) { this.changed(); this.message(text); } }
  readLetter(id: string) { const letter = letters.find(l => l.id === id && l.day <= this.state.day); if (!letter || this.state.story.read.includes(id)) return; this.state.story.read.push(id); this.changed(); }
  beginDish(recipeId?: RecipeId) {
    if (this.state.phase !== 'open' || !this.state.orders[0]?.accepted) return;
    this.kitchenFeedback=null;this.view = 'kitchen';
    if (recipeId && Object.hasOwn(recipes, recipeId)) {
      if (this.state.dish && this.state.dish.step > 0 && this.state.dish.recipeId !== recipeId) { this.message('Limpe a tábua antes de começar outra receita. Os ingredientes são livres.'); return; }
      if (!this.state.dish || this.state.dish.recipeId !== recipeId) this.state.dish = { recipeId, step: 0, added: [], skill: [], actions: 0, ready: false };
    }
    this.changed();
  }
  ingredient(id: IngredientId) {
    const s = this.state, d = s.dish;
    if (!d || d.ready || !s.orders[0]?.accepted) return false;
    const step = dishSteps(d, s.orders[0].extra)[d.step];
    if (!step || step.type !== 'ingredient') return false;
    // Ingredients are always available. Nothing is bought, counted or depleted.
    if (!Object.hasOwn(ingredients, id)) return false;
    d.added.push(id); d.skill.push(step.ingredient === id ? 1 : .25); d.step++; this.advance(); return true;
  }
  gesture(quality: number) {
    const s = this.state, d = s.dish; if (!d || d.ready || !Number.isFinite(quality)) return;
    const step = dishSteps(d, s.orders[0]?.extra ?? null)[d.step]; if (!step || step.type === 'ingredient') return;
    const count = step.count ?? (step.type === 'cut' ? 3 : 1);
    d.actions++;
    if (d.actions < count) { this.changed(); return; }
    d.skill.push(Math.max(.25, Math.min(1, quality))); d.step++; d.actions = 0; this.advance();
  }
  private advance() { const s = this.state, d = s.dish; if (d) d.ready = d.step >= dishSteps(d, s.orders[0]?.extra ?? null).length; this.changed(); }
  discard() { if (!this.state.dish) return;this.kitchenFeedback=null; this.state.dish = null; this.changed(); this.message('Tábua limpa. Pode recomeçar sem custo e sem preocupação.'); }
  serve() {
    const s = this.state, d = s.dish, o = s.orders[0]; if (!o?.accepted || !d?.ready) return null;
    const q = dishQuality(d, o, s.upgrades.includes('counter'));
    const { price, tip: baseTip } = payment(o.recipeId, q, s.day);
    const tip = baseTip + (s.upgrades.includes('teaset') && q >= .7 ? Math.round(price * .05) : 0), total = price + tip;
    const story = completeConversation(s, o, q);
    s.ledger.served++; if(q>=.7)s.ledger.dishes[d.recipeId]=(s.ledger.dishes[d.recipeId]??0)+1;
    s.money += total; s.stats.revenue += price; s.stats.tips += tip; s.stats.served++; s.stats.quality += q;
    s.reputation = Math.max(0, Math.min(5, s.reputation + (q - .65) * .12)); s.xp += Math.round(15 + q * 25);
    s.relationships[o.customerId] = (s.relationships[o.customerId] ?? 0) + 1;
    s.orders.shift(); s.dish = null;this.kitchenFeedback=null; this.view = 'restaurant'; this.changed();
    const c = customers.find(c => c.id === o.customerId)!;
    this.message(story ?? `${c.name}: “${q >= .85 ? 'Está uma delícia! Dá para sentir o carinho.' : q >= .5 ? 'Obrigada por cozinhar para mim. Quero voltar amanhã.' : 'Não era bem o que pedi, mas amanhã tentamos de novo.'}”  +¥ ${total}`);
    this.dispatchEvent(new CustomEvent('served', { detail: { quality: q, total, story } }));
    return { quality: q, total, tip, customerId: c.id };
  }
  finishDay() {
    const s = this.state;
    if (s.phase !== 'open' || s.orders.length || s.dish || s.stats.served < dayTarget(s.day)) return false;
    s.stats.rent = Math.max(0, Math.min(180, s.money)); s.money -= s.stats.rent; s.phase = 'night';
    if (eventFor(s.day) && !s.completedEvents.includes(`day-${s.day}`)) s.completedEvents.push(`day-${s.day}`);
    s.lastSummary = letters.filter(l => l.day === s.day + 1).map(l => `Nova carta: ${l.title}`);
    if (s.day + 1 === 3) s.lastSummary.push('Lanternas e pedidos com complementos');
    if (s.day + 1 === 7) s.lastSummary.push('Kenji vem conhecer sua cozinha');
    if ((s.day + 1) % 10 === 0) s.lastSummary.push('Noite das lanternas · gorjetas de celebração');
    this.changed(); return true;
  }
  nextDay() { if (this.state.phase !== 'night') return; if(this.state.tutorial==='active'||this.state.day===1&&this.state.tutorial===undefined)this.state.tutorial='completed';this.state.day++; this.state.phase = 'morning'; this.state.stats = emptyStats(); this.changed(); }
  buyDecor(id: string) { const item = purchase(this.state,id); if(!item)return false; if(['floor','wall'].includes(item.type)){applyStyle(this.state,id);this.view='decorate';}else if(item.type!=='upgrade'){this.placing=id;this.view='decorate';}this.changed();return true; }
  applyInterior(id:string){const item=decorById(id);if(!item||!['floor','wall'].includes(item.type))return false;if(!ownedItem(this.state,id)&&!purchase(this.state,id))return false;if(!applyStyle(this.state,id))return false;this.view='decorate';this.changed();return true;}
  placeDecor(id:string,x:number,y:number){if(!place(this.state,id,x,y))return;this.placing=null;this.selectedDecoration=id;this.changed();}
  selectDecor(id:string){this.selectedDecoration=id;this.placing=null;this.dispatchEvent(new Event('change'));}
  storeDecor(id:string){if(!storeItem(this.state,id))return;this.selectedDecoration=null;this.changed();}
  flipDecor(id:string){if(flipItem(this.state,id))this.changed();}
  toggleGrid(){this.state.interior.grid=!this.state.interior.grid;this.changed();}
  claimGoal(id:string){const text=claimMilestone(this.state,id);if(!text)return false;this.changed();this.message(text);return true;}
  setView(view: GameView) { this.view = view; this.dispatchEvent(new Event('change')); }
  tick(dt: number) {
    if (this.paused || this.state.phase !== 'open' || this.state.settings.relaxed) return;
    let changed = false;
    for (const o of this.state.orders) {
      const p = Math.max(.25, o.patience - dt / 300000);
      if (Math.floor(p * 100) !== Math.floor(o.patience * 100)) changed = true;
      o.patience = p;
    }
    if (changed) this.changed();
  }
}
