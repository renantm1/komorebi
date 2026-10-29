import { describe, it, expect } from 'vitest';
import { KitchenGame } from '../../src/systems/game';
import { SaveStore, SAVE_KEY, BACKUP_KEY, validateState, migrateState } from '../../src/systems/save';
import { newState, dishSteps, dayTarget, eventFor } from '../../src/systems/state';
import { ingredients, recipes, recipeIds, type RecipeId } from '../../src/data/catalog';
import { activeLetter, conversationFor } from '../../src/systems/story';
function memory() { const data = new Map<string, string>(); return { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => { data.set(k, v); }, removeItem: (k: string) => { data.delete(k); } }; }
function game() { return new KitchenGame(new SaveStore(memory())); }
function finishDish(g: KitchenGame, recipe = g.state.orders[0].recipeId, wrong = false) {
  g.acceptOrder(); g.beginDish(recipe); let guard = 0;
  while (!g.state.dish!.ready && guard++ < 30) { const d = g.state.dish!, step = dishSteps(d, g.state.orders[0].extra)[d.step]; if (step.type === 'ingredient') g.ingredient(wrong ? step.ingredient === 'sesame' ? 'nori' : 'sesame' : step.ingredient); else g.gesture(1); }
  expect(g.state.dish!.ready).toBe(true); return g.serve()!;
}
function finishDay(g: KitchenGame) { while (g.state.stats.served < dayTarget(g.state.day)) { if (!g.state.orders.length) g.spawnOrder(); finishDish(g); } expect(g.finishDay()).toBe(true); }
describe('uma cozinha sem estoque', () => {
  for (const id of recipeIds) it(`prepara ${id}, valida seus gestos e recebe uma única vez`, () => {
    const g = game(); g.state.menu = [id]; g.open(); const before = g.state.money; const r = finishDish(g);
    expect(r.quality).toBe(1); expect(g.state.money).toBe(before + recipes[id].price + Math.round(recipes[id].price * .12)); expect(g.state).not.toHaveProperty('inventory');
    const paid = g.state.money; expect(g.serve()).toBeNull(); expect(g.state.money).toBe(paid);
  });
  it('todos os doze pratos estão disponíveis desde o primeiro dia', () => { expect(recipeIds).toHaveLength(12); expect(game().state.menu).toEqual(recipeIds); });
  it('nunca bloqueia ou cobra ingredientes, mesmo após muitos pratos', () => {
    const g = game(); g.state.menu = ['onigiri']; g.open(); g.acceptOrder();
    for (let i = 0; i < 80; i++) { g.beginDish('onigiri'); expect(g.ingredient('rice')).toBe(true); g.discard(); }
    expect(g.state.money).toBe(15000); expect(g.state.stats.served).toBe(0); expect(g.state).not.toHaveProperty('inventory');
  });
  it('não paga sem aceitar o pedido ou sem terminar o prato', () => { const g = game(); g.open(); g.beginDish('onigiri'); expect(g.state.dish).toBeNull(); g.acceptOrder(); g.beginDish('onigiri'); g.ingredient('rice'); expect(g.serve()).toBeNull(); expect(g.state.money).toBe(15000); });
  it('o jogador escolhe a receita e a precisão influencia pagamento e reação', () => { const good = game(), bad = game(); good.open(); bad.open(); const a = finishDish(good), b = finishDish(bad, 'ramen', true); expect(b.quality).toBeLessThan(a.quality); expect(b.total).toBeLessThan(a.total); expect(bad.state.reputation).toBeLessThan(good.state.reputation); });
  it('conta as três dobrinhas e os três movimentos de saltear', () => {
    for (const id of ['gyoza', 'yakisoba'] as RecipeId[]) { const g = game(); g.state.menu = [id]; g.open(); g.acceptOrder(); g.beginDish(id); while (g.state.dish!.step < (id === 'gyoza' ? 3 : 4)) { const d = g.state.dish!, step = dishSteps(d, null)[d.step]; if (step.type === 'ingredient') g.ingredient(step.ingredient); }
      const initial = g.state.dish!.step; g.gesture(1); expect(g.state.dish!.step).toBe(initial); expect(g.state.dish!.actions).toBe(1); g.gesture(1); g.gesture(1); expect(g.state.dish!.step).toBe(initial + 1); expect(g.state.dish!.actions).toBe(0);
    }
  });
});
describe('histórias que continuam', () => {
  it('guarda cartas lidas e só disponibiliza as que chegaram', () => { const g = game(); expect(activeLetter(g.state)?.id).toBe('grandma-1'); g.readLetter('festival-10'); expect(g.state.story.read).toEqual([]); g.readLetter('grandma-1'); expect(activeLetter(g.state)).toBeNull(); g.state.day = 2; expect(activeLetter(g.state)?.id).toBe('grandma-2'); });
  it('as duas respostas alteram a conversa e ficam salvas, sem premiar clique repetido', () => { const g = game(); g.open(); expect(conversationFor(g.state, g.state.orders[0])?.title).toBe('A primeira página'); g.reply(1); expect(g.state.story.replies[String(g.state.orders[0].id)]).toBe(1); expect(g.state.story.affinity.aiko).toBe(1); g.reply(0); expect(g.state.story.affinity.aiko).toBe(1); expect(g.state.story.replies[String(g.state.orders[0].id)]).toBe(1); });
  it('entregar o prato da história concede e posiciona um presente real uma única vez', () => { const g = game(); g.state.day = 5; g.state.menu = ['onigiri']; g.open(); expect(g.state.orders[0].customerId).toBe('hana'); g.reply(0); finishDish(g); expect(g.state.story.completed).toContain('hana-flowers'); expect(g.state.owned).toContain('flowers'); expect(g.state.decorations).toContainEqual({ id: 'flowers', x: 400, y: 425 }); expect(g.state.relationships.hana).toBe(1); });
  it('um prato errado não conclui a história nem concede o presente', () => { const g = game(); g.state.day = 5; g.open(); finishDish(g, 'ramen', true); expect(g.state.story.completed).not.toContain('hana-flowers'); expect(g.state.owned).not.toContain('flowers'); });
  it('uma história mal atendida pode ser retomada, sem perder o presente para sempre', () => { const g = game(); g.state.day = 5; g.open(); const order = { ...g.state.orders[0] }; finishDish(g, 'ramen', true); expect(g.state.relationships.hana).toBe(1); expect(conversationFor(g.state, order)?.id).toBe('hana-flowers'); g.state.orders = [{ ...order, id: 2, accepted: false }]; finishDish(g); expect(g.state.owned).toContain('flowers'); expect(g.state.story.completed).toContain('hana-flowers'); });
  it('dez dias completos sem reposição, com todos os vizinhos e progressão real', () => { const g = game(), seen = new Set<string>(); for (let day = 1; day <= 10; day++) { expect(g.state.day).toBe(day); g.open(); while (g.state.stats.served < dayTarget(day)) { if (!g.state.orders.length) g.spawnOrder(); seen.add(g.state.orders[0].customerId); g.reply(0); finishDish(g); } expect(g.finishDay()).toBe(true); g.nextDay(); } expect(seen.size).toBe(6); expect(g.state.day).toBe(11); expect(g.state.completedEvents).toContain('day-10'); expect(g.state.story.completed.length).toBeGreaterThan(7); expect(g.state.money).toBeGreaterThan(15000); });
});
describe('casa, caixa e ritmo tranquilo', () => {
  it('fecha somente depois de todos os pedidos, descontando apenas o cuidado com a casa', () => { const g = game(); g.open(); expect(g.finishDay()).toBe(false); finishDish(g); expect(g.finishDay()).toBe(false); finishDay(g); expect(g.state.money).toBe(15000 + g.state.stats.revenue + g.state.stats.tips - 180); const money = g.state.money; expect(g.finishDay()).toBe(false); expect(g.state.money).toBe(money); });
  it('compra, posiciona e move móveis sem duplicar compras', () => { const g = game(); expect(g.buyDecor('plant')).toBe(true); expect(g.state.money).toBe(14100); expect(g.buyDecor('plant')).toBe(false); g.placeDecor('plant', 300, 350); g.placeDecor('plant', 450, 400); expect(g.state.decorations).toEqual([{ id: 'plant', x: 450, y: 400 }]); });
  it('chá é uma melhoria de gorjetas, sem qualquer mecânica de estoque', () => { const g = game(); g.state.day = 2; expect(g.buyDecor('teaset')).toBe(true); g.open(); const r = finishDish(g); expect(r.tip).toBe(Math.round(recipes[g.state.menu.includes('ramen') ? 'ramen' : 'onigiri'].price * .12) + Math.round(recipes.ramen.price * .05)); });
  it('o modo relaxado não reduz paciência e a fila normal tem até três clientes', () => { const g = game(); g.open(); g.tick(20000); expect(g.state.orders[0].patience).toBe(1); g.state.settings.relaxed = false; g.tick(20000); expect(g.state.orders[0].patience).toBeLessThan(1); for (let i = 0; i < 8; i++) g.spawnOrder(); expect(g.state.orders).toHaveLength(3); });
  it('o festival retorna a cada dez dias e a casa continua depois do dia 30', () => { expect(eventFor(10)?.title).toBe('Festival do bairro'); expect(eventFor(40)?.title).toBe('Festival do bairro'); const g = game(); g.state.day = 30; g.open(); finishDay(g); g.nextDay(); expect(g.state.day).toBe(31); });
});
describe('salvamento e migração', () => {
  it('retoma um prato e uma resposta no ponto exato', () => { const storage = memory(), g = new KitchenGame(new SaveStore(storage)); g.open(); g.reply(1); g.acceptOrder(); g.beginDish('onigiri'); g.ingredient('rice'); const next = new KitchenGame(new SaveStore(storage)); expect(next.hasSave).toBe(true); expect(next.state).toEqual(g.state); expect(next.state.dish!.step).toBe(1); });
  it('preserva móveis, cartas e todas as opções de áudio após reabrir', () => { const storage = memory(), g = new KitchenGame(new SaveStore(storage)); g.buyDecor('plant'); g.placeDecor('plant', 300, 400); g.readLetter('grandma-1'); g.state.settings.track = 2; g.state.settings.musicVolume = .15; g.changed(); const next = new KitchenGame(new SaveStore(storage)); expect(next.state.settings).toEqual(g.state.settings); expect(next.state.decorations).toEqual(g.state.decorations); expect(next.state.story.read).toEqual(['grandma-1']); });
  it('migra a versão anterior mantendo dia, dinheiro, decoração e preparo; remove estoque', () => {
    const storage = memory(), fresh = newState();
    const old = { ...fresh, version: 1, day: 4, money: 18420, inventory: { rice: 0 }, menu: ['onigiri'], owned: ['plant', 'fridge'], upgrades: ['fridge'], decorations: [{ id: 'plant', x: 300, y: 400 }], phase: 'open', orders: [{ id: 1, customerId: 'aiko', recipeId: 'onigiri', extra: null, createdAt: Date.now(), patience: 1 }], nextOrderId: 2, dish: { recipeId: 'onigiri', step: 1, added: ['rice'], skill: [1], cuts: 0, ready: false }, stats: { ...fresh.stats, cost: 35, supplies: 200 } };
    delete (old as any).story; storage.setItem(SAVE_KEY, JSON.stringify(old)); const g = new KitchenGame(new SaveStore(storage)); expect(g.hasSave).toBe(true); expect(g.state.version).toBe(3); expect(g.state.money).toBe(18420); expect(g.state.day).toBe(4); expect(g.state.dish!.step).toBe(1); expect(g.state.orders[0].accepted).toBe(true); expect(g.state.upgrades).toContain('teaset'); expect(g.state).not.toHaveProperty('inventory'); expect(g.state.stats).not.toHaveProperty('supplies'); expect(g.state.menu).toHaveLength(12);
  });
  it('trata dados corrompidos sem quebrar a aplicação e preserva uma cópia', () => { const storage = memory(); storage.setItem(SAVE_KEY, '{quebrado'); expect(new SaveStore(storage).load()).toBeNull(); expect(storage.getItem(BACKUP_KEY)).toBe('{quebrado'); const s = newState(); (s as any).orders = [{ recipeId: 'desconhecido' }]; expect(validateState(s)).toBeNull(); expect(validateState({ version: 2 })).toBeNull(); expect(migrateState(null)).toBeNull(); });
  it('falhas de armazenamento não bloqueiam a cozinha', () => { const saves = new SaveStore({ getItem: () => null, setItem: () => { throw Error('QuotaExceeded'); }, removeItem: () => {} }), g = new KitchenGame(saves); g.open(); g.acceptOrder(); g.beginDish('onigiri'); expect(g.ingredient('rice')).toBe(true); expect(g.hasSave).toBe(false); expect(saves.error).toContain('bloqueou'); });
});
