import { test, expect, type Page } from '@playwright/test';
import { recipes, recipeIngredients, type RecipeId } from '../../src/data/recipes';
import { newState, dishSteps, type State } from '../../src/systems/state';
const saved = (page: Page): Promise<State> => page.evaluate(() => JSON.parse(localStorage.getItem('komorebi.save.v1')!));
async function seed(page: Page, id: RecipeId) {
  const s = newState(); s.phase = 'open'; s.orders = [{id:1,customerId:'aiko',recipeId:id,extra:null,createdAt:Date.now(),patience:1,accepted:true,clarified:false}]; s.nextOrderId=2;
  await page.addInitScript(s => localStorage.setItem('komorebi.save.v1', JSON.stringify(s)), s);
  await page.goto('./'); await page.getByRole('button',{name:'Continuar · dia 1'}).tap();
  await page.getByRole('button',{name:'Ir para a cozinha',exact:true}).tap();
  const chip=page.getByRole('button',{name:`Preparar ${recipes[id].name}`,exact:true}); await chip.scrollIntoViewIfNeeded(); await chip.tap();
  await expect(page.locator('canvas')).toBeVisible(); await page.waitForTimeout(500);
}
async function metrics(page: Page) { const b=(await page.locator('canvas').boundingBox())!; const w=b.width/b.height>1.15?1120:640, h=w*b.height/b.width, wide=w>800; const f=wide?Math.max(.6,Math.min(1,(h-180)/300)):Math.max(.58,Math.min(1,(h-330)/350));const cy=wide?(h+35)/2:Math.max(300,Math.min(h-330,h*.43));return {b,w,h,wide,f,cy}; }
async function ingredientPoint(page:Page,slot:number){const {h,wide}=await metrics(page);return {x:wide?64+slot*124:64+slot%5*128,y:wide?h-63:h-175+Math.floor(slot/5)*100};}
async function touch(page: Page, x:number,y:number,toX=x,toY=y,hold=0,work=true) {
  const {b,w,f,cy}=await metrics(page);const point=(px:number,py:number)=>({x:b.x+(work?w/2+(px-560)*f:px)*b.width/w,y:b.y+(work?cy+(py-340)*f:py)*b.width/w});
  const a=point(x,y),z=point(toX,toY);
  expect(await page.evaluate(([x,y])=>document.elementFromPoint(x,y)?.tagName,[a.x,a.y])).toBe('CANVAS');
  const cdp=await page.context().newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...a,id:1,radiusX:5,radiusY:5}]});
  if(hold) await page.waitForTimeout(hold);
  if(toX!==x||toY!==y)for(let i=1;i<=8;i++) await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:a.x+(z.x-a.x)*i/8,y:a.y+(z.y-a.y)*i/8,id:1,radiusX:5,radiusY:5}]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();
}

for (const id of Object.keys(recipes) as RecipeId[]) test(`celular: prepara ${recipes[id].name} com toque real`,async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await seed(page,id);
  const slots=recipeIngredients(id),steps=recipes[id].steps;
  for(const [i,step] of steps.entries()) {
    if(step.type==='ingredient'){const p=await ingredientPoint(page,slots.indexOf(step.ingredient));await touch(page,p.x,p.y,undefined,undefined,0,false);}
    else if(step.type==='shape')await touch(page,430,335,680,335);
    else if(step.type==='roll')await touch(page,380,335,740,335);
    else if(step.type==='cut')for(const x of [460,560,660])await touch(page,x,330);
    else if(step.type==='fold'&&step.count===3)for(const x of [490,560,630])await touch(page,x,340);
    else if(step.type==='fold')await touch(page,435,409,655,274);
    else if(step.type==='toss')for(let j=0;j<3;j++)await touch(page,560,424,560,280);
    else await touch(page,560,330,560,330,1900);
    await expect.poll(async()=> (await saved(page)).dish?.step).toBe(i+1);
  }
  await expect(page.getByRole('button',{name:'Servir com carinho'})).toBeVisible();
  if(id==='ramen')await page.screenshot({path:'test-results/mobile-ramen.png'});
  await page.getByRole('button',{name:'Servir com carinho'}).tap();expect((await saved(page)).stats.served).toBe(1);expect((await saved(page)).stats.quality).toBeGreaterThan(.95);expect(errors).toEqual([]);
});
test('PWA usa os caminhos do Pages, fica offline e preserva um prato entre visitas',async({page,context,request})=>{
  const manifest=await (await request.get('manifest.webmanifest')).json();expect(manifest).toMatchObject({display:'standalone',start_url:'./',scope:'./',orientation:'landscape'});
  for(const icon of manifest.icons){const response=await request.get(icon.src);expect(response.ok()).toBe(true);expect((await response.body()).subarray(1,4).toString()).toBe('PNG');}
  await page.goto('./');await page.getByRole('button',{name:'Começar minha história'}).tap();await page.getByRole('button',{name:'Guardar esta carta e voltar'}).tap();
  await expect.poll(()=>page.evaluate(async()=>{const r=await navigator.serviceWorker.ready;return r.scope;})).toContain('/komorebi/');
  await page.getByRole('button',{name:'Configurações',exact:true}).tap();await page.getByRole('button',{name:'Aplicativo & offline',exact:true}).tap();await expect(page.getByText('Pronto para jogar offline',{exact:true})).toBeVisible();await page.getByRole('button',{name:'Fechar',exact:true}).tap();
  await context.setOffline(true);await page.getByRole('button',{name:'Abrir o restaurante'}).tap();await page.getByRole('button',{name:'Claro, já preparo!'}).tap();await page.getByRole('button',{name:'Ir para a cozinha',exact:true}).tap();await page.getByRole('button',{name:'Preparar Onigiri',exact:true}).tap();
  const p=await ingredientPoint(page,0);await touch(page,p.x,p.y,undefined,undefined,0,false);const before=await saved(page);expect(before.dish?.step).toBe(1);
  await page.reload();await page.getByRole('button',{name:'Continuar · dia 1'}).tap();expect((await saved(page)).dish).toEqual(before.dish);expect((await saved(page)).money).toBe(before.money);
  await touch(page,430,335,680,335);await expect.poll(async()=> (await saved(page)).dish?.step).toBe(2);await expect(page.locator('body')).toHaveClass(/mobile-game/);
});
test('telas pequenas têm bancada e controles acessíveis sem rolagem horizontal',async({page})=>{
  await page.setViewportSize({width:360,height:640});await seed(page,'donburi');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(360);
  const board=await page.locator('canvas').boundingBox(),panel=await page.locator('#side-panel').boundingBox(),nav=await page.locator('.rail').boundingBox();
  expect(board!.height).toBeGreaterThan(300);expect(panel!.y+panel!.height).toBeLessThanOrEqual(nav!.y+1);
  await page.getByRole('button',{name:'Configurações',exact:true}).tap();await expect(page.getByRole('heading',{name:'Do seu jeito.'})).toBeVisible();await page.screenshot({path:'test-results/mobile-settings.png'});
});
test('uma atualização espera a confirmação e retoma a mesma etapa depois de recarregar',async({page})=>{
  const {readFile,writeFile}=await import('node:fs/promises');const original=await readFile('dist/sw.js','utf8');
  await page.goto('./');await page.getByRole('button',{name:'Começar minha história'}).tap();await page.getByRole('button',{name:'Guardar esta carta e voltar'}).tap();
  await page.evaluate(async()=>{await navigator.serviceWorker.ready;});
  await page.getByRole('button',{name:'Abrir o restaurante'}).tap();await page.getByRole('button',{name:'Claro, já preparo!'}).tap();await page.getByRole('button',{name:'Ir para a cozinha',exact:true}).tap();await page.getByRole('button',{name:'Preparar Onigiri',exact:true}).tap();
  const p=await ingredientPoint(page,0);await touch(page,p.x,p.y,undefined,undefined,0,false);const before=await saved(page);expect(before.dish?.step).toBe(1);
  try {
    await writeFile('dist/sw.js',original+'\n/* Browser validation of the next worker version. */\n');
    await page.evaluate(async()=>{const r=await navigator.serviceWorker.ready;await r.update();});
    await expect.poll(()=>page.evaluate(async()=>!!(await navigator.serviceWorker.ready).waiting)).toBe(true);
    // The old document and cooking state remain active while the new worker waits.
    await expect(page.getByRole('heading',{name:'Deslize sobre o arroz para modelar'})).toBeVisible();expect((await saved(page)).dish).toEqual(before.dish);
    await page.getByRole('button',{name:'Configurações',exact:true}).tap();await page.getByRole('button',{name:'Aplicativo & offline',exact:true}).tap();
    await expect(page.getByRole('button',{name:'Salvar e atualizar'})).toBeVisible();
    await page.evaluate(()=>{(window as any).restoreStorage=Storage.prototype.setItem;Storage.prototype.setItem=()=>{throw new DOMException('Quota exceeded','QuotaExceededError');};});
    await page.getByRole('button',{name:'Salvar e atualizar'}).tap();await expect(page.getByRole('button',{name:'Salvar e atualizar'})).toBeVisible();
    expect(await page.evaluate(async()=>!!(await navigator.serviceWorker.ready).waiting)).toBe(true);
    await page.evaluate(()=>{Storage.prototype.setItem=(window as any).restoreStorage;});
    await page.getByRole('button',{name:'Salvar e atualizar'}).tap();await page.getByRole('button',{name:'Continuar · dia 1'}).tap();
    await expect(page.getByRole('heading',{name:'Deslize sobre o arroz para modelar'})).toBeVisible();expect((await saved(page)).dish).toEqual(before.dish);expect((await saved(page)).money).toBe(before.money);
  } finally { await writeFile('dist/sw.js',original); }
});
test.describe('Retina e rotação do celular',()=>{
 test.use({deviceScaleFactor:2});
 test('roda a tela sem perder o preparo e mantém os ingredientes dentro da bancada',async({page})=>{
  await seed(page,'onigiri');let p=await ingredientPoint(page,0);await touch(page,p.x,p.y,undefined,undefined,0,false);expect((await saved(page)).dish?.step).toBe(1);
  let canvas=await page.locator('canvas').boundingBox(),panel=await page.locator('#side-panel').boundingBox(),nav=await page.locator('.rail').boundingBox();
  expect(canvas!.x+canvas!.width).toBeLessThanOrEqual(panel!.x+1);expect(canvas!.y+canvas!.height).toBeLessThanOrEqual(nav!.y+1);
  expect(await page.locator('canvas').getAttribute('width')).toBe('2240');
  await page.setViewportSize({width:390,height:844});await page.waitForTimeout(500);await touch(page,430,335,680,335);expect((await saved(page)).dish?.step).toBe(2);
  await page.setViewportSize({width:844,height:390});await page.waitForTimeout(500);p=await ingredientPoint(page,1);await touch(page,p.x,p.y,undefined,undefined,0,false);
  await expect(page.getByRole('button',{name:'Servir com carinho'})).toBeVisible();await page.screenshot({path:'test-results/mobile-landscape-retina.png'});
  await page.getByRole('button',{name:'Servir com carinho'}).tap();expect((await saved(page)).stats.quality).toBe(1);
 });
});
test('um toque cancelado não termina o cozimento',async({page})=>{
 await seed(page,'ramen');for(const slot of [0,1]){const p=await ingredientPoint(page,slot);await touch(page,p.x,p.y,undefined,undefined,0,false);}
 const {b,w,cy}=await metrics(page),cdp=await page.context().newCDPSession(page);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:b.x+b.width/2,y:b.y+cy*b.width/w,id:1}]});await page.waitForTimeout(1900);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});expect((await saved(page)).dish?.step).toBe(2);await cdp.detach();
 await touch(page,560,330,560,330,1900);expect((await saved(page)).dish?.step).toBe(3);
});
test('a decoração aceita arraste por toque e guarda os móveis no modo paisagem',async({page})=>{
 const state=newState();await page.addInitScript(s=>localStorage.setItem('komorebi.save.v1',JSON.stringify(s)),state);await page.goto('./');await page.getByRole('button',{name:'Continuar · dia 1'}).tap();
 await page.getByRole('button',{name:'Decorar',exact:true}).tap();await page.getByRole('button',{name:'Organizar a minha casa'}).tap();await page.waitForTimeout(400);
 const {h}=await metrics(page);await touch(page,125,535*h/730,205,575*h/730,0,false);
 let table=(await saved(page)).interior.furniture.find(d=>d.id==='table-round')!;expect(table.x).toBeCloseTo(205,0);expect(table.y).toBeCloseTo(575,0);
 await page.getByRole('button',{name:'Virar',exact:true}).tap();expect((await saved(page)).interior.furniture[0].flipped).toBe(true);
 await page.getByRole('button',{name:'Guardar',exact:true}).tap();expect((await saved(page)).interior.furniture[0].hidden).toBe(true);
 await page.locator('[data-action="place-table-round"]').tap();await touch(page,160,520*h/730,undefined,undefined,0,false);table=(await saved(page)).interior.furniture[0];expect(table.hidden).toBe(false);expect(table.x).toBeCloseTo(160,0);expect((await saved(page)).money).toBe(15000);
});
