export type IngredientId = 'rice' | 'nori' | 'salmon' | 'cucumber' | 'broth' | 'noodles' | 'egg' | 'scallion' | 'sesame' | 'mushroom' | 'dough' | 'cabbage' | 'shrimp' | 'chicken' | 'miso' | 'sauce';
export const ingredients: Record<IngredientId, { name: string; color: string }> = {
  rice: { name: 'Arroz', color: '#fff8e3' },
  nori: { name: 'Alga nori', color: '#425a45' },
  salmon: { name: 'Salmão', color: '#ed9676' },
  cucumber: { name: 'Pepino', color: '#8ca56a' },
  broth: { name: 'Caldo shoyu', color: '#b47540' },
  noodles: { name: 'Macarrão', color: '#e9ce82' },
  egg: { name: 'Ovo', color: '#f6d16e' },
  scallion: { name: 'Cebolinha', color: '#759759' },
  sesame: { name: 'Gergelim', color: '#d8b880' },
  mushroom: { name: 'Shimeji', color: '#aa8564' },
  dough: { name: 'Massa', color: '#eddbb7' },
  cabbage: { name: 'Repolho', color: '#adc083' },
  shrimp: { name: 'Camarão', color: '#e6a28a' },
  chicken: { name: 'Frango', color: '#c89568' },
  miso: { name: 'Missô', color: '#b5895b' },
  sauce: { name: 'Molho da casa', color: '#8f5f39' },
};
