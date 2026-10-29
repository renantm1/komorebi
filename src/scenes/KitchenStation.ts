import Phaser from 'phaser';
import { ingredients, recipes, recipeIngredients, type IngredientId } from '../data/catalog';
import { KitchenGame } from '../systems/game';
import { dishSteps } from '../systems/state';
import { audio } from '../systems/audio';
export class KitchenStation {
  readonly container: Phaser.GameObjects.Container;
  private work: Phaser.GameObjects.Container;
  private mobileBoard: Phaser.GameObjects.Graphics;
  private mobileBackground: Phaser.GameObjects.Image | null = null;
  private wide = false;
  private shelf: Phaser.GameObjects.Container;
  private board: Phaser.GameObjects.Container;
  private food: Phaser.GameObjects.Container;
  private meter: Phaser.GameObjects.Graphics;
  private brush: Phaser.GameObjects.Graphics;
  private label: Phaser.GameObjects.Text;
  private halos = new Map<IngredientId, Phaser.GameObjects.Rectangle>();
  private key = ''; private shelfKey = ''; private held = false; private holdStarted = 0; private elapsed = 0; private travel = 0; private startX = 0; private startY = 0; private lastX = 0; private clock = 0;
  constructor(private scene: Phaser.Scene, private model: KitchenGame, private mobile = false) {
    const s = scene, c = this.container = s.add.container(0, 0);
    if(mobile){this.mobileBackground=s.add.image(320,450,'portrait-kitchen').setDisplaySize(640,900);c.add(this.mobileBackground);}
    this.mobileBoard=s.add.graphics();c.add(this.mobileBoard);
    const g = s.add.graphics(); g.fillStyle(0xc9a578); g.fillRect(0, 0, 1120, 730);
    for (let x = 0; x < 1120; x += 74) { g.lineStyle(1, 0x99734c, .2); g.lineBetween(x, 0, x + 10, 730); }
    g.fillStyle(0xf1e7ce); g.fillRect(0, 0, 1120, 173); g.fillStyle(0xb89768); g.fillRect(0, 167, 1120, 10);
    g.fillStyle(0x9c774b, .22); g.fillRoundedRect(271, 208, 581, 299, 24); g.fillStyle(0xe8c597); g.fillRoundedRect(263, 198, 581, 299, 24); g.lineStyle(2, 0xc69e6f); g.strokeRoundedRect(274, 208, 559, 279, 19);
    for (let y = 225; y < 480; y += 21) { g.lineStyle(1, 0xc19766, .2); g.lineBetween(290, y, 820, y + 4); }
    // A folded kitchen towel, a knife, chopsticks and a small herb vase frame the work surface.
    g.fillStyle(0xe8e5c9); g.fillRoundedRect(45, 344, 127, 100, 5); for (let y = 352; y < 444; y += 9) { g.lineStyle(1, 0xa6b39a, .6); g.lineBetween(49, y, 169, y); }
    g.fillStyle(0x91816a); g.fillRoundedRect(194, 265, 21, 116, 5); g.fillStyle(0xd9dfca); g.fillTriangle(192, 270, 222, 270, 220, 375); g.fillStyle(0x705940); g.fillRoundedRect(196, 225, 19, 54, 5);
    g.lineStyle(4, 0x8a6443); g.lineBetween(862, 285, 885, 423); g.lineBetween(876, 282, 899, 421);
    g.fillStyle(0xa1b18c); g.fillRoundedRect(87, 251, 41, 60, 12); g.lineStyle(3, 0x779060); g.lineBetween(108, 255, 107, 202); g.lineBetween(107, 232, 88, 212); g.lineBetween(107, 219, 124, 198); g.fillStyle(0x839d6c); g.fillEllipse(86, 209, 25, 13); g.fillEllipse(126, 196, 25, 13);
    g.fillStyle(0xb38b5e); g.fillRect(0, 534, 1120, 196); g.fillStyle(0x977048); g.fillRect(0, 531, 1120, 9); c.add(g);g.setVisible(!mobile);
    c.add(s.add.text(44, 493, '心をこめて。', { fontFamily: 'serif', fontSize: '17px', color: '#9a7c51' }).setVisible(!mobile));
    c.add(s.add.text(65, 556, 'SUA BANCADA · INGREDIENTES LIVRES', { fontFamily: 'sans-serif', fontSize: '10px', letterSpacing: 2, color: '#faedd2' }).setVisible(!mobile));
    this.board = s.add.container(0, 0); c.add(this.board); this.food = s.add.container(560, 340); c.add(this.food);
    this.label = s.add.text(560, 467, '', { fontFamily: 'Georgia', fontSize: '17px', color: '#7b7952' }).setOrigin(.5); c.add(this.label);
    this.meter = s.add.graphics(); c.add(this.meter);
    this.brush = s.add.graphics().setVisible(false); this.brush.lineStyle(2, 0xfffae3, .9); this.brush.strokeCircle(0, 0, 24); this.brush.lineStyle(1, 0x849566, .7); this.brush.strokeCircle(0, 0, 29); c.add(this.brush);
    this.work=s.add.container(0,0,[this.board,this.food,this.label,this.meter,this.brush]);c.add(this.work);
    this.shelf = s.add.container(0, 0); c.add(this.shelf);
    const cancel=()=>this.cancelTouch();
    s.input.on('pointerupoutside',cancel);window.addEventListener('blur',cancel);document.addEventListener('visibilitychange',cancel);
    s.game.canvas.addEventListener('touchcancel',cancel,{capture:true,passive:true});
    s.events.once('shutdown',()=>{window.removeEventListener('blur',cancel);document.removeEventListener('visibilitychange',cancel);s.game.canvas.removeEventListener('touchcancel',cancel,true);});
    s.input.on('pointerdown', this.down, this); s.input.on('pointermove', this.move, this); s.input.on('pointerup', this.up, this);
    s.input.on('dragstart', (_p: Phaser.Input.Pointer, obj: Phaser.GameObjects.Image) => { if (!obj.getData('ingredient')) return; s.tweens.killTweensOf(obj); this.shelf.bringToTop(obj); obj.setData('moved',true);obj.setAlpha(.9).setDisplaySize(mobile?112:95,mobile?95:81); });
    s.input.on('drag', (_p: Phaser.Input.Pointer, obj: Phaser.GameObjects.Image, x: number, y: number) => { if (!obj.getData('ingredient')) return; obj.setPosition(x, y); });
    s.input.on('dragend', (p: Phaser.Input.Pointer, obj: Phaser.GameObjects.Image) => {
      if (!obj.getData('ingredient')) return;
      if (this.active() && this.inBoard(p) && model.ingredient(obj.getData('ingredient'))) { audio.effect('drop'); const point=this.toWork(p);this.puff(point.x,point.y); }
      obj.setAlpha(1).disableInteractive();obj.setData('returning',true);s.tweens.add({ targets: obj, x: obj.getData('homeX'), y: obj.getData('homeY'), scaleX: obj.getData('homeScaleX'), scaleY: obj.getData('homeScaleY'), duration: 160, ease: 'Back.easeOut', onComplete:()=>{if(obj.active){obj.setInteractive({useHandCursor:true});obj.setData('returning',false);}} });obj.setData('moved',false);
    });
  }
  private active() { return this.model.view === 'kitchen' && !this.model.paused; }
  private toWork(p:Phaser.Input.Pointer){return {x:(p.worldX-this.work.x)/this.work.scaleX,y:(p.worldY-this.work.y)/this.work.scaleY};}
  private inBoard(p:Phaser.Input.Pointer){const q=this.toWork(p);return q.x>280&&q.x<839&&q.y>202&&q.y<491;}
  layout(height:number,width=640){
    if(!this.mobile)return;
    this.wide=width>800;
    const y=this.wide?(height+35)/2:Math.max(300,Math.min(height-330,height*.43)), factor=this.wide?Math.max(.6,Math.min(1,(height-180)/300)):Math.max(.58,Math.min(1,(height-330)/350));
    const center=width/2;
    this.mobileBackground?.setTexture(this.wide?'landscape-kitchen':'portrait-kitchen').setPosition(center,height/2).setDisplaySize(width,height);
    this.work.setPosition(center-560*factor,y-340*factor).setScale(factor);
    this.mobileBoard.clear();this.mobileBoard.fillStyle(0x7c6345,.18);this.mobileBoard.fillRoundedRect(center-287*factor,y-139*factor,574*factor,309*factor,25);
    this.mobileBoard.fillStyle(0xe8c698);this.mobileBoard.fillRoundedRect(center-287*factor,y-147*factor,574*factor,309*factor,25);this.mobileBoard.lineStyle(2,0xc8a172);this.mobileBoard.strokeRoundedRect(center-276*factor,y-137*factor,552*factor,289*factor,21);
    this.shelf.setData('height',height);this.shelfKey='';this.sync();
  }
  cancelTouch(){this.held=false;this.brush.setVisible(false);this.food.setScale(1);}

  private step() { const d = this.model.state.dish; return d ? dishSteps(d, this.model.state.orders[0]?.extra ?? null)[d.step] : null; }
  private down(p: Phaser.Input.Pointer) {
    if (!this.active() || !this.inBoard(p) || this.model.state.dish?.ready) return;
    const q=this.toWork(p);const step = this.step(), d = this.model.state.dish; if (!step || !d || step.type === 'ingredient') return;
    if (step.type === 'cut' || step.type === 'fold' && step.count === 3) {
      const x = step.type === 'cut' ? 460 + d.actions * 100 : 490 + d.actions * 70;
      if (Math.abs(q.x - x) < 55) { this.model.gesture(1); audio.effect('cut'); const point=this.toWork(p);this.puff(point.x,point.y); }
      else this.model.message('Clique com calma nas marcas claras, da esquerda para a direita.');
      return;
    }
    this.held = true; this.holdStarted = performance.now(); this.elapsed = 0; this.travel = 0; this.startX = this.lastX = q.x; this.startY = q.y;
    this.brush.setPosition(q.x, q.y).setVisible(!['cook', 'fry'].includes(step.type));
    if (step.type === 'fry') audio.effect('sizzle');
  }
  private move(p: Phaser.Input.Pointer) { if (!this.held || !this.active()) return; const q=this.toWork(p);this.travel += Math.abs(q.x - this.lastX); this.lastX = q.x; this.brush.setPosition(q.x, q.y); if (this.step()?.type === 'shape') this.food.setScale(1 + Math.min(this.travel, 180) / 1600, 1 - Math.min(this.travel, 180) / 2400); }
  private up(p: Phaser.Input.Pointer) {
    if (!this.held) return; this.elapsed = performance.now() - this.holdStarted; this.held = false; this.brush.setVisible(false); this.food.setScale(1);
    if (!this.active()) return;const qPoint=this.toWork(p); const step = this.step(); if (!step || step.type === 'ingredient') return;
    let done = false, q = 1;
    if (step.type === 'cook' || step.type === 'fry') { done = this.elapsed >= 500; q = this.elapsed >= 1500 && this.elapsed <= 3300 ? 1 : Math.max(.6, 1 - Math.abs(this.elapsed - 2300) / 8000); }
    if (step.type === 'shape') done = this.travel >= 100;
    if (step.type === 'roll') done = qPoint.x - this.startX >= 150;
    if (step.type === 'fold') done = qPoint.x - this.startX >= 80 && Math.abs(qPoint.y - this.startY) >= 60;
    if (step.type === 'toss') done = this.startY - qPoint.y >= 85;
    if (done) { this.model.gesture(q); audio.effect('drop'); this.puff(560, 330); if (step.type === 'toss') this.scene.tweens.add({ targets: this.food, y: 298, angle: -7, duration: 170, yoyo: true, onComplete: () => { this.food.setPosition(560, 340).setAngle(0); } }); }
    else this.model.message(step.type === 'toss' ? 'Arraste de baixo para cima, como um movimento de frigideira.' : step.type === 'fold' ? 'Um gesto na diagonal fecha o cone. Tente da esquerda para a direita e para cima.' : 'Pode tentar de novo, sem custo. Faça o gesto um pouquinho mais longo.');
  }
  private puff(x: number, y: number) { for (let i = 0; i < 6; i++) { const p = this.scene.add.circle(x, y, 2 + i % 2, 0xffefbd, .8); this.work.add(p); this.scene.tweens.add({ targets: p, x: x + Math.cos(i) * 35, y: y - 10 + Math.sin(i) * 24, alpha: 0, duration: 550, onComplete: () => p.destroy() }); } }
  sync() {
    this.container.setVisible(this.model.view === 'kitchen');
    const s = this.model.state, d = s.dish, shelfKey = d?.recipeId + ':' + s.orders[0]?.extra;
    if (shelfKey !== this.shelfKey) { this.shelfKey = shelfKey; this.renderShelf(); }
    const key = JSON.stringify(d); if (key !== this.key) { this.key = key; this.renderFood(); }
    const step = this.step(); for (const [id, halo] of this.halos) halo.setAlpha(step?.type === 'ingredient' && step.ingredient === id ? .3 : .04);
  }
  private renderShelf() {
    this.shelf.removeAll(true); this.halos.clear(); const d = this.model.state.dish;
    const ids = d ? recipeIngredients(d.recipeId, this.model.state.orders[0]?.extra ?? null) : [];
    ids.forEach((id, i) => {
      const x = this.mobile?(this.wide?64+i*124:64+i%5*128):63+i*89,homeY=this.mobile?(this.shelf.getData('height')??900)-(this.wide?63:175)+(this.wide?0:Math.floor(i/5)*100):621,halo = this.scene.add.rectangle(x, homeY, this.mobile?(this.wide?108:112):80, this.mobile?(this.wide?80:94):89, 0xfff0bd, .1).setStrokeStyle(1, 0xf4dfb2, .5); this.shelf.add(halo); this.halos.set(id, halo);
      const sprite = this.scene.add.image(x, homeY, 'ingredient-' + id).setDisplaySize(this.mobile?(this.wide?92:98):82,this.mobile?(this.wide?78:83):70).setInteractive({ useHandCursor: true });
      sprite.setData({ ingredient:id,homeX:x,homeY,homeScaleX:sprite.scaleX,homeScaleY:sprite.scaleY,moved:false }); this.scene.input.setDraggable(sprite); this.shelf.add(sprite);
      this.shelf.add(this.scene.add.text(x,this.mobile?homeY+43:583,ingredients[id].name,{ fontFamily:'sans-serif',fontSize:this.mobile?'16px':'11px', color: '#f9edd0' }).setOrigin(.5));
      sprite.on('pointerup',()=>{if(!this.mobile||sprite.getData('moved')||!this.active())return;if(this.model.ingredient(id)){audio.effect('drop');this.puff(560,330);}});
      sprite.on('pointerover', () => { if (!sprite.input?.dragState && !sprite.getData('returning')) this.scene.tweens.add({ targets: sprite, y: homeY-7, duration: 130 }); });
      sprite.on('pointerout', () => { if (!sprite.input?.dragState && !sprite.getData('returning')) this.scene.tweens.add({ targets: sprite, y: homeY, duration: 130 }); });
    });
    if (!d) this.shelf.add(this.scene.add.text(this.mobile?320:404,this.mobile?(this.shelf.getData('height')??900)-150:627, 'Escolha uma receita acima.', { fontFamily: 'Georgia', fontSize: '23px', color: '#f7e7c3' }).setOrigin(.5));
  }
  private renderFood() {
    this.board.removeAll(true); for (const child of this.food.list) this.scene.tweens.killTweensOf(child); this.food.removeAll(true); this.meter.clear(); this.food.setScale(1); this.label.setText('');
    const d = this.model.state.dish, step = this.step();
    const p = this.scene.add.graphics(); p.fillStyle(0xfff7df); p.fillEllipse(560, 350, 361, 216, 96); p.lineStyle(3, 0xb6c39d); p.strokeEllipse(560, 350, 335, 191, 96); this.board.add(p);
    if (!d) { this.label.setText('Que prato vamos preparar?'); this.food.add(this.scene.add.text(0, -10, '十二の小さな幸せ', { fontFamily: 'serif', fontSize: '27px', color: '#a0a47e' }).setOrigin(.5)); return; }
    if (d.ready) {
      const dish = this.scene.add.image(0, -8, 'food-' + d.recipeId).setDisplaySize(260, 260); this.food.add(dish);
      this.scene.tweens.add({ targets: dish, y: -15, duration: 1250, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.label.setText('Feito por você. Pronto para servir.'); return;
    }
    const g = this.scene.add.graphics(); this.food.add(g);
    if (!d.added.length) { g.lineStyle(2, 0xa1b18b, .6); g.strokeCircle(0, -4, 48); this.food.add(this.scene.add.text(0, -9, '+', { fontFamily: 'Georgia', fontSize: '32px', color: '#a1b18b' }).setOrigin(.5)); }
    else if (['maki', 'uramaki'].includes(d.recipeId)) {
      g.fillStyle(0xc2a36f); g.fillRoundedRect(-171, -96, 342, 185, 6); for (let x = -160; x < 167; x += 12) { g.lineStyle(2, 0xe7cb93); g.lineBetween(x, -90, x, 80); }
      if (step?.type === 'cut') { for (let i = 0; i < 4; i++) { const x = -153 + i * 100; g.fillStyle(d.recipeId === 'uramaki' ? 0xf6ebce : 0x425c43); g.fillRoundedRect(x, -48, 85, 80, 15); g.fillStyle(0xfaf1d7); g.fillEllipse(x + 42, -44, 83, 39); g.fillStyle(d.recipeId === 'uramaki' ? 0xe99b79 : 0x8da868); g.fillEllipse(x + 42, -44, 24, 16); } }
      else { g.fillStyle(0x496047); g.fillRoundedRect(-150, -76, 300, 137, 3); if (d.added.includes('rice')) { g.fillStyle(0xfaf1d7); g.fillRoundedRect(-139, -67, 278, 119, 3); } if (d.added.includes('cucumber')) { g.fillStyle(0x8aa76b); g.fillRoundedRect(-131, -15, 262, 19, 5); } if (d.added.includes('salmon')) { g.fillStyle(0xe79b7b); g.fillRoundedRect(-128, 10, 256, 15, 5); } }
    } else if (d.recipeId === 'gyoza') {
      for (let i = 0; i < 3; i++) { const x = -75 + i * 75; g.fillStyle(0xf9e7bc); g.fillEllipse(x, 0, 79, 86); g.lineStyle(2, 0xd2ba87); g.strokeEllipse(x, 0, 79, 86); if (d.added.includes('cabbage')) { g.fillStyle(0x9eaf78); g.fillEllipse(x, 0, 46, 30); } if (d.added.includes('mushroom')) { g.fillStyle(0xa88960); g.fillEllipse(x + 4, 0, 23, 16); } if (d.step > 3) { g.fillStyle(0xe7c98d); g.fillRoundedRect(x - 37, -12, 74, 37, 12); g.lineStyle(3, 0xbf9b5f); for (let n = 0; n < 4; n++) g.lineBetween(x - 24 + n * 15, -12, x - 19 + n * 15, 12); } }
    } else if (d.recipeId === 'temaki') {
      g.fillStyle(0x425b43); g.fillTriangle(-130, -75, 135, -75, 90, 80); if (d.added.includes('rice')) { g.fillStyle(0xfff6d9); g.fillTriangle(-111, -62, 110, -62, 78, 52); } if (d.added.includes('salmon')) { g.fillStyle(0xe99b78); g.fillRoundedRect(-65, -37, 136, 31, 6); } if (d.added.includes('cucumber')) { g.fillStyle(0x92ac6f); g.fillRoundedRect(-59, 1, 143, 18, 5); }
    } else if (['ramen', 'missoshiru', 'donburi', 'yakisoba'].includes(d.recipeId)) {
      const pan = d.recipeId === 'yakisoba'; g.fillStyle(pan ? 0x506248 : 0xd6ddba); g.fillEllipse(0, -3, 253, 195); g.lineStyle(3, 0x8c9c7a); g.strokeEllipse(0, -3, 253, 195); g.fillStyle(d.added.includes('broth') ? 0xb38a52 : d.added.includes('rice') ? 0xf9eecd : 0x62714e); g.fillEllipse(0, -8, 226, 163);
      if (pan) { g.lineStyle(16, 0x566348); g.lineBetween(103, 52, 164, 88); }
      if (d.added.includes('noodles')) { g.lineStyle(5, 0xe9c882); for (let i = 0; i < 9; i++) { g.beginPath(); g.arc(-15 + i % 3 * 10, -24 + i * 4, 16 + i * 5, .25, 5.6); g.strokePath(); } }
      if (d.added.includes('chicken')) { g.fillStyle(0xc7945e); for (let i = 0; i < 4; i++) g.fillRoundedRect(-62 + i * 32, -38 + i % 2 * 30, 44, 34, 7); }
      if (d.added.includes('miso') || d.added.includes('mushroom')) { g.fillStyle(0xab855d); for (let i = 0; i < 5; i++) { g.fillEllipse(-55 + i * 25, -33 + i % 2 * 36, 32, 15); g.lineStyle(4, 0xe0c89c); g.lineBetween(-55 + i * 25, -29 + i % 2 * 36, -55 + i * 25, -11 + i % 2 * 36); } }
      if (d.added.includes('egg')) { g.fillStyle(0xfff5d8); g.fillEllipse(55, -34, 43, 59); g.fillStyle(0xeebc52); g.fillEllipse(55, -30, 23, 31); }
      if (d.added.includes('cabbage')) { g.fillStyle(0xa9bd7c); for (let i = 0; i < 5; i++) g.fillTriangle(-64 + i * 25, -42, -46 + i * 25, -22, -73 + i * 25, -15); }
    } else if (['tempura', 'karaage'].includes(d.recipeId)) {
      g.fillStyle(step?.type === 'fry' ? 0xb78b3e : 0xb6c49a); g.fillEllipse(0, -5, 265, 168); g.lineStyle(4, 0x7c8d67); g.strokeEllipse(0, -5, 265, 168);
      for (let i = 0; i < 5; i++) { const x = -73 + i % 3 * 64, y = -37 + Math.floor(i / 3) * 56; g.fillStyle(d.added.includes('dough') ? 0xe1bd70 : 0xdba17d); g.fillRoundedRect(x, y, 51, d.recipeId === 'tempura' ? 76 : 43, 14); g.lineStyle(3, 0xf4d494); g.lineBetween(x + 9, y + 10, x + 34, y + 20); }
    } else {
      g.fillStyle(0xfff7dc); if (d.recipeId === 'onigiri' && d.step > 1) { g.fillTriangle(0, -83, -90, 46, 90, 46); g.lineStyle(2, 0xe3d3ac); g.strokeTriangle(0, -83, -90, 46, 90, 46); } else g.fillEllipse(0, -4, 185, 94);
      if (d.added.includes('salmon')) { g.fillStyle(0xe99b7b); g.fillRoundedRect(-95, -55, 190, 61, 18); g.lineStyle(5, 0xffdcbc); for (let i = 0; i < 5; i++) g.lineBetween(-73 + i * 35, -51, -61 + i * 35, -1); }
    }
    // Extras are visible in the dish instead of being bookkeeping-only additions.
    if (d.added.includes('sesame')) { g.fillStyle(0xbda06a); for (let i = 0; i < 17; i++) g.fillEllipse(-64 + i * 19 % 126, -37 + i * 13 % 64, 3, 6); }
    if (d.added.includes('scallion')) { g.fillStyle(0x73955b); for (let i = 0; i < 7; i++) g.fillEllipse(-51 + i * 16, -42 + i % 3 * 10, 12, 6); }
    if (step?.type === 'cut' || step?.type === 'fold' && step.count === 3) {
      for (let i = 0; i < 3; i++) { const x = (step.type === 'cut' ? 460 + i * 100 : 490 + i * 70); const marks = this.scene.add.graphics(); marks.lineStyle(3, i < d.actions ? 0x80965e : 0xfff3ca); if (step.type === 'cut') for (let y = 258; y < 418; y += 12) marks.lineBetween(x, y, x, y + 6); else marks.strokeCircle(x, 340, 16); this.board.add(marks); }
    }
    if (step?.type === 'shape') this.label.setText('←  Modele com um gesto suave  →');
    if (step?.type === 'roll') this.label.setText('Arraste da esquerda para a direita  →');
    if (step?.type === 'fold' && !step.count) this.label.setText('Dobre na diagonal  ↗');
    if (step?.type === 'toss') this.label.setText(`Salteie para cima  ↑  ${d.actions}/3`);
    if (step?.type === 'cook' || step?.type === 'fry') this.label.setText('Segure · solte na faixa verde');
  }
  update(dt: number) {
    if (this.model.view !== 'kitchen') return; this.clock += dt;
    const step = this.step(), d = this.model.state.dish;
    if (this.held && this.active()) { this.elapsed = performance.now() - this.holdStarted; this.brush.setScale(1 + Math.sin(this.clock / 120) * .07); }
    if (step?.type === 'cook' || step?.type === 'fry') {
      this.meter.clear(); this.meter.fillStyle(0xc9bb91); this.meter.fillRoundedRect(446, 493, 228, 8, 4); this.meter.fillStyle(0x92ab72); this.meter.fillRect(514, 493, 82, 8); if (this.held) { this.meter.fillStyle(0xfff6d1); this.meter.fillCircle(446 + Math.min(228, this.elapsed / 5000 * 228), 497, 6); }
      if (this.held && this.clock % 140 < dt) { const bubble = this.scene.add.circle(493 + Math.random() * 133, 340 + Math.random() * 45, 3 + Math.random() * 3, 0xf8dea0, .7); this.work.add(bubble); this.scene.tweens.add({ targets: bubble, y: bubble.y - 14, alpha: 0, duration: 450, onComplete: () => bubble.destroy() }); }
    }
    if (d?.added.length && ['ramen', 'missoshiru', 'donburi', 'gyoza', 'yakisoba', 'tempura', 'karaage'].includes(d.recipeId) && this.clock % 500 < dt) { const steam = this.scene.add.ellipse(535 + Math.random() * 66, 275, 6, 15, 0xfff7dc, .55); this.work.add(steam); this.scene.tweens.add({ targets: steam, y: 210, x: steam.x + 12, alpha: 0, scaleX: 3, duration: 1800, onComplete: () => steam.destroy() }); }
  }
}
