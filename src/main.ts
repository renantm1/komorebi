import '@fontsource/fraunces/latin-400.css';
import '@fontsource/fraunces/latin-500.css';
import '@fontsource/fraunces/latin-600.css';
import '@fontsource/nunito-sans/latin-400.css';
import '@fontsource/nunito-sans/latin-600.css';
import '@fontsource/nunito-sans/latin-700.css';
import '@fontsource/nunito-sans/latin-800.css';
import './style.css';
import './desktop.css';
import './mobile.css';
import { mobilePanel, sheetKind } from './ui/mobilePanels';
import { appInstall } from './pwa/client';
import { appPanel } from './ui/appPanel';
import { version as appVersion } from '../package.json';
import { saveGraphics } from './systems/display';
import { KitchenGame } from './systems/game';
import { createWorld } from './scenes/WorldScene';
import { recipes, weather, yen, type RecipeId } from './data/catalog';
import { foodSVG } from './art/illustrations';
import { dayTarget } from './systems/state';
import { activeLetter } from './systems/story';
import { letters } from './data/story';
import { audio, LOFI_TRACKS } from './systems/audio';
import { image, icon } from './ui/helpers';
import { menuPanel, morningPanel, servicePanel, nightPanel, decorPanel } from './ui/panels';
import { modalContent } from './ui/modals';
let mobileGame = matchMedia('(max-width:760px)').matches || matchMedia('(pointer:coarse) and (max-width:1024px)').matches;
document.body.classList.toggle('mobile-game', mobileGame);
const model = new KitchenGame();
let menu = true, modal: string | null = null, selectedLetter = '', recipeFilter = 0, toastTimer: ReturnType<typeof setTimeout>, autoTimer = 0, shopFilter = 0, paletteKey = '';
const $ = (s: string) => document.querySelector(s) as HTMLElement;
$('#app').innerHTML = `<header class="header"><a class="brand" href="#" aria-label="Komorebi, menu principal" data-action="main-menu"><span class="brand-seal">${icon('bowl')}</span><span><strong>KOMOREBI<span class="brand-kanji">木漏れ日</span></strong><small>JAPANESE KITCHEN</small></span></a><div id="day-info"></div><div id="wallet"></div><button id="game-update" class="game-version" data-action="app"></button><button class="icon-button settings-button" data-action="settings" aria-label="Configurações">${icon('settings')}</button></header><div class="layout"><nav class="rail" aria-label="Navegação do jogo"><div class="rail-top"><button data-action="restaurant" class="nav-item selected">${icon('home')}<span>Salão</span></button><button data-action="kitchen" class="nav-item">${icon('bowl')}<span>Cozinha</span></button><span class="rail-divider"></span><button data-action="recipes" class="nav-item">${icon('book')}<span>Receitas</span></button><button data-action="shop" class="nav-item">${icon('plant')}<span>Decorar</span></button><button data-action="story" class="nav-item story-nav">${icon('mail')}<span>História</span><i id="letter-badge"></i></button><button data-action="goals" class="nav-item">${icon('star')}<span>Conquistas</span></button><button data-action="calendar" class="nav-item">${icon('calendar')}<span>Calendário</span></button></div><div class="rail-bottom"><button data-action="settings" class="nav-item">${icon('sound')}<span>Ambiente</span></button><button data-action="help" class="nav-item">${icon('help')}<span>Como jogar</span></button></div></nav><main class="main"><div class="page-heading"><div><p class="eyebrow">UM CANTINHO SEU, UM DIA DE CADA VEZ</p><h1 id="page-title">O sabor de se sentir em casa.</h1></div><div id="weather-pill"></div></div><section class="game-layout"><div class="stage-column"><div class="stage-shell"><div id="world-loading" class="world-loading-message" role="status">Preparando a bancada…</div><div id="world" role="application" aria-label="Restaurante Komorebi: cena interativa de culinária"></div><div id="scene-label" class="scene-label"></div><button id="scene-switch" class="scene-switch" data-action="kitchen">${icon('bowl')} Ir para a cozinha ${icon('arrow')}</button><div id="recipe-dock" class="recipe-dock" aria-label="Escolha a receita para preparar"></div><div id="scene-caption" class="scene-caption"></div><div id="scene-radio" class="scene-radio"></div><div id="kitchen-status" class="kitchen-status" role="status" aria-live="polite" hidden></div></div><div class="under-scene"><span>${icon('leaf')} Sem pressa. Os ingredientes nunca acabam.</span><button class="text-button" data-action="help">Como jogar ${icon('arrow')}</button></div></div><aside id="side-panel" class="side-panel" aria-label="Seu restaurante"></aside></section><footer class="footer"><span id="save-status"></span><span>Feito para desacelerar <span class="footer-dot">·</span> 木漏れ日</span><button class="text-button" data-action="credits">Sobre o jogo</button></footer></main></div><div id="toast" class="toast" role="status"></div><div id="modal-root"></div>`;
function renderKitchenStatus(){const el=$('#kitchen-status'),f=model.kitchenFeedback;el.hidden=menu||model.view!=='kitchen'||!f;el.textContent=f?.message??'';el.dataset.kind=f?.kind??'hint';}
function render() {
  const update=$('#game-update');update.textContent=appInstall.updateAvailable?'Nova versão · Salvar e atualizar':`v${appVersion}`;update.dataset.action=appInstall.updateAvailable?'update-app':'app';update.classList.toggle('ready',appInstall.updateAvailable);
  $('.settings-button').classList.toggle('has-update', appInstall.updateAvailable);
  $('.settings-button').title = appInstall.updateAvailable ? 'Nova versão disponível em Aplicativo & offline' : 'Configurações';
  const s = model.state, w = weather[(s.day - 1) % weather.length];
  document.body.classList.toggle('menu-state', menu); document.body.classList.toggle('in-kitchen', model.view === 'kitchen'); document.body.classList.toggle('decorating', model.view === 'decorate');
  $('#day-info').innerHTML = `<span class="day-icon">${icon(w.kind)}</span><div><strong>Dia ${String(s.day).padStart(2, '0')} <span class="muted">·</span> ${s.phase === 'morning' ? 'Uma nova manhã' : s.phase === 'open' ? 'Portas abertas' : 'Luzes de fim de dia'}</strong><small>${w.name} · ${s.settings.relaxed ? 'Sem pressa' : 'Uma casa movimentada'}</small></div>`;
  $('#wallet').innerHTML = `<span class="wallet-icon">${icon('coin')}</span><div><strong>${yen(s.money)}</strong><small class="${model.saves.error ? 'save-warning' : ''}">${model.saves.error ? 'Não foi possível salvar' : 'para cuidar da sua casa'}</small></div>`;
  $('#weather-pill').innerHTML = `<span class="weather-icon">${icon(w.kind)}</span><span>${w.name}<small>Ingredientes livres · Sem pressa</small></span>`;
  $('.stage-shell').classList.toggle('cooking', model.view === 'kitchen');
  $('#page-title').textContent = model.view === 'kitchen' ? 'Um pouco de cuidado em cada prato.' : model.view === 'decorate' ? 'Deixe este cantinho com a sua cara.' : 'O sabor de se sentir em casa.';
  $('#scene-label').innerHTML = `<span class="status-dot ${s.phase === 'open' ? 'open' : ''}"></span> ${model.view === 'kitchen' ? 'SUA COZINHA · INGREDIENTES LIVRES' : model.view === 'decorate' ? 'MODO DECORAÇÃO' : s.day % 10 === 0 ? 'NOITE DAS LANTERNAS' : 'SEU PEQUENO RESTAURANTE'}`;
  const switcher = $('#scene-switch'); switcher.style.display = menu ? 'none' : 'flex'; switcher.innerHTML = model.view !== 'restaurant' ? `${icon('home')} Voltar ao salão ${icon('arrow')}` : `${icon('bowl')} Ir para a cozinha ${icon('arrow')}`; switcher.dataset.action = model.view !== 'restaurant' ? 'restaurant' : 'kitchen';
  $('#scene-caption').innerHTML = model.view === 'decorate' ? `<span>${icon('plant')} ${model.placing ? 'Clique no cenário para posicionar seu novo objeto.' : 'Arraste os objetos para encontrar um novo lugar.'}</span>` : '';
  $('#letter-badge').classList.toggle('unread', !!activeLetter(s));
  $('#save-status').innerHTML = `${icon(model.saves.error ? 'help' : 'check')} ${model.saves.error || (model.hasSave ? 'Seu progresso está guardado' : 'Uma nova história está esperando')}`;
  $('#scene-radio').innerHTML = `<button class="radio-toggle" data-action="toggle-music" aria-label="${s.settings.music ? 'Pausar música' : 'Tocar música'}"><span class="mini-vinyl ${s.settings.music && audio.status.started ? 'spinning' : ''}"></span>${icon(s.settings.music ? 'pause' : 'play')}</button><button class="radio-track" data-action="settings"><small>RÁDIO KOMOREBI · LO-FI</small><strong>${LOFI_TRACKS[s.settings.track].title}</strong></button><button class="radio-next" data-action="next-track" aria-label="Próxima faixa">${icon('arrow')}</button>`;
  audio.weather(w.kind === 'rain');
  document.querySelectorAll('.nav-item').forEach(el => el.classList.toggle('selected', (el as HTMLElement).dataset.action === (model.view === 'kitchen' ? 'kitchen' : model.view === 'decorate' ? 'shop' : 'restaurant')));
  $('#side-panel').innerHTML = menu ? menuPanel(model) : mobileGame ? mobilePanel(model) : model.view === 'decorate' ? decorPanel(model) : s.phase === 'morning' ? morningPanel(model) : s.phase === 'night' ? nightPanel(model) : servicePanel(model);
  document.body.dataset.sheet = sheetKind(model);
  if(menu) $('#side-panel .menu-actions').insertAdjacentHTML('beforeend', `<button class="install-entry" data-action="app">${icon('home')} ${appInstall.installed ? 'Aplicativo & offline' : mobileGame ? 'Instalar no celular' : 'Baixar e instalar'}</button>`);
  renderKitchenStatus();renderPalette();
}
function renderPalette() {
  const show = !menu && model.view === 'kitchen' && !!model.state.orders[0]?.accepted;
  $('#recipe-dock').classList.toggle('visible', show); if (!show) return;
  const key = model.state.menu.join(',') + ':' + (model.state.dish?.recipeId ?? 'none'); if (key === paletteKey) return; paletteKey = key;
  const scroll = document.querySelector('.recipe-scroll')?.scrollLeft ?? 0;
  $('#recipe-dock').innerHTML = `<button class="recipe-arrow" data-action="recipes-left" aria-label="Receitas anteriores">${icon('back')}</button><div class="recipe-scroll">${model.state.menu.map(id => `<button class="recipe-chip ${model.state.dish?.recipeId === id ? 'selected' : ''}" data-action="cook-${id}" aria-label="Preparar ${recipes[id].name}">${image(foodSVG(id, 110), recipes[id].name)}<span>${recipes[id].short}</span></button>`).join('')}</div><button class="recipe-arrow" data-action="recipes-right" aria-label="Mais receitas">${icon('arrow')}</button>`;
  $('.recipe-scroll').scrollLeft = scroll;
}
function syncAudio() { const s = model.state.settings; audio.start(s.volume, s.music, s.musicVolume, s.track, s.ambience); }
function showModal(name: string, preserveFocus = false) {
  modal = name; model.paused = true;window.dispatchEvent(new Event('komorebi-game-paused'));
  if (name === 'story') { if (!selectedLetter) selectedLetter = activeLetter(model.state)?.id ?? letters[0].id; model.readLetter(selectedLetter); }
  const { title, body, eyebrow, wide } = name === 'app' ? appPanel() : modalContent(name, model, selectedLetter, recipeFilter, shopFilter);
  $('#modal-root').innerHTML = `<div class="modal-backdrop"><section class="modal ${wide ? 'wide' : ''} ${name === 'story' ? 'story-modal' : ''}" role="dialog" aria-modal="true" aria-labelledby="modal-title" tabindex="-1"><button class="modal-close icon-button" data-action="close-modal" aria-label="Fechar">${icon('close')}</button><p class="eyebrow">${eyebrow}</p><h2 id="modal-title">${title}</h2>${body}</section></div>`;
  if (!preserveFocus) $('.modal').focus();
}
function closeModal() { modal = null; model.paused = menu; $('#modal-root').innerHTML = ''; render(); }
function start() { menu = false; model.paused = false; syncAudio(); if (model.state.dish) model.view = 'kitchen'; render(); if (model.saves.error) model.message(model.saves.error); }
function chooseRecipe(id: RecipeId) {
  if (!Object.hasOwn(recipes, id)) return;
  if (model.state.dish && model.state.dish.recipeId !== id && model.state.dish.step > 0) { showModal(`switch-${id}`); return; }
  if (modal) closeModal(); model.beginDish(id);
}
function action(id: string) {
  if (!audio.status.started) syncAudio(); audio.effect('click'); const s = model.state;
  if (['recipes', 'calendar', 'settings', 'shop', 'credits', 'help', 'new-confirm', 'delete-confirm', 'discard-confirm', 'story', 'goals', 'app', 'graphics-lost'].includes(id)) { if (id === 'story') selectedLetter = ''; showModal(id); return; }
  if (id === 'graphics-light' || id === 'graphics-auto') {
    if(model.hasSave && !model.saves.save(model.state)){ model.message(model.saves.error || 'Não foi possível salvar.'); return; }
    if(!saveGraphics(id === 'graphics-light' ? 'light' : 'auto')){ model.message('Não foi possível guardar a preferência.'); return; }
    window.location.reload(); return;
  }
  if (id === 'install-app') { void appInstall.install().then(() => showModal('app')); return; }
  if (id === 'update-app') { if(model.hasSave && !model.saves.save(model.state)){ model.message(model.saves.error || 'Não foi possível salvar. Tente novamente antes de atualizar.'); return; } void appInstall.update().catch(()=>model.message('A atualização não pôde ser aplicada. Tente novamente.')); return; }
  if (id === 'new' || id === 'reset-confirmed') { if (modal) closeModal(); model.reset(); selectedLetter = ''; start(); showModal('story'); return; }
  if (id === 'continue') { start(); return; }
  if (id === 'close-modal') { closeModal(); return; }
  if (id === 'main-menu') { menu = true; model.paused = true; model.setView('restaurant'); return; }
  if (id === 'open') { model.open(); audio.effect('bell'); return; }
  if (id === 'accept-order') { model.acceptOrder(); return; }
  if (id === 'clarify-order') { model.clarifyOrder(); return; }
  if (id === 'prepare' || id === 'kitchen') { if (!menu && s.phase === 'open' && s.orders[0]?.accepted) model.beginDish(); else model.message('Converse com o cliente e aceite um pedido antes de ir à cozinha.'); return; }
  if (id === 'serve') { if (model.serve()) audio.effect('cash'); return; }
  if (id === 'next-customer') { model.spawnOrder(); return; }
  if (id === 'close-day') { model.finishDay(); return; }
  if (id === 'next-day') { model.nextDay(); selectedLetter = ''; return; }
  if (id === 'restaurant') { model.placing = null; model.selectedDecoration=null; model.setView('restaurant'); return; }
  if (id === 'discard') { closeModal(); model.discard(); return; }
  if (id === 'decorate') { closeModal(); model.setView('decorate'); return; }
  if (id === 'recipes-left' || id === 'recipes-right') { $('.recipe-scroll').scrollBy({ left: id === 'recipes-left' ? -330 : 330, behavior: 'smooth' }); return; }
  if (id === 'toggle-music' || id === 'next-track' || id === 'previous-track') {
    if (id === 'toggle-music') s.settings.music = !s.settings.music; else s.settings.track = (s.settings.track + (id === 'next-track' ? 1 : 2)) % LOFI_TRACKS.length;
    syncAudio(); model.changed(); if (modal === 'settings') showModal('settings'); return;
  }
  if(id==='grid'){model.toggleGrid();return;}
  if(id==='flip-decor'){if(model.selectedDecoration)model.flipDecor(model.selectedDecoration);return;}
  if(id==='store-decor'){if(model.selectedDecoration)model.storeDecor(model.selectedDecoration);return;}
  if(id==='shop-walls'||id==='shop-floors'){shopFilter=id==='shop-walls'?3:4;showModal('shop');return;}
  if(id.startsWith('shop-filter-')){shopFilter=Number(id.slice(12));showModal('shop');return;}
  if(id.startsWith('claim-')){model.claimGoal(id.slice(6));showModal('goals');return;}
  if(id.startsWith('style-')){if(model.applyInterior(id.slice(6))){closeModal();model.message('Um novo ambiente, com o mesmo carinho.');}return;}
  if(id.startsWith('collect-place-')){closeModal();model.placing=id.slice(14);model.setView('decorate');return;}
  if (id.startsWith('reply-')) { model.reply(Number(id.slice(6))); return; }
  if (id.startsWith('letter-')) { selectedLetter = id.slice(7); showModal('story'); return; }
  if (id.startsWith('filter-')) { recipeFilter = Number(id.slice(7)); showModal('recipes'); return; }
  if (id.startsWith('decor-')) { const item = id.slice(6); if (model.buyDecor(item)) { closeModal(); model.message(model.state.upgrades.includes(item) ? 'Um novo cuidado para receber melhor. Melhoria instalada!' : 'Escolha um lugar no cenário para o seu novo objeto.'); } return; }
  if (id.startsWith('place-')) { model.placing = id.slice(6); model.setView('decorate'); return; }
  if (id.startsWith('toggle-')) {
    const r = id.slice(7) as RecipeId; if (!Object.hasOwn(recipes, r)) return;
    if (s.menu.includes(r)) { if (s.menu.length === 1) { model.message('Deixe pelo menos uma receita no cardápio.'); return; } s.menu = s.menu.filter(k => k !== r); } else s.menu.push(r);
    model.changed(); showModal('recipes'); return;
  }
  if (id.startsWith('cook-')) { chooseRecipe(id.slice(5) as RecipeId); return; }
  if (id.startsWith('confirm-switch-')) { const r = id.slice(15) as RecipeId; closeModal(); model.discard(); model.beginDish(r); return; }
}
document.addEventListener('click', e => {
  const el = (e.target as HTMLElement).closest<HTMLElement>('[data-action]'); if (el && !el.hasAttribute('disabled')) { e.preventDefault(); action(el.dataset.action!); }
  if ((e.target as HTMLElement).classList.contains('modal-backdrop')) closeModal();
});
document.addEventListener('input', e => {
  const el = e.target as HTMLInputElement;
  if (el.id === 'volume' || el.id === 'music-volume') { model.state.settings[el.id === 'volume' ? 'volume' : 'musicVolume'] = Number(el.value); syncAudio(); model.changed(); }
});
document.addEventListener('change', e => {
  const el = e.target as HTMLInputElement;
  if (['music', 'relaxed', 'ambience'].includes(el.id)) { model.state.settings[el.id as 'music' | 'relaxed' | 'ambience'] = el.checked; syncAudio(); model.changed(); }
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { if (modal) closeModal(); else showModal('settings'); }
  if (e.key === 'Tab' && modal) { const els = Array.from($('.modal').querySelectorAll<HTMLElement>('button:not(:disabled),input,a')); const first = els[0], last = els.at(-1); if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); } }
});
document.body.classList.add('world-loading');
window.addEventListener('komorebi-world-ready',()=>document.body.classList.remove('world-loading'));
window.addEventListener('komorebi-graphics-lost', () => { audio.pause(true); showModal('graphics-lost'); });
model.addEventListener('change', render);
model.addEventListener('kitchen-feedback',renderKitchenStatus);
appInstall.addEventListener('change', () => { render(); if (modal === 'app') showModal('app', true); });
model.addEventListener('notice', () => { const el = $('#toast'); el.innerHTML = `${icon('leaf')}<span>${model.notice}</span>`; el.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 6500); });
model.paused = true; render(); let world = createWorld('world', model, mobileGame), changingLayout=false;
function resizeLayout(){
  const next=matchMedia('(max-width:760px)').matches || matchMedia('(pointer:coarse) and (max-width:1024px)').matches;
  if(next===mobileGame || changingLayout)return;changingLayout=true;document.body.classList.add('world-loading');mobileGame=next;document.body.classList.toggle('mobile-game',mobileGame);render();
  world.events.once('destroy',()=>{world=createWorld('world',model,mobileGame);changingLayout=false;resizeLayout();});world.destroy(true);
}
matchMedia('(max-width:760px)').addEventListener('change',resizeLayout);matchMedia('(pointer:coarse) and (max-width:1024px)').addEventListener('change',resizeLayout);
setInterval(() => { if (menu || modal || model.state.phase !== 'open') return; autoTimer++; if (autoTimer % 22 === 0 && !model.state.settings.relaxed) model.spawnOrder(); if (autoTimer % 9 === 0 && model.state.stats.served < dayTarget(model.state.day) && model.state.orders.length === 0) model.spawnOrder(); }, 1000);
document.addEventListener('visibilitychange', () => { model.paused = document.hidden || !!modal || menu; audio.pause(document.hidden); if (document.hidden && model.hasSave) model.changed(); });
window.addEventListener('beforeunload', () => { if (model.hasSave) model.saves.save(model.state); });
if (import.meta.env.DEV) { Object.assign(window, { komorebi: model, komorebiAudio: audio }); }
