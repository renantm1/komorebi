import { KitchenGame } from '../systems/game';
import { decorCatalog, decorById, type DecorType } from '../data/decorations';
import { ownedItem, visibleDecor } from '../systems/interior';
import { decorationSVG } from '../art/illustrations';
import { yen } from '../data/catalog';
import { milestones } from '../data/milestones';
import { milestoneStatus } from '../systems/milestones';
import { button, icon, image } from './helpers';
const groups: { name: string; types: DecorType[] }[] = [
  { name: 'Tudo', types: [] }, { name: 'Objetos', types: ['plant', 'flowers', 'lantern', 'art', 'cat', 'aquarium', 'windchime', 'rug'] },
  { name: 'Móveis', types: ['furniture'] }, { name: 'Paredes', types: ['wall'] }, { name: 'Pisos', types: ['floor'] }, { name: 'Conforto', types: ['upgrade'] },
];
export function shopBody(m: KitchenGame, filter = 0) {
  const s = m.state, group = groups[filter] ?? groups[0];
  return `<p class="modal-intro">Experimente novas cores, encontre um móvel e faça a casa do seu jeito. Móveis da avó podem ser movidos ou guardados. Tudo fica salvo, sem estoque e sem pressa.</p><div class="recipe-tabs shop-tabs">${groups.map((g, i) => `<button class="${i === filter ? 'active' : ''}" data-action="shop-filter-${i}">${g.name}</button>`).join('')}</div><div class="shop-grid">${decorCatalog.filter(d => !group.types.length || group.types.includes(d.type)).map(d => {
    const owns = ownedItem(s, d.id), style = ['floor', 'wall'].includes(d.type), active = s.interior.floor === d.id || s.interior.wall === d.id, locked = s.day < d.day && !owns;
    const action = style ? `style-${d.id}` : owns && d.type !== 'upgrade' ? `collect-place-${d.id}` : `decor-${d.id}`;
    const text = active ? 'Em uso' : owns ? style ? 'Aplicar' : d.type === 'upgrade' ? 'Instalado' : 'Posicionar' : locked ? `Chega no dia ${d.day}` : yen(d.price);
    const disabled = active || locked || owns && d.type === 'upgrade' || !owns && s.money < d.price;
    return `<article class="shop-item ${locked ? 'locked' : ''}">${image(decorationSVG(d.id), d.name)}<span class="shop-category">${d.base ? 'JÁ FAZ PARTE DA CASA' : style ? 'UM NOVO AMBIENTE' : d.type === 'upgrade' ? 'PARA RECEBER MELHOR' : 'PARA O CORAÇÃO'}</span><h3>${d.name}</h3><p>${d.description}</p>${button(text, action, active || owns && d.type === 'upgrade' ? 'quiet' : 'secondary', active || owns && d.type === 'upgrade' ? 'check' : locked ? 'lock' : 'plant', disabled ? 'disabled' : '')}</article>`;
  }).join('')}</div><button class="text-button modal-decor" data-action="decorate">${icon('plant')} Organizar a minha casa ${icon('arrow')}</button>`;
}
export function interiorPanel(m: KitchenGame) {
  const s = m.state, visible = visibleDecor(s), selected = m.selectedDecoration && visible.find(d => d.id === m.selectedDecoration), spec = selected && decorById(selected.id);
  return `<div class="panel-title"><span class="eyebrow">CADA DETALHE, UMA HISTÓRIA</span></div><h2>Um lugar mais seu.</h2><p class="panel-intro">Clique em um objeto para selecioná-lo. Arraste para mover. Ao posicionar móveis, a prévia procura uma área livre do balcão.</p><button class="grid-toggle ${s.interior.grid ? 'active' : ''}" data-action="grid">${icon('home')} Grade discreta <span>${s.interior.grid ? 'Ligada' : 'Desligada'}</span></button>${spec ? `<div class="selected-decor"><small>OBJETO SELECIONADO</small><strong>${spec.name}</strong><div>${button('Virar', 'flip-decor', 'secondary', 'back')}${button('Guardar', 'store-decor', 'secondary', 'stock')}</div></div>` : ''}<div class="interior-styles"><button data-action="shop-walls">${icon('home')} Paredes<small>${decorById(s.interior.wall)!.name}</small></button><button data-action="shop-floors">${icon('leaf')} Piso<small>${decorById(s.interior.floor)!.name}</small></button></div><div class="owned-decor">${decorCatalog.filter(d => ownedItem(s, d.id) && !['upgrade', 'floor', 'wall'].includes(d.type)).map(d => `<button class="owned-item ${m.placing === d.id ? 'placing' : ''}" data-action="place-${d.id}">${image(decorationSVG(d.id), d.name)}<span>${d.name}<small>${visible.some(v => v.id === d.id) ? 'No salão · reposicionar' : 'Guardado · colocar no salão'}</small></span>${icon(m.placing === d.id ? 'check' : 'arrow')}</button>`).join('')}</div>${button('Visitar a loja', 'shop', 'secondary', 'plant')}${button('Tudo no seu lugar', 'restaurant', 'primary', 'check')}`;
}
export function milestonesBody(m: KitchenGame) {
  const s = m.state;
  return `<p class="modal-intro">Sem prazo, sem sequência diária e sem perder o que conquistou. Recompensas são objetos para cuidar da casa. Pratos já servidos continuam contando para os encontros.</p><div class="milestone-grid">${milestones.map(g => {
    const status = milestoneStatus(s, g.id)!, reward = decorById(g.reward)!;
    return `<article class="milestone-card ${status.claimed ? 'claimed' : status.complete ? 'ready' : ''}"><div class="milestone-image">${image(decorationSVG(g.reward), reward.name)}${icon(status.claimed ? 'check' : 'star')}</div><h3>${g.title}</h3><p>${g.description}</p><div class="milestone-progress"><span style="width:${status.progress / g.target * 100}%"></span></div><small>${status.progress} / ${g.target} · Recompensa: ${reward.name}</small>${status.claimed ? button('Na sua coleção', `claim-${g.id}`, 'quiet', 'check', 'disabled') : button(status.complete ? 'Receber meu presente' : 'Um dia de cada vez', `claim-${g.id}`, status.complete ? 'primary' : 'quiet', status.complete ? 'heart' : 'leaf', status.complete ? '' : 'disabled')}</article>`;
  }).join('')}</div>`;
}
