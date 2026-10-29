export * from './ingredients';
export * from './recipes';
export * from './customers';
export * from './climate';
export * from './decorations';
export const yen=(n:number)=>`¥ ${Math.round(n).toLocaleString('pt-BR')}`;
