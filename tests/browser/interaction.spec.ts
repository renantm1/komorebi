import {test,expect,type Page} from '@playwright/test';
import {seed,orderState,choose,saved,point,drag,clickWorld} from './helpers';
import type {RecipeId} from '../../src/data/recipes';
test.use({viewport:{width:1920,height:911},deviceScaleFactor:1.25});
async function setup(page:Page,id:RecipeId='onigiri'){await seed(page,orderState(id));await choose(page,id);await page.waitForTimeout(250);}
const rice=(page:Page)=>page.evaluate(()=>{const s=(window as any).komorebiEngine.scene.getScenes(true)[0];const item=s.children.getByName('kitchen').getByName('ingredient-shelf').getByName('ingredient-rice');return {x:item.x,y:item.y,alpha:item.alpha};});
test('mouse: arraste nativo captura a soltura fora do canvas e permite tentar novamente',async({page})=>{
 await setup(page);const a=await point(page,63,621),panel=(await page.locator('#side-panel').boundingBox())!;await page.mouse.move(a.x,a.y);await page.mouse.down();expect(await page.locator('canvas').evaluate(c=>c.hasPointerCapture(1))).toBe(true);
 await page.mouse.move(panel.x+20,panel.y+100,{steps:3});await page.mouse.up();expect((await saved(page)).dish?.step).toBe(0);await page.waitForTimeout(230);await drag(page,63,621);expect((await saved(page)).dish).toMatchObject({step:1,added:['rice']});expect(await page.locator('canvas').evaluate(c=>c.hasPointerCapture(1))).toBe(false);
});
async function pixel(page:Page,x:number,y:number){return page.evaluate(([x,y])=>new Promise<number[]>(resolve=>{const g=(window as any).komorebiEngine,d=g.registry.get('display').density;g.renderer.snapshotPixel(Math.round(x*d),Math.round(y*d),(c:any)=>resolve([c.r,c.g,c.b]));}),[x,y]);}
async function activeMarker(page:Page,x:number){await expect.poll(async()=>{const c=await pixel(page,x+11,340);return Math.max(...c.map((v,i)=>Math.abs(v-[94,123,70][i])));},{timeout:5000}).toBeLessThan(12);}
test('mouse: arraste rápido acompanha o cursor e incorpora o ingrediente uma única vez',async({page},info)=>{
 await setup(page);expect(await page.evaluate(()=>(window as any).komorebiEngine.renderer.type)).toBe(info.project.name==='webgl'?2:1);
 const a=await point(page,63,621),b=await point(page,560,340);await page.mouse.move(a.x,a.y);await page.mouse.down();await page.mouse.move(b.x,b.y,{steps:1});
 const moving=await rice(page);expect(Math.abs(moving.x-560)).toBeLessThan(8);expect(Math.abs(moving.y-340)).toBeLessThan(15);
 await page.mouse.up();await expect(page.locator('#kitchen-status')).toContainText('Arroz adicionado ao prato.');expect((await saved(page)).dish).toMatchObject({step:1,added:['rice']});
 const status=(await page.locator('#kitchen-status').boundingBox())!,canvas=(await page.locator('canvas').boundingBox())!;expect(status.y).toBeGreaterThanOrEqual(canvas.y+canvas.height-1);
 await page.screenshot({path:`test-results/received-${info.project.name}.png`});
});
test('mouse: queda fora da tábua não consome etapa e permite tentar novamente',async({page})=>{
 await setup(page);await drag(page,63,621,130,150);expect((await saved(page)).dish?.step).toBe(0);await expect(page.locator('#kitchen-status')).toContainText('tábua iluminada');await page.waitForTimeout(230);
 await drag(page,63,621,765,420);expect((await saved(page)).dish?.step).toBe(1);await expect(page.locator('#kitchen-status')).toContainText('Arroz adicionado');
});
test('mouse: nome e borda do cartão também permitem pegar ingredientes',async({page})=>{
 await setup(page);await drag(page,63,579);expect((await saved(page)).dish).toMatchObject({step:1,added:['rice']});
 await drag(page,560,280,560,420);expect((await saved(page)).dish?.step).toBe(2);
 await drag(page,192,641);expect((await saved(page)).dish).toMatchObject({ready:true,added:['rice','nori']});
});
test('mouse: soltura sem seleção e botão direito não adicionam ingredientes',async({page})=>{
 await setup(page);const a=await point(page,560,90),b=await point(page,63,621);await page.mouse.move(a.x,a.y);await page.mouse.down();await page.mouse.move(b.x,b.y,{steps:5});await page.mouse.up();expect((await saved(page)).dish?.step).toBe(0);
 await page.mouse.click(b.x,b.y,{button:'right'});expect((await saved(page)).dish?.step).toBe(0);await page.mouse.click(b.x,b.y);await expect.poll(async()=> (await saved(page)).dish?.step).toBe(1);
});
test('mouse: ingrediente durante etapa de modelar explica o gesto e não estraga o prato',async({page})=>{
 await setup(page);await clickWorld(page,63,621);await drag(page,152,621);expect((await saved(page)).dish).toMatchObject({step:1,added:['rice']});await expect(page.locator('#kitchen-status')).toContainText('Segure no arroz');
 await drag(page,560,280,560,420);expect((await saved(page)).dish?.step).toBe(2);await page.waitForTimeout(240);await clickWorld(page,152,621);await page.getByRole('button',{name:'Servir com carinho'}).click();expect((await saved(page)).stats.quality).toBe(1);
});
test('mouse: abrir configurações durante cozimento cancela o gesto sem avançar a receita',async({page})=>{
 await setup(page,'ramen');await clickWorld(page,63,621);await clickWorld(page,152,621);expect((await saved(page)).dish?.step).toBe(2);const p=await point(page,560,330);await page.mouse.move(p.x,p.y);await page.mouse.down();await page.waitForTimeout(650);await page.keyboard.press('Escape');await expect(page.getByRole('heading',{name:'Do seu jeito.'})).toBeVisible();await page.waitForTimeout(300);await page.keyboard.press('Escape');await page.mouse.up();expect((await saved(page)).dish?.step).toBe(2);
 await page.mouse.down();await page.waitForTimeout(1900);await page.mouse.up();expect((await saved(page)).dish?.step).toBe(3);
});
for(const id of ['maki','gyoza'] as const)test(`mouse: marcas de ${id==='maki'?'corte':'dobra'} aparecem sobre a comida`,async({page},info)=>{
 await setup(page,id);for(const x of [63,152,241])await clickWorld(page,x,621);if(id==='maki')await drag(page,740,335,380,335);
 const x=id==='maki'?460:490;await activeMarker(page,x);
 const before=(await saved(page)).dish!;await clickWorld(page,x,340);expect((await saved(page)).dish?.actions).toBe(1);expect((await saved(page)).dish?.step).toBe(before.step);await activeMarker(page,560);
 await page.screenshot({path:`test-results/guides-${id}-${info.project.name}.png`});
});
test('mouse: trocar e limpar receitas restaura os ingredientes sem cobrar dinheiro',async({page})=>{
 await setup(page);await clickWorld(page,63,621);await page.getByRole('button',{name:'Preparar Nigiri de salmão',exact:true}).click();await page.getByRole('button',{name:'Continuar este prato'}).click();expect((await saved(page)).dish?.recipeId).toBe('onigiri');
 await page.getByRole('button',{name:'Preparar Nigiri de salmão',exact:true}).click();await page.getByRole('button',{name:'Preparar outra receita'}).click();expect((await saved(page)).dish).toMatchObject({recipeId:'nigiri',step:0});await clickWorld(page,63,621);expect((await saved(page)).dish?.step).toBe(1);
 await page.getByRole('button',{name:'Recomeçar sem custo'}).click();await page.getByRole('button',{name:'Limpar a tábua'}).click();expect((await saved(page)).dish).toBeNull();await page.getByRole('button',{name:'Preparar Onigiri',exact:true}).click();await drag(page,63,621);expect((await saved(page)).dish?.step).toBe(1);expect((await saved(page)).money).toBe(15000);
});
test('mouse: redimensionar enquanto arrasta cancela a queda e preserva os controles',async({page})=>{
 await setup(page);const a=await point(page,63,621),b=await point(page,560,340);await page.mouse.move(a.x,a.y);await page.mouse.down();await page.mouse.move(b.x,b.y,{steps:4});await page.setViewportSize({width:1366,height:768});await page.waitForTimeout(250);await page.mouse.up();expect((await saved(page)).dish?.step).toBe(0);await drag(page,63,621);expect((await saved(page)).dish?.step).toBe(1);
});
