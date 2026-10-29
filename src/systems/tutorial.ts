import { recipes, recipeIngredients, type Gesture } from '../data/recipes';
import { ingredients, type IngredientId } from '../data/ingredients';
import { customers } from '../data/customers';
import { dayTarget, dishSteps, type State } from './state';
import type { GameView } from './game';

export type GuidePoint = { x: number; y: number };
export interface TutorialLesson {
  key: string; title: string; text: string; button: string;
  action?: string; ingredient?: IngredientId; gesture?: Gesture; hold?: boolean;
  selector?: string; from?: GuidePoint; to?: GuidePoint;
  area?: { width: number; height: number };
}
export const tutorialActive = (s: State) => (s.tutorial ?? (s.day === 1 ? 'active' : 'completed')) === 'active';

/** Follow the actual order and dish: reloading cannot skip or duplicate a step. */
export function tutorialLesson(s: State, view: GameView): TutorialLesson {
  const o = s.orders[0], d = s.dish;
  const lesson = (key: string, title: string, text: string, button: string, action: string, selector?: string): TutorialLesson => ({ key, title, text, button, action, selector });
  if (s.phase === 'morning') return lesson('open', 'Vamos abrir a casa?', 'Sou Emiko, sua avó. Vou acompanhar seu primeiro dia. Abra o restaurante para receber um vizinho. Os ingredientes são livres e você pode tentar quantas vezes quiser.', 'Abrir com o guia', 'open', '#side-panel [data-action="open"]');
  if (s.phase === 'night') return lesson('complete', 'Você cuidou da casa!', `Os ${s.stats.served} vizinhos de hoje foram atendidos. Seu progresso está guardado. Amanhã você pode continuar no seu ritmo e reabrir este guia em Como jogar.`, 'Concluir o tutorial', 'tutorial-complete', '#side-panel [data-action="next-day"]');
  if (!o) return s.stats.served >= dayTarget(s.day)
    ? lesson('close', 'Seu primeiro dia está completo.', 'Todos foram servidos. Feche por hoje para ver o resultado do dia. Os ingredientes não custaram nada.', 'Fechar o dia com o guia', 'close-day', '#side-panel [data-action="close-day"]')
    : lesson('next', 'Um prato, um novo encontro.', 'Muito bem! Receba o próximo vizinho. Vou continuar mostrando as etapas de cada pedido até o fim do dia.', 'Chamar o próximo vizinho', 'next-customer', '#side-panel [data-action="next-customer"]');
  const prefix = `${o.id}:`, name = recipes[o.recipeId].name;
  if (!o.accepted) return lesson(prefix+'accept', `Vamos ouvir ${customers.find(c => c.id === o.customerId)?.name ?? 'quem chegou'}.`, `O pedido é ${name}. Você pode conversar com seu vizinho antes de aceitar. Depois, toque em “Claro, já preparo!” ou aceite aqui no guia.`, 'Aceitar este pedido', 'accept-order', '#side-panel [data-action="accept-order"]');
  if (view !== 'kitchen') return lesson(prefix+'kitchen', 'Vista o avental.', `Vamos preparar ${name}. Entre na cozinha para encontrar a tábua e os ingredientes.`, 'Ir para a bancada', 'prepare', '#side-panel [data-action="prepare"]');
  if (!d || d.recipeId !== o.recipeId) return lesson(prefix+'recipe', `Escolha ${name}.`, d ? 'O prato escolhido é diferente do pedido. Você pode trocar a receita; se já começou, o jogo pede confirmação antes de limpar a tábua.' : 'O pedido está no papel à direita. Escolha a mesma receita na faixa acima da bancada. A receita fica destacada em verde.', 'Escolher a receita do pedido', 'cook-'+o.recipeId, `[data-action="cook-${o.recipeId}"]`);
  const key = prefix+d.recipeId+':'+d.step+':'+d.actions;
  if (d.ready) return lesson(key, 'Pronto para servir!', 'Você terminou o prato. Sirva com carinho para receber o pagamento e voltar ao salão. A receita só termina depois da entrega.', 'Entregar este prato', 'serve', '#side-panel [data-action="serve"]');
  const st = dishSteps(d, o.extra)[d.step], stage = `Etapa ${d.step+1} · `;
  if (st.type === 'ingredient') {
    const id = st.ingredient, x = 63+recipeIngredients(d.recipeId,o.extra).indexOf(id)*89;
    return {key,title:stage+'Adicione '+ingredients[id].name.toLowerCase(),text:`Clique em ${ingredients[id].name.toLowerCase()} na prateleira ou segure e arraste até a tábua. Se o arraste não responder, use o botão abaixo. A prateleira é reposta sem custo; a comida aparece no prato.`,button:'Adicionar '+ingredients[id].name.toLowerCase(),ingredient:id,from:{x,y:621},to:{x:560,y:340},area:{width:86,height:108}};
  }
  if (st.type === 'cut' || st.type === 'fold' && st.count === 3) {
    const x = st.type === 'cut' ? 460+d.actions*100 : 490+d.actions*70;
    return {key,title:stage+(st.type==='cut'?'Os três cortes':'As três dobrinhas'),text:`Clique no círculo verde de número ${d.actions+1}, sobre a comida. Depois, siga a próxima marca. Você também pode usar o botão de ajuda abaixo.`,button:`${st.type==='cut'?'Cortar':'Fechar'} a marca ${d.actions+1}`,gesture:st.type,from:{x,y:340},area:{width:52,height:52}};
  }
  const motions: Record<string,[GuidePoint,GuidePoint,string,string]> = {
    shape:[{x:430,y:335},{x:680,y:335},'Segure o botão esquerdo sobre o arroz e deslize até a barra completar. Solte o botão. O arroz continua no prato; esta etapa não usa outro ingrediente.','modelar'],
    roll:[{x:380,y:335},{x:740,y:335},'Segure sobre a esteira e deslize para um dos lados. Solte quando a barra completar para fechar o rolinho.','enrolar'],
    fold:[{x:435,y:409},{x:655,y:274},'Segure sobre o recheio e faça um movimento na diagonal, como a seta mostra. Solte para fechar o cone.','dobrar'],
    toss:[{x:560,y:424},{x:560,y:280},`Segure sobre a frigideira e arraste para cima. Faça três movimentos separados, soltando o botão entre eles. Movimento ${d.actions+1} de 3.`,'saltear'],
  };
  const timed = st.type === 'cook' || st.type === 'fry', motion = motions[st.type];
  return {key,title:stage+(timed?(st.type==='fry'?'Hora de fritar':'Vamos cozinhar'):'Vamos '+motion[3]),text:timed?'Segure o botão esquerdo sobre o prato. O marcador começa a andar; solte quando ele estiver dentro da faixa verde. No botão de ajuda abaixo, o movimento é o mesmo: segure e solte na faixa verde.':motion[2]+' Para fazer com ajuda, segure o botão abaixo até completar e solte.',button:timed?'Segure para '+(st.type==='fry'?'fritar':'cozinhar'):'Segure para '+motion[3],gesture:st.type,hold:true,from:timed?{x:560,y:330}:motion[0],to:timed?undefined:motion[1],area:{width:timed?100:60,height:timed?100:60}};
}
