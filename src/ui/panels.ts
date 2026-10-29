import {interiorPanel} from './decorUI';
import {milestones} from '../data/milestones';
import {milestoneStatus} from '../systems/milestones';
import { KitchenGame } from '../systems/game';
import { customers, recipes, ingredients, decorCatalog, yen, gestureHelp } from '../data/catalog';
import { customerSVG, foodSVG, decorationSVG } from '../art/illustrations';
import { dishSteps, dayTarget, level, eventFor } from '../systems/state';
import { activeLetter, conversationFor, requestText } from '../systems/story';
import { image, button, icon } from './helpers';
export function menuPanel(m: KitchenGame) {
  return `<section class="welcome"><div class="little-flower">${icon('leaf')}</div><p class="eyebrow">BEM-VINDO AO KOMOREBI</p><h2>Uma cozinha. <br>Um bairro. <br><em>Sua história.</em></h2><p>Doze receitas, um caderno de lembranças e todo o tempo do mundo. Coloque o avental. A casa é sua.</p><div class="menu-actions">${m.hasSave ? button(`Continuar · dia ${m.state.day}`, 'continue') : button('Começar minha história', 'new')}${m.hasSave ? button('Novo jogo', 'new-confirm', 'secondary', 'leaf') : ''}${button('Configurações', 'settings', 'quiet', 'settings')}</div><div class="welcome-note">${icon('heart')} Ingredientes livres. Música lo-fi. <br>Uma boa história em cada encontro.</div></section><div class="panel-foot"><span>木漏れ日</span><p>A luz do sol que atravessa as folhas.</p></div>`;
}
export function morningPanel(m: KitchenGame) {
  const s = m.state, letter = activeLetter(s), ev = eventFor(s.day);
  return `<div class="panel-title"><span class="eyebrow">UM NOVO CAPÍTULO</span><span class="paper-tag">MANHÃ</span></div><h2>Bom dia, chef.</h2><p class="panel-intro">O fornecedor já cuidou de tudo. Aqui, os ingredientes nunca acabam. Hoje você só precisa cozinhar e acolher.</p>${letter ? `<button class="letter-invitation" data-action="story">${icon('mail')}<span><small>UMA CARTA PARA VOCÊ</small><strong>${letter.title}</strong><em>${letter.from}</em></span>${icon('arrow')}</button>` : `<div class="daily-note"><span class="note-pin"></span><p class="handwriting">“Cozinhar é um jeito<br>de cuidar de alguém.”</p><small>— do caderno da sua avó</small></div>`}${ev ? `<div class="event-note">${icon('spark')}<div><strong>${ev.title}</strong><p>${ev.body}</p></div></div>` : ''}<div class="morning-list"><button data-action="recipes">${icon('book')}<span>O caderno da família<small>${s.menu.length} receitas no cardápio · sem estoque</small></span>${icon('arrow')}</button><button data-action="story">${icon('mail')}<span>Cartas & lembranças<small>${s.story.completed.length} histórias guardadas</small></span>${icon('arrow')}</button><button data-action="shop">${icon('plant')}<span>Um toque de carinho<small>Decore seu pequeno restaurante</small></span>${icon('arrow')}</button></div><div class="open-action">${button('Abrir o restaurante', 'open', 'primary', 'sun')}<small>Sem cobranças. Cada prato tem seu tempo.</small></div><button class="milestone-invitation" data-action="goals">${icon('star')}<span>Pequenas conquistas<small>${milestones.filter(g=>milestoneStatus(s,g.id)?.complete&&!milestoneStatus(s,g.id)?.claimed).length} presentes prontos · sem prazo</small></span>${icon('arrow')}</button><div class="reputation">${icon('star')}<strong>${s.reputation.toFixed(1)}</strong><span>um lugar que acolhe</span><span class="level">NÍVEL ${level(s.xp)}</span></div>`;
}
export function servicePanel(m: KitchenGame) {
  const s = m.state, o = s.orders[0], d = s.dish, c = o && customers.find(c => c.id === o.customerId), kitchen = m.view === 'kitchen';
  let content = `<div class="panel-title"><span class="eyebrow">${kitchen ? 'NA SUA BANCADA' : 'GENTE QUE CHEGA'}</span><span class="paper-tag live">ABERTO</span></div>`;
  if (o && c) {
    const conversation = conversationFor(s, o), choice = s.story.replies[String(o.id)];
    content += `<div class="customer-heading">${image(customerSVG(c), c.name, 'portrait')}<div><h2>${c.name}</h2><p>${c.role}</p><small>${icon('heart')} ${(s.relationships[c.id] ?? 0) ? `${s.relationships[c.id]} encontros · ${s.story.affinity[c.id] ?? 0} conversas` : 'Nosso primeiro encontro'}</small></div></div>`;
    if (!kitchen) {
      if (conversation) content += `<details class="conversation" ${!o.accepted ? 'open' : ''}><summary>${icon('mail')} ${conversation.title}</summary><p>“${conversation.line}”</p>${choice === undefined ? `<div class="dialogue-choices">${conversation.choices.map((option, i) => button(option.text, `reply-${i}`, 'reply-button', '')).join('')}</div>` : `<p class="character-reply">“${conversation.choices[choice].reply}”</p>`}</details>`;
      content += `<div class="dialogue"><p>“${requestText(s, o)}”</p></div>`;
      if (!o.accepted) content += `<div class="accept-order">${button('Claro, já preparo!', 'accept-order', 'primary', 'heart')}<button class="text-button" data-action="clarify-order">${icon('help')} Pode repetir o pedido?</button></div>`;
    }
    if (o.accepted) {
      content += `<div class="order-ticket ${kitchen ? 'compact-ticket' : ''}"><div class="ticket-heading"><span>PEDIDO ${String(o.id).padStart(3, '0')}</span>${icon('bowl')}</div>${image(foodSVG(o.recipeId), recipes[o.recipeId].name, 'ticket-food')}<h3>${recipes[o.recipeId].name}</h3><p>${o.extra ? `+ ${ingredients[o.extra].name}` : 'Receita tradicional, com carinho'}</p><strong>${yen(recipes[o.recipeId].price)}</strong>${!s.settings.relaxed ? `<div class="patience"><span style="width:${o.patience * 100}%"></span></div>` : ''}</div>`;
      if (kitchen) {
        if (!d) content += `<div class="choose-dish"><span class="eyebrow">VISTA O AVENTAL</span><h3>Qual receita vai preparar?</h3><p>Escolha um prato no caderno acima da bancada. Ou abra o livro para consultar o passo a passo.</p>${button('Consultar as receitas', 'recipes', 'secondary', 'book')}</div>`;
        else {
          const steps = dishSteps(d, o.extra), step = steps[d.step];
          content += `<div class="step-info"><span class="eyebrow">${d.ready ? 'FEITO COM CARINHO' : `${recipes[d.recipeId].short.toUpperCase()} · ETAPA ${d.step + 1} DE ${steps.length}`}</span><h3>${d.ready ? 'Bom apetite!' : step?.label}</h3><div class="step-dots">${steps.map((_, i) => `<span class="${i < d.step ? 'done' : i === d.step ? 'active' : ''}">${i < d.step ? icon('check') : i + 1}</span>`).join('')}</div></div>`;
          content += d.ready ? button('Servir com carinho', 'serve') : `<div class="gesture-hint">${icon(step?.type === 'ingredient' ? 'arrow' : 'leaf')}<p>${step?.type === 'ingredient' ? 'Clique no ingrediente ou arraste até o prato. Eles nunca acabam.' : step ? gestureHelp[step.type] : ''}</p></div>`;
          content += `<button data-action="discard-confirm" class="text-button discard">${icon('trash')} Recomeçar sem custo</button>`;
        }
      } else content += button(d ? 'Continuar o preparo' : 'Ir para a cozinha', 'prepare', 'primary', 'bowl');
    }
  } else content += `<div class="quiet-moment">${icon('cup')}<h2>Uma pausa gostosa.</h2><p>${s.stats.served >= dayTarget(s.day) ? 'Todos os vizinhos de hoje foram atendidos. Hora de guardar as boas histórias.' : 'O sino já vai tocar de novo. Aproveite para respirar um pouquinho.'}</p></div>${s.stats.served >= dayTarget(s.day) ? button('Fechar por hoje', 'close-day', 'primary', 'leaf') : button('Receber próximo cliente', 'next-customer', 'primary', 'people')}`;
  return content + `<div class="day-progress"><div><span>${s.stats.served} de ${dayTarget(s.day)} encontros</span><span>${yen(s.stats.revenue + s.stats.tips)}</span></div><div class="progress-track"><span style="width:${s.stats.served / dayTarget(s.day) * 100}%"></span></div><small>${icon('heart')} O ingrediente principal é o carinho.</small></div>`;
}
export function nightPanel(m: KitchenGame) {
  const s = m.state, st = s.stats;
  return `<div class="panel-title"><span class="eyebrow">O DIA FICA NA MEMÓRIA</span><span class="paper-tag">NOITE</span></div><div class="night-heading">${icon('leaf')}<h2>Mais um bom dia.</h2><p>A última tigela foi lavada.<br>As histórias ficam por aqui.</p></div><div class="receipt"><h3>Komorebi <span>Dia ${s.day}</span></h3><p><span>Pratos servidos</span><strong>${st.served}</strong></p><p><span>Vendas</span><strong>${yen(st.revenue)}</strong></p><p><span>Gorjetas</span><strong>${yen(st.tips)}</strong></p><p><span>Cuidado com a casa</span><strong>− ${yen(st.rent)}</strong></p><div class="receipt-total"><span>Carinho que rendeu</span><strong>${yen(st.revenue + st.tips - st.rent)}</strong></div><small>Ingredientes por conta da casa. Nada para repor, nada para contar. Só boas histórias para levar para amanhã.</small></div><div class="satisfaction">${icon('heart')}<div><strong>${st.served ? (st.quality / st.served * 100).toFixed(0) : 0}% de carinho recebido</strong><small>${s.story.completed.length} memórias · Reputação ${s.reputation.toFixed(1)}</small></div></div>${s.lastSummary.length ? `<div class="unlock">${icon('spark')}<p><strong>Um novo capítulo amanhã</strong>${s.lastSummary.join(' · ')}</p></div>` : ''}${button('Até amanhã', 'next-day', 'primary', 'sun')}`;
}
export function decorPanel(m:KitchenGame){return interiorPanel(m);}
