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
npm run build:download # também gera o arquivo offline para computador
npm run preview
```

Publique o conteúdo de `dist/` em uma hospedagem estática. Caminhos relativos permitem subdiretórios. Não exige backend, conta, variável de ambiente ou API paga. Neste repositório, o workflow abaixo publica automaticamente os commits aprovados em `main`.

## Publicação pelo GitHub Actions

O workflow `.github/workflows/pages.yml` executa instalação com `npm ci`, testes de lógica, testes reais com Chromium e build. Somente um resultado aprovado em `main` é enviado ao GitHub Pages; pull requests são testados sem publicar. Também é possível executar o workflow manualmente na aba Actions.

A publicação da versão de PC exige as regras do jogo, os testes em Canvas e WebGL e a suíte de produção/offline. A verificação exclusiva de iPhone/WebKit é informativa enquanto o trabalho está concentrado no PC; seu relatório continua disponível no Actions.

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
5. Clique no ingrediente iluminado ou arraste seu cartão (desenho, nome ou borda) para a tábua destacada. Uma mensagem confirma a adição; o ingrediente desaparece no prato e a prateleira é reposta sem custo. Siga os gestos de cada família, depois sirva com carinho.
6. Atenda os vizinhos do dia, feche a casa, consulte o resultado e volte amanhã. Os dias continuam após o dia 30.

O caderno de receitas também permite consultar os ingredientes e escolher um prato durante o expediente. Há confirmação antes de trocar um preparo iniciado. **Esc** abre ou fecha as configurações.

## Tutorial do primeiro dia no PC

O **Caderno da avó** acompanha automaticamente o dia 1, inclusive em partidas antigas que ainda estão nesse dia. O guia destaca os botões, mostra uma seta e um cursor animado na bancada e segue a etapa real do pedido: abrir a casa, aceitar, escolher a receita, preparar, servir os quatro vizinhos e fechar o caixa. Recarregar retoma o passo atual, sem apagar o progresso.

No PC, o arraste de ingredientes usa Pointer Events do navegador, captura a soltura e converte a posição real do cursor em relação ao canvas. A validação da queda usa a tábua desenhada e independe do estado interno do arraste do Phaser. Soltar fora da tábua devolve o ingrediente; perder o foco, pausar ou redimensionar cancela o gesto. Cliques e toques não duplicam a adição.

Se o arraste não responder no navegador, o guia oferece **Adicionar ingrediente** e controles de ajuda em HTML. Para modelar, enrolar, dobrar ou saltear, segure o botão até completar e solte; para cozinhar e fritar, solte na faixa verde. Corte e fechamento do gyoza usam um clique por marca. Esses controles preparam o prato e usam os mesmos ingredientes, qualidade, ações e pagamento do jogo. O botão também aceita segurar Espaço ou Enter. Pausar ou trocar de janela cancela o gesto sem concluir a etapa.

**Pular guia** guarda a preferência. **Como jogar → Ativar tutorial guiado** reabre a ajuda na etapa atual, em qualquer dia, preservando o restaurante. **Jogar com tutorial** também aparece no menu do PC. A passagem para o dia seguinte encerra o guia; ele fica suspenso enquanto você decora ou abre um menu. As demonstrações respeitam a preferência de movimento reduzido.

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

No PC, segure o botão esquerdo no arroz e deslize em qualquer direção para modelar; para enrolar, arraste para um dos lados. A barra mostra quando pode soltar. Corte e dobra do gyoza usam marcas numeradas desenhadas sobre a comida: clique na marca destacada. Os gestos são cancelados ao abrir configurações, trocar de janela ou redimensionar durante um arraste; a receita fica na mesma etapa para tentar de novo. Soltar um ingrediente fora da tábua o devolve à prateleira com uma orientação.

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

No computador, o cenário inteiro cabe na área de jogo. Navegação, receitas e pedido ocupam áreas separadas, sem cobrir os ingredientes. A escala preserva a proporção em janelas comuns e telas largas, e adapta a interface ao redimensionar. Ingredientes aceitam clique ou arraste. O arroz tem contorno, sombra e textura para permanecer visível sobre a louça. Os menus usam painéis em papel. Clientes entram, piscam e respiram; a porta se move, as lanternas oscilam, a chuva/neve/pétalas passam pela janela, e há vapor, bolhas, ingredientes arrastáveis, feedback dos gestos e partículas ao servir.

Comida, utensílios, personagens, decoração, cenário e ícones são SVGs originais. A bancada mostra o prato sendo montado. Compre objetos, clique para posicionar e arraste para mudar de lugar no modo decoração. A mesa, a cadeira e os três banquinhos da avó agora são móveis interativos, disponíveis desde o início. Toque ou clique em um objeto para **virar** ou **guardar**; guardar preserva a posse e permite recolocar sem cobrança. Uma grade opcional encaixa posições.

A loja tem categorias de objetos, móveis, paredes, pisos e conforto. **Três paredes** (papel de arroz, verde do jardim e sakura) e **três pisos** (cipreste, tatame e ladrilho) mudam o cenário de verdade. Compre uma vez e reaplique sem pagar novamente. Objetos novos incluem mesa de chá, cadeira de tecido, estante, tapete, bonsai, sino dos ventos, bandeirola e aquário com peixes e bolhas animados. As áreas de colocação mantêm os móveis fora do balcão de atendimento. Chá de boas-vindas melhora gorjetas; bancada de cipreste melhora a qualidade.

No celular, a orientação preferida é **paisagem**: salão amplo, bancada própria, receitas em uma faixa deslizante, ingredientes ao alcance e navegação na parte inferior. O pedido e os controles ficam ao lado da bancada. Em retrato, a composição se adapta com ingredientes em duas fileiras e painel inferior. Os ingredientes aceitam toque ou arraste; os outros gestos são feitos diretamente no prato. O pedido e a etapa ficam em um painel compacto. A interface respeita a área segura do aparelho. Em paisagem, a bancada e o painel ficam lado a lado.

O Phaser escolhe **WebGL** quando disponível, com fallback automático para Canvas. O canvas acompanha os pixels físicos da área visível, com limite de 1,6 milhão de pixels no celular e 2048 pixels por dimensão. ResizeObserver agrupa alterações de tamanho e ignora dimensões vazias durante a rotação. As coordenadas de toque são convertidas pela câmera; pratos, personagens e ingredientes usam texturas maiores. No iPhone e iPad, o **modo leve** usa Canvas e 30 FPS por padrão para reduzir pressão de memória. Em Configurações → Desempenho, é possível salvar e escolher entre modo leve e qualidade automática. A perda de contexto gráfico oferece recuperação em modo leve sem apagar a etapa. As imagens móveis são dimensionadas para o tamanho em que aparecem e os filtros de desfoque sobre a cena foram removidos. Armazenamento bloqueado gera um aviso, sem impedir a abertura.

Não houve troca de engine: a renderização antes forçada a Canvas passou a usar a GPU compatível com o aparelho.

## Instalar como PWA

No celular, a barra de navegação da casa fica escondida enquanto o restaurante está aberto. O salão, a bancada e o pedido aproveitam a altura liberada. Durante o preparo, o botão compacto **Voltar ao salão** permite consultar o pedido e continuar o mesmo prato. Decoração, história, conquistas e calendário ficam disponíveis entre expedientes; a barra volta depois de **Fechar por hoje**. Configurações, atendimento e receitas do preparo continuam acessíveis durante o trabalho.

Abra [Komorebi](https://renantm1.github.io/komorebi/) no celular. No menu do jogo, **Jogar como aplicativo** mostra o botão de instalação quando disponibilizado pelo navegador e instruções nos demais casos.

- **Android:** no Chrome/Edge, use Instalar aplicativo ou Adicionar à tela inicial.
- **iPhone/iPad:** no Safari, Compartilhar → Adicionar à Tela de Início.
- Abra pelo ícone Komorebi para jogar em janela própria. Não precisa de App Store, Play Store, cadastro ou backend.

Na primeira visita online, espere a indicação **Pronto para jogar offline** em Configurações → Aplicativo & offline. O service worker guarda HTML, scripts, fontes e ícones. Arte e trilha são geradas localmente; as doze receitas e a história funcionam sem conexão. A versão de desenvolvimento não registra service worker; offline é validado no build de produção.

Atualizações aguardam confirmação em Aplicativo & offline → **Salvar e atualizar**. O jogo grava o progresso antes de recarregar e permite retomar o prato. A atualização dos caches não remove o LocalStorage. O progresso continua local ao navegador, origem e aparelho; não há sincronização. Limpar os dados do site pode remover tanto o cache quanto a partida. O navegador também pode liberar o cache quando o aparelho estiver sem espaço.

No computador, a versão carregada aparece no cabeçalho. Quando uma atualização fica pronta, esse indicador vira **Nova versão · Salvar e atualizar**.

## Arquivo para baixar no computador

Depois de `npm run build`, execute `npm run build:download`. O arquivo `dist/downloads/komorebi-offline.html` contém scripts, fontes, arte e música, sem precisar de servidor. Abra no navegador do computador. O download aparece em Aplicativo & offline e funciona em Windows, Mac e Linux. O site também publica `downloads/como-jogar.html` com instruções.

O arquivo é separado do PWA para iPhone/Android: no celular, instale pelo Safari ou Chrome. O progresso do site não é transferido automaticamente para o arquivo, pois o navegador separa origens. O pacote de download é excluído do cache do PWA para não dobrar o download inicial no celular.

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
npm run test:pwa # requer build e build:download antes
npm run test:webkit # requer WebKit do Playwright
```

Os testes de lógica também simulam trinta dias, os oito vizinhos, os novos capítulos, compra e aplicação de acabamentos, guarda e recolocação de móveis, recompensas únicas e migração das duas versões anteriores. Cobrem as doze receitas, ingredientes ilimitados, qualidade, pagamento único, gestos contados, cartas, escolhas, presentes, dez dias, festivais, decoração, migração e armazenamento. Os testes no Chromium preparam e entregam os doze pratos com **gestos reais de mouse**, verificam a retomada, presentes, tela estreita a geração efetiva de áudio pela rádio, mudanças de cor nos pixels do cenário, arraste e guarda da mesa, peixes em movimento e conquistas persistentes.

A suíte de produção PWA serve o build sob `/komorebi/`, como o GitHub Pages, prepara as doze receitas com eventos reais de toque no Chromium/WebGL, verifica ícones e manifesto, reabre offline preservando a etapa, valida tela de 360 px e confirma que uma atualização aguarda o jogador antes de recarregar e bloqueia a recarga se o salvamento falhar. Também verifica rotação em tela de alta densidade, gestos cancelados e decoração por toque. A suíte desktop exercita também o fallback Canvas. Os testes de atualização restauram o service worker original ao terminar.

Playwright inicia o Vite quando necessário. Usa `/usr/bin/chromium` quando disponível, ou o Chromium instalado com `npx playwright install chromium`. `CHROMIUM_PATH` seleciona outro binário. Screenshots são gravadas em `test-results/`. O Actions instala Chromium e WebKit; o teste WebKit usa perfil de iPhone para cozinhar, girar, recarregar offline e continuar em modo leve. Isso não substitui um teste no aparelho físico. O teste do arquivo offline abre `file://` no Actions; no ambiente gerenciado, onde essa navegação é bloqueada pela política do Chromium, o mesmo HTML do disco é fornecido por uma rota interceptada com a rede desligada.

## Organização

```
src/
  art/         # Cenário, personagens, pratos, ingredientes e decoração originais
  data/        # Receitas, ingredientes, clientes, histórias, clima e catálogo
  scenes/      # WorldScene, MobileScene e KitchenStation: renderização, animações e gestos
  systems/     # Pedidos, história, economia, loja, decoração, salvamento e áudio
  pwa/         # Instalação, disponibilidade offline e atualizações
  ui/          # Painéis, caderno, cartas, diálogos, rádio e ícones
  main.ts      # Integração e controles
```

## Próximas expansões

A versão atual oferece doze pratos, oito vizinhos e um arco com 12 cartas e 24 conversas até o dia 30, além da decoração de pisos, paredes e móveis. Há espaço para novos capítulos, personalização da fachada e ampliação física do salão. Esses recursos não aparecem como opções falsas nos menus. Os dias continuam com novas combinações de pedidos, clima e encontros; as 24 conversas autorais não geram capítulos narrativos infinitos.

## Créditos

Arte, personagens, roteiro, interface e composições: originais do projeto. Fontes Fraunces e Nunito Sans (SIL Open Font License), Phaser (MIT), Vite (MIT), TypeScript (Apache 2.0), Vitest e Playwright. Não utiliza assets ou código proprietário de outros jogos.

Em tarefas na nuvem, use o checkout existente em `/workspace/komorebi`. Cada tarefa já é isolada; não crie worktrees sem solicitação explícita.
