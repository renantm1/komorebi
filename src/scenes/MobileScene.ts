import Phaser from 'phaser';
import { KitchenGame } from '../systems/game';
import { weather, customers } from '../data/catalog';
import { decorById } from '../data/decorations';
import { visibleDecor, placement } from '../systems/interior';
import { audio } from '../systems/audio';
import { KitchenStation } from './KitchenStation';
import { loadArt } from './loadArt';

/** Mobile compositions shares the game's recipes, saves and economy with desktop. */
export class MobileScene extends Phaser.Scene {
  private room!: Phaser.GameObjects.Container;
  private back!: Phaser.GameObjects.Image;
  private front!: Phaser.GameObjects.Image;
  private floor!: Phaser.GameObjects.Image;
  private frontMask!: Phaser.GameObjects.Graphics;
  private floorMask!: Phaser.GameObjects.Graphics;
  private station!: KitchenStation;
  private people!: Phaser.GameObjects.Container;
  private furnishings!: Phaser.GameObjects.Container;
  private outline!: Phaser.GameObjects.Graphics;
  private ghost!: Phaser.GameObjects.Image;
  private night!: Phaser.GameObjects.Rectangle;
  private lamps: Phaser.GameObjects.Image[] = [];
  private drops: Phaser.GameObjects.Ellipse[] = [];
  private actors = new Map<number, Phaser.GameObjects.Container>();
  private objects = new Map<string, Phaser.GameObjects.Container>();
  private width = 640;
  private height = 900;
  private get wide() { return this.width > 800; }
  private lastView = '';
  private clock = 0;
  constructor(private model: KitchenGame, private density: number) { super('Mobile'); }
  preload() { loadArt(this, true); }
  create() {
    this.cameras.main.setOrigin(0, 0).setZoom(this.density);
    this.input.dragDistanceThreshold = 12;
    this.room = this.add.container(0, 0);
    this.back = this.add.image(320, 450, 'portrait-wall-cream'); this.room.add(this.back);
    this.people = this.add.container(0, 0); this.room.add(this.people);
    this.front = this.add.image(320, 450, 'portrait-wall-cream'); this.room.add(this.front);
    this.frontMask = this.make.graphics({ x: 0, y: 0 }); this.front.setMask(this.frontMask.createGeometryMask());
    this.floor = this.add.image(320, 750, 'floor-tatami'); this.room.add(this.floor);
    this.floorMask = this.make.graphics({ x: 0, y: 0 }); this.floor.setMask(this.floorMask.createGeometryMask());
    this.furnishings = this.add.container(0, 0); this.room.add(this.furnishings);
    this.outline = this.add.graphics(); this.room.add(this.outline);
    this.ghost = this.add.image(130, 500, 'decor-plant').setAlpha(.55).setVisible(false); this.room.add(this.ghost);
    for (const x of [48, 594]) {
      const glow = this.add.ellipse(x, 115, 190, 220, 0xffe4a2, .12); this.room.add(glow);
      this.tweens.add({ targets: glow, alpha: .24, duration: 2600, yoyo: true, repeat: -1 });
      const lamp = this.add.image(x, 113, 'decor-lantern').setDisplaySize(110, 124); this.room.add(lamp); this.lamps.push(lamp);
      this.tweens.add({ targets: lamp, angle: x < 100 ? 3 : -3, duration: 3800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
    for (let i = 0; i < 24; i++) { const drop = this.add.ellipse(6 + i * 19 % 180, 140 + i * 23 % 245, 2, 13, 0xffffff, .45); this.room.add(drop); this.drops.push(drop); }
    this.night = this.add.rectangle(320, 450, 640, 900, 0x35434c, 0); this.room.add(this.night);
    this.station = new KitchenStation(this, this.model, true);
    this.input.on('pointerdown', (p: Phaser.Input.Pointer, objects: Phaser.GameObjects.GameObject[]) => {
      if (this.model.paused || this.model.view !== 'decorate' || !this.model.placing || objects.some(o => o.getData('decoration'))) return;
      const q = this.toRoom(p.worldX, p.worldY); this.model.placeDecor(this.model.placing, q.x, q.y);
    });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (!this.model.placing) return; const q = this.toRoom(p.worldX, p.worldY), pos = placement(this.model.state, this.model.placing, q.x, q.y);
      if (pos) this.ghost.setPosition(this.toX(pos.x), this.toY(pos.y));
    });
    this.time.addEvent({ delay: 3300, loop: true, callback: () => { for (const [id, actor] of this.actors) { const o = this.model.state.orders.find(o => o.id === id), person = actor.getByName('person') as Phaser.GameObjects.Image; if (!o) continue; person.setTexture(o.customerId + '-blink'); this.time.delayedCall(150, () => { if (person.active) person.setTexture(o.customerId); }); } } });
    const sync = () => this.sync(), served = (event: Event) => {
      const text = this.add.text(this.width / 2, this.height * .46, `+ ¥ ${(event as CustomEvent).detail.total}`, { fontFamily: 'Georgia', fontSize: '38px', color: '#fff3cb', stroke: '#5d7656', strokeThickness: 6 }).setOrigin(.5); this.room.add(text);
      this.tweens.add({ targets: text, y: text.y - 110, alpha: 0, duration: 2000, onComplete: () => text.destroy() });
      for (let i = 0; i < 12; i++) { const star = this.add.star(this.width / 2, this.height * .48, 4, 3, 9, 0xffdf97); this.room.add(star); this.tweens.add({ targets: star, x: this.width / 2 + Math.cos(i) * 180, y: star.y + Math.sin(i) * 100, alpha: 0, angle: 90, duration: 1300, onComplete: () => star.destroy() }); }
    };
    this.model.addEventListener('change', sync); this.model.addEventListener('served', served);
    this.scale.on('resize', this.layout, this);
    this.events.once('shutdown', () => { this.model.removeEventListener('change', sync); this.model.removeEventListener('served', served); this.scale.off('resize', this.layout, this); });
    this.layout();
  }
  private toX(x: number) { return this.wide ? x : -90 + x * 820 / 1120; }
  private toY(y: number) { return this.wide ? y * this.height / 730 : (60 + y * 650 / 730) * this.height / 900; }
  private toRoom(x: number, y: number) { return this.wide ? { x, y: y * 730 / this.height } : { x: (x + 90) * 1120 / 820, y: (y * 900 / this.height - 60) * 730 / 650 }; }
  private layout() {
    this.width = this.scale.width / this.density; this.height = this.scale.height / this.density;
    const h = this.height, w = this.width;
    this.back.setPosition(w / 2, h / 2).setDisplaySize(w, h); this.front.setPosition(w / 2, h / 2).setDisplaySize(w, h);
    const counter = this.wide ? 447 / 730 : .509;
    this.frontMask.clear().fillStyle(0xffffff).fillRect(0, h * counter, w, h * (1 - counter));
    this.floor.setPosition(w / 2, h * (this.wide ? 577.5 / 730 : .79)).setDisplaySize(w, h * (this.wide ? 305 / 730 : .42));
    this.floorMask.clear().fillStyle(0xffffff);
    if(this.wide) this.floorMask.fillRect(0,h*425/730,282,h*305/730).fillRect(282,h*654/730,838,h*76/730);
    else this.floorMask.fillRect(0, h * .49, 110, h * .3).fillRect(0, h * .79, 640, h * .21);
    this.lamps.forEach((lamp,i)=>lamp.setPosition(i ? w-55 : 48,h*.13));
    this.night.setPosition(w / 2, h / 2).setSize(w, h);
    this.station.layout(h, w); this.sync();
  }
  private sync() {
    const m = this.model, s = m.state;
    this.room.setVisible(m.view !== 'kitchen'); this.station.sync();
    const texture = this.wide ? (s.interior.wall === 'wall-cream' ? 'restaurant' : s.interior.wall) : 'portrait-' + s.interior.wall;
    this.back.setTexture(texture); this.front.setTexture(texture);
    this.floor.setVisible(s.interior.floor !== 'floor-cedar'); if (s.interior.floor !== 'floor-cedar') this.floor.setTexture(s.interior.floor);
    this.night.setAlpha(s.phase === 'night' ? .24 : 0);
    if (m.view !== this.lastView) { this.cameras.main.fadeIn(240, 239, 227, 201); this.lastView = m.view; this.station.cancelTouch(); }
    const active = new Set(s.orders.map(o => o.id));
    for (const [id, actor] of this.actors) if (!active.has(id)) { this.tweens.killTweensOf(actor); this.tweens.add({ targets: actor, x: 770, alpha: 0, duration: 700, onComplete: () => actor.destroy() }); this.actors.delete(id); }
    s.orders.forEach((o, i) => {
      let actor = this.actors.get(o.id); const x = (this.wide ? 600 : 338) + i * 145, y = this.height * (this.wide ? .52 : .449);
      if (!actor) {
        actor = this.add.container(this.width + 180, y); const person = this.add.image(0, 0, o.customerId).setDisplaySize(204, 293).setName('person'); actor.add(person);
        const bubble = this.add.graphics().fillStyle(0xfff6df).fillRoundedRect(-84, -217, 168, 65, 22).fillTriangle(-13, -153, 2, -136, 15, -153); actor.add(bubble);
        actor.add(this.add.image(-43, -185, 'food-' + o.recipeId).setDisplaySize(61, 61));
        actor.add(this.add.text(27, -185, customers.find(c => c.id === o.customerId)!.name, { fontFamily: 'Georgia', fontSize: '21px', color: '#5b6c4d' }).setOrigin(.5));
        this.people.add(actor); this.actors.set(o.id, actor); this.tweens.add({ targets: actor, x, duration: 950, ease: 'Back.easeOut' });
        this.tweens.add({ targets: person, y: 4, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' }); audio.effect('bell');
      } else { actor.y = y; if (!this.tweens.isTweening(actor)) actor.x = x; }
    });
    const desired = visibleDecor(s), ids = new Set(desired.map(d => d.id));
    for (const [id, group] of this.objects) if (!ids.has(id)) { this.kill(group); this.objects.delete(id); }
    for (const d of desired) {
      const spec = decorById(d.id)!; let group = this.objects.get(d.id);
      if (!group) {
        group = this.add.container(0, 0); const obj = group;
        const image = this.add.image(0, 0, 'decor-' + d.id).setDisplaySize((spec.width ?? 100) * .76, (spec.height ?? 112) * .86).setName('item').setInteractive({ useHandCursor: true }).setData('decoration', d.id);
        group.add(image); this.furnishings.add(group); this.objects.set(d.id, group); this.input.setDraggable(image);
        image.on('pointerdown', () => { if (!m.paused && m.view === 'decorate') m.selectDecor(d.id); else if (spec.type === 'windchime') audio.effect('bell'); });
        image.on('drag', (p: Phaser.Input.Pointer) => { if (m.paused || m.view !== 'decorate') return; const q = this.toRoom(p.worldX, p.worldY), pos = placement(m.state, d.id, q.x, q.y); if (pos) obj.setPosition(this.toX(pos.x), this.toY(pos.y)); });
        image.on('dragend', () => { if (m.view !== 'decorate' || m.paused) return; const q = this.toRoom(obj.x, obj.y); m.placeDecor(d.id, q.x, q.y); });
        if (spec.type === 'aquarium') for (let i = 0; i < 2; i++) { const fish = this.add.ellipse(i ? 20 : -20, i ? 11 : -4, 14, 7, i ? 0xe3c67e : 0xe79e75); group.add(fish); this.tweens.add({ targets: fish, x: i ? -25 : 25, duration: 3300 + i * 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' }); }
      }
      group.setPosition(this.toX(d.x), this.toY(d.y)); (group.getByName('item') as Phaser.GameObjects.Image).setDisplaySize((spec.width ?? 100) * (this.wide ? 1 : .76), (spec.height ?? 112) * (this.wide ? 1 : .86)).setFlipX(!!d.flipped);
    }
    this.furnishings.sort('y'); for (const d of desired) if (decorById(d.id)?.type === 'rug') this.furnishings.sendToBack(this.objects.get(d.id)!);
    this.outline.clear(); const selected = this.objects.get(m.selectedDecoration ?? '');
    if (m.view === 'decorate' && selected) { const b = (selected.getByName('item') as Phaser.GameObjects.Image).getBounds(); this.outline.lineStyle(3, 0xfff2bd).strokeRoundedRect(b.x - 5, b.y - 5, b.width + 10, b.height + 10, 9); }
    if (m.view === 'decorate' && s.interior.grid) for (let y = 440; y < 711; y += 20) for (let x = 80; x < 1040; x += 20) if (x < 280 || y > 654) this.outline.fillStyle(0xfff5d2, .6).fillCircle(this.toX(x), this.toY(y), 1.8);
    this.ghost.setVisible(m.view === 'decorate' && !!m.placing); if (m.placing) { const spec = decorById(m.placing)!; this.ghost.setTexture('decor-' + m.placing).setDisplaySize((spec.width ?? 100) * (this.wide ? 1 : .76), (spec.height ?? 112) * (this.wide ? 1 : .86)); }
  }
  private kill(group: Phaser.GameObjects.Container) { for (const child of group.list) this.tweens.killTweensOf(child); group.destroy(); }
  update(_time: number, dt: number) {
    if (!this.station) return; this.clock += dt; this.model.tick(Math.min(dt, 100)); this.station.update(dt);
    const kind = weather[(this.model.state.day - 1) % weather.length].kind;
    for (const [i, drop] of this.drops.entries()) { drop.setVisible(['rain', 'sakura', 'snow'].includes(kind)); drop.setFillStyle(kind === 'sakura' ? 0xe7b6a8 : 0xffffff, .6); drop.setSize(kind === 'rain' ? 2 : 7, kind === 'rain' ? 13 : 5); drop.y += dt * (kind === 'rain' ? .15 : .03); drop.x += kind === 'rain' ? 0 : Math.sin(this.clock / 1500 + i) * .12; if (drop.y > this.height * .43) drop.setPosition(6 + i * 19 % 180, this.height * .16); }
  }
}
