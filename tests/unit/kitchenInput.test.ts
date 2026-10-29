import {describe,it,expect} from 'vitest';
import {measureGesture,COOK_WINDOW} from '../../src/systems/kitchenInput';
const motion={dx:0,dy:0,distance:0,heldMs:0};
describe('gestos da bancada',()=>{
 it('modela com movimentos verticais ou circulares, sem depender só do eixo horizontal',()=>{expect(measureGesture('shape',{...motion,dy:110,distance:110}).complete).toBe(true);expect(measureGesture('shape',{...motion,distance:99.99999999}).complete).toBe(true);expect(measureGesture('shape',{...motion,distance:30}).complete).toBe(false);});
 it('permite enrolar e dobrar dos dois lados',()=>{for(const sign of [-1,1]){expect(measureGesture('roll',{...motion,dx:160*sign}).complete).toBe(true);expect(measureGesture('fold',{...motion,dx:90*sign,dy:70*sign}).complete).toBe(true);}});
 it('saltear requer um movimento para cima',()=>{expect(measureGesture('toss',{...motion,dy:-90}).complete).toBe(true);expect(measureGesture('toss',{...motion,dy:90}).complete).toBe(false);});
 it('a qualidade perfeita coincide com a faixa verde desenhada no medidor',()=>{for(const t of [COOK_WINDOW.idealStart,2300,COOK_WINDOW.idealEnd])expect(measureGesture('cook',{...motion,heldMs:t})).toMatchObject({complete:true,quality:1});expect(measureGesture('fry',{...motion,heldMs:200}).complete).toBe(false);expect(measureGesture('cook',{...motion,heldMs:4200}).quality).toBeLessThan(1);});
});
