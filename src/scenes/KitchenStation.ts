import Phaser from 'phaser';
import { ingredients, recipes, recipeIngredients, type IngredientId } from '../data/catalog';
import { KitchenGame } from '../systems/game';
import { dishSteps } from '../systems/state';
import { COOK_WINDOW, measureGesture } from '../systems/kitchenInput';
import { audio } from '../systems/audio';
export class KitchenStation {
  readonly container: Phaser.GameObjects.Container;
  private work: Phaser.GameObjects.Container;
  private mobileBoard: Phaser.GameObjects.Graphics;
  private mobileBackground: Phaser.GameObjects.Image | null = null;
  private wide = false;
  private shelf: Phaser.GameObjects.Container;
  private board: Phaser.GameObjects.Container;
  private guides: Phaser.GameObjects.Container;
  private target: Phaser.GameObjects.Zone;
  private dropHint: Phaser.GameObjects.Container;
  private dragging: Phaser.GameObjects.Image | null = null;
  private pressedIngredient: Phaser.GameObjects.Image | null = null;
  private dragPointer: Phaser.Input.Pointer | null = null;
  private nativeIngredients = false;
  private nativeDrag: {id:number;obj:Phaser.GameObjects.Image;startX:number;startY:number;grabX:number;grabY:number;moved:boolean} | null = null;
  private contextKey = '';
  private food: Phaser.GameObjects.Container;
  private meter: Phaser.GameObjects.Graphics;
  private brush: Phaser.GameObjects.Graphics;
  private label: Phaser.GameObjects.Text;
  private heading: Phaser.GameObjects.Text;
  private subtitle: Phaser.GameObjects.Text;
  private sources = new Map<IngredientId,{sprite:Phaser.GameObjects.Image;caption:Phaser.GameObjects.Text}>();
  private emptyShelf: Phaser.GameObjects.Text | null = null;
  private halos = new Map<IngredientId, Phaser.GameObjects.Rectangle>();
  private key = ''; private shelfKey = ''; private held = false; private holdStarted = 0; private elapsed = 0; private travel = 0; private startX = 0; private startY = 0; private lastX = 0; private lastY = 0; private clock = 0;
  constructor(private scene: Phaser.Scene, private model: KitchenGame, private mobile = false) {
    const s = scene, c = this.container = s.add.container(0, 0).setName('kitchen');
    s.input.dragDistanceThreshold = mobile ? 12 : 8;
    if(mobile){this.mobileBackground=s.add.image(320,450,'portrait-kitchen').setDisplaySize(640,900);c.add(this.mobileBackground);}
    this.mobileBoard=s.add.graphics();c.add(this.mobileBoard);
    const g = s.add.graphics(); g.fillStyle(0xc9a578); g.fillRect(0, 0, 1120, 730);
    for (let x = 0; x < 1120; x += 74) { g.lineStyle(1, 0x99734c, .2); g.lineBetween(x, 0, x + 10, 730); }
    g.fillStyle(0xf1e7ce); g.fillRect(0, 0, 1120, 173); g.fillStyle(0xb89768); g.fillRect(0, 167, 1120, 10);
    for(let x=0;x<1120;x+=80){g.lineStyle(1,0xd4c6a7,.25);g.lineBetween(x,0,x,165);}
    g.fillStyle(0xb99a6d);g.fillRoundedRect(40,128,210,10,4);
    for(let i=0;i<4;i++){g.fillStyle([0xa8b68d,0xd5b389,0xabb39a,0xd8c6a2][i]);g.fillRoundedRect(58+i*44,89,31,38,6);g.fillEllipse(73+i*44,89,31,9,32);g.lineStyle(2,0x8a9470,.5);g.strokeEllipse(73+i*44,89,31,9,32);}
    g.lineStyle(3,0xa38b62);g.lineBetween(886,52,1068,52);for(let i=0;i<3;i++){const x=919+i*58;g.lineStyle(3,0x84947a);g.lineBetween(x,53,x,105);g.strokeEllipse(x,116,22+i*3,31,32);}
    g.fillStyle(0x9c774b, .22); g.fillRoundedRect(271, 208, 581, 299, 24); g.fillStyle(0xe8c597); g.fillRoundedRect(263, 198, 581, 299, 24); g.lineStyle(2, 0xc69e6f); g.strokeRoundedRect(274, 208, 559, 279, 19);
    for (let y = 225; y < 480; y += 21) { g.lineStyle(1, 0xc19766, .2); g.lineBetween(290, y, 820, y + 4); }
    // A folded kitchen towel, a knife, chopsticks and a small herb vase frame the work surface.
    g.fillStyle(0xe8e5c9); g.fillRoundedRect(45, 344, 127, 100, 5); for (let y = 352; y < 444; y += 9) { g.lineStyle(1, 0xa6b39a, .6); g.lineBetween(49, y, 169, y); }
    g.fillStyle(0x91816a); g.fillRoundedRect(194, 265, 21, 116, 5); g.fillStyle(0xd9dfca); g.fillTriangle(192, 270, 222, 270, 220, 375); g.fillStyle(0x705940); g.fillRoundedRect(196, 225, 19, 54, 5);
    g.lineStyle(4, 0x8a6443); g.lineBetween(862, 285, 885, 423); g.lineBetween(876, 282, 899, 421);
    g.fillStyle(0xa1b18c); g.fillRoundedRect(87, 251, 41, 60, 12); g.lineStyle(3, 0x779060); g.lineBetween(108, 255, 107, 202); g.lineBetween(107, 232, 88, 212); g.lineBetween(107, 219, 124, 198); g.fillStyle(0x839d6c); g.fillEllipse(86, 209, 25, 13); g.fillEllipse(126, 196, 25, 13);
    g.fillStyle(0xb38b5e); g.fillRect(0, 534, 1120, 196); g.fillStyle(0x977048); g.fillRect(0, 531, 1120, 9); c.add(g);g.setVisible(!mobile);
    c.add(s.add.text(44, 493, '心をこめて。', { fontFamily: 'serif', fontSize: '17px', color: '#9a7c51' }).setVisible(!mobile));
    c.add(s.add.text(65, 542, 'SUA BANCADA · INGREDIENTES LIVRES', { fontFamily: 'sans-serif', fontSize: '10px', letterSpacing: 2, color: '#faedd2' }).setVisible(!mobile));
    this.heading=s.add.text(560,75,'Sua cozinha, seu ritmo.',{fontFamily:'Georgia',fontSize:'29px',color:'#667b51'}).setOrigin(.5).setVisible(!mobile);c.add(this.heading);
    this.subtitle=s.add.text(560,112,'DO CADERNO DA AVÓ · FEITO POR VOCÊ',{fontFamily:'sans-serif',fontSize:'11px',letterSpacing:2,color:'#a08b60'}).setOrigin(.5).setVisible(!mobile);c.add(this.subtitle);
    this.board = s.add.container(0, 0); c.add(this.board); this.food = s.add.container(560, 340); c.add(this.food);
    this.label = s.add.text(560, 467, '', { fontFamily: 'Georgia', fontSize: '17px', color: '#7b7952' }).setOrigin(.5); c.add(this.label);
    this.meter = s.add.graphics(); c.add(this.meter);
    this.brush = s.add.graphics().setVisible(false); this.brush.lineStyle(2, 0xfffae3, .9); this.brush.strokeCircle(0, 0, 24); this.brush.lineStyle(1, 0x849566, .7); this.brush.strokeCircle(0, 0, 29); c.add(this.brush);
    this.guides=s.add.container(0,0).setName('gesture-guides');
    this.target=s.add.zone(559,349,592,322).setRectangleDropZone(592,322).setName('work-area');
    const outline=s.add.graphics().lineStyle(4,0x6f9650,.9).strokeRoundedRect(268,193,582,312,23);
    const dropLabel=s.add.text(560,217,'Solte o ingrediente na tábua',{fontFamily:'sans-serif',fontSize:'17px',color:'#426b35',backgroundColor:'#eff3d8',padding:{x:12,y:5}}).setOrigin(.5);
    this.dropHint=s.add.container(0,0,[outline,dropLabel]).setVisible(false);
    this.work=s.add.container(0,0,[this.board,this.target,this.food,this.guides,this.dropHint,this.label,this.meter,this.brush]).setName('workbench');c.add(this.work);
    this.shelf = s.add.container(0, 0).setName('ingredient-shelf'); c.add(this.shelf);
    this.nativeIngredients=!mobile&&typeof PointerEvent!=='undefined';
    if(this.nativeIngredients)this.installIngredientPointers();
    const cancel = () => this.cancelTouch(), canvas = s.game.canvas;
    s.input.on('pointerupoutside', cancel); window.addEventListener('blur', cancel); document.addEventListener('visibilitychange', cancel);
    const contextMenu=(event:Event)=>{if(this.active())event.preventDefault();};canvas.addEventListener('contextmenu',contextMenu);
    window.addEventListener('komorebi-game-paused', cancel); canvas.addEventListener('touchcancel', cancel, { capture: true, passive: true });
    s.scale.on('resize', cancel);
    const cleanup = () => { window.removeEventListener('blur', cancel); document.removeEventListener('visibilitychange', cancel); window.removeEventListener('komorebi-game-paused', cancel); canvas.removeEventListener('touchcancel', cancel, true);canvas.removeEventListener('contextmenu',contextMenu); s.scale.off('resize', cancel); };
    s.events.once('shutdown', cleanup); s.events.once('destroy', cleanup);
    s.input.on('pointerdown', this.down, this); s.input.on('pointermove', this.move, this); s.input.on('pointerup', this.up, this);
    s.input.on('dragstart', (p: Phaser.Input.Pointer, obj: Phaser.GameObjects.Image) => {
      if (!obj.getData('ingredient')) return;
      obj.setData('moved', true);
      if (!this.active() || this.step()?.type !== 'ingredient' || obj.getData('pressedPointer') !== p.id) { obj.setData('cancelled', true); if(this.active()) this.explainStep(); return; }
      this.dragging=obj; this.dragPointer=p; s.tweens.killTweensOf(obj); this.shelf.bringToTop(obj);
      obj.setAlpha(.95).setDisplaySize(mobile?112:95,mobile?95:81); this.moveIngredient(p,obj); this.dropHint.setVisible(true);
      this.model.feedback(`Leve ${ingredients[obj.getData('ingredient') as IngredientId].name.toLowerCase()} até a tábua iluminada.`);
    });
    s.input.on('drag', (p: Phaser.Input.Pointer, obj: Phaser.GameObjects.Image) => { if(obj===this.dragging && !obj.getData('cancelled')) this.moveIngredient(p,obj); });
    s.input.on('dragend', (p: Phaser.Input.Pointer, obj: Phaser.GameObjects.Image, dropped:boolean) => {
      if(!obj.getData('ingredient')) return;
      this.dragging=null; this.dragPointer=null; this.pressedIngredient=null; this.dropHint.setVisible(false); obj.setData('pressedPointer',null);
      const inCanvas=p.upElement===canvas;
      if(!obj.getData('cancelled') && this.active() && inCanvas && (dropped || this.inBoard(p))) this.addIngredient(obj);
      else { if(!obj.getData('cancelled') && this.active())this.model.feedback('Solte o ingrediente sobre a tábua iluminada para adicionar.','warning'); this.returnIngredient(obj,false); }
    });
  }

  private active() { return this.model.view === 'kitchen' && !this.model.paused; }
  private nativePoint(event:PointerEvent){const r=this.scene.game.canvas.getBoundingClientRect();return {x:(event.clientX-r.left)*1120/r.width,y:(event.clientY-r.top)*730/r.height};}
  private installIngredientPointers(){
    const canvas=this.scene.game.canvas;
    const down=(event:PointerEvent)=>{
      if(!this.active()||event.button!==0||this.nativeDrag)return;
      const q=this.nativePoint(event),source=[...this.sources.values()].find(({sprite})=>sprite.visible&&!sprite.getData('returning')&&Math.abs(q.x-sprite.getData('homeX'))<=43&&q.y>=sprite.getData('homeY')-61&&q.y<=sprite.getData('homeY')+47);
      if(!source)return;
      // Own the complete ingredient gesture, including mouse-up outside the canvas.
      // Compatibility mouse events must not add the ingredient a second time.
      event.preventDefault();
      if(this.step()?.type!=='ingredient'){this.explainStep();return;}
      const obj=source.sprite;this.scene.tweens.killTweensOf(obj);this.pressedIngredient=obj;
      this.nativeDrag={id:event.pointerId,obj,startX:event.clientX,startY:event.clientY,grabX:q.x-obj.x,grabY:q.y-obj.y,moved:false};
      obj.setData({cancelled:false,moved:false,pressedPointer:null});this.dropHint.setVisible(true);canvas.setPointerCapture(event.pointerId);
    };
    const move=(event:PointerEvent)=>{
      const drag=this.nativeDrag;if(!drag||event.pointerId!==drag.id)return;
      if(!this.active()){this.cancelTouch();return;}
      if(!drag.moved&&Math.hypot(event.clientX-drag.startX,event.clientY-drag.startY)<5)return;
      if(!drag.moved){drag.moved=true;this.dragging=drag.obj;drag.obj.setData('moved',true).setAlpha(.95).setDisplaySize(95,81);this.shelf.bringToTop(drag.obj);this.model.feedback('Solte o ingrediente na tábua iluminada.');}
      const q=this.nativePoint(event);drag.obj.setPosition(q.x-drag.grabX,q.y-drag.grabY);
    };
    const up=(event:PointerEvent)=>{
      const drag=this.nativeDrag;if(!drag||event.pointerId!==drag.id)return;
      move(event);const q=this.nativePoint(event),inBoard=q.x>=263&&q.x<=855&&q.y>=188&&q.y<=510;
      const onSource=Math.abs(q.x-drag.obj.getData('homeX'))<=43&&q.y>=drag.obj.getData('homeY')-61&&q.y<=drag.obj.getData('homeY')+47;
      this.nativeDrag=null;this.dragging=null;this.pressedIngredient=null;this.dropHint.setVisible(false);
      if(canvas.hasPointerCapture(event.pointerId))canvas.releasePointerCapture(event.pointerId);
      if(this.active()&&(inBoard||!drag.moved&&onSource))this.addIngredient(drag.obj);
      else {this.returnIngredient(drag.obj,false);if(this.active())this.model.feedback('Solte o ingrediente sobre a tábua iluminada para adicionar.','warning');}
    };
    const cancel=()=>{if(this.nativeDrag)this.cancelTouch();};
    canvas.addEventListener('pointerdown',down,true);canvas.addEventListener('pointermove',move,true);canvas.addEventListener('pointerup',up,true);canvas.addEventListener('pointercancel',cancel,true);canvas.addEventListener('lostpointercapture',cancel,true);
    const cleanup=()=>{canvas.removeEventListener('pointerdown',down,true);canvas.removeEventListener('pointermove',move,true);canvas.removeEventListener('pointerup',up,true);canvas.removeEventListener('pointercancel',cancel,true);canvas.removeEventListener('lostpointercapture',cancel,true);};
    this.scene.events.once('shutdown',cleanup);this.scene.events.once('destroy',cleanup);
  }
  private worldPoint(p:Phaser.Input.Pointer){return this.scene.cameras.main.getWorldPoint(p.x,p.y);}
  private toWork(p:Phaser.Input.Pointer){const q=this.worldPoint(p);return {x:(q.x-this.work.x)/this.work.scaleX,y:(q.y-this.work.y)/this.work.scaleY};}
  private inBoard(p:Phaser.Input.Pointer){const q=this.toWork(p);return q.x>=263&&q.x<=855&&q.y>=188&&q.y<=510;}
  private moveIngredient(p:Phaser.Input.Pointer,obj:Phaser.GameObjects.Image){const q=this.worldPoint(p);obj.setPosition(q.x-(obj.getData('grabX')??0),q.y-(obj.getData('grabY')??0));}
  private instruction(){const step=this.step(),d=this.model.state.dish;if(!step)return '';
    if(step.type==='ingredient')return 'Clique no ingrediente iluminado ou arraste até o prato.';
    if(step.type==='shape')return 'Segure no arroz e deslize até a barra completar.';
    if(step.type==='roll')return 'Segure e enrole com um gesto para um dos lados  ↔';
    if(step.type==='cut')return `Clique na marca destacada · ${(d?.actions??0)+1} de 3`;
    if(step.type==='fold')return step.count?`Feche a borda destacada · ${(d?.actions??0)+1} de 3`:'Segure e dobre com um gesto na diagonal  ↗';
    if(step.type==='toss')return `Arraste para cima · ${d?.actions??0} de 3`;
    return 'Segure sobre o prato · solte na faixa verde';
  }
  private explainStep(){this.model.feedback(this.model.state.dish?.ready?'O prato está pronto. Clique em Servir com carinho.':this.instruction()||'Escolha uma receita antes de adicionar ingredientes.','warning');}
  private addIngredient(obj:Phaser.GameObjects.Image){
    const step=this.step(),id=obj.getData('ingredient') as IngredientId;
    if(!this.active() || step?.type!=='ingredient'){if(this.active())this.explainStep();this.returnIngredient(obj,false);return;}
    this.pressedIngredient=null;obj.setData('pressedPointer',null).setData('moved',true).disableInteractive();
    if(!this.model.ingredient(id)){this.returnIngredient(obj,false);return;}
    const correct=step.ingredient===id;
    this.model.feedback(correct?`${ingredients[id].name} adicionado ao prato.`:`${ingredients[id].name} adicionado. Esta etapa pedia ${ingredients[step.ingredient].name.toLowerCase()}; você pode recomeçar sem custo.`,correct?'success':'warning');
    audio.effect('drop');this.puff(560,330);this.returnIngredient(obj,true);
  }
  private returnIngredient(obj:Phaser.GameObjects.Image,accepted:boolean){
    if(!obj.active)return;
    const s=this.scene;s.tweens.killTweensOf(obj);obj.disableInteractive().setData('returning',true);
    const home={x:obj.getData('homeX'),y:obj.getData('homeY'),scaleX:obj.getData('homeScaleX'),scaleY:obj.getData('homeScaleY')};
    const finish=()=>{if(obj.active){obj.setPosition(home.x,home.y).setScale(home.scaleX,home.scaleY).setAlpha(1).setInteractive({useHandCursor:true});obj.setData('returning',false);}};
    // A received ingredient disappears into the dish; only rejected drops fly back.
    s.tweens.add({targets:obj,...(accepted?{x:this.work.x+560*this.work.scaleX,y:this.work.y+330*this.work.scaleY,scaleX:home.scaleX*.45,scaleY:home.scaleY*.45,alpha:0}:{...home,alpha:1}),duration:accepted?220:180,ease:'Sine.easeOut',onComplete:finish});
  }

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
  cancelTouch(){
    const native=this.nativeDrag;this.nativeDrag=null;
    if(native){const canvas=this.scene.game.canvas;if(canvas.hasPointerCapture(native.id))canvas.releasePointerCapture(native.id);if(this.dragging!==native.obj)this.returnIngredient(native.obj,false);}
    const busy=this.held||!!this.dragging||!!this.pressedIngredient;
    this.held=false;this.brush.setVisible(false);this.food.setScale(1);this.meter.clear();this.dropHint.setVisible(false);
    if(this.pressedIngredient?.active){this.pressedIngredient.setData('cancelled',true).setData('pressedPointer',null);}this.pressedIngredient=null;
    if(this.dragging){const obj=this.dragging;this.dragging=null;this.dragPointer=null;if(obj.active){obj.setData('cancelled',true).setData('pressedPointer',null);this.returnIngredient(obj,false);}}
    if(!this.model.state.dish?.ready)this.label.setText(this.instruction());
    if(busy&&this.active())this.model.feedback('Movimento cancelado. Você pode tentar novamente.');
  }

  private step() { const d = this.model.state.dish; return d ? dishSteps(d, this.model.state.orders[0]?.extra ?? null)[d.step] : null; }
  private down(p: Phaser.Input.Pointer) {
    if(this.nativeDrag)return;
    if(!this.active() || !this.inBoard(p) || this.model.state.dish?.ready || !p.wasTouch&&p.button!==0)return;
    const q=this.toWork(p),step=this.step(),d=this.model.state.dish;if(!step||!d)return;if(step.type==='ingredient'){this.model.feedback(`Escolha ${ingredients[step.ingredient].name.toLowerCase()} na prateleira ou arraste até o prato.`);return;}
    if(step.type==='cut'||step.type==='fold'&&step.count===3){
      const x=step.type==='cut'?460+d.actions*100:490+d.actions*70;
      if(Math.abs(q.x-x)<=55){const n=d.actions+1,stage=d.step;this.model.gesture(1);audio.effect('cut');this.puff(q.x,q.y);this.model.feedback(this.model.state.dish?.ready?'Prato pronto para servir.':d.step!==stage?'Etapa concluída. '+this.instruction():`Marca ${n} de 3 concluída. Continue na marca destacada.`,'success');}
      else this.model.feedback('Clique na marca destacada, da esquerda para a direita.','warning');
      return;
    }
    this.held=true;this.holdStarted=performance.now();this.elapsed=0;this.travel=0;this.startX=this.lastX=q.x;this.startY=this.lastY=q.y;
    this.brush.setPosition(q.x,q.y).setVisible(!['cook','fry'].includes(step.type));this.model.feedback(this.instruction());
    if(step.type==='fry')audio.effect('sizzle');
  }
  private move(p:Phaser.Input.Pointer){
    if(!this.held||!this.active())return;
    const q=this.toWork(p);this.travel+=Math.hypot(q.x-this.lastX,q.y-this.lastY);this.lastX=q.x;this.lastY=q.y;this.brush.setPosition(q.x,q.y);
    if(this.step()?.type==='shape')this.food.setScale(1+Math.min(this.travel,180)/1600,1-Math.min(this.travel,180)/2400);
  }
  private motion(){return {dx:this.lastX-this.startX,dy:this.lastY-this.startY,distance:this.travel,heldMs:performance.now()-this.holdStarted};}
  private up(p:Phaser.Input.Pointer){
    if(!this.held)return;
    this.move(p);const motion=this.motion();this.held=false;this.brush.setVisible(false);this.food.setScale(1);this.meter.clear();
    if(!this.active())return;
    const step=this.step();if(!step||step.type==='ingredient')return;
    const result=measureGesture(step.type,motion);
    if(result.complete){
      this.model.gesture(result.quality);audio.effect('drop');this.puff(560,330);this.model.feedback(this.model.state.dish?.ready?'Prato pronto para servir.':'Movimento concluído. Continue na próxima etapa.','success');
      if(step.type==='toss')this.scene.tweens.add({targets:this.food,y:298,angle:-7,duration:170,yoyo:true,onComplete:()=>{if(this.food.active)this.food.setPosition(560,340).setAngle(0);}});
    }else{
      const hint=step.type==='cook'||step.type==='fry'?'Segure sobre o prato por um instante e solte com o marcador na faixa verde.':step.type==='toss'?'Comece mais abaixo e arraste para cima.':step.type==='fold'?'Faça um movimento na diagonal para fechar o cone.':'Segure sobre o prato e deslize um pouco mais, até a barra completar.';
      this.model.feedback(hint,'warning');this.label.setText(this.instruction());
    }
  }
  private puff(x: number, y: number) { for (let i = 0; i < 6; i++) { const p = this.scene.add.circle(x, y, 2 + i % 2, 0xffefbd, .8); this.work.add(p); this.scene.tweens.add({ targets: p, x: x + Math.cos(i) * 35, y: y - 10 + Math.sin(i) * 24, alpha: 0, duration: 550, onComplete: () => p.destroy() }); } }
  sync() {
    const context=`${this.model.view}:${this.model.state.orders[0]?.id}:${this.model.state.dish?.recipeId}:${this.model.state.dish?.step}`;
    if(context!==this.contextKey||!this.active()){this.cancelTouch();this.contextKey=context;}
    this.container.setVisible(this.model.view === 'kitchen');
    if(this.target.input){this.target.input.dropZone=true;this.target.input.cursor=this.model.state.dish?.ready?'default':this.step()?.type==='ingredient'?'pointer':'grab';}
    const s = this.model.state, d = s.dish;this.heading.setText(d?recipes[d.recipeId].name:'Sua cozinha, seu ritmo.');this.subtitle.setText(d?recipes[d.recipeId].japanese:'DO CADERNO DA AVÓ · FEITO POR VOCÊ');const shelfKey = d?.recipeId + ':' + s.orders[0]?.extra;
    if (shelfKey !== this.shelfKey) { this.shelfKey = shelfKey; this.renderShelf(); }
    const key = JSON.stringify(d); if (key !== this.key) { this.key = key; this.renderFood(); }
    const step = this.step(); for (const [id, halo] of this.halos) halo.setAlpha(step?.type === 'ingredient' && step.ingredient === id ? .3 : .04);
  }
  private renderShelf() {
    const d=this.model.state.dish,ids=d?recipeIngredients(d.recipeId,this.model.state.orders[0]?.extra??null):[];
    // Reuse registered inputs: rebuilding them on a recipe switch discarded fast clicks
    // until Phaser's next input frame, even though the new shelf was already shown.
    if(!this.sources.size){
      for(const id of Object.keys(ingredients) as IngredientId[]){
        const halo=this.scene.add.rectangle(0,0,this.mobile?112:80,this.mobile?94:89,0xfff0bd,.1).setStrokeStyle(1,0xf4dfb2,.5);this.shelf.add(halo);this.halos.set(id,halo);
        const sprite=this.scene.add.image(0,0,'ingredient-'+id).setInteractive({useHandCursor:true}).setName('ingredient-'+id).setData('ingredient',id);
        this.scene.input.setDraggable(sprite,!this.nativeIngredients);this.shelf.add(sprite);
        const caption=this.scene.add.text(0,0,ingredients[id].name,{fontFamily:'sans-serif',fontSize:this.mobile?'16px':'14px',color:'#fff4db',align:'center',...(!this.mobile?{wordWrap:{width:82}}:{})}).setOrigin(.5);this.shelf.add(caption);this.sources.set(id,{sprite,caption});
        sprite.on('pointerdown',(p:Phaser.Input.Pointer)=>{
          if(this.nativeIngredients)return;
          if(!this.active()||sprite.getData('returning')||!p.wasTouch&&p.button!==0)return;
          this.pressedIngredient=sprite;const q=this.worldPoint(p);sprite.setData({pressedPointer:p.id,grabX:q.x-sprite.x,grabY:q.y-sprite.y,moved:false,cancelled:false});
        });
        sprite.on('pointerup',(p:Phaser.Input.Pointer)=>{if(this.nativeIngredients||!p.wasTouch&&p.button!==0||sprite.getData('pressedPointer')!==p.id||sprite.getData('moved')||sprite.getData('cancelled')||!this.active())return;this.addIngredient(sprite);});
        sprite.on('pointerover',()=>{if(this.dragging!==sprite&&this.pressedIngredient!==sprite&&!sprite.input?.dragState&&!sprite.getData('returning'))this.scene.tweens.add({targets:sprite,y:sprite.getData('homeY')-7,duration:130});});
        sprite.on('pointerout',()=>{if(this.dragging!==sprite&&this.pressedIngredient!==sprite&&!sprite.input?.dragState&&!sprite.getData('returning'))this.scene.tweens.add({targets:sprite,y:sprite.getData('homeY'),duration:130});});
      }
      this.emptyShelf=this.scene.add.text(0,0,'Escolha uma receita acima.',{fontFamily:'Georgia',fontSize:'23px',color:'#f7e7c3'}).setOrigin(.5);this.shelf.add(this.emptyShelf);
    }
    for(const [id,{sprite,caption}] of this.sources){
      this.scene.tweens.killTweensOf(sprite);const i=ids.indexOf(id),visible=i>=0,halo=this.halos.get(id)!;
      sprite.setVisible(visible).setAlpha(1);caption.setVisible(visible);halo.setVisible(visible);
      sprite.setData({returning:false,moved:false,cancelled:false,pressedPointer:null});
      if(!visible){sprite.disableInteractive();continue;}
      const x=this.mobile?(this.wide?64+i*124:64+i%5*128):63+i*89;
      const y=this.mobile?(this.shelf.getData('height')??900)-(this.wide?63:175)+(this.wide?0:Math.floor(i/5)*100):621;
      sprite.setPosition(x,y).setDisplaySize(this.mobile?(this.wide?92:98):82,this.mobile?(this.wide?78:83):70).setInteractive({useHandCursor:true});
      if(!this.mobile&&sprite.input){
        // Include the caption and card edges, without overlapping adjacent slots.
        sprite.input.hitArea=new Phaser.Geom.Rectangle(sprite.displayOriginX-43/sprite.scaleX,sprite.displayOriginY-61/sprite.scaleY,86/sprite.scaleX,108/sprite.scaleY);
        sprite.input.hitAreaCallback=Phaser.Geom.Rectangle.Contains;sprite.input.customHitArea=true;
      }
      sprite.setData({homeX:x,homeY:y,homeScaleX:sprite.scaleX,homeScaleY:sprite.scaleY});
      halo.setPosition(x,this.mobile?y:y-7).setSize(this.mobile?(this.wide?108:112):86,this.mobile?(this.wide?80:94):108);caption.setPosition(x,this.mobile?y+43:579);
    }
    this.emptyShelf!.setVisible(!d).setPosition(this.mobile?320:404,this.mobile?(this.shelf.getData('height')??900)-150:627);
  }

  private renderFood() {
    this.scene.tweens.killTweensOf(this.food);this.food.setPosition(560,340).setAngle(0);this.guides.removeAll(true);this.board.removeAll(true); for (const child of this.food.list) this.scene.tweens.killTweensOf(child); this.food.removeAll(true); this.meter.clear(); this.food.setScale(1); this.label.setText('');
    const d = this.model.state.dish, step = this.step();
    const p = this.scene.add.graphics(); p.fillStyle(0xe5e9d4); p.fillEllipse(560, 350, 361, 216, 96); p.lineStyle(3, 0xb6c39d); p.strokeEllipse(560, 350, 335, 191, 96); this.board.add(p);
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
      if (step?.type === 'cut') {
        // A roll stays whole until each cut; do not show pre-cut slices before input.
        const edges=[-168,-100,0,100,168],cuts=d.actions;
        for(let i=0;i<=cuts;i++){
          const left=edges[i]+i*5,right=i<cuts?edges[i+1]:168,width=right-left;
          g.fillStyle(d.recipeId==='uramaki'?0xf5e9c9:0x425c43);g.fillRoundedRect(left,-43,width,87,12);g.lineStyle(2,0x708466);g.strokeRoundedRect(left,-43,width,87,12);
          g.fillStyle(0xfff4d8);g.fillEllipse(left+9,0,21,72,48);g.fillStyle(0x8aa768);g.fillEllipse(left+8,0,9,28,32);
          if(d.added.includes('salmon')){g.fillStyle(0xe89c7c);g.fillEllipse(left+9,12,10,21,32);}
          if(d.recipeId==='uramaki'){g.fillStyle(0xcdbd91,.65);for(let k=0;k<8;k++)g.fillEllipse(left+22+k*19%Math.max(1,width-25),-25+k%3*20,5,3,8);}
        }
      }
      else { g.fillStyle(0x496047); g.fillRoundedRect(-150, -76, 300, 137, 3); if (d.added.includes('rice')) { g.fillStyle(0xfaf1d7); g.fillRoundedRect(-139, -67, 278, 119, 3); } if (d.added.includes('cucumber')) { g.fillStyle(0x8aa76b); g.fillRoundedRect(-131, -15, 262, 19, 5); } if (d.added.includes('salmon')) { g.fillStyle(0xe79b7b); g.fillRoundedRect(-128, 10, 256, 15, 5); } }
    } else if (d.recipeId === 'gyoza') {
      for (let i = 0; i < 3; i++) { const x = -75 + i * 75; g.fillStyle(0xf9e7bc); g.fillEllipse(x, 0, 79, 86); g.lineStyle(2, 0xd2ba87); g.strokeEllipse(x, 0, 79, 86); if (d.added.includes('cabbage')) { g.fillStyle(0x9eaf78); g.fillEllipse(x, 0, 46, 30); } if (d.added.includes('mushroom')) { g.fillStyle(0xa88960); g.fillEllipse(x + 4, 0, 23, 16); } if (d.step > 3 || d.step===3 && i<d.actions) { g.fillStyle(0xe7c98d); g.fillRoundedRect(x - 37, -12, 74, 37, 12); g.lineStyle(3, 0xbf9b5f); for (let n = 0; n < 4; n++) g.lineBetween(x - 24 + n * 15, -12, x - 19 + n * 15, 12); } }
    } else if (d.recipeId === 'temaki') {
      g.fillStyle(0x425b43); g.fillTriangle(-130, -75, 135, -75, 90, 80); if (d.added.includes('rice')) { g.fillStyle(0xfff6d9); g.fillTriangle(-111, -62, 110, -62, 78, 52); } if (d.added.includes('salmon')) { g.fillStyle(0xe99b78); g.fillRoundedRect(-65, -37, 136, 31, 6); } if (d.added.includes('cucumber')) { g.fillStyle(0x92ac6f); g.fillRoundedRect(-59, 1, 143, 18, 5); }
    } else if (['ramen', 'missoshiru', 'donburi', 'yakisoba'].includes(d.recipeId)) {
      const pan = d.recipeId === 'yakisoba'; g.fillStyle(pan ? 0x506248 : 0xd6ddba); g.fillEllipse(0, -3, 253, 195); g.lineStyle(3, 0x8c9c7a); g.strokeEllipse(0, -3, 253, 195); g.fillStyle(d.added.includes('broth') ? (d.added.includes('miso')?0xc5a873:0xb38a52) : d.added.includes('rice') ? 0xf9eecd : 0x62714e); g.fillEllipse(0, -8, 226, 163);
      if (pan) { g.lineStyle(16, 0x566348); g.lineBetween(103, 52, 164, 88); }
      if (d.added.includes('noodles')) { g.lineStyle(5, d.added.includes('sauce')?0xc99f60:0xe9c882); for (let i = 0; i < 9; i++) { g.beginPath(); g.arc(-15 + i % 3 * 10, -24 + i * 4, 16 + i * 5, .25, 5.6); g.strokePath(); } }
      if (d.added.includes('chicken')) { g.fillStyle(0xc7945e); for (let i = 0; i < 4; i++) g.fillRoundedRect(-62 + i * 32, -38 + i % 2 * 30, 44, 34, 7); }
      if (d.added.includes('mushroom')) { g.fillStyle(0xab855d); for (let i = 0; i < 5; i++) { g.fillEllipse(-55 + i * 25, -33 + i % 2 * 36, 32, 15); g.lineStyle(4, 0xe0c89c); g.lineBetween(-55 + i * 25, -29 + i % 2 * 36, -55 + i * 25, -11 + i % 2 * 36); } }
      if (d.added.includes('egg')) { g.fillStyle(0xfff5d8); g.fillEllipse(55, -34, 43, 59); g.fillStyle(0xeebc52); g.fillEllipse(55, -30, 23, 31); }
      if (d.added.includes('cabbage')) { g.fillStyle(0xa9bd7c); for (let i = 0; i < 5; i++) g.fillTriangle(-64 + i * 25, -42, -46 + i * 25, -22, -73 + i * 25, -15); }
    } else if (['tempura', 'karaage'].includes(d.recipeId)) {
      g.fillStyle(step?.type === 'fry' ? 0xb78b3e : 0xb6c49a); g.fillEllipse(0, -5, 265, 168); g.lineStyle(4, 0x7c8d67); g.strokeEllipse(0, -5, 265, 168);
      for (let i = 0; i < 5; i++) { const x = -73 + i % 3 * 64, y = -37 + Math.floor(i / 3) * 56; g.fillStyle(d.added.includes('dough') ? 0xe1bd70 : d.added.includes('sauce')?0xbe885c:0xdba17d); g.fillRoundedRect(x, y, 51, d.recipeId === 'tempura' ? 76 : 43, 14); g.lineStyle(3, 0xf4d494); g.lineBetween(x + 9, y + 10, x + 34, y + 20); }
    } else {
      g.fillStyle(0xfff7dc); if (d.recipeId === 'onigiri' && d.step > 1) { g.fillTriangle(0, -83, -90, 46, 90, 46); g.lineStyle(2, 0xe3d3ac); g.strokeTriangle(0, -83, -90, 46, 90, 46); } else { g.fillStyle(0xb4a681,.28);g.fillEllipse(3,2,190,98,64);g.fillStyle(0xfff5d7);g.fillEllipse(0,-5,185,94,64);g.lineStyle(2,0xc7b88f);g.strokeEllipse(0,-5,185,94,64); }
      g.fillStyle(0xd9cba5,.8);for(let i=0;i<24;i++){const x=-59+i%8*17,y=-25+Math.floor(i/8)*20+(i%3)*2;if(d.recipeId==='onigiri'&&d.step>1&&Math.abs(x)>(y+83)/129*90-8)continue;g.fillEllipse(x,y,7,3,8);}
      if(d.recipeId==='onigiri'&&d.added.includes('nori')){g.fillStyle(0x425d43);g.fillRoundedRect(-29,3,58,51,4);g.lineStyle(2,0x6e8661,.75);g.lineBetween(-20,11,-20,45);g.lineBetween(19,11,19,45);}
      if (d.added.includes('salmon')) { g.fillStyle(0xe99b7b); g.fillRoundedRect(-95, -55, 190, 61, 18); g.lineStyle(5, 0xffdcbc); for (let i = 0; i < 5; i++) g.lineBetween(-73 + i * 35, -51, -61 + i * 35, -1); }
    }
    // Extras are visible in the dish instead of being bookkeeping-only additions.
    if (d.added.includes('sesame')) { g.fillStyle(0xbda06a); for (let i = 0; i < 17; i++) g.fillEllipse(-64 + i * 19 % 126, -37 + i * 13 % 64, 3, 6); }
    if (d.added.includes('scallion')) { g.fillStyle(0x73955b); for (let i = 0; i < 7; i++) g.fillEllipse(-51 + i * 16, -42 + i % 3 * 10, 12, 6); }
    if (step?.type === 'cut' || step?.type === 'fold' && step.count === 3) {
      for (let i = 0; i < 3; i++) { const x = (step.type === 'cut' ? 460 + i * 100 : 490 + i * 70); const marks = this.scene.add.graphics(); marks.lineStyle(3, i < d.actions ? 0x80965e : 0xfff3ca); if (step.type === 'cut') for (let y = 258; y < 418; y += 12) marks.lineBetween(x, y, x, y + 6); else marks.strokeCircle(x, 340, 16); this.guides.add(marks);
        if(i>=d.actions){const active=i===d.actions;const dot=this.scene.add.circle(x,340,19,active?0x5e7b46:0xf7efd7,active?1:.7).setStrokeStyle(2,0x4a693d);this.guides.add(dot);this.guides.add(this.scene.add.text(x,340,String(i+1),{fontFamily:'sans-serif',fontSize:'17px',color:active?'#fff8e8':'#597046'}).setOrigin(.5));} }
    }
    this.label.setText(this.instruction());
  }

  update(dt: number) {
    if (!this.active()){if(this.held||this.dragging)this.cancelTouch();return;}this.clock += dt;
    const step = this.step(), d = this.model.state.dish;
    if (this.held && this.active()) { this.elapsed = performance.now() - this.holdStarted; this.brush.setScale(1 + Math.sin(this.clock / 120) * .07); }
    if(this.held && step && step.type!=='ingredient' && !['cook','fry'].includes(step.type)){const progress=measureGesture(step.type,this.motion()).progress;this.meter.clear().fillStyle(0xb9aa85).fillRoundedRect(440,491,240,13,6);this.meter.fillStyle(progress>=1?0x6b9451:0xa3b67a).fillRoundedRect(440,491,Math.max(1,240*progress),13,6);this.label.setText(progress>=1?'Pode soltar ✓':`Continue o movimento · ${Math.round(progress*100)}%`);}
    if (step?.type === 'cook' || step?.type === 'fry') {
      const x=420,y=490,w=280,h=15;
      this.meter.clear();this.meter.fillStyle(0x9d8a62,.5).fillRoundedRect(x,y,w,h,7);this.meter.fillStyle(0x83a663).fillRect(x+w*COOK_WINDOW.idealStart/COOK_WINDOW.scale,y,w*(COOK_WINDOW.idealEnd-COOK_WINDOW.idealStart)/COOK_WINDOW.scale,h);
      if(this.held){this.meter.fillStyle(0xfff8dd).fillCircle(x+Math.min(w,this.elapsed/COOK_WINDOW.scale*w),y+h/2,8);this.meter.lineStyle(2,0x6d784f).strokeCircle(x+Math.min(w,this.elapsed/COOK_WINDOW.scale*w),y+h/2,8);}

      if (this.held && this.clock % 140 < dt) { const bubble = this.scene.add.circle(493 + Math.random() * 133, 340 + Math.random() * 45, 3 + Math.random() * 3, 0xf8dea0, .7); this.work.add(bubble); this.scene.tweens.add({ targets: bubble, y: bubble.y - 14, alpha: 0, duration: 450, onComplete: () => bubble.destroy() }); }
    }
    if (d?.added.length && ['ramen', 'missoshiru', 'donburi', 'gyoza', 'yakisoba', 'tempura', 'karaage'].includes(d.recipeId) && this.clock % 500 < dt) { const steam = this.scene.add.ellipse(535 + Math.random() * 66, 275, 6, 15, 0xfff7dc, .55); this.work.add(steam); this.scene.tweens.add({ targets: steam, y: 210, x: steam.x + 12, alpha: 0, scaleX: 3, duration: 1800, onComplete: () => steam.destroy() }); }
  }
}
