import { KitchenGame } from '../systems/game';
import { tutorialActive, tutorialLesson, type TutorialLesson, type GuidePoint } from '../systems/tutorial';
import { dayTarget } from '../systems/state';
import { COOK_WINDOW, measureGesture } from '../systems/kitchenInput';
import { audio } from '../systems/audio';
import { icon } from './helpers';

/** HTML help controls stay usable independently of the canvas input system. */
export class TutorialGuide {
  private overlay = document.createElement('div');
  private highlighted: HTMLElement | null = null;
  private card: HTMLElement | null = null;
  private lesson: TutorialLesson | null = null;
  private key = '';
  private frame = 0;
  private started = 0;
  private holding = false;
  private timer = 0;
  private observedCanvas: HTMLCanvasElement | null = null;
  private observer = new ResizeObserver(() => this.positionSoon());
  constructor(private model: KitchenGame, private navigate: (action: string) => void, private available: () => boolean) {
    this.overlay.id='tutorial-overlay'; this.overlay.setAttribute('aria-hidden','true'); this.overlay.hidden=true;
    this.overlay.innerHTML='<div class="tutorial-focus"></div><svg class="tutorial-path"><path/></svg><span class="tutorial-cursor"><svg viewBox="0 0 32 38"><path d="M5 2v28l8-7 7 13 6-3-7-12h11Z" fill="#fff8e4" stroke="#3e6539" stroke-width="2.5" stroke-linejoin="round"/></svg></span>';
    document.body.append(this.overlay);
    this.observer.observe(document.querySelector('#world')!);
    window.addEventListener('resize',()=>{this.cancelHold();this.positionSoon();});
    window.addEventListener('focus',()=>this.positionSoon());
    document.addEventListener('scroll',()=>this.positionSoon(),true);
    window.addEventListener('komorebi-world-ready',()=>this.positionSoon());
    for(const event of ['blur','komorebi-game-paused'])window.addEventListener(event,()=>{this.cancelHold();this.overlay.hidden=true;});
    document.addEventListener('visibilitychange',()=>{if(document.hidden)this.cancelHold();else this.positionSoon();});
  }
  render() {
    const active=tutorialActive(this.model.state)&&this.available();
    document.body.classList.toggle('tutorial-active',active);
    if(!active){this.cancelHold();this.card?.remove();this.card=null;this.lesson=null;this.key='';this.clearTarget();this.overlay.hidden=true;return;}
    const l=tutorialLesson(this.model.state,this.model.view),previous=this.key;
    if(l.key!==previous||!this.card?.isConnected){
      this.cancelHold();this.card?.remove();this.clearTarget();this.lesson=l;this.key=l.key;
      const s=this.model.state;
      const card=this.card=document.createElement('section');card.id='tutorial-card';card.className='tutorial-card';card.setAttribute('aria-label','Tutorial guiado');card.dataset.lesson=l.key;
      card.innerHTML=`<div class="tutorial-top"><span>${icon('leaf')} CADERNO DA AVÓ</span><button data-action="tutorial-skip" class="tutorial-skip" aria-label="Pular tutorial">Pular guia</button></div><small class="tutorial-count">DIA ${s.day} · ${s.stats.served} DE ${dayTarget(s.day)} VIZINHOS ATENDIDOS</small><h3>${l.title}</h3><p id="tutorial-instruction" aria-live="polite">${l.text}</p><button class="tutorial-assist" aria-describedby="tutorial-instruction">${l.hold?icon('leaf'):icon('arrow')}<span>${l.button}</span></button>${l.hold?'<div class="tutorial-hold-meter" role="progressbar" aria-label="Progresso do gesto com ajuda" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><i></i><b></b></div><small class="tutorial-hold-hint">Segure o botão acima; depois solte.</small>':''}${l.from?'<button class="tutorial-replay">'+icon('play')+' Ver movimento outra vez</button>':''}`;
      document.querySelector('#side-panel')!.prepend(card);
      const button=card.querySelector<HTMLButtonElement>('.tutorial-assist')!;
      if(l.hold){
        button.addEventListener('pointerdown',e=>{if(e.button!==0)return;e.preventDefault();button.setPointerCapture(e.pointerId);this.beginHold();});
        button.addEventListener('pointerup',()=>this.finishHold());
        button.addEventListener('pointercancel',()=>this.cancelHold());
        button.addEventListener('lostpointercapture',()=>this.cancelHold());
        button.addEventListener('keydown',e=>{if([' ','Enter'].includes(e.key)){e.preventDefault();if(!e.repeat)this.beginHold();}});
        button.addEventListener('keyup',e=>{if([' ','Enter'].includes(e.key)){e.preventDefault();this.finishHold();}});
        button.addEventListener('blur',()=>this.cancelHold());
        button.addEventListener('click',e=>e.preventDefault());
      }else button.addEventListener('click',()=>this.perform());
      card.querySelector('.tutorial-replay')?.addEventListener('click',()=>{this.overlay.classList.remove('demonstrating');requestAnimationFrame(()=>this.overlay.classList.add('demonstrating'));this.positionSoon();});
      if(previous!==l.key){document.querySelector('#side-panel')!.scrollTop=0;card.querySelector<HTMLHeadingElement>('h3')!.tabIndex=-1;}
      this.overlay.classList.add('demonstrating');
    }
    this.positionSoon();
  }
  private valid(){return this.available()&&!this.model.paused&&this.lesson&&tutorialLesson(this.model.state,this.model.view).key===this.key;}
  private perform(){
    const l=this.lesson;if(!l||!this.valid())return;
    if(l.action){this.navigate(l.action);return;}
    if(l.ingredient){if(this.model.ingredient(l.ingredient)){audio.effect('drop');this.model.feedback('Ingrediente adicionado. Siga a próxima etapa do guia.','success');}return;}
    if(l.gesture){this.model.gesture(1);audio.effect('cut');this.model.feedback('Marca concluída. Continue na marca destacada.','success');}
  }
  private beginHold(){
    if(!this.valid()||this.holding)return;this.holding=true;this.started=performance.now();
    const tick=()=>{if(!this.holding)return;if(!this.valid()){this.cancelHold();return;}this.showProgress(performance.now()-this.started);this.frame=requestAnimationFrame(tick);};tick();
  }
  private showProgress(ms:number){
    const timed=this.lesson?.gesture==='cook'||this.lesson?.gesture==='fry',total=timed?COOK_WINDOW.scale:900,value=Math.min(100,ms/total*100),meter=this.card?.querySelector<HTMLElement>('.tutorial-hold-meter'),hint=this.card?.querySelector('.tutorial-hold-hint');
    meter?.classList.toggle('timed',timed);meter?.style.setProperty('--progress',value+'%');meter?.setAttribute('aria-valuenow',String(Math.round(value)));
    if(hint)hint.textContent=timed?(ms>=COOK_WINDOW.idealStart&&ms<=COOK_WINDOW.idealEnd?'Na faixa verde. Pode soltar!':ms>COOK_WINDOW.idealEnd?'Pode soltar e tentar novamente se quiser.':'Continue segurando até a faixa verde.'):(ms>=900?'Completou! Pode soltar.':'Continue segurando…');
  }
  private finishHold(){
    if(!this.holding)return;const ms=performance.now()-this.started,l=this.lesson,valid=this.valid();this.cancelHold();if(!valid||!l?.gesture)return;
    const timed=l.gesture==='cook'||l.gesture==='fry',result=measureGesture(l.gesture,{dx:0,dy:0,distance:0,heldMs:ms});
    if(timed?result.complete:ms>=900){this.model.gesture(timed?result.quality:1);audio.effect('drop');this.model.feedback('Movimento concluído. Continue no guia.','success');}
    else {const hint=this.card?.querySelector('.tutorial-hold-hint');if(hint)hint.textContent='Soltou cedo. Segure um pouquinho mais e tente de novo.';}
  }
  private cancelHold(){this.holding=false;cancelAnimationFrame(this.frame);const meter=this.card?.querySelector<HTMLElement>('.tutorial-hold-meter');meter?.style.setProperty('--progress','0%');meter?.setAttribute('aria-valuenow','0');}
  private clearTarget(){this.highlighted?.classList.remove('tutorial-target');this.highlighted=null;}
  private positionSoon(){cancelAnimationFrame(this.timer);this.timer=requestAnimationFrame(()=>this.position());}
  private position(){
    const l=this.lesson;if(!l||!this.available()||document.hidden||document.body.classList.contains('world-loading')){this.overlay.hidden=true;return;}
    this.clearTarget();
    if(l.selector){this.overlay.hidden=true;const el=document.querySelector<HTMLElement>(l.selector);if(el){el.classList.add('tutorial-target');this.highlighted=el;if(el.closest('.recipe-scroll')){const r=el.getBoundingClientRect(),scroller=el.closest('.recipe-scroll')!.getBoundingClientRect();if(r.left<scroller.left||r.right>scroller.right)el.scrollIntoView({block:'nearest',inline:'center'});}}return;}
    const canvas=document.querySelector('canvas');if(!canvas||!l.from){this.overlay.hidden=true;return;}
    if(canvas!==this.observedCanvas){if(this.observedCanvas)this.observer.unobserve(this.observedCanvas);this.observedCanvas=canvas;this.observer.observe(canvas);}
    const b=canvas.getBoundingClientRect(),point=(p:GuidePoint)=>({x:b.x+p.x*b.width/1120,y:b.y+p.y*b.height/730}),a=point(l.from),z=point(l.to??l.from),w=(l.area?.width??80)*b.width/1120,h=(l.area?.height??80)*b.height/730;
    const focus=this.overlay.querySelector<HTMLElement>('.tutorial-focus')!;focus.style.cssText=`left:${a.x-w/2}px;top:${a.y-h/2}px;width:${w}px;height:${h}px`;
    this.overlay.style.setProperty('--from-x',a.x+'px');this.overlay.style.setProperty('--from-y',a.y+'px');this.overlay.style.setProperty('--to-x',z.x+'px');this.overlay.style.setProperty('--to-y',z.y+'px');
    const svg=this.overlay.querySelector<SVGSVGElement>('.tutorial-path')!;svg.setAttribute('viewBox',`0 0 ${innerWidth} ${innerHeight}`);svg.querySelector('path')!.setAttribute('d',l.to?`M${a.x},${a.y} Q${a.x},${z.y} ${z.x},${z.y}`:'');
    this.overlay.hidden=false;
  }
}
