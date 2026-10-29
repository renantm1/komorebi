import {test,expect,type Page} from '@playwright/test';
import {newGame,seed,orderState,choose,saved,drag,point,ready} from './helpers';
import {dishSteps} from '../../src/systems/state';
const assist=(page:Page)=>page.locator('#tutorial-card .tutorial-assist');
test('mouse: atualizar o painel durante um gesto de ajuda não interrompe o preparo',async({page})=>{
 await seed(page,orderState('onigiri'));await choose(page,'onigiri');await assist(page).click();const b=(await assist(page).boundingBox())!;await page.mouse.move(b.x+b.width/2,b.y+b.height/2);await page.mouse.down();await page.waitForTimeout(600);
 await page.evaluate(()=>{const m=(window as any).komorebi;m.state.settings.relaxed=false;m.tick(4000);});await page.waitForTimeout(600);await page.mouse.up();expect((await saved(page)).dish?.step).toBe(2);
});
async function hold(page:Page,ms=1050){const button=assist(page);await button.scrollIntoViewIfNeeded();const b=(await button.boundingBox())!;await page.mouse.move(b.x+b.width/2,b.y+b.height/2);await page.mouse.down();await page.waitForTimeout(ms);await page.mouse.up();}

test('tutorial: primeiro dia completo com controles de ajuda, mesmo sem entrada pelo canvas',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await newGame(page);await expect(page.locator('#tutorial-card')).toContainText('Vamos abrir a casa');
 // A PC where canvas dragging does not work must still be able to finish the day.
 await page.locator('canvas').evaluate(c=>c.style.pointerEvents='none');
 let actions=0;
 while((await saved(page)).phase!=='night'&&actions++<100){
  const s=await saved(page),d=s.dish,step=d&&!d.ready?dishSteps(d,s.orders[0]?.extra??null)[d.step]:null;
  if(step&&step.type!=='ingredient'&&step.type!=='cut'&&!(step.type==='fold'&&step.count===3))await hold(page,['cook','fry'].includes(step.type)?1900:1050);
  else await assist(page).click();
 }
 const s=await saved(page);expect(s.stats.served).toBe(4);expect(s.stats.quality).toBeGreaterThan(3.9);expect(s.money).toBe(15000+s.stats.revenue+s.stats.tips-180);await expect(page.locator('#tutorial-card')).toContainText('Você cuidou da casa');await page.screenshot({path:'test-results/tutorial-first-day.png'});
 await assist(page).click();await expect(page.locator('#tutorial-card')).toHaveCount(0);expect((await saved(page)).tutorial).toBe('completed');await page.getByRole('button',{name:'Até amanhã',exact:true}).click();expect((await saved(page)).day).toBe(2);await expect(page.locator('#tutorial-card')).toHaveCount(0);expect(errors).toEqual([]);
});
test('tutorial: recarregar retoma a etapa, pular persiste e reativar preserva a partida',async({page})=>{
 await seed(page,orderState('onigiri'));await choose(page,'onigiri');await assist(page).click();await expect(page.locator('#tutorial-card')).toContainText('Vamos modelar');const before=await saved(page);
 await page.reload();await page.getByRole('button',{name:'Continuar · dia 1'}).click();await ready(page);await expect(page.locator('#tutorial-card')).toContainText('Vamos modelar');expect((await saved(page)).dish).toEqual(before.dish);
 await page.getByRole('button',{name:'Pular tutorial'}).click();await page.reload();await page.getByRole('button',{name:'Continuar · dia 1'}).click();await ready(page);await expect(page.locator('#tutorial-card')).toHaveCount(0);expect((await saved(page)).tutorial).toBe('dismissed');
 await page.getByRole('button',{name:'Como jogar',exact:true}).click();await page.getByRole('button',{name:'Ativar tutorial guiado'}).click();await expect(page.locator('#tutorial-card')).toContainText('Vamos modelar');expect((await saved(page)).dish).toEqual(before.dish);expect((await saved(page)).money).toBe(before.money);
});
test('mouse: tutorial destaca a área correta sem bloquear arraste e gestos reais',async({page},info)=>{
 await seed(page,orderState('onigiri'));await choose(page,'onigiri');await expect(page.locator('#tutorial-overlay')).toBeVisible();const p=await point(page,63,621);expect(await page.evaluate(p=>document.elementFromPoint(p.x,p.y)?.tagName,p)).toBe('CANVAS');
 const b=(await page.locator('.tutorial-focus').boundingBox())!;expect(p.x).toBeGreaterThan(b.x);expect(p.x).toBeLessThan(b.x+b.width);await page.screenshot({path:`test-results/tutorial-rice-${info.project.name}.png`});
 await drag(page,63,621);await expect(page.locator('#tutorial-card')).toContainText('Vamos modelar');expect((await saved(page)).dish?.step).toBe(1);await drag(page,560,280,560,420);await expect(page.locator('#tutorial-card')).toContainText('Adicione alga nori');await assist(page).click();expect((await saved(page)).dish?.ready).toBe(true);
});
test('mouse: tutorial exige segurar, cancela ao pausar e permite usar teclado',async({page})=>{
 await seed(page,orderState('onigiri'));await choose(page,'onigiri');await assist(page).click();await assist(page).click();expect((await saved(page)).dish?.step).toBe(1);await expect(page.locator('.tutorial-hold-hint')).toContainText('Soltou cedo');
 const b=(await assist(page).boundingBox())!;await page.mouse.move(b.x+b.width/2,b.y+b.height/2);await page.mouse.down();await page.waitForTimeout(300);await page.keyboard.press('Escape');await page.waitForTimeout(1000);await page.keyboard.press('Escape');await page.mouse.up();expect((await saved(page)).dish?.step).toBe(1);
 await assist(page).focus();await page.keyboard.down('Space');await page.waitForTimeout(1050);await page.keyboard.up('Space');expect((await saved(page)).dish?.step).toBe(2);await assist(page).click();expect((await saved(page)).dish?.ready).toBe(true);
});
