# KOMOREBI — Japanese Kitchen

Um jogo 2D de culinária para navegador, em português. Você herda o restaurante da avó Emiko, reabre as portas, conversa com os vizinhos e cozinha no seu ritmo. **Sem estoque, sem reposição e sem limite de ingredientes.** Feito com Phaser 3, TypeScript e Vite; arte vetorial e trilha lo-fi originais.

## Executar

Requer Node.js 22.12+ e npm (validado com Node 24).

```sh
npm ci
npm run dev
```

O Vite informa o endereço local. Para produção:

```sh
npm run build
npm run preview
```

Publique o conteúdo de `dist/` em uma hospedagem estática. Caminhos relativos permitem subdiretórios. Não exige backend, conta, variável de ambiente ou API paga. Nenhuma publicação é automática.

## Publicação pelo GitHub Actions

O workflow `.github/workflows/pages.yml` executa instalação com `npm ci`, testes de lógica, testes reais com Chromium e build. Somente um resultado aprovado em `main` é enviado ao GitHub Pages; pull requests são testados sem publicar. Também é possível executar o workflow manualmente na aba Actions.

No repositório `renantm1/komorebi`, a origem de **Settings → Pages → Build and deployment → Source** deve ser **GitHub Actions**. Essa habilitação é uma configuração do GitHub, não do código. Depois de habilitar, cada push em `main` atualiza o jogo. O endereço final aparece no job “Publicar no GitHub Pages” e no ambiente `github-pages`.

As Actions oficiais estão fixadas por SHA e o Dependabot propõe atualizações mensalmente. O job de testes tem acesso somente de leitura; apenas a implantação recebe `pages: write` e `id-token: write`. Nenhuma chave de aplicação ou token pessoal é necessário no workflow. O Vite usa caminhos relativos para o jogo funcionar em `/komorebi/`.

O primeiro acesso em um domínio diferente usa outro LocalStorage: o progresso do endereço local não é automaticamente transferido para o site publicado.

## Uma cozinha sem preocupações

Os ingredientes são livres em todos os modos. Não existe compra, contagem, esgotamento nem cobrança pelo que é colocado no prato. Recomeçar o preparo não custa dinheiro. A antiga melhoria de geladeira foi substituída pelo **chá de boas-vindas**, que melhora as gorjetas.

O dinheiro vem de refeições concluídas e entregues. Precisão da receita e montagem influenciam o pagamento e a reação; o modo relaxado não reduz a paciência. O fechamento desconta apenas ¥ 180 para cuidar da casa, até o limite do caixa, sem criar dívida. Dinheiro serve para decoração e conforto.

## O fluxo de jogo

1. Leia a primeira carta da avó e conheça a casa. As doze receitas já estão disponíveis.
2. Na manhã, escolha seu cardápio, leia cartas ou decore o salão. Abra quando quiser.
3. Escute o cliente, escolha uma resposta se quiser conversar e aceite com **Claro, já preparo!**. **Pode repetir o pedido?** esclarece a receita.
4. Vá à cozinha e **escolha a receita** no caderno acima da bancada; as setas revelam mais pratos. O jogador pode escolher uma receita diferente da pedida, com consequências na qualidade.
5. Arraste ingredientes da prateleira para o prato. Siga os gestos de cada família, depois sirva com carinho.
6. Atenda os vizinhos do dia, feche a casa, consulte o resultado e volte amanhã. Os dias continuam após o dia 30.

O caderno de receitas também permite consultar os ingredientes e escolher um prato durante o expediente. Há confirmação antes de trocar um preparo iniciado. **Esc** abre ou fecha as configurações.

## Doze pratos realmente preparáveis

| Prato | Mecânica |
| --- | --- |
| Onigiri | Arrastar arroz, deslizar para modelar, envolver com nori |
| Nigiri de salmão | Modelar arroz e colocar o salmão |
| Hosomaki de pepino | Montar, enrolar com arraste e clicar nas três marcas para cortar |
| Ramen shoyu | Montar caldo e macarrão, segurar para cozinhar, finalizar com ovo e cebolinha |
| Temaki de salmão | Montar nori, arroz, salmão e pepino; dobrar com gesto diagonal |
| Gyoza de legumes | Rechear, clicar nas três bordas para fechar e dourar na frigideira |
| Tempurá de camarão | Empanar, segurar para fritar e retirar na faixa verde |
| Donburi da casa | Montar arroz, frango e molho, cozinhar e finalizar |
| Yakisoba de legumes | Montar a frigideira e saltear com três arrastes de baixo para cima |
| Missoshiru de shimeji | Dissolver missô, colocar cogumelos, aquecer e finalizar |
| Uramaki de salmão | Montar arroz por fora, rechear, enrolar e cortar nas marcas |
| Karaage crocante | Marinar frango, empanar, fritar e finalizar |

A faixa verde de cozimento e fritura é generosa: aproximadamente 1,5 a 3,3 segundos. Não há limite para iniciar ou tentar novamente. Pedidos a partir do dia 3 podem incluir complementos compatíveis com o prato. Complementos já presentes na receita não são cobrados em etapas duplicadas.

## História e vizinhos

- **Oito personagens originais** com aparências e personalidades distintas: Aiko, Haruto, Yumi, Satoshi, Hana, Kenji, Mio e Ren.
- **24 conversas narrativas**, com duas respostas cada. A escolha é lembrada e não pode ser repetida para acumular afinidade.
- **12 cartas** dos dias 1 a 30: a reabertura, o caderno da família, a rua florescendo, a cerejeira, a aquarela, as lanternas, a padaria da praça, as cartas do carteiro, a biblioteca da vizinhança, o jardim e a nova letra da casa.
- Os pedidos narrativos mudam conforme as visitas: Aiko pesquisa um piquenique com temaki; Haruto descobre uma noite sem trabalho; Satoshi relembra as dobrinhas do gyoza.
- Entregar bem o pedido de certas histórias concede **presentes reais no salão**: flores da Hana, vaso de Satoshi, aquarela de Yumi e lanterna de Kenji, além dos novos presentes de Mio e Ren. Não exige ler uma carta até um prazo e não há falha permanente.
- Mio, a padeira, chega no dia 12. Ren, o carteiro, chega no dia 15. Os capítulos seguintes acompanham os vizinhos até o dia 30, respeitando as histórias que ainda não foram concluídas.
- O caderno de história registra cartas lidas e memórias concluídas. O calendário mostra encontros, conversas e dias especiais.
- Uma noite de lanternas retorna a cada dez dias, com luzes animadas e gorjetas de celebração.

## Visual, decoração e atmosfera

O restaurante ocupa a tela, com HUD sobreposto e menus em papel. Clientes entram, piscam e respiram; a porta se move, as lanternas oscilam, a chuva/neve/pétalas passam pela janela, e há vapor, bolhas, ingredientes arrastáveis, feedback dos gestos e partículas ao servir.

Comida, utensílios, personagens, decoração, cenário e ícones são SVGs originais. A bancada mostra o prato sendo montado. Compre objetos, clique para posicionar e arraste para mudar de lugar no modo decoração. A mesa, a cadeira e os três banquinhos da avó agora são móveis interativos, disponíveis desde o início. Clique em um objeto para **virar** ou **guardar**; guardar preserva a posse e permite recolocar sem cobrança. Uma grade opcional encaixa posições.

A loja tem categorias de objetos, móveis, paredes, pisos e conforto. **Três paredes** (papel de arroz, verde do jardim e sakura) e **três pisos** (cipreste, tatame e ladrilho) mudam o cenário de verdade. Compre uma vez e reaplique sem pagar novamente. Objetos novos incluem mesa de chá, cadeira de tecido, estante, tapete, bonsai, sino dos ventos, bandeirola e aquário com peixes e bolhas animados. As áreas de colocação mantêm os móveis fora do balcão de atendimento. Chá de boas-vindas melhora gorjetas; bancada de cipreste melhora a qualidade.

A prioridade é desktop com mouse. Existe adaptação inicial para telas estreitas e gestos de toque, mas a experiência desktop tem o maior acabamento.

## Pequenas conquistas

Seis objetivos sem prazo, sequência obrigatória ou punição: dez encontros, conhecer os seis primeiros vizinhos, concluir seis histórias, preparar bem as doze receitas, servir cem pratos e chegar ao dia 30. O caderno **Conquistas** mostra o progresso e entrega presentes uma única vez: sino dos ventos, bonsai, estante, aquário, tatame e bandeirola. Os presentes vão para a coleção e podem ser colocados ou aplicados na decoração.

As visitas reais dos salvamentos anteriores contam para o total de encontros. A coleção individual de pratos começa a ser registrada nesta atualização; a versão anterior não guardava esse histórico, então ele não é inventado na migração. Objetivos não entregam dinheiro por clique.

## Rádio Komorebi

Três composições lo-fi procedurais originais, sintetizadas com **Web Audio API**:

- **Chuva em Kyoto** — 72 BPM.
- **Luz na janela** — 76 BPM.
- **Depois da última tigela** — 66 BPM.

Acordes de piano elétrico, melodias suaves, baixo, bumbo, caixa e chimbal com swing, filtro quente, compressão e eco discreto. Sem áudio de terceiros ou downloads durante o jogo. A chuva acompanha o clima. Música, sons e ambiente podem ser ajustados separadamente; faixa, volume e pausa ficam salvos. A reprodução começa após uma interação, respeitando a política de autoplay dos navegadores. A rádio permite trocar a faixa e pausar sem sair do salão.

## Salvamento e compatibilidade

Salvamento automático em LocalStorage, chave estável `komorebi.save.v1`, com **schema de dados versão 3**. Guarda dia, caixa, cardápio, pedidos aceitos, etapa de preparo e gestos parciais, móveis e posições, cartas, respostas, afinidade, histórias concluídas, eventos, áudio, pisos, paredes, grade, móveis guardados ou virados, contagem de pratos e conquistas recebidas.

Os salvamentos das versões 1 e 2 são migrados automaticamente: dia, dinheiro, visitas, móveis e preparo permanecem; a contagem de estoque e os dados de reposição são removidos; a geladeira vira o serviço de chá e as receitas novas ficam disponíveis. As posições da decoração existente são mantidas e os móveis originais ganham controles sem custo. Não é necessário começar de novo.

JSON ou estrutura inválida não derrubam o jogo. O arquivo anterior é preservado em `komorebi.save.backup` quando possível; o navegador informa falhas de armazenamento. Limpar dados do site remove o progresso. Não há sincronização entre dispositivos ou origens.

## Testes

```sh
npm test
npm run build
npm run test:e2e
```

Os testes de lógica também simulam trinta dias, os oito vizinhos, os novos capítulos, compra e aplicação de acabamentos, guarda e recolocação de móveis, recompensas únicas e migração das duas versões anteriores. Cobrem as doze receitas, ingredientes ilimitados, qualidade, pagamento único, gestos contados, cartas, escolhas, presentes, dez dias, festivais, decoração, migração e armazenamento. Os testes no Chromium preparam e entregam os doze pratos com **gestos reais de mouse**, verificam a retomada, presentes, tela estreita a geração efetiva de áudio pela rádio, mudanças de cor nos pixels do cenário, arraste e guarda da mesa, peixes em movimento e conquistas persistentes.

Playwright inicia o Vite quando necessário. Usa `/usr/bin/chromium` quando disponível, ou o Chromium instalado com `npx playwright install chromium`. `CHROMIUM_PATH` seleciona outro binário. Screenshots são gravadas em `test-results/`.

## Organização

```
src/
  art/         # Cenário, personagens, pratos, ingredientes e decoração originais
  data/        # Receitas, ingredientes, clientes, histórias, clima e catálogo
  scenes/      # WorldScene e KitchenStation: renderização, animações e gestos
  systems/     # Pedidos, história, economia, loja, decoração, salvamento e áudio
  ui/          # Painéis, caderno, cartas, diálogos, rádio e ícones
  main.ts      # Integração e controles
```

## Próximas expansões

A versão atual oferece doze pratos, oito vizinhos e um arco com 12 cartas e 24 conversas até o dia 30, além da decoração de pisos, paredes e móveis. Há espaço para novos capítulos, personalização da fachada e ampliação física do salão. Esses recursos não aparecem como opções falsas nos menus. Os dias continuam com novas combinações de pedidos, clima e encontros; as 24 conversas autorais não geram capítulos narrativos infinitos.

## Créditos

Arte, personagens, roteiro, interface e composições: originais do projeto. Fontes Fraunces e Nunito Sans (SIL Open Font License), Phaser (MIT), Vite (MIT), TypeScript (Apache 2.0), Vitest e Playwright. Não utiliza assets ou código proprietário de outros jogos.

Em tarefas na nuvem, use o checkout existente em `/workspace/komorebi`. Cada tarefa já é isolada; não crie worktrees sem solicitação explícita.
