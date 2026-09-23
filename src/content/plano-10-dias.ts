export type Refeicao = {
  titulo: string;
  nome?: string;
  descricao: string;
};

export type DiaPlano = {
  numero: number;
  tema: string;
  refeicoes: Refeicao[];
};

export const PLANO_INTRO = {
  titulo: "Plano Alimentar — 10 Dias ARI",
  subtitulo: "Protocolo Plant-Based Funcional para Emagrecimento Saudável",
  descricao:
    "Este plano utiliza exclusivamente Alimentos Reparadores Intestinais (ARI), eliminando todos os ATNN. É baseado em culinária plant-based acessível, ingredientes do mercado brasileiro, e princípios da alimentação funcional e macrobiótica. Cada dia inclui 5 refeições: café da manhã, lanche da manhã, almoço, lanche da tarde e jantar.",
  regras: [
    "Beba 2L de água por dia. Comece em jejum.",
    "Mastigue devagar. O nervo vago ativa a digestão.",
    "Cúrcuma SEMPRE com pimenta-do-reino e azeite.",
  ],
};

export const PLANO_DIAS: DiaPlano[] = [
  {
    numero: 1,
    tema: "Início Leve e Funcional",
    refeicoes: [
      {
        titulo: "Café da Manhã",
        nome: "Smoothie Verde Reparador",
        descricao:
          "Banana congelada + folha de couve + abacaxi + água de coco + gengibre + linhaça moída + limão. Bater sem coar.",
      },
      {
        titulo: "Lanche da Manhã",
        descricao: "1 punhado de castanha de caju in natura + 1 fatia de mamão.",
      },
      {
        titulo: "Almoço",
        nome: "Golden Bowl Dourado",
        descricao:
          "Arroz integral + feijão carioca + couve refogada no alho + abóbora assada com cúrcuma + cenoura ralada. Molho: azeite + limão + cúrcuma + pimenta-do-reino. Castanha de caju picada.",
      },
      {
        titulo: "Lanche da Tarde",
        descricao: "Chá de gengibre com canela + 2 castanhas-do-pará.",
      },
      {
        titulo: "Jantar",
        nome: "Sopa Calmante de Abóbora com Gengibre e Coco",
        descricao:
          "Abóbora cabotiã + cebola + alho + gengibre + cúrcuma + leite de coco sem açúcar + coentro. Batida no liquidificador.",
      },
    ],
  },
  {
    numero: 2,
    tema: "Detox e Prebiótico",
    refeicoes: [
      {
        titulo: "Café da Manhã",
        nome: "Mingau de Aveia sem Glúten",
        descricao:
          "Aveia em flocos cozida em leite de coco + banana amassada + canela + 1 colher de pasta de amendoim sem adição + chia.",
      },
      {
        titulo: "Lanche da Manhã",
        descricao: "1 fatia de abacaxi + chá de hibisco sem açúcar.",
      },
      {
        titulo: "Almoço",
        nome: "Lentilha Refogada com Arroz Integral e Salada Viva",
        descricao:
          "Lentilha com cebola, alho, cominho e cúrcuma + arroz integral. Salada: rúcula + cenoura ralada + beterraba crua + azeite + limão.",
      },
      {
        titulo: "Lanche da Tarde",
        descricao: "1 banana + 1 colher de sopa de linhaça moída.",
      },
      {
        titulo: "Jantar",
        nome: "Caldo Verde Funcional",
        descricao:
          "Broto de couve picado fino + mandioca cozida amassada + alho + azeite + pimenta-do-reino. Caldo simples, leve e repleto de sulforafano.",
      },
    ],
  },
  {
    numero: 3,
    tema: "Energia e Saciedade",
    refeicoes: [
      {
        titulo: "Café da Manhã",
        nome: "Tapioca Recheada",
        descricao:
          "Tapioca com homus caseiro (grão-de-bico + tahine + alho + limão) + tomate picado + rúcula + azeite.",
      },
      {
        titulo: "Lanche da Manhã",
        descricao: "1 punhado de amendoim in natura + 1 laranja.",
      },
      {
        titulo: "Almoço",
        nome: "Arroz de Couve-flor com Açafrão",
        descricao:
          "Couve-flor ralada refogada no azeite com alho + cúrcuma + pimenta-do-reino + castanha de caju. Acompanha feijão preto e salada de alface roxa com pepino.",
      },
      {
        titulo: "Lanche da Tarde",
        descricao: "Vitamina de mamão com gengibre e canela (sem açúcar).",
      },
      {
        titulo: "Jantar",
        nome: "Wrap de Alface com Lentilha e Manga",
        descricao:
          "Folha de alface romana + lentilha temperada com cominho + manga em cubos + cebola roxa + coentro + limão.",
      },
    ],
  },
  {
    numero: 4,
    tema: "Anti-inflamatório Profundo",
    refeicoes: [
      {
        titulo: "Café da Manhã",
        nome: "Bowl de Frutas com Sementes",
        descricao:
          "Mamão em cubos + banana fatiada + acerola ou goiaba + chia + linhaça + coco ralado sem açúcar + canela.",
      },
      {
        titulo: "Lanche da Manhã",
        descricao:
          "Chá de cúrcuma com leite de coco e canela (golden milk) + 2 castanhas-do-pará.",
      },
      {
        titulo: "Almoço",
        nome: "Ceviche de Manga com Grão-de-bico",
        descricao:
          "Manga firme + grão-de-bico cozido + cebola roxa + coentro + gengibre + limão + pimenta. Servir sobre folhas de alface.",
      },
      {
        titulo: "Lanche da Tarde",
        descricao: "1 fatia de melancia ou melão + água com limão.",
      },
      {
        titulo: "Jantar",
        nome: "Sopa de Ervilha com Hortelã",
        descricao:
          "Ervilha seca cozida com cebola, alho, cúrcuma, caldo de legumes caseiro + hortelã fresca. Batida e servida com fio de azeite.",
      },
    ],
  },
  {
    numero: 5,
    tema: "Macrobiótico e Equilibrado",
    refeicoes: [
      {
        titulo: "Café da Manhã",
        nome: "Mingau de Amaranto com Banana e Coco",
        descricao:
          "Amaranto cozido em água + banana amassada + canela + coco ralado sem açúcar + 1 fio de azeite.",
      },
      {
        titulo: "Lanche da Manhã",
        descricao: "1 punhado de castanha de caju + 1 fatia de abacaxi.",
      },
      {
        titulo: "Almoço",
        nome: "Arroz Integral com Feijão Azuki e Legumes Salteados",
        descricao:
          "Arroz integral + feijão azuki cozido + abobrinha + cenoura + brócolis salteados no azeite com alho e gengibre. Molho de tahine e limão.",
      },
      {
        titulo: "Lanche da Tarde",
        descricao: "Kombucha artesanal (ou chá verde sem açúcar) + 3 tâmaras.",
      },
      {
        titulo: "Jantar",
        nome: "Batata-doce Assada Recheada",
        descricao:
          "Batata-doce assada com recheio de espinafre refogado + grão-de-bico + alho + azeite + cúrcuma. Sementes de gergelim por cima.",
      },
    ],
  },
  {
    numero: 6,
    tema: "Reparo da Mucosa",
    refeicoes: [
      {
        titulo: "Café da Manhã",
        nome: "Smoothie Laranja Dourado",
        descricao:
          "Manga + cenoura crua + gengibre + cúrcuma + água de coco + linhaça moída + pitada de pimenta-do-reino.",
      },
      {
        titulo: "Lanche da Manhã",
        descricao: "1 banana + pasta de amendoim sem adição (1 colher).",
      },
      {
        titulo: "Almoço",
        nome: "Pizza de Tapioca com Homus e Legumes Assados",
        descricao:
          "Base de tapioca + homus caseiro + abobrinha + berinjela + tomate cereja assados + azeite + orégano. Sem glúten, sem laticínio.",
      },
      {
        titulo: "Lanche da Tarde",
        descricao: "Salada de frutas simples (mamão + banana + acerola) sem açúcar.",
      },
      {
        titulo: "Jantar",
        nome: "Creme de Cenoura com Gengibre",
        descricao:
          "Cenoura cozida + gengibre + cebola + alho + cúrcuma batidos com caldo de legumes. Servir com sementes de linhaça e coentro.",
      },
    ],
  },
  {
    numero: 7,
    tema: "Leveza e Diversidade",
    refeicoes: [
      {
        titulo: "Café da Manhã",
        nome: "Tapioca com Abacate e Coentro",
        descricao:
          "Tapioca + abacate amassado com limão e sal + coentro + pimenta-do-reino + fio de azeite.",
      },
      {
        titulo: "Lanche da Manhã",
        descricao: "Chá de maracujá (casca e polpa) + 2 castanhas-do-pará.",
      },
      {
        titulo: "Almoço",
        nome: "Salada Prebiótica Completa",
        descricao:
          "Alface roxa + rúcula + beterraba crua ralada + cenoura + grão-de-bico cozido + sementes de girassol + cebola roxa. Molho: tahine + limão + alho + água.",
      },
      {
        titulo: "Lanche da Tarde",
        descricao: "1 fatia de melancia + água com gengibre e limão.",
      },
      {
        titulo: "Jantar",
        nome: "Mandioca Cozida com Refogado de Couve e Alho",
        descricao:
          "Mandioca cozida + couve-manteiga refogada no azeite com alho amassado + pimenta-do-reino. Simples, poderoso e anti-inflamatório.",
      },
    ],
  },
  {
    numero: 8,
    tema: "Força e Proteína Vegetal",
    refeicoes: [
      {
        titulo: "Café da Manhã",
        nome: "Mingau de Aveia com Chia e Maçã",
        descricao:
          "Aveia sem glúten + leite de aveia ou coco + chia hidratada + maçã ralada + canela + noz-moscada.",
      },
      {
        titulo: "Lanche da Manhã",
        descricao: "1 punhado de amendoim + 1 laranja.",
      },
      {
        titulo: "Almoço",
        nome: "Feijoada Funcional Plant-Based",
        descricao:
          "Feijão preto + batata-doce em cubos + couve + cebola + alho + cominho + pimenta-do-reino. Sem embutidos. Arroz integral e farofa de castanha de caju.",
      },
      {
        titulo: "Lanche da Tarde",
        descricao: "Vitamina de banana com aveia e canela (leite de coco).",
      },
      {
        titulo: "Jantar",
        nome: "Sopa de Quinoa com Legumes",
        descricao:
          "Quinoa + cenoura + abobrinha + espinafre + caldo de legumes caseiro + cúrcuma + pimenta-do-reino. Leve e proteica.",
      },
    ],
  },
  {
    numero: 9,
    tema: "Intestino em Foco",
    refeicoes: [
      {
        titulo: "Café da Manhã",
        nome: "Bowl Prebiótico da Manhã",
        descricao:
          "Biomassa de banana verde (2 colheres) diluída em leite de coco + cacau 100% em pó + canela + tâmara picada. Polvilhar linhaça.",
      },
      {
        titulo: "Lanche da Manhã",
        descricao: "Kombucha ou chucrute (1-2 colheres) + castanha de caju.",
      },
      {
        titulo: "Almoço",
        nome: "Arroz Integral com Lentilha e Molho Dourado",
        descricao:
          "Arroz integral + lentilha cozida temperada + cenoura assada + espinafre refogado. Molho: cúrcuma + azeite + limão + alho + pimenta.",
      },
      {
        titulo: "Lanche da Tarde",
        descricao: "1 mamão médio + chá de gengibre.",
      },
      {
        titulo: "Jantar",
        nome: "Berinjela Assada com Grão-de-bico e Tahine",
        descricao:
          "Berinjela assada ao forno + grão-de-bico tostado com cúrcuma e cominho + molho de tahine + salsinha fresca + azeite.",
      },
    ],
  },
  {
    numero: 10,
    tema: "Consolidação e Celebração",
    refeicoes: [
      {
        titulo: "Café da Manhã",
        nome: "Smoothie de Acerola e Manga",
        descricao:
          "Manga + acerola (ou suco concentrado) + gengibre + linhaça moída + água de coco + cúrcuma. Rico em vitamina C e anti-inflamatório.",
      },
      {
        titulo: "Lanche da Manhã",
        nome: "Brigadeiro de Banana Verde e Cacau",
        descricao:
          "Biomassa de banana verde + cacau 100% + tâmara hidratada + canela. Bolinha no coco ralado. 2-3 unidades.",
      },
      {
        titulo: "Almoço",
        nome: "Prato Colorido do Décimo Dia",
        descricao:
          "Arroz integral + feijão carioca + batata-doce assada + couve refogada + beterraba crua ralada + cenoura + abóbora. Molho dourado: cúrcuma + azeite + limão.",
      },
      {
        titulo: "Lanche da Tarde",
        descricao: "1 fatia de abacaxi + chá de hibisco gelado sem açúcar.",
      },
      {
        titulo: "Jantar",
        nome: "Caldo Detox Final",
        descricao:
          "Agrião + mandioca + cebola + alho + gengibre + cúrcuma + caldo de legumes caseiro. Batido, servido com sementes de linhaça e fio de azeite.",
      },
    ],
  },
];

export const INGREDIENTES_CORINGA: { titulo: string; itens: string[] }[] = [
  {
    titulo: "Frutas de emergência (comer como lanche ou café)",
    itens: [
      "Banana (verde: biomassa; madura: smoothie ou mingau)",
      "Mamão papaia — comer puro, em jejum ideal",
      "Manga — comer fria com limão e gengibre",
      "Abacaxi — lanche ou chá da casca",
      "Abacate — amassar com limão, sal e azeite",
      "Melancia ou melão — hidratação + saciedade",
    ],
  },
  {
    titulo: "Refeições de 15 minutos (quando não tem tempo)",
    itens: [
      "Arroz integral + feijão (qualquer) + azeite + alho + couve refogada",
      "Tapioca + homus comprado (sem glúten/laticínio) + tomate + rúcula",
      "Salada de folhas + grão-de-bico de lata (escorrido) + azeite + limão",
      "Ovo caipira (se não for vegano) com espinafre e cúrcuma",
      "Mandioca cozida + azeite + alho + couve — simples e completo",
      "Sopa de lentilha com cenoura e gengibre — 20 min no total",
    ],
  },
  {
    titulo: "Temperos que transformam qualquer prato",
    itens: [
      "Cúrcuma + pimenta-do-reino + azeite — sobre tudo",
      "Alho amassado (repousar 10 min antes de usar)",
      "Gengibre fresco ralado — em sucos, sopas e refogados",
      "Limão espremido na hora — acidifica, realça sabor e aumenta vitamina C",
      "Canela em pó — em frutas, mingaus e chás",
      "Coentro e salsinha frescos — queladores e anti-inflamatórios",
    ],
  },
  {
    titulo: "Snacks rápidos e saudáveis (sem precisar cozinhar)",
    itens: [
      "Castanha de caju in natura (punhado)",
      "Amendoim in natura ou pasta sem adição (1 colher)",
      "2 castanhas-do-pará (não mais que isso por dia)",
      "Tâmaras (2-3 unidades) — adoçante natural e sacietante",
      "Coco ralado seco sem açúcar (polvilhar em frutas)",
      "Sementes de girassol ou gergelim (sobre saladas)",
    ],
  },
  {
    titulo: "Bebidas que substituem qualquer industrializado",
    itens: [
      "Água com limão + gengibre + folha de hortelã",
      "Chá de gengibre com canela (quente ou gelado)",
      "Chá de hibisco sem açúcar (diurético natural)",
      "Água de coco natural (hidratação e eletrólitos)",
      "Leite de coco feito em casa (coco + água no liquidificador)",
      "Kombucha artesanal — 1 copo por dia máximo",
    ],
  },
  {
    titulo: "Emergência total: ingredientes mínimos do mês",
    itens: [
      "Arroz integral, feijão carioca ou preto, lentilha",
      "Batata-doce, mandioca, abóbora",
      "Couve-manteiga, cenoura, cebola, alho",
      "Azeite de oliva extravirgem, cúrcuma, gengibre, canela, pimenta-do-reino",
      "Linhaça moída ou chia, aveia sem glúten",
      "Castanha de caju, amendoim in natura",
      "Limão, banana, mamão — frutas-base",
      "Tapioca, leite de coco sem açúcar",
    ],
  },
];

export const NOTAS_FINAIS: string[] = [
  "A biomassa de banana verde pode ser feita em casa: cozinhar bananas verdes com casca em panela de pressão por 10 min, descascar e bater. Guardar no freezer em porções.",
  "O feijão e as leguminosas devem ser demolhados por 8-12h antes do cozimento para eliminar fitatos e reduzir lectinas, melhorando a absorção de nutrientes.",
  "Fermentados (kombucha, chucrute) devem ser introduzidos progressivamente: 1-2 colheres/dia na primeira semana.",
  "Caso sinta muita fome, aumente a porção de leguminosas e vegetais — nunca corte nutrientes, ajuste a qualidade.",
  "O caldo de legumes caseiro (cenoura + cebola + alho + salsinha + aipo) substitui qualquer caldo em cubo industrializado e pode ser feito em quantidade e congelado.",
];
