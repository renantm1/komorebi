import {describe,it,expect} from 'vitest';
import {KitchenGame} from '../../src/systems/game';
import {SaveStore,validateState} from '../../src/systems/save';
import {newState} from '../../src/systems/state';
import {tutorialActive,tutorialLesson} from '../../src/systems/tutorial';
import {recipes,recipeIds} from '../../src/data/recipes';
const game=()=>new KitchenGame(new SaveStore({getItem:()=>null,setItem:()=>{},removeItem:()=>{}}));
describe('tutorial que acompanha a partida',()=>{
 it('ativa no primeiro dia dos salvamentos novos e antigos, sem forçar dias posteriores',()=>{const s=newState();expect(tutorialActive(s)).toBe(true);s.day=3;expect(tutorialActive(s)).toBe(false);s.tutorial='active';expect(tutorialActive(s)).toBe(true);});
 it('segue abertura, aceite, cozinha, escolha, preparo e entrega sem avançar sozinho',()=>{
  const g=game();expect(tutorialLesson(g.state,g.view).action).toBe('open');g.open();expect(tutorialLesson(g.state,g.view).action).toBe('accept-order');g.acceptOrder();expect(tutorialLesson(g.state,g.view).action).toBe('prepare');g.beginDish();expect(tutorialLesson(g.state,g.view).action).toBe('cook-onigiri');g.beginDish('onigiri');expect(tutorialLesson(g.state,g.view).ingredient).toBe('rice');expect(g.state.dish?.step).toBe(0);g.ingredient('rice');expect(tutorialLesson(g.state,g.view)).toMatchObject({gesture:'shape',hold:true});g.gesture(1);g.ingredient('nori');expect(tutorialLesson(g.state,g.view).action).toBe('serve');g.serve();expect(tutorialLesson(g.state,g.view).action).toBe('next-customer');
 });
 it('retoma cada gesto das doze receitas e acompanha as três marcas, sem pular ações',()=>{
  for(const id of recipeIds){const g=game();g.state.menu=[id];g.open();g.acceptOrder();g.beginDish(id);
   for(const st of recipes[id].steps){const l=tutorialLesson(g.state,g.view);if(st.type==='ingredient'){expect(l.ingredient).toBe(st.ingredient);g.ingredient(st.ingredient);}else{expect(l.gesture).toBe(st.type);const n=st.count??1;for(let i=0;i<n;i++){const before=tutorialLesson(g.state,g.view).key;g.gesture(1);expect(tutorialLesson(g.state,g.view).key).not.toBe(before);}}}
   expect(tutorialLesson(g.state,g.view).action).toBe('serve');
  }
 });
 it('pede confirmação pelo fluxo normal se a receita iniciada for diferente do pedido',()=>{const g=game();g.open();g.acceptOrder();g.beginDish('ramen');g.ingredient('broth');expect(tutorialLesson(g.state,g.view).action).toBe('cook-onigiri');expect(g.state.dish?.recipeId).toBe('ramen');});
 it('só oferece fechar depois dos quatro atendimentos e encerra ao virar o dia',()=>{const g=game();g.open();g.state.orders=[];g.state.stats.served=4;expect(tutorialLesson(g.state,g.view).action).toBe('close-day');g.finishDay();expect(tutorialLesson(g.state,g.view).action).toBe('tutorial-complete');g.nextDay();expect(tutorialActive(g.state)).toBe(false);});
 it('guarda a opção de pular e aceita progresso antigo sem perder o preparo',()=>{const g=game();g.open();g.acceptOrder();g.beginDish('onigiri');g.ingredient('rice');g.state.tutorial='dismissed';const s=validateState(JSON.parse(JSON.stringify(g.state)))!;expect(s.dish?.step).toBe(1);expect(tutorialActive(s)).toBe(false);delete s.tutorial;expect(tutorialActive(validateState(s)!)).toBe(true);});
});
