import type Phaser from 'phaser';
import { customers, ingredients, recipes, decorCatalog, type IngredientId } from '../data/catalog';
import { customerSVG, foodSVG, ingredientSVG, decorationSVG, svgURL } from '../art/illustrations';
import { roomSVG, floorSVG } from '../art/roomArt';
import { portraitRoomSVG, portraitKitchenSVG, landscapeKitchenSVG } from '../art/mobileArt';
export function loadArt(scene: Phaser.Scene, mobile = false) {
  if (mobile) {
    for (const wall of ['wall-cream', 'wall-sage', 'wall-sakura']) scene.load.svg('portrait-' + wall, svgURL(portraitRoomSVG(wall)), { width: 960, height: 1350 });
    scene.load.svg('portrait-kitchen', svgURL(portraitKitchenSVG()), { width: 960, height: 1500 });
    scene.load.svg('landscape-kitchen', svgURL(landscapeKitchenSVG()), { width: 1680, height: 900 });
  }
  {
    scene.load.svg('restaurant', svgURL(roomSVG('wall-cream')), { width: 1120, height: 730 });
    for (const wall of ['wall-sage', 'wall-sakura']) scene.load.svg(wall, svgURL(roomSVG(wall)), { width: 1120, height: 730 });
  }
  for (const floor of ['floor-tatami', 'floor-tile']) scene.load.svg(floor, svgURL(floorSVG(floor)), { width: 1120, height: 305 });
  for (const c of customers) { scene.load.svg(c.id, svgURL(customerSVG(c)), { width: 320, height: 460 }); scene.load.svg(c.id + '-blink', svgURL(customerSVG(c, true)), { width: 320, height: 460 }); }
  for (const id of Object.keys(recipes)) scene.load.svg('food-' + id, svgURL(foodSVG(id as keyof typeof recipes, 400)));
  for (const id of Object.keys(ingredients)) scene.load.svg('ingredient-' + id, svgURL(ingredientSVG(id as IngredientId)), { width: 200, height: 170 });
  for (const d of decorCatalog) scene.load.svg('decor-' + d.id, svgURL(decorationSVG(d.id)), { width: 240, height: 270 });
}
