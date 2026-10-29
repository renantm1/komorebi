import { expect, type Page } from '@playwright/test';
import { newState, type State } from '../../src/systems/state';
import { recipes, recipeIngredients, type RecipeId } from '../../src/data/recipes';
export async function point(page: Page, x: number, y: number) { const b = (await page.locator('canvas').boundingBox())!; return { x: b.x + x * b.width / 1120, y: b.y + y * b.height / 730 }; }
export async function clickWorld(page: Page, x: number, y: number) { const p = await point(page, x, y); await page.mouse.click(p.x, p.y); }
export async function drag(page: Page, x: number, y: number, toX = 560, toY = 330) { const a = await point(page, x, y), b = await point(page, toX, toY); await page.mouse.move(a.x, a.y); await page.mouse.down(); await page.mouse.move(b.x, b.y, { steps: 7 }); await page.mouse.up(); }
export const saved = (page: Page): Promise<State> => page.evaluate(() => JSON.parse(localStorage.getItem('komorebi.save.v1')!));
export async function newGame(page: Page) { await page.goto('/'); await page.getByRole('button', { name: 'Começar minha história' }).click(); await expect(page.getByRole('heading', { name: 'O caderno que ficou.' })).toBeVisible(); await page.getByRole('button', { name: 'Guardar esta carta e voltar' }).click(); }
export async function seed(page: Page, state: State) {
  await page.goto('/');
  // Seed after beforeunload has persisted the previous session, and consume it once.
  await page.evaluate(s => sessionStorage.setItem('komorebi.test.pending', JSON.stringify(s)), state);
  await page.addInitScript(() => { const pending = sessionStorage.getItem('komorebi.test.pending'); if (pending) { localStorage.setItem('komorebi.save.v1', pending); sessionStorage.removeItem('komorebi.test.pending'); } });
  await page.reload(); await page.getByRole('button', { name: `Continuar · dia ${state.day}` }).click();
}
export function orderState(id: RecipeId, extra: State['orders'][number]['extra'] = null): State { const s = newState(); s.phase = 'open'; s.orders = [{ id: 1, customerId: 'aiko', recipeId: id, extra, createdAt: Date.now(), patience: 1, accepted: true, clarified: false }]; s.nextOrderId = 2; return s; }
export async function choose(page: Page, id: RecipeId) { await page.getByRole('button', { name: 'Ir para a cozinha', exact: true }).click(); const recipe = page.getByRole('button', { name: `Preparar ${recipes[id].name}`, exact: true }); await recipe.scrollIntoViewIfNeeded(); await recipe.click(); }
export async function cook(page: Page, id: RecipeId, extra: State['orders'][number]['extra'] = null) {
  const slots = recipeIngredients(id, extra);
  const steps = [...recipes[id].steps]; if (extra && !steps.some(s => s.type === 'ingredient' && s.ingredient === extra)) steps.push({ type: 'ingredient', ingredient: extra, label: '' });
  for (const st of steps) {
    if (st.type === 'ingredient') await drag(page, 63 + slots.indexOf(st.ingredient) * 89, 621);
    else if (st.type === 'shape') await drag(page, 430, 335, 680, 335);
    else if (st.type === 'roll') await drag(page, 380, 335, 740, 335);
    else if (st.type === 'cut') for (const x of [460, 560, 660]) await clickWorld(page, x, 330);
    else if (st.type === 'fold' && st.count === 3) for (const x of [490, 560, 630]) await clickWorld(page, x, 340);
    else if (st.type === 'fold') await drag(page, 435, 409, 655, 274);
    else if (st.type === 'toss') for (let i = 0; i < 3; i++) await drag(page, 560, 424, 560, 280);
    else { const p = await point(page, 560, 330); await page.mouse.move(p.x, p.y); await page.mouse.down(); await page.waitForTimeout(2200); await page.mouse.up(); }
  }
  await expect(page.getByRole('button', { name: 'Servir com carinho' })).toBeVisible();
}
