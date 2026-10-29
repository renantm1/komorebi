import { describe, expect, it } from 'vitest';
import { gameDisplay, graphicsMode } from '../../src/systems/display';
describe('memória da tela',()=>{
 it('usa os pixels físicos do celular em vez de multiplicar o tamanho da arte',()=>{
  const v=gameDisplay(594,282,2,true)!;expect(v.width).toBe(1120);expect(v.pixelsWide).toBe(1188);expect(v.pixelsHigh).toBe(564);
 });
 it('limita a memória mesmo em telas de alta densidade e no menu vertical',()=>{
  for(const [w,h] of [[390,844],[844,390],[1366,1024],[3000,4000],[200,4000]])for(const dpr of [1,2,3,4]){
   const v=gameDisplay(w,h,dpr,true)!;expect(v.pixelsWide*v.pixelsHigh).toBeLessThanOrEqual(1_600_000);expect(v.pixelsWide).toBeLessThanOrEqual(w*2);expect(Math.max(v.pixelsWide,v.pixelsHigh)).toBeLessThanOrEqual(2048);
  }
 });
 it('reduz a resolução no modo leve sem alterar as coordenadas dos pratos',()=>{
  const a=gameDisplay(594,282,3,true)!,b=gameDisplay(594,282,3,true,true)!;expect([b.width,b.height]).toEqual([a.width,a.height]);expect(b.pixelsWide).toBe(594);expect(b.pixelsWide*b.pixelsHigh).toBeLessThanOrEqual(900_000);
 });
 it('ignora medidas temporariamente vazias ou inválidas durante a rotação',()=>{
  for(const pair of [[0,390],[844,0],[-1,100],[NaN,100],[100,Infinity]])expect(gameDisplay(pair[0],pair[1],2,true)).toBeNull();
 });
 it('prioriza modo leve no iPhone e permite escolher a qualidade automática',()=>{expect(graphicsMode({getItem:()=>null},true)).toBe('light');expect(graphicsMode({getItem:()=> 'auto'},true)).toBe('auto');});
 it('uma preferência inválida ou armazenamento indisponível mantém a qualidade automática',()=>{
  expect(graphicsMode({getItem:()=>null})).toBe('auto');expect(graphicsMode({getItem:()=>{throw Error();}})).toBe('auto');expect(graphicsMode({getItem:()=> 'light'})).toBe('light');
 });
});
