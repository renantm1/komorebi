import Phaser from 'phaser';
import { decorById } from '../data/decorations';
import { KitchenGame } from '../systems/game';
import { placement, visibleDecor } from '../systems/interior';
import { audio } from '../systems/audio';
export class RoomDecor {
  private layer: Phaser.GameObjects.Container;
  private floor: Phaser.GameObjects.Image;
  private grid: Phaser.GameObjects.Graphics;
  private outline: Phaser.GameObjects.Graphics;
  private ghost: Phaser.GameObjects.Image;
  private objects = new Map<string, { group: Phaser.GameObjects.Container; image: Phaser.GameObjects.Image }>();
  constructor(private scene: Phaser.Scene, private model: KitchenGame, room: Phaser.GameObjects.Container, private back: Phaser.GameObjects.Image, private front: Phaser.GameObjects.Image, private door: Phaser.GameObjects.Image) {
    this.floor = scene.add.image(560, 577.5, 'floor-tatami').setVisible(false); room.add(this.floor);
    const mask = scene.make.graphics({ x: 0, y: 0 }); mask.fillStyle(0xffffff); mask.fillRect(0, 425, 282, 305); mask.fillRect(282, 654, 838, 76); this.floor.setMask(mask.createGeometryMask());
    this.grid = scene.add.graphics(); room.add(this.grid);
    this.layer = scene.add.container(0, 0); room.add(this.layer);
    this.outline = scene.add.graphics(); room.add(this.outline);
    this.ghost = scene.add.image(190, 520, 'decor-plant').setAlpha(.45).setVisible(false); room.add(this.ghost);
    scene.input.on('pointermove', (p: Phaser.Input.Pointer) => { const id = model.placing; if (model.view !== 'decorate' || !id) return; const point = placement(model.state, id, p.x, p.y); if (point) this.ghost.setPosition(point.x, point.y); });
  }
  sync() {
    const s = this.model.state, editing = this.model.view === 'decorate';
    const texture = s.interior.wall === 'wall-cream' ? 'restaurant' : s.interior.wall;
    this.back.setTexture(texture); this.front.setTexture(texture); this.door.setTexture(texture);
    this.floor.setVisible(s.interior.floor !== 'floor-cedar'); if (s.interior.floor !== 'floor-cedar') this.floor.setTexture(s.interior.floor);
    this.grid.clear();
    if (editing && s.interior.grid) for (let y = 440; y < 711; y += 20) for (let x = 60; x < 1040; x += 20) if (x < 280 || y > 654) { this.grid.fillStyle(0xfff6d9, .65); this.grid.fillCircle(x, y, 1.4); }
    const desired = visibleDecor(s), ids = new Set(desired.map(d => d.id));
    for (const [id, obj] of this.objects) if (!ids.has(id)) { this.dispose(obj.group); this.objects.delete(id); }
    for (const d of desired) {
      let object = this.objects.get(d.id); const spec = decorById(d.id)!;
      if (!object) {
        const group = this.scene.add.container(d.x, d.y), image = this.scene.add.image(0, 0, 'decor-' + d.id).setDisplaySize(spec.width ?? 100, spec.height ?? 112).setInteractive({ useHandCursor: true });
        image.setData('decoration', d.id); group.add(image); this.layer.add(group); this.scene.input.setDraggable(image); object = { group, image }; this.objects.set(d.id, object);
        image.on('pointerdown', () => { if (this.model.view === 'decorate' && !this.model.paused) this.model.selectDecor(d.id); else if (spec.type === 'windchime') audio.effect('bell'); });
        image.on('drag', (p: Phaser.Input.Pointer) => { if (this.model.view !== 'decorate' || this.model.paused) return; const point = placement(this.model.state, d.id, p.x, p.y); if (point) { group.setPosition(point.x, point.y); this.drawOutline(); } });
        image.on('dragend', () => { if (this.model.view === 'decorate') this.model.placeDecor(d.id, group.x, group.y); });
        if (spec.type === 'aquarium') this.fish(group);
        if (['windchime', 'lantern'].includes(spec.type)) this.scene.tweens.add({ targets: image, angle: 2.5, duration: 2200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      }
      object.group.setPosition(d.x, d.y); object.image.setFlipX(!!d.flipped);
    }
    this.layer.sort('y');
    // Rugs stay under furniture regardless of the order in which items were purchased.
    for (const d of desired) if (decorById(d.id)?.type === 'rug') this.layer.sendToBack(this.objects.get(d.id)!.group);
    this.drawOutline();
    const id = this.model.placing, spec = id ? decorById(id) : null;
    this.ghost.setVisible(editing && !!spec); if (spec) this.ghost.setTexture('decor-' + id).setDisplaySize(spec.width ?? 100, spec.height ?? 112);
  }
  private drawOutline() {
    this.outline.clear(); if (this.model.view !== 'decorate') return;
    const object = this.objects.get(this.model.selectedDecoration ?? ''); if (!object) return;
    const bounds = object.image.getBounds(); this.outline.lineStyle(2, 0xf9ebbc, .95); this.outline.strokeRoundedRect(bounds.x - 5, bounds.y - 5, bounds.width + 10, bounds.height + 10, 7);
  }
  private fish(group: Phaser.GameObjects.Container) {
    for (let i = 0; i < 2; i++) {
      const fish = this.scene.add.container(i ? 27 : -27, i ? 16 : -5), color = i ? 0xdec781 : 0xe7a17b;
      fish.add(this.scene.add.ellipse(0, 0, 19, 10, color)); fish.add(this.scene.add.triangle(-11, 0, 0, 0, 0, 11, 10, 5, color).setOrigin(.5)); fish.add(this.scene.add.circle(5, -1, 1, 0x687f62)); group.add(fish);
      this.scene.tweens.add({ targets: fish, x: i ? -36 : 38, y: i ? 5 : 12, duration: 3700 + i * 1100, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', onYoyo: () => fish.setScale(-1, 1), onRepeat: () => fish.setScale(1, 1) });
      const bubble = this.scene.add.circle(38 - i * 20, 25, 2, 0xe7edd4, .75); group.add(bubble); this.scene.tweens.add({ targets: bubble, y: -26, alpha: .1, duration: 2200 + i * 900, repeat: -1 });
    }
  }
  private dispose(group: Phaser.GameObjects.Container) { for (const child of group.list) { this.scene.tweens.killTweensOf(child); if (child instanceof Phaser.GameObjects.Container) for (const inner of child.list) this.scene.tweens.killTweensOf(inner); } group.destroy(); }
}
