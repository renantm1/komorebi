export const dayTarget=(day:number)=>Math.min(4+Math.floor((day-1)/2),8);
export const level=(xp:number)=>1+Math.floor(xp/180);
export function eventFor(day:number):{title:string;body:string}|null {
 if(day%10===0)return {title:'Festival do bairro',body:'As lanternas estão acesas e todo mundo quer celebrar. Hoje, as gorjetas têm um bônus de ¥ 100.'};

 if(day===7)return {title:'Uma visita especial',body:'Kenji, o escritor gastronômico, vem conhecer sua cozinha. Um bom prato pode virar uma boa história.'};
 if(day===5)return {title:'Um presente da Yumi',body:'Novas aquarelas chegaram à loja. As pequenas paisagens deixam o salão ainda mais seu.'};
 if(day===3)return {title:'Luz para ficar mais um pouco',body:'Lanternas de papel chegaram à loja. Os clientes também começaram a pedir acompanhamentos diferentes.'};
 if(day%6===4)return {title:'Flores pelo caminho',body:'O bairro está em flor. Hana deixou um bilhete: “Que seu dia seja leve, como as pétalas”.'};
 return null;
}
