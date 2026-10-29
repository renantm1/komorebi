import Phaser from 'phaser';
import { customers, weather } from '../data/catalog';
import { KitchenGame } from '../systems/game';
import { audio } from '../systems/audio';
import { KitchenStation } from './KitchenStation';
import {RoomDecor} from './RoomDecor';
import { loadArt } from './loadArt';
import { MobileScene } from './MobileScene';
import { gameDisplay, graphicsMode, type GameDisplay } from '../systems/display';
export class WorldScene extends Phaser.Scene {
  private room!: Phaser.GameObjects.Container;
  private station!: KitchenStation;
  private interior!: RoomDecor;
  private actors = new Map<number, Phaser.GameObjects.Container>();
  private weatherDrops: Phaser.GameObjects.Ellipse[] = [];
  private night!: Phaser.GameObjects.Rectangle;
  private door!: Phaser.GameObjects.Image;
  private openSign!: Phaser.GameObjects.Container;
  private festival!: Phaser.GameObjects.Container;
  private clock = 0; private lastView = ''; private lastDecor = '';
  constructor(private model: KitchenGame) { super('World'); }
  preload() { loadArt(this); }
  create() {
    const resize = () => this.cameras.main.setOrigin(0, 0).setZoom((this.registry.get('display') as GameDisplay).density);
    resize(); this.scale.on('resize', resize); const cleanupResize=()=>this.scale.off('resize',resize);this.events.once('shutdown',cleanupResize);this.events.once('destroy',cleanupResize);
    const room = this.room = this.add.container(0, 0); const backdrop=this.add.image(560,365,'restaurant');room.add(backdrop);
    const doorInterior = this.add.rectangle(594, 284, 251, 216, 0x746e53); room.add(doorInterior);
    this.door = this.add.image(560, 365, 'restaurant').setCrop(468, 174, 251, 216); room.add(this.door);
    const doorMask = this.make.graphics({ x: 0, y: 0 }); doorMask.fillStyle(0xffffff); doorMask.fillRect(468, 174, 251, 216); this.door.setMask(doorMask.createGeometryMask());
    const windowMask = this.make.graphics({ x: 0, y: 0 }); windowMask.fillStyle(0xffffff); windowMask.fillRect(52, 114, 330, 275); const mask = windowMask.createGeometryMask();
    for (let i = 0; i < 48; i++) { const d = this.add.ellipse(55 + i * 37 % 328, 115 + i * 43 % 270, 1.2, 12, 0xf5f9e9, .5).setRotation(.15).setMask(mask); room.add(d); this.weatherDrops.push(d); }
    for (const [x, y, scale] of [[480, 90, .8], [1015, 96, .93]]) {
      const glow = this.add.ellipse(x, y + 10, 175 * scale, 180 * scale, 0xffe6a1, .1); room.add(glow);
      this.tweens.add({ targets: glow, alpha: .2, scaleX: 1.2, scaleY: 1.15, duration: 2500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      const lamp = this.add.image(x, y, 'decor-lantern').setDisplaySize(160 * scale, 180 * scale).setInteractive({ useHandCursor: true }); room.add(lamp);
      this.tweens.add({ targets: lamp, angle: 2.3, duration: 3200 + x, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      lamp.on('pointerdown', () => { audio.effect('bell'); this.tweens.add({ targets: lamp, angle: -9, duration: 250, yoyo: true, ease: 'Sine.easeInOut' }); });
    }
    const sunshine = this.add.graphics(); sunshine.fillStyle(0xffecc1, .065); sunshine.fillPoints([{ x: 50, y: 125 }, { x: 370, y: 125 }, { x: 650, y: 640 }, { x: 70, y: 640 }], true); room.add(sunshine); this.tweens.add({ targets: sunshine, alpha: .3, duration: 6000, yoyo: true, repeat: -1 });
    const foreground=this.add.image(560,365,'restaurant').setCrop(0,447,1120,283);room.add(foreground);
    this.interior=new RoomDecor(this,this.model,room,backdrop,foreground,this.door);
    this.night = this.add.rectangle(560, 365, 1120, 730, 0x353b48, 0); room.add(this.night);
    this.festival = this.add.container(0, 0); room.add(this.festival);
    const wire = this.add.graphics(); wire.lineStyle(2, 0x786548); wire.beginPath(); wire.moveTo(20, 170); wire.lineTo(300, 200); wire.lineTo(600, 175); wire.lineTo(880, 202); wire.lineTo(1100, 174); wire.strokePath(); this.festival.add(wire);
    for (let i = 0; i < 11; i++) { const lamp = this.add.ellipse(50 + i * 100, 193 + Math.sin(i) * 10, 22, 32, i % 2 ? 0xeab880 : 0xffe1a4); this.festival.add(lamp); this.tweens.add({ targets: lamp, alpha: .65, y: lamp.y + 3, duration: 1300 + i * 127, yoyo: true, repeat: -1 }); }
    this.openSign = this.add.container(670, 357); const sign = this.add.rectangle(0, 0, 79, 37, 0x586d48).setStrokeStyle(2, 0xcbb281).setInteractive({ useHandCursor: true }); this.openSign.add(sign); this.openSign.add(this.add.text(0, 0, 'ABRIR', { fontFamily: 'Georgia', fontSize: '16px', color: '#fff0c9' }).setOrigin(.5)); room.add(this.openSign); sign.on('pointerdown', () => { if (!this.model.paused) this.model.open(); });
    this.station = new KitchenStation(this, this.model);
    this.time.addEvent({ delay: 3500, loop: true, callback: () => { for (const [id, actor] of this.actors) { const sprite = actor.getByName('person') as Phaser.GameObjects.Image, o = this.model.state.orders.find(o => o.id === id); if (!sprite || !o) continue; sprite.setTexture(o.customerId + '-blink'); this.time.delayedCall(170, () => { if (sprite.active) sprite.setTexture(o.customerId); }); } } });
    this.time.addEvent({ delay: 900, loop: true, callback: () => { if (this.model.view === 'kitchen') return; const table=this.model.state.interior.furniture.find(d=>d.id==='table-round'&&!d.hidden);if(!table)return;const steam = this.add.ellipse(table.x-15 + Math.random() * 10, table.y-45, 3, 11, 0xfff4d7, .5); room.add(steam); this.tweens.add({ targets: steam, y: 451, x: steam.x + 8, alpha: 0, scaleX: 3, duration: 2300, onComplete: () => steam.destroy() }); } });
    this.input.on('pointerdown', (p: Phaser.Input.Pointer,objects:Phaser.GameObjects.GameObject[]) => { if(objects.some(o=>o.getData('decoration')))return; if (!this.model.paused && this.model.view === 'decorate' && this.model.placing && p.worldY > 120 && p.worldY < 640) { this.model.placeDecor(this.model.placing, p.worldX, p.worldY); audio.effect('drop'); } });
    const sync = () => this.sync(), served = (e: Event) => this.celebrate((e as CustomEvent).detail.total);
    this.model.addEventListener('change', sync); this.model.addEventListener('served', served);
    const cleanup=()=>{this.model.removeEventListener('change',sync);this.model.removeEventListener('served',served);};this.events.once('shutdown',cleanup);this.events.once('destroy',cleanup);this.sync();
  }
  private sync() {
    const m = this.model, s = m.state; this.room.setVisible(m.view !== 'kitchen'); this.station.sync();this.interior.sync();
    if (this.lastView !== m.view) { this.cameras.main.fadeIn(300, 244, 237, 221); this.lastView = m.view; }
    this.night.setAlpha(s.phase === 'night' ? .22 : 0); this.openSign.setVisible(s.phase === 'morning' && !m.paused); this.festival.setVisible(s.day % 10 === 0);
    const active = new Set(s.orders.map(o => o.id));
    for (const [id, actor] of this.actors) if (!active.has(id)) { this.tweens.killTweensOf(actor); this.tweens.add({ targets: actor, x: 1210, alpha: 0, duration: 1100, ease: 'Sine.easeIn', onComplete: () => actor.destroy() }); this.actors.delete(id); }
    s.orders.forEach((o, i) => {
      const existing = this.actors.get(o.id);
      if (existing) { const hello = existing.getByName('hello') as Phaser.GameObjects.Text; hello.setText(o.accepted ? 'obrigada!' : 'olá, chef!'); if (existing.getData('slot') !== i) { existing.setData('slot', i); this.tweens.add({ targets: existing, x: 575 + i * 135, duration: 650, ease: 'Sine.easeInOut' }); } return; }
      const actor = this.add.container(1220, 385).setData('slot', i); actor.add(this.add.image(0, 0, o.customerId).setDisplaySize(152, 219).setName('person'));
      const bubble = this.add.graphics(); bubble.fillStyle(0xfff8df); bubble.fillRoundedRect(-77, -194, 154, 68, 17); bubble.fillTriangle(-15, -127, 0, -111, 14, -127); actor.add(bubble); actor.add(this.add.image(-38, -161, 'food-' + o.recipeId).setDisplaySize(55, 55)); const c = customers.find(c => c.id === o.customerId)!;
      actor.add(this.add.text(23, -169, c.name, { fontFamily: 'Georgia', fontSize: '16px', color: '#586a49' }).setOrigin(.5)); actor.add(this.add.text(23, -149, 'olá, chef!', { fontFamily: 'sans-serif', fontSize: '10px', color: '#98865f' }).setOrigin(.5).setName('hello'));
      this.room.addAt(actor, 3); this.actors.set(o.id, actor);
      this.tweens.add({ targets: actor, x: 575 + i * 135, duration: 1450, ease: 'Sine.easeOut' }); this.tweens.add({ targets: actor, y: 389, duration: 950 + i * 70, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.tweens.killTweensOf(this.door); this.tweens.add({ targets: this.door, x: 474, duration: 500, yoyo: true, hold: 1000, ease: 'Sine.easeInOut' }); audio.effect('bell');
    });
  }

  private celebrate(amount: number) {
    const label = this.add.text(630, 345, `+ ¥ ${amount}`, { fontFamily: 'Georgia', fontSize: '32px', color: '#fff1ba', stroke: '#738756', strokeThickness: 5 }).setOrigin(.5); this.room.add(label); this.tweens.add({ targets: label, y: 240, alpha: 0, duration: 2500, ease: 'Sine.easeOut', onComplete: () => label.destroy() });
    for (let i = 0; i < 14; i++) { const spark = this.add.star(630, 345, 4, 2, 7, 0xffe1a0); this.room.add(spark); this.tweens.add({ targets: spark, x: 630 + Math.cos(i) * 115, y: 320 + Math.sin(i) * 72, alpha: 0, angle: 120, duration: 1300, onComplete: () => spark.destroy() }); }
  }
  update(_time: number, dt: number) {
    this.clock += dt; this.model.tick(Math.min(dt, 100)); this.station.update(dt);
    const kind = weather[(this.model.state.day - 1) % weather.length].kind;
    for (const [i, d] of this.weatherDrops.entries()) {
      d.setVisible(['rain', 'sakura', 'snow'].includes(kind)); d.setFillStyle(kind === 'rain' ? 0xf4f8e7 : kind === 'snow' ? 0xffffff : 0xe6b1a5, kind === 'rain' ? .45 : .8);
      d.setSize(kind === 'rain' ? 1.4 : kind === 'snow' ? 3 : 7, kind === 'rain' ? 14 : 4); d.y += dt * (kind === 'rain' ? .12 + i % 3 * .02 : .026); if (kind !== 'rain') d.x += Math.sin(this.clock / 1200 + i) * .15;
      if (d.y > 390) d.setPosition(55 + i * 37 % 325, 112);
    }
  }
}
export function createWorld(parent: string, model: KitchenGame, mobile = false) {
  const host = document.getElementById(parent)!;
  const light = graphicsMode() === 'light';
  const measure = () => gameDisplay(host.clientWidth, host.clientHeight, window.devicePixelRatio || 1, mobile, light);
  const first = measure() ?? gameDisplay(640, 480, 1, mobile, light)!;
  const game = new Phaser.Game({ type: light ? Phaser.CANVAS : Phaser.AUTO, parent, width: first.pixelsWide, height: first.pixelsHigh, backgroundColor: '#e6d6b8', antialias: true,
    callbacks: { preBoot: g => g.registry.set('display', first) },
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: [mobile ? new MobileScene(model) : new WorldScene(model)], render: { roundPixels: false }, fps: { target: mobile || light ? 30 : 60, limit: mobile || light ? 30 : 60 }, audio: { noAudio: true } });
  let frame = 0;
  const resize = () => {
    frame = 0; if (!game.isBooted) return;
    const next = measure(); if (!next) return;
    const current = game.registry.get('display') as GameDisplay;
    const unchanged = next.pixelsWide === current.pixelsWide && next.pixelsHigh === current.pixelsHigh && next.width === current.width;
    if (unchanged && game.scale.parentSize.width === host.clientWidth && game.scale.parentSize.height === host.clientHeight) return;
    game.registry.set('display', next);
    game.scale.parentSize.setSize(host.clientWidth, host.clientHeight);
    if (unchanged) game.scale.refresh(); else game.scale.setGameSize(next.pixelsWide, next.pixelsHigh);
  };
  const observer = new ResizeObserver(() => { if (!frame) frame = requestAnimationFrame(resize); });
  observer.observe(host);
  const lost = () => { if (model.hasSave) model.saves.save(model.state); model.paused = true; window.dispatchEvent(new Event('komorebi-graphics-lost')); };
  game.events.once('ready', () => { game.canvas.addEventListener('webglcontextlost', lost); resize(); });
  game.events.once('destroy', () => { observer.disconnect(); cancelAnimationFrame(frame); game.canvas?.removeEventListener('webglcontextlost', lost); });
  if (import.meta.env.DEV) Object.assign(window, { komorebiEngine: game });
  return game;
}
