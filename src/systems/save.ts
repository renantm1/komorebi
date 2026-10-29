import {newInterior,ownedItem} from './interior';
import {newLedger} from './milestones';
import {milestones} from '../data/milestones';
import {decorById,movableItems} from '../data/decorations';
import { newState, emptyStats, emptyStory, dishSteps, type State } from './state';
import { ingredients, recipes, customers, decorCatalog, recipeIds } from '../data/catalog';
import { letters, conversations } from '../data/story';
// The storage key stays stable so existing players keep their progress.
export const SAVE_KEY = 'komorebi.save.v1';
export const BACKUP_KEY = 'komorebi.save.backup';
const finite = (n: unknown, min = 0, max = Number.MAX_SAFE_INTEGER): n is number => typeof n === 'number' && Number.isFinite(n) && n >= min && n <= max;
const strings = (a: unknown): a is string[] => Array.isArray(a) && a.every(x => typeof x === 'string');
export function migrateState(value: unknown): unknown {
  if(!value||typeof value!=='object')return value;
  let old=value as Record<string,any>;
  if(old.version===1){
    const {inventory:_inventory,...base}=old;
    const convert=(id:string)=>id==='fridge'?'teaset':id;
    old={...base,version:2,menu:Array.isArray(old.menu)?[...new Set([...old.menu,...recipeIds])]:old.menu,
      orders:Array.isArray(old.orders)?old.orders.map((o:any)=>({...o,accepted:true,clarified:false})):old.orders,
      dish:old.dish?{...old.dish,actions:old.dish.cuts??0}:null,
      stats:old.stats?{revenue:old.stats.revenue,tips:old.stats.tips,served:old.stats.served,quality:old.stats.quality,rent:old.stats.rent}:old.stats,
      owned:Array.isArray(old.owned)?old.owned.map(convert):old.owned,upgrades:Array.isArray(old.upgrades)?old.upgrades.map(convert):old.upgrades,
      settings:old.settings?{...old.settings,musicVolume:.55,track:0,ambience:true}:old.settings,story:emptyStory()};
  }
  if(old.version===2){const served=old.relationships&&typeof old.relationships==='object'?Object.values(old.relationships).reduce<number>((sum,n)=>sum+(finite(n)?n:0),0):0;return {...old,version:3,interior:newInterior(),ledger:{...newLedger(),served}};}
  return old;
}
export function validateState(value: unknown): State | null {
  try {
    const s = value as State;
    if (!s || s.version !== 3 || !Number.isInteger(s.day) || !finite(s.day, 1, 100000) || !['morning', 'open', 'night'].includes(s.phase) || !finite(s.money, -10000) || !finite(s.xp) || !finite(s.reputation, 0, 5)) return null;
    if (!Array.isArray(s.menu) || !s.menu.length || new Set(s.menu).size !== s.menu.length || !s.menu.every(k => Object.hasOwn(recipes, k))) return null;
    if (!Array.isArray(s.orders) || s.orders.length > 3 || !s.orders.every(o => finite(o.id, 1) && customers.some(c => c.id === o.customerId) && Object.hasOwn(recipes, o.recipeId) && (o.extra === null || Object.hasOwn(ingredients, o.extra)) && finite(o.createdAt) && finite(o.patience, 0, 1) && typeof o.accepted === 'boolean' && typeof o.clarified === 'boolean')) return null;
    if (!finite(s.nextOrderId, 1) || !s.stats || !Object.keys(emptyStats()).every(k => finite(s.stats[k as keyof typeof s.stats]))) return null;
    if (!strings(s.owned) || !s.owned.every(id => decorCatalog.some(d => d.id === id)) || !strings(s.upgrades) || !s.upgrades.every(id => ['teaset', 'counter'].includes(id))) return null;
    if (!Array.isArray(s.decorations) || !s.decorations.every(d => s.owned.includes(d.id) && finite(d.x, 40, 1080) && finite(d.y, 80, 710) && (d.flipped===undefined||typeof d.flipped==='boolean'))) return null;
    if (!s.relationships || !Object.entries(s.relationships).every(([id, n]) => customers.some(c => c.id === id) && finite(n)) || !strings(s.completedEvents) || !strings(s.lastSummary)) return null;
    const interior=s.interior;
    if(!interior||typeof interior.grid!=='boolean'||!Array.isArray(interior.furniture)||interior.furniture.length!==movableItems.length||new Set(interior.furniture.map(d=>d.id)).size!==movableItems.length||!interior.furniture.every(d=>movableItems.some(i=>i.id===d.id)&&finite(d.x,40,1080)&&finite(d.y,80,710)&&(d.hidden===undefined||typeof d.hidden==='boolean')&&(d.flipped===undefined||typeof d.flipped==='boolean')))return null;
    if(decorById(interior.floor)?.type!=='floor'||decorById(interior.wall)?.type!=='wall'||!ownedItem(s,interior.floor)||!ownedItem(s,interior.wall))return null;
    if(!s.ledger||!finite(s.ledger.served)||!s.ledger.dishes||!Object.entries(s.ledger.dishes).every(([id,n])=>Object.hasOwn(recipes,id)&&finite(n))||!strings(s.ledger.claimed)||!s.ledger.claimed.every(id=>milestones.some(m=>m.id===id))||new Set(s.ledger.claimed).size!==s.ledger.claimed.length)return null;
    const t = s.settings;
    if (!t || typeof t.relaxed !== 'boolean' || typeof t.music !== 'boolean' || typeof t.ambience !== 'boolean' || !finite(t.volume, 0, 1) || !finite(t.musicVolume, 0, 1) || !Number.isInteger(t.track) || !finite(t.track, 0, 2)) return null;
    if (!s.story || !strings(s.story.read) || !strings(s.story.completed) || !s.story.completed.every(id => conversations.some(c => c.id === id)) || !s.story.read.every(id => letters.some(l => l.id === id)) || !strings(s.story.letters) || !s.story.replies || !Object.values(s.story.replies).every(n => n === 0 || n === 1) || !s.story.affinity || !Object.entries(s.story.affinity).every(([id, n]) => customers.some(c => c.id === id) && finite(n))) return null;
    if (s.dish !== null) {
      const d = s.dish;
      if (!d || !s.orders[0]?.accepted || !Object.hasOwn(recipes, d.recipeId) || !Number.isInteger(d.step) || !finite(d.step, 0, 12) || !Array.isArray(d.added) || !d.added.every(i => Object.hasOwn(ingredients, i)) || !Array.isArray(d.skill) || !d.skill.every(n => finite(n, 0, 1)) || !Number.isInteger(d.actions) || !finite(d.actions, 0, 3) || typeof d.ready !== 'boolean') return null;
      const steps = dishSteps(d, s.orders[0].extra);
      if (d.step > steps.length || d.ready !== (d.step === steps.length) || d.skill.length !== d.step || d.added.length > d.step) return null;
    }
    return s;
  } catch { return null; }
}
export class SaveStore {
  error = '';
  private storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> | null = null;
  constructor(storage?: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>) {
    try { this.storage = storage ?? globalThis.localStorage ?? null; } catch {}
    if (!this.storage) this.error = 'O navegador bloqueou o armazenamento. A partida funciona, mas não pode ser salva neste navegador.';
  }
  load(): State | null {
    if (!this.storage) return null;
    try {
      const raw = this.storage.getItem(SAVE_KEY); if (!raw) return null;
      let parsed: unknown;
      try { parsed = JSON.parse(raw); } catch { this.storage.setItem(BACKUP_KEY, raw); this.error = 'O progresso não pôde ser lido. Uma cópia foi preservada.'; return null; }
      const s = validateState(migrateState(parsed));
      if (!s) { this.storage.setItem(BACKUP_KEY, raw); this.error = 'O progresso está incompleto. Uma cópia foi preservada.'; }
      return s;
    } catch { this.error = 'Não foi possível ler o progresso. O arquivo original foi preservado.'; return null; }
  }
  save(s: State): boolean { try { if (!this.storage) throw Error('storage unavailable'); this.storage.setItem(SAVE_KEY, JSON.stringify(s)); this.error = ''; return true; } catch { this.error = 'O navegador bloqueou o salvamento. Permita armazenamento local para guardar seu progresso.'; return false; } }
  clear() { try { if (!this.storage) throw Error('storage unavailable'); this.storage.removeItem(SAVE_KEY); } catch { this.error = 'Não foi possível apagar o progresso.'; } }
}
export const cloneState = (s: State) => JSON.parse(JSON.stringify(s)) as State;
export { newState };
