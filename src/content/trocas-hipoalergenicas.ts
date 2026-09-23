// Guia de Adaptações Hipoalergênicas — trocas por dia do Plano 10 Dias ARI.
export type Troca = {
  refeicao: string; // deve casar com o titulo da refeição no plano
  alerta: "Castanha" | "Amendoim" | "Coco" | "Gergelim" | "Acesso";
  de: string;
  para: string;
};

export type TrocasDia = {
  dia: number;
  trocas: Troca[];
  nota?: string;
};

export const TROCAS_POR_DIA: TrocasDia[] = [
  {
    dia: 1,
    trocas: [
      {
        refeicao: "Lanche da Manhã",
        alerta: "Castanha",
        de: "Castanha de caju in natura",
        para: "Sementes de girassol ou abóbora torradas, na mesma quantidade",
      },
      {
        refeicao: "Almoço",
        alerta: "Castanha",
        de: "Castanha de caju picada (finalização do Golden Bowl)",
        para: "Sementes de abóbora torradas picadas",
      },
      {
        refeicao: "Lanche da Tarde",
        alerta: "Castanha",
        de: "2 castanhas-do-pará",
        para: "1 colher de sopa de sementes de girassol",
      },
      {
        refeicao: "Jantar",
        alerta: "Coco",
        de: "Leite de coco sem açúcar",
        para: "Creme de aveia (aveia batida com água e coada) ou leite de arroz",
      },
    ],
  },
  {
    dia: 2,
    trocas: [
      {
        refeicao: "Café da Manhã",
        alerta: "Coco",
        de: "Mingau cozido em leite de coco",
        para: "Leite de aveia (mantém a mesma cremosidade do mingau)",
      },
      {
        refeicao: "Café da Manhã",
        alerta: "Amendoim",
        de: "Pasta de amendoim sem adição",
        para: "Pasta de semente de girassol ou de abóbora sem adição",
      },
    ],
    nota: "Almoço, lanches e jantar seguem sem alterações.",
  },
  {
    dia: 3,
    trocas: [
      {
        refeicao: "Café da Manhã",
        alerta: "Gergelim",
        de: "Tahine (no homus caseiro)",
        para: "Homus sem tahine: mais azeite + limão + um pouco de água do cozimento do grão-de-bico",
      },
      {
        refeicao: "Lanche da Manhã",
        alerta: "Amendoim",
        de: "Amendoim in natura",
        para: "Sementes de abóbora torradas",
      },
      {
        refeicao: "Almoço",
        alerta: "Castanha",
        de: "Castanha de caju",
        para: "Sementes de girassol torradas",
      },
    ],
    nota: "Lanche da tarde e jantar seguem sem alterações.",
  },
  {
    dia: 4,
    trocas: [
      {
        refeicao: "Café da Manhã",
        alerta: "Coco",
        de: "Coco ralado sem açúcar",
        para: "Aveia em flocos finos levemente tostada, ou mais canela",
      },
      {
        refeicao: "Lanche da Manhã",
        alerta: "Coco",
        de: "Golden milk com leite de coco",
        para: "Golden milk com leite de aveia (cúrcuma, canela e pimenta-do-reino continuam iguais)",
      },
      {
        refeicao: "Lanche da Manhã",
        alerta: "Castanha",
        de: "2 castanhas-do-pará",
        para: "Sementes de girassol",
      },
    ],
    nota: "Almoço, lanche da tarde e jantar seguem sem alterações.",
  },
  {
    dia: 5,
    trocas: [
      {
        refeicao: "Café da Manhã",
        alerta: "Coco",
        de: "Coco ralado sem açúcar",
        para: "Aveia em flocos finos tostada",
      },
      {
        refeicao: "Lanche da Manhã",
        alerta: "Castanha",
        de: "Castanha de caju",
        para: "Sementes de abóbora torradas",
      },
      {
        refeicao: "Almoço",
        alerta: "Gergelim",
        de: "Molho de tahine",
        para: "Molho de azeite, limão, alho amassado e um fio de água",
      },
      {
        refeicao: "Lanche da Tarde",
        alerta: "Acesso",
        de: "Kombucha artesanal",
        para: "Chá verde sem açúcar ou água com limão e gengibre (kombucha nem sempre é fácil de encontrar ou tem custo elevado)",
      },
      {
        refeicao: "Jantar",
        alerta: "Gergelim",
        de: "Sementes de gergelim da finalização",
        para: "Sementes de girassol",
      },
    ],
  },
  {
    dia: 6,
    trocas: [
      {
        refeicao: "Café da Manhã",
        alerta: "Coco",
        de: "Água de coco",
        para: "Água filtrada com uma rodela de limão (para quem tem alergia a coco em qualquer forma)",
      },
      {
        refeicao: "Lanche da Manhã",
        alerta: "Amendoim",
        de: "Pasta de amendoim sem adição",
        para: "Pasta de semente de girassol ou abóbora",
      },
      {
        refeicao: "Almoço",
        alerta: "Gergelim",
        de: "Homus caseiro com tahine",
        para: "Homus sem tahine (mais azeite + limão), como no Dia 3",
      },
    ],
    nota: "Lanche da tarde e jantar seguem sem alterações.",
  },
  {
    dia: 7,
    trocas: [
      {
        refeicao: "Lanche da Manhã",
        alerta: "Castanha",
        de: "2 castanhas-do-pará",
        para: "Sementes de abóbora torradas",
      },
      {
        refeicao: "Almoço",
        alerta: "Gergelim",
        de: "Molho de tahine (Salada Prebiótica)",
        para: "Molho de azeite, limão e alho. As sementes de girassol da salada podem ser mantidas; só quem tem alergia a sementes em geral deve trocá-las por cubos pequenos de pepino",
      },
    ],
    nota: "Café da manhã, lanche da tarde e jantar seguem sem alterações.",
  },
  {
    dia: 8,
    trocas: [
      {
        refeicao: "Lanche da Manhã",
        alerta: "Amendoim",
        de: "Amendoim in natura",
        para: "Sementes de girassol",
      },
      {
        refeicao: "Almoço",
        alerta: "Castanha",
        de: "Farofa de castanha de caju",
        para: "Farofa de sementes de girassol ou abóbora trituradas grosseiramente",
      },
      {
        refeicao: "Lanche da Tarde",
        alerta: "Coco",
        de: "Leite de coco",
        para: "Leite de aveia",
      },
    ],
    nota: "No café da manhã, priorizar sempre a opção de leite de aveia. Jantar segue sem alterações.",
  },
  {
    dia: 9,
    trocas: [
      {
        refeicao: "Café da Manhã",
        alerta: "Coco",
        de: "Leite de coco (na biomassa de banana verde)",
        para: "Leite de aveia ou leite de arroz",
      },
      {
        refeicao: "Café da Manhã",
        alerta: "Acesso",
        de: "Biomassa de banana verde caseira",
        para: "Purê de banana verde já pronto (lojas de produtos naturais) ou banana amassada comum quando não houver tempo de preparo",
      },
      {
        refeicao: "Lanche da Manhã",
        alerta: "Acesso",
        de: "Kombucha ou chucrute",
        para: "Repolho roxo fatiado fino com limão (efeito refrescante semelhante, sem depender de fermentado difícil de achar)",
      },
      {
        refeicao: "Lanche da Manhã",
        alerta: "Castanha",
        de: "Castanha de caju",
        para: "Sementes de girassol",
      },
      {
        refeicao: "Jantar",
        alerta: "Gergelim",
        de: "Molho de tahine",
        para: "Azeite + limão + alho, como nos demais dias",
      },
    ],
    nota: "Almoço e lanche da tarde seguem sem alterações.",
  },
  {
    dia: 10,
    trocas: [
      {
        refeicao: "Café da Manhã",
        alerta: "Acesso",
        de: "Acerola (ou suco concentrado)",
        para: "Morango, kiwi ou laranja — todas boas fontes de vitamina C e mais fáceis de achar fora da época da acerola",
      },
      {
        refeicao: "Lanche da Manhã",
        alerta: "Coco",
        de: "Bolinha enrolada em coco ralado",
        para: "Enrolar em canela em pó ou em aveia em flocos finos moída",
      },
    ],
    nota: "Almoço, lanche da tarde e jantar seguem sem alterações.",
  },
];

export const TROCAS_INTRO = {
  titulo: "Guia de Adaptações Hipoalergênicas",
  descricao:
    "Sempre que houver alergia (castanhas, amendoim, coco, gergelim) ou dificuldade para encontrar um ingrediente, use a troca sugerida em destaque dourado dentro de cada refeição. Todas as opções continuam 100% plant-based e sem ultraprocessados.",
  principio:
    "Princípio geral: castanhas e amendoim viram sementes de girassol ou abóbora torradas; o coco vira leite ou creme de aveia; o gergelim/tahine vira pasta de girassol ou simplesmente mais azeite e limão.",
};

export const TABELA_GERAL: { original: string; motivo: string; substituicao: string }[] = [
  {
    original: "Leite de coco",
    motivo: "Coco",
    substituicao: "Leite de aveia (mais neutro) ou leite de arroz (mais leve, bom para sopas e cremes)",
  },
  {
    original: "Coco ralado / em flocos",
    motivo: "Coco",
    substituicao: "Aveia em flocos finos levemente tostada, ou canela em pó extra",
  },
  {
    original: "Água de coco",
    motivo: "Coco",
    substituicao: "Água filtrada com limão e hortelã",
  },
  {
    original: "Castanha de caju",
    motivo: "Castanha",
    substituicao: "Sementes de girassol ou abóbora torradas",
  },
  {
    original: "Castanha-do-pará",
    motivo: "Castanha",
    substituicao: "Sementes de girassol em quantidade equivalente",
  },
  {
    original: "Amendoim / pasta de amendoim",
    motivo: "Amendoim",
    substituicao: "Sementes de girassol ou pasta de girassol/abóbora sem adição",
  },
  {
    original: "Tahine (pasta de gergelim)",
    motivo: "Gergelim",
    substituicao: "Pasta de semente de girassol ou abóbora; ou mais azeite + limão no molho/homus",
  },
  {
    original: "Sementes de gergelim",
    motivo: "Gergelim",
    substituicao: "Sementes de girassol torradas",
  },
  {
    original: "Amaranto",
    motivo: "Acesso",
    substituicao: "Aveia em flocos ou quinoa, com tempo de cozimento parecido",
  },
  {
    original: "Kombucha",
    motivo: "Acesso",
    substituicao: "Chá verde sem açúcar ou água com limão e gengibre",
  },
  {
    original: "Chucrute",
    motivo: "Acesso",
    substituicao: "Repolho roxo fatiado fino com limão",
  },
  {
    original: "Acerola",
    motivo: "Acesso",
    substituicao: "Morango, kiwi ou laranja",
  },
  {
    original: "Biomassa de banana verde caseira",
    motivo: "Acesso",
    substituicao: "Purê pronto de banana verde ou banana amassada comum",
  },
];

export const CORINGA_HIPO: { categoria: string; alerta: string; seguro: string }[] = [
  {
    categoria: "Snacks rápidos",
    alerta: "Castanha de caju, amendoim, castanha-do-pará",
    seguro: "Sementes de girassol e de abóbora torradas, tâmaras",
  },
  {
    categoria: "Refeição de 15 min",
    alerta: "Homus comprado (geralmente leva tahine)",
    seguro: "Homus caseiro rápido: grão-de-bico de lata + azeite + limão + alho batidos",
  },
  {
    categoria: "Temperos",
    alerta: "—",
    seguro: "Toda a lista original (cúrcuma, gengibre, alho, limão, canela, coentro, salsinha) já é segura",
  },
  {
    categoria: "Bebidas",
    alerta: "Leite de coco caseiro, kombucha",
    seguro: "Leite de aveia caseiro, chá verde ou chás de ervas sem açúcar",
  },
];
