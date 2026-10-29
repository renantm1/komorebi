export type DecorType = 'plant' | 'flowers' | 'lantern' | 'art' | 'cat' | 'upgrade' | 'furniture' | 'aquarium' | 'windchime' | 'rug' | 'floor' | 'wall';
export interface DecorItem { id: string; name: string; description: string; price: number; day: number; type: DecorType; width?: number; height?: number; base?: boolean }
export const decorCatalog: DecorItem[] = [
  { id: 'plant', name: 'Monstera', description: 'Um pouco de verde perto da janela.', price: 900, day: 1, type: 'plant' },
  { id: 'flowers', name: 'Flores da Hana', description: 'Um pequeno arranjo para o balcão.', price: 650, day: 1, type: 'flowers' },
  { id: 'lantern', name: 'Lanterna de papel', description: 'Luz quentinha para os dias cinzentos.', price: 1400, day: 3, type: 'lantern' },
  { id: 'art', name: 'Aquarela de Kyoto', description: 'Uma janela para outra paisagem.', price: 1800, day: 5, type: 'art', width: 115, height: 130 },
  { id: 'cat', name: 'Maneki-neko', description: 'Um companheiro para receber visitas.', price: 1200, day: 7, type: 'cat' },
  { id: 'teaset', name: 'Chá de boas-vindas', description: 'Chá de cortesia para cada encontro. Gorjetas +5%.', price: 2200, day: 2, type: 'upgrade' },
  { id: 'counter', name: 'Bancada de cipreste', description: 'Mais cuidado, mais conforto. Qualidade de montagem +5%.', price: 4200, day: 10, type: 'upgrade' },
  { id: 'table-round', name: 'Mesa da avó', description: 'A primeira mesa da casa. Pode mudar de lugar.', price: 0, day: 1, type: 'furniture', width: 200, height: 190, base: true },
  { id: 'chair-wood', name: 'Cadeira da janela', description: 'Um lugar para ficar mais um pouco.', price: 0, day: 1, type: 'furniture', width: 85, height: 105, base: true },
  ...['a', 'b', 'c'].map((letter, i): DecorItem => ({ id: `stool-${letter}`, name: `Banquinho ${i + 1}`, description: 'Um lugar de madeira junto ao balcão.', price: 0, day: 1, type: 'furniture', width: 84, height: 90, base: true })),
  { id: 'table-low', name: 'Mesa de chá', description: 'Uma mesa baixa com cerâmica verde e espaço para conversar.', price: 1700, day: 1, type: 'furniture', width: 190, height: 150 },
  { id: 'chair-sage', name: 'Cadeira de tecido', description: 'Assento macio em verde-sálvia. Pode virar para a mesa.', price: 850, day: 1, type: 'furniture', width: 85, height: 120 },
  { id: 'aquarium', name: 'Pequeno aquário', description: 'Peixinhos, bolhas e uma pausa que cabe no salão.', price: 2600, day: 5, type: 'aquarium', width: 160, height: 135 },
  { id: 'bonsai', name: 'Bonsai do Satoshi', description: 'Uma árvore pequena, com um tempo só dela.', price: 1300, day: 3, type: 'plant', width: 115, height: 120 },
  { id: 'windchime', name: 'Sino dos ventos', description: 'Papel, vidro e um sopro de primavera. Toque para ouvir.', price: 700, day: 1, type: 'windchime', width: 65, height: 140 },
  { id: 'bookcase', name: 'Estante de histórias', description: 'Livros que podem ficar. Histórias que podem seguir.', price: 1900, day: 10, type: 'furniture', width: 145, height: 185 },
  { id: 'rug', name: 'Tapete de junco', description: 'Uma ilha de conforto debaixo da mesa.', price: 900, day: 1, type: 'rug', width: 220, height: 85 },
  { id: 'banner', name: 'Bandeirola do bairro', description: 'Um pedacinho da festa que a rua fez para você.', price: 1200, day: 20, type: 'art', width: 180, height: 85 },
  { id: 'floor-cedar', name: 'Cipreste original', description: 'O assoalho de madeira que a avó deixou.', price: 0, day: 1, type: 'floor', base: true },
  { id: 'floor-tatami', name: 'Tatame de junco', description: 'Tramas de verde suave, como numa casa de chá.', price: 2400, day: 1, type: 'floor' },
  { id: 'floor-tile', name: 'Ladrilho de Kyoto', description: 'Pequenos ladrilhos em creme e terracota.', price: 2800, day: 3, type: 'floor' },
  { id: 'wall-cream', name: 'Papel de arroz', description: 'A parede creme original da família.', price: 0, day: 1, type: 'wall', base: true },
  { id: 'wall-sage', name: 'Verde do jardim', description: 'Um verde que conversa com as folhas lá fora.', price: 1800, day: 1, type: 'wall' },
  { id: 'wall-sakura', name: 'Papel de sakura', description: 'Flores delicadas em rosa claro para a primavera ficar.', price: 2200, day: 3, type: 'wall' },
];
export const decorById = (id: string) => decorCatalog.find(d => d.id === id);
export const isStyle = (id: string) => ['floor', 'wall'].includes(decorById(id)?.type ?? '');
export const movableItems = decorCatalog.filter(d => d.base && d.type === 'furniture');
