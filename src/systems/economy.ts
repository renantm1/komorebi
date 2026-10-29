import {recipes} from '../data/recipes';
import type {RecipeId} from '../data/recipes';
import type {Dish,Order} from './state';
export function dishQuality(dish:Dish,order:Order,upgraded:boolean):number {
 let quality=dish.skill.reduce((sum,n)=>sum+n,0)/Math.max(1,dish.skill.length);
 if(dish.recipeId!==order.recipeId)quality*=.3;
 if(upgraded)quality=Math.min(1,quality+.05);
 return quality*(.85+order.patience*.15);
}
export function payment(recipeId:RecipeId,quality:number,day:number){
 const price=Math.round(recipes[recipeId].price*(.25+quality*.75));
 const tip=quality>=.85?Math.round(price*.12)+(day%10===0?100:0):0;
 return {price,tip,total:price+tip};
}
