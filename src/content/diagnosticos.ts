export type IntakeRespostas = {
  idade?: number;
  peso?: number;
  altura?: number;
  pesoDesejado?: number;
  objetivos?: string[];
  condicoes?: string[];
  usaMedicamentos?: "sim" | "nao";
  medicamentos?: string[];
  medicamentosOutro?: string;
  bristol?: string;
  frequenciaIntestinal?: string;
  qualidadeSono?: string;
  horasSono?: number;
  refeicoesPorDia?: string;
  cafeDaManha?: string;
  restricoesAlimentares?: string[];
  restricoesOutro?: string;
  alcool?: string;
  mlAgua?: number;
};

export type PerfilDiagnostico = {
  titulo: string;
  paragrafos: string[];
};

export function escolherPerfil(r: IntakeRespostas): PerfilDiagnostico {
  // Score-based sobre sinais do novo quiz
  let score = 0;

  // Intestino — Bristol
  if (r.bristol === "1" || r.bristol === "2") score += 2; // constipação
  if (r.bristol === "6" || r.bristol === "7") score += 2; // diarreia
  if (r.bristol === "3") score += 1;

  // Frequência intestinal
  if (r.frequenciaIntestinal === "menos_3") score += 2;
  if (r.frequenciaIntestinal === "3_5") score += 1;

  // Sono
  if (r.qualidadeSono === "ruim" || r.qualidadeSono === "insonia") score += 2;
  if (r.qualidadeSono === "regular") score += 1;
  if (typeof r.horasSono === "number" && r.horasSono < 6) score += 1;

  // Hábitos alimentares
  if (r.cafeDaManha === "nunca") score += 2;
  if (r.cafeDaManha === "raramente") score += 1;
  if (r.refeicoesPorDia === "1_3") score += 1;

  // Álcool
  if (r.alcool === "mais_3x") score += 2;
  if (r.alcool === "menos_2x") score += 1;

  // Água
  if (typeof r.mlAgua === "number" && r.mlAgua < 1000) score += 1;

  if (score >= 6) {
    return {
      titulo: "Intestino Inflamado — Grau Moderado",
      paragrafos: [
        "Suas respostas indicam um padrão que vem sobrecarregando o seu intestino há um tempo. Isso é mais comum do que você imagina — e tem solução.",
        "Quando o intestino fica inflamado, o corpo armazena mais gordura, a fome aumenta e a disposição cai. É um ciclo que parece sem saída, mas que muda quando a gente troca os hábitos certos.",
        "Nas próximas semanas, vamos trabalhar em 4 fases que se complementam: primeiro desinflamar, depois reativar os hormônios da saciedade, regular sua microbiota e por fim consolidar tudo isso.",
        "Você não está sozinha nesse caminho. Vamos passo a passo, no seu ritmo.",
      ],
    };
  }

  if (score <= 2) {
    return {
      titulo: "Intestino em Recuperação — Grau Leve",
      paragrafos: [
        "Que ótimo! Suas respostas mostram que você já tem alguns hábitos saudáveis. Isso vai facilitar muito o seu caminho no Programa ACTIVE.",
        "Ainda assim, pequenos ajustes podem destravar a perda de peso e melhorar bastante a sua disposição.",
        "Nas próximas 4 fases, vamos refinar o que já está bom e te ajudar a alcançar o peso e a energia que você quer.",
        "Vamos juntas?",
      ],
    };
  }

  return {
    titulo: "Intestino Sobrecarregado — Grau Inicial",
    paragrafos: [
      "Suas respostas mostram que o seu intestino está pedindo atenção. Alguns hábitos do dia a dia podem estar causando inflamação sem você perceber.",
      "Mas calma: isso é totalmente reversível. O protocolo do Programa ACTIVE foi desenhado exatamente para esse momento.",
      "Vamos seguir 4 fases que se completam, começando pelos ajustes mais simples e gentis para o seu corpo se acostumar.",
      "Estou aqui com você em cada etapa.",
    ],
  };
}

export const FASES = [
  { numero: 1, titulo: "Combatendo a inflamação intestinal", liberaDia: 1 },
  { numero: 2, titulo: "Reativando GLP-1 e GIP com o Iogurte Bariátrico", liberaDia: 15 },
  { numero: 3, titulo: "Regulando a microbiota", liberaDia: 30 },
  { numero: 4, titulo: "Bônus", liberaDia: 45 },
];

export const OBJETIVOS_OPCOES = [
  "Perder peso",
  "Definição muscular",
  "Melhorar a saúde",
  "Elevar a autoestima",
];

export const CONDICOES_OPCOES = [
  "Diabetes",
  "Hipertensão",
  "Hipotireoidismo",
  "SOP (Síndrome dos Ovários Policísticos)",
  "Síndrome do intestino irritável",
  "Câncer",
  "Colesterol alto",
  "Ansiedade / Depressão",
  "Nenhuma das anteriores",
];

export const MEDICAMENTOS_OPCOES = [
  "Losartana / Anti-hipertensivo",
  "Metformina",
  "Levotiroxina (Puran / Synthroid)",
  "Omeprazol / Protetor gástrico",
  "Anticoncepcional",
  "Antidepressivo",
  "Sinvastatina / Atorvastatina",
  "Insulina",
  "Outro",
];

export const RESTRICOES_OPCOES = [
  "Intolerância à lactose",
  "Intolerância ao glúten",
  "Alergia a amendoim ou oleaginosas",
  "Outro",
  "Nenhuma",
];

export const BRISTOL_OPCOES = [
  { id: "1", titulo: "Tipo 1", descricao: "Bolinhas duras e separadas (constipação severa)" },
  { id: "2", titulo: "Tipo 2", descricao: "Formato de salsicha, mas com grumos (constipação leve)" },
  { id: "3", titulo: "Tipo 3", descricao: "Salsicha com rachaduras na superfície (normal)" },
  { id: "4", titulo: "Tipo 4", descricao: "Salsicha lisa e macia (ideal)" },
  { id: "5", titulo: "Tipo 5", descricao: "Pedaços macios com bordas definidas (transição para diarreia)" },
  { id: "6", titulo: "Tipo 6", descricao: "Pedaços moles e fofos (diarreia leve)" },
  { id: "7", titulo: "Tipo 7", descricao: "Totalmente líquido (diarreia severa)" },
];
