import { test, expect } from '@playwright/test';
import { newGame, saved } from './helpers';
test('menu animado, carta da avó e primeiro encontro com escolhas', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('/'); await expect(page.locator('canvas')).toBeVisible(); await page.waitForTimeout(800);
  const a = await page.locator('canvas').screenshot(); await page.waitForTimeout(350); const b = await page.locator('canvas').screenshot(); expect(a.equals(b)).toBe(false);
  await page.screenshot({ path: 'test-results/menu.png', fullPage: true });
  await page.getByRole('button', { name: 'Começar minha história' }).click(); await expect(page.getByText('A chave está debaixo do vaso.', { exact: true }).last()).toBeVisible(); await page.screenshot({ path: 'test-results/story.png', fullPage: true });
  await page.getByRole('button', { name: 'Guardar esta carta e voltar' }).click(); await page.getByRole('button', { name: 'Abrir o restaurante' }).click();
  await page.getByRole('button', { name: 'E o que você está escrevendo?' }).click(); await expect(page.locator('.character-reply')).toContainText('história sobre alguém que volta para casa');
  await page.getByRole('button', { name: 'Claro, já preparo!' }).click(); await page.waitForTimeout(1600); await page.screenshot({ path: 'test-results/restaurant.png', fullPage: true });
  await page.getByRole('button', { name: 'Ir para a cozinha', exact: true }).click(); await expect(page.getByText('Qual receita vai preparar?')).toBeVisible(); await expect(page.locator('.recipe-chip')).toHaveCount(12); expect((await saved(page)).story.affinity.aiko).toBe(1); expect(errors).toEqual([]);
});
