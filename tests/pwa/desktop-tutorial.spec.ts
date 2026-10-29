import {test,expect} from '@playwright/test';
import {version} from '../../package.json';
test.use({viewport:{width:1366,height:768},isMobile:false,hasTouch:false});
test('PC publicado: tutorial retoma offline e entrega um prato com ajuda',async({page,context})=>{
 const state=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('komorebi.save.v1')!)),assist=()=>page.locator('#tutorial-card .tutorial-assist');
 await page.goto('./');await expect(page.locator('#game-update')).toHaveText('v'+version);await page.getByRole('button',{name:'Jogar com tutorial'}).click();await page.getByRole('button',{name:'Guardar esta carta e voltar'}).click();
 for(let i=0;i<4;i++)await assist().click();await expect(assist()).toContainText('Adicionar arroz');await assist().click();expect((await state()).dish.step).toBe(1);
 expect(await page.evaluate(async()=>(await navigator.serviceWorker.ready).updateViaCache)).toBe('none');await context.setOffline(true);await page.reload();await page.getByRole('button',{name:'Continuar · dia 1'}).click();await expect(page.locator('#tutorial-card')).toContainText('Vamos modelar');
 await page.locator('canvas').evaluate(c=>c.style.pointerEvents='none');const b=(await assist().boundingBox())!;await page.mouse.move(b.x+b.width/2,b.y+b.height/2);await page.mouse.down();await page.waitForTimeout(1050);await page.mouse.up();expect((await state()).dish.step).toBe(2);await assist().click();expect((await state()).dish.ready).toBe(true);await assist().click();expect((await state()).stats).toMatchObject({served:1,quality:1});await page.screenshot({path:'test-results/tutorial-production.png'});
});
test('arquivo publicado abre a versão atual e mantém o progresso do mesmo site',async({page})=>{
 const state=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('komorebi.save.v1')!)),assist=()=>page.locator('#tutorial-card .tutorial-assist');
 await page.goto('./');await page.getByRole('button',{name:'Jogar com tutorial'}).click();await page.getByRole('button',{name:'Guardar esta carta e voltar'}).click();for(let i=0;i<5;i++)await assist().click();const before=await state();
 await page.goto(`downloads/komorebi-offline.html?v=${version}`);await expect(page.locator('#game-update')).toHaveText('v'+version);await page.getByRole('button',{name:'Jogar com tutorial'}).click();await expect(page.locator('#tutorial-card')).toContainText('Vamos modelar');expect((await state()).dish).toEqual(before.dish);expect((await state()).money).toBe(before.money);
 const b=(await assist().boundingBox())!;await page.mouse.move(b.x+b.width/2,b.y+b.height/2);await page.mouse.down();await page.waitForTimeout(1050);await page.mouse.up();await assist().click();expect((await state()).dish.ready).toBe(true);await assist().click();expect((await state()).stats.served).toBe(1);
});
