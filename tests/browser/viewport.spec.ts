import {test,expect} from '@playwright/test';
import {seed,orderState,choose,saved,point,drag} from './helpers';
for(const viewport of [{width:1920,height:911},{width:1366,height:768},{width:1280,height:720}])test(`bancada completa e clicável em ${viewport.width}x${viewport.height}`,async({page})=>{
 await page.setViewportSize(viewport);await seed(page,orderState('onigiri'));await choose(page,'onigiri');await page.waitForTimeout(300);
 const canvas=(await page.locator('canvas').boundingBox())!,rail=(await page.locator('.rail').boundingBox())!,panel=(await page.locator('#side-panel').boundingBox())!,dock=(await page.locator('#recipe-dock').boundingBox())!;
 expect(canvas.x).toBeGreaterThanOrEqual(rail.x+rail.width);expect(canvas.x+canvas.width).toBeLessThanOrEqual(panel.x);expect(canvas.y).toBeGreaterThanOrEqual(dock.y+dock.height);expect(canvas.y+canvas.height).toBeLessThanOrEqual(viewport.height);
 for(const [x,y] of [[63,621],[152,621],[419,621],[560,340]]){const p=await point(page,x,y);expect(await page.evaluate(p=>document.elementFromPoint(p.x,p.y)?.tagName,p)).toBe('CANVAS');}
 const p=await point(page,63,621);await page.mouse.click(p.x,p.y);expect((await saved(page)).dish?.step).toBe(1);await drag(page,430,335,680,335);expect((await saved(page)).dish?.step).toBe(2);const nori=await point(page,152,621);await page.mouse.click(nori.x,nori.y);await page.getByRole('button',{name:'Servir com carinho'}).click();expect((await saved(page)).stats.quality).toBe(1);
 await page.screenshot({path:`test-results/desktop-${viewport.width}.png`});
});
test('redimensionar entre computador e tela estreita mantém o preparo e um único cenário',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await seed(page,orderState('onigiri'));await choose(page,'onigiri');const p=await point(page,63,621);await page.mouse.click(p.x,p.y);expect((await saved(page)).dish?.step).toBe(1);
 for(let i=0;i<3;i++){await page.setViewportSize({width:600,height:800});await expect(page.locator('body')).toHaveClass(/mobile-game/);await expect(page.locator('canvas')).toHaveCount(1);await page.waitForTimeout(200);await page.setViewportSize({width:1440,height:900});await expect(page.locator('body')).not.toHaveClass(/mobile-game/);await expect(page.locator('canvas')).toHaveCount(1);await page.waitForTimeout(200);}
 expect((await saved(page)).dish?.step).toBe(1);await drag(page,430,335,680,335);expect((await saved(page)).dish?.step).toBe(2);expect(errors).toEqual([]);
});
