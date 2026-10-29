import { test, expect } from '@playwright/test';
import { recipes, recipeIds, recipeIngredients } from '../../src/data/recipes';
import { newState } from '../../src/systems/state';
import { newGame, seed, orderState, choose, cook, saved, drag, clickWorld } from './helpers';
for (const id of recipeIds) test(`prepara e entrega ${recipes[id].name} com os gestos reais`, async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await seed(page, orderState(id)); await choose(page, id); await cook(page, id);
  if (['temaki', 'gyoza', 'ramen', 'yakisoba'].includes(id)) await page.screenshot({ path: `test-results/${id}.png`, fullPage: true });
  await page.getByRole('button', { name: 'Servir com carinho' }).click();
  const state = await saved(page); expect(state.stats.served).toBe(1); expect(state.stats.quality).toBeGreaterThan(.95); expect(state.money).toBe(15000 + recipes[id].price + Math.round(recipes[id].price * .12)); expect(state).not.toHaveProperty('inventory'); expect(errors).toEqual([]);
});
test('ciclo completo com os quatro primeiros pedidos e continuação no dia seguinte', async ({ page }) => {
  await newGame(page); await page.getByRole('button', { name: 'Abrir o restaurante' }).click();
  for (let i = 0; i < 4; i++) {
    const next = page.getByRole('button', { name: 'Receber próximo cliente' }); if (await next.isVisible()) await next.click();
    await page.getByRole('button', { name: 'Claro, já preparo!' }).click(); const id = (await saved(page)).orders[0].recipeId;
    await choose(page, id); await cook(page, id); await page.getByRole('button', { name: 'Servir com carinho' }).click();
  }
  const before = await saved(page); await page.getByRole('button', { name: 'Fechar por hoje' }).click(); await expect(page.getByText('Ingredientes por conta da casa.', { exact: false })).toBeVisible(); expect((await saved(page)).money).toBe(before.money - 180);
  await page.screenshot({ path: 'test-results/night.png', fullPage: true }); await page.getByRole('button', { name: 'Até amanhã' }).click(); await page.reload(); await page.getByRole('button', { name: 'Continuar · dia 2' }).click(); await expect(page.getByRole('button', { name: 'Abrir o restaurante' })).toBeVisible(); expect((await saved(page)).day).toBe(2);
});
test('retoma o preparo, resposta e móveis após recarregar sem qualquer gestão de estoque', async ({ page }) => {
  await newGame(page); await page.getByRole('button', { name: 'Decorar', exact: true }).click(); await page.locator('.shop-item').filter({ has: page.getByRole('heading', { name: 'Monstera' }) }).getByRole('button').click();
  await clickWorld(page, 320, 390); expect((await saved(page)).decorations).toHaveLength(1); await page.getByRole('button', { name: 'Tudo no seu lugar' }).click(); await page.getByRole('button', { name: 'Abrir o restaurante' }).click(); await page.getByRole('button', { name: 'Ela continua sendo sua.' }).click(); await page.getByRole('button', { name: 'Claro, já preparo!' }).click(); await choose(page, 'onigiri'); await drag(page, 63, 621);
  await expect(page.getByText('Deslize sobre o arroz para modelar')).toBeVisible(); await page.reload(); await page.getByRole('button', { name: 'Continuar · dia 1' }).click(); await expect(page.getByText('Deslize sobre o arroz para modelar')).toBeVisible(); const s = await saved(page); expect(s.dish!.step).toBe(1); expect(s.story.replies['1']).toBe(0); expect(s.decorations).toHaveLength(1); expect(s.money).toBe(14100); await drag(page, 430, 335, 680, 335); await drag(page, 152, 621); await page.getByRole('button', { name: 'Servir com carinho' }).click();
});
test('pedido com complemento exige e mostra o ingrediente extra', async ({ page }) => {
  await seed(page, orderState('ramen', 'mushroom')); await choose(page, 'ramen'); await cook(page, 'ramen', 'mushroom'); await page.getByRole('button', { name: 'Servir com carinho' }).click(); expect((await saved(page)).stats.quality).toBeGreaterThan(.95);
});
test('presentes conquistados na conversa aparecem de verdade no salão e no caderno', async ({ page }) => {
  const state = orderState('onigiri'); state.day = 5; state.orders[0].customerId = 'hana'; state.orders[0].accepted = false;
  await seed(page, state); await page.getByRole('button', { name: 'Vamos colocá-las no balcão?' }).click(); await page.getByRole('button', { name: 'Claro, já preparo!' }).click(); await choose(page, 'onigiri'); await cook(page, 'onigiri'); await page.getByRole('button', { name: 'Servir com carinho' }).click();
  const s = await saved(page); expect(s.owned).toContain('flowers'); expect(s.decorations.some(d => d.id === 'flowers')).toBe(true); await page.getByRole('button', { name: 'História', exact: true }).click(); await expect(page.getByText('Flores para um recomeço', { exact: true })).toBeVisible();
});
test('tela móvel com doze receitas, cartas e configurações sem estoque nem rolagem horizontal', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await newGame(page); await page.getByRole('button', { name: 'Receitas', exact: true }).click(); await expect(page.locator('.recipe-page')).toHaveCount(12); await page.getByRole('button', { name: 'Na frigideira', exact: true }).click(); await expect(page.locator('.recipe-page')).toHaveCount(4); await page.getByRole('button', { name: 'Fechar', exact: true }).click(); await expect(page.getByRole('button', { name: 'Estoque', exact: true })).toHaveCount(0); await page.getByRole('button', { name: 'Configurações', exact: true }).click(); await page.locator('#relaxed').uncheck(); expect((await saved(page)).settings.relaxed).toBe(false); await page.getByRole('button', { name: 'Fechar', exact: true }).click(); expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true); await page.screenshot({ path: 'test-results/mobile.png', fullPage: true });
});
test('a rádio sintetiza áudio real, permite trocar faixa e persiste volume e pausa', async ({ page }) => {
  await newGame(page); await page.getByRole('button', { name: 'Configurações', exact: true }).click();
  await page.locator('#ambience').uncheck(); await page.locator('#volume').fill('0');
  await expect.poll(() => page.evaluate(() => (window as any).komorebiAudio.status.context)).toBe('running');
  await expect.poll(() => page.evaluate(() => (window as any).komorebiAudio.sampleEnergy()), { timeout: 7000 }).toBeGreaterThan(.001);
  const first = (await saved(page)).settings.track; await page.locator('.radio-controls').getByRole('button', { name: 'Próxima faixa' }).click(); expect((await saved(page)).settings.track).toBe((first + 1) % 3);
  await page.locator('#music-volume').fill('0.2'); expect((await saved(page)).settings.musicVolume).toBe(.2); await page.locator('#music').uncheck(); await page.waitForTimeout(1900); expect(await page.evaluate(() => (window as any).komorebiAudio.sampleEnergy())).toBeLessThan(.001); await page.reload(); await page.getByRole('button', { name: 'Continuar · dia 1' }).click(); const s = await saved(page); expect(s.settings.music).toBe(false); expect(s.settings.musicVolume).toBe(.2); expect(s.settings.track).toBe((first + 1) % 3);
});
test('a versão anterior continua do mesmo preparo e migra ingredientes esgotados', async ({ page }) => {
  const fresh = newState();
  const old = { ...fresh, version: 1, day: 4, money: 18420, phase: 'open', inventory: { rice: 0, nori: 0 }, owned: ['plant', 'fridge'], upgrades: ['fridge'], decorations: [{ id: 'plant', x: 300, y: 400 }], orders: [{ id: 1, customerId: 'aiko', recipeId: 'onigiri', extra: null, createdAt: Date.now(), patience: 1 }], nextOrderId: 2, dish: { recipeId: 'onigiri', step: 1, added: ['rice'], skill: [1], cuts: 0, ready: false }, stats: { ...fresh.stats, cost: 35, supplies: 100 } };
  delete (old as any).story;
  await page.goto('/'); await page.evaluate(s => localStorage.setItem('komorebi.save.v1', JSON.stringify(s)), old); await page.reload(); await page.getByRole('button', { name: 'Continuar · dia 4' }).click();
  await expect(page.getByText('Deslize sobre o arroz para modelar')).toBeVisible(); expect((await saved(page)).money).toBe(18420); expect((await saved(page)).decorations).toHaveLength(1); await drag(page, 430, 335, 680, 335); await drag(page, 152, 621); await page.getByRole('button', { name: 'Servir com carinho' }).click(); const s = await saved(page); expect(s.version).toBe(3); expect(s.upgrades).toContain('teaset'); expect(s).not.toHaveProperty('inventory'); expect(s.money).toBeGreaterThan(18420);
});
