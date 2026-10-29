import {decorCatalog} from '../data/decorations';
import type {State} from './state';
export function purchase(state:State,id:string){
 const item=decorCatalog.find(d=>d.id===id);
 if(!item||item.base||state.owned.includes(id)||state.day<item.day||state.money<item.price)return null;
 state.money-=item.price;
 state.owned.push(id);
 if(item.type==='upgrade')state.upgrades.push(id);
 return item;
}
