import { KitchenGame } from '../systems/game';
import { customers, recipes, ingredients, gestureHelp, yen } from '../data/catalog';
import { customerSVG, foodSVG } from '../art/illustrations';
import { dishSteps, dayTarget } from '../systems/state';
import { activeLetter, conversationFor, requestText } from '../systems/story';
import { image, button, icon } from './helpers';
import { decorPanel } from './panels';
export function mobilePanel(m: KitchenGame) {
  const s = m.state, o = s.orders[0], d = s.dish;
  if (m.view === 'decorate') return decorPanel(m);
  if (s.phase === 'morning') return `<div class="mobile-greeting"><div><p class="eyebrow">DIA ${s.day} · UM NOVO CAPÍTULO</p><h2>Bom dia, chef.</h2></div><button data-action="story" class="letter-short" aria-label="Cartas e lembranças">${icon('mail')}${activeLetter(s) ? '<i></i>' : ''}</button></div><p class="mobile-note">A casa acordou. Que histórias vamos receber?</p>${button('Abrir o restaurante', 'open', 'primary', 'sun')}`;
  if (s.phase === 'night') return `<p class="eyebrow">DIA ${s.day} · BOAS HISTÓRIAS FICAM</p><div class="mobile-greeting"><h2>Mais um bom dia.</h2>${icon('leaf')}</div><p class="mobile-note">${s.stats.served} pratos · ${yen(s.stats.revenue + s.stats.tips - s.stats.rent)} no caixa · ${s.story.completed.length} memórias</p>${button('Até amanhã', 'next-day', 'primary', 'sun')}`;
  if (!o) return `<p class="eyebrow">${s.stats.served} DE ${dayTarget(s.day)} ENCONTROS</p><h2>Uma pausa gostosa.</h2><p class="mobile-note">Um respiro, uma xícara de chá.</p>${s.stats.served >= dayTarget(s.day) ? button('Fechar por hoje', 'close-day', 'primary', 'leaf') : button('Receber próximo cliente', 'next-customer', 'primary', 'people')}`;
  const c = customers.find(c => c.id === o.customerId)!;
  const person = `<div class="mobile-person">${image(customerSVG(c), c.name)}<div><h2>${c.name}</h2><small>${c.role}</small></div><span class="paper-tag">PEDIDO ${String(o.id).padStart(2, '0')}</span></div>`;
  if (m.view === 'kitchen') {
    const steps = d ? dishSteps(d, o.extra) : [], step = d && steps[d.step];
    return `<div class="mobile-step-top"><span>Pedido · ${recipes[o.recipeId].name}${o.extra ? ` + ${ingredients[o.extra].name}` : ''}</span><button data-action="restaurant" aria-label="Voltar ao salão">${icon('home')}</button><button data-action="discard-confirm" aria-label="Recomeçar sem custo">${icon('back')}</button></div>${d ? `<p class="eyebrow">${d.ready ? 'FEITO POR VOCÊ' : `ETAPA ${d.step + 1} DE ${steps.length} · ${recipes[d.recipeId].short}`}</p><h2 class="mobile-step-title">${d.ready ? 'Prontinho. Bom apetite!' : step?.label}</h2>${d.ready ? button('Servir com carinho', 'serve', 'primary', 'heart') : `<div class="mobile-instruction"><div class="tiny-progress">${steps.map((_, i) => `<i class="${i < d.step ? 'done' : i === d.step ? 'active' : ''}"></i>`).join('')}</div><p>${step?.type === 'ingredient' ? 'Toque no ingrediente iluminado ou arraste até o prato.' : step ? gestureHelp[step.type].replace('Deslize o mouse sobre o arroz, com o botão pressionado, para modelar.', 'Deslize o dedo sobre o arroz para modelar.').replaceAll('Clique', 'Toque').replaceAll('clique', 'toque') : ''}</p></div>`}` : '<h2>O que vamos preparar?</h2><p class="mobile-note">Escolha uma receita acima da bancada.</p>'}`;
  }
  if (o.accepted) return `${person}<div class="mobile-order">${image(foodSVG(o.recipeId), recipes[o.recipeId].name)}<div><strong>${recipes[o.recipeId].name}</strong><small>${o.extra ? `+ ${ingredients[o.extra].name}` : 'Receita tradicional'}</small></div></div>${button(d ? 'Continuar o preparo' : 'Ir para a cozinha', 'prepare', 'primary', 'bowl')}`;
  const conversation = conversationFor(s, o), choice = s.story.replies[String(o.id)];
  return `${person}<div class="mobile-dialogue-scroll">${conversation ? `<details class="conversation" open><summary>${conversation.title}</summary><p>“${conversation.line}”</p>${choice === undefined ? `<div class="dialogue-choices">${conversation.choices.map((opt, i) => button(opt.text, `reply-${i}`, 'reply-button', '')).join('')}</div>` : `<p class="character-reply">“${conversation.choices[choice].reply}”</p>`}</details>` : ''}<p class="mobile-request">“${requestText(s, o)}”</p><button class="text-button" data-action="clarify-order">${icon('help')} Pode repetir o pedido?</button></div><div class="mobile-accept">${button('Claro, já preparo!', 'accept-order', 'primary', 'heart')}</div>`;
}
export function sheetKind(m: KitchenGame) { return m.view === 'decorate' ? 'decor' : m.view === 'kitchen' ? 'cook' : m.state.phase === 'open' && m.state.orders[0] && !m.state.orders[0].accepted ? 'talk' : 'rest'; }
