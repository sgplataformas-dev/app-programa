import { CATEGORIAS } from "@/content/aulas";

/**
 * Busca simples do app: digita um tema ("iogurte bariátrico", "alimentos",
 * "flacidez"...) e cai direto na aula ou página certa. Dois tipos de item:
 *  - Gerado automaticamente a partir de CATEGORIAS (uma entrada por aula) —
 *    sempre que uma aula nova entrar em aulas.ts, já fica buscável sozinha.
 *  - Curado à mão, pra páginas que não são uma aula específica (Protocolo,
 *    Flacidez, lista de compras, perfil) — o texto das aulas não cobre
 *    palavras como "alimentos" ou "dieta", que remetem à página toda.
 */

export type SearchResult = {
  id: string;
  titulo: string;
  subtitulo?: string;
  to: string;
  params?: Record<string, string>;
};

type SearchEntry = SearchResult & { searchText: string };

/** Remove acento e caixa — "Alimentação" e "alimentacao" batem igual. */
function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

const CURATED_ENTRIES: (SearchResult & { keywords: string[] })[] = [
  {
    id: "page-protocolo",
    titulo: "Seu Protocolo",
    subtitulo: "Plano alimentar 10 dias, trocas e lista de compras",
    to: "/protocolo",
    keywords: [
      "protocolo",
      "plano alimentar",
      "alimentos",
      "alimentacao",
      "dieta",
      "cardapio",
      "refeicoes",
      "comida",
      "almoco",
      "jantar",
      "cafe da manha",
      "ari",
      "atnn",
      "lista de compras",
      "ingredientes",
      "compras",
      "trocas hipoalergenicas",
      "substituicoes",
      "alergia",
    ],
  },
  {
    id: "page-flacidez",
    titulo: "Flacidez Nunca Mais",
    subtitulo: "Programa de colágeno, pele e flacidez",
    to: "/flacidez",
    keywords: [
      "flacidez",
      "colageno",
      "pele",
      "rugas",
      "elasticidade",
      "firmeza",
      "cabelo",
      "unha",
      "articulacao",
    ],
  },
  {
    id: "page-aulas",
    titulo: "Aulas Bônus",
    subtitulo: "Catálogo completo de aulas e receitas",
    to: "/aulas",
    keywords: ["aulas", "bonus", "receitas", "catalogo", "videos"],
  },
  {
    id: "page-perfil",
    titulo: "Perfil",
    subtitulo: "Seus dados e configurações",
    to: "/perfil",
    keywords: ["perfil", "conta", "dados", "configuracoes", "ajustes"],
  },
];

function buildIndex(): SearchEntry[] {
  const entries: SearchEntry[] = [];

  for (const categoria of CATEGORIAS) {
    for (const modulo of categoria.modulos) {
      for (const aula of modulo.aulas) {
        entries.push({
          id: `aula-${aula.id}`,
          titulo: aula.titulo,
          subtitulo: modulo.titulo,
          to: "/aulas/$lessonId",
          params: { lessonId: aula.id },
          searchText: normalize(`${aula.titulo} ${aula.descricao} ${modulo.titulo} ${modulo.subtitulo ?? ""}`),
        });
      }
    }
  }

  for (const curated of CURATED_ENTRIES) {
    entries.push({
      id: curated.id,
      titulo: curated.titulo,
      subtitulo: curated.subtitulo,
      to: curated.to,
      params: curated.params,
      searchText: normalize(`${curated.titulo} ${curated.subtitulo ?? ""} ${curated.keywords.join(" ")}`),
    });
  }

  return entries;
}

// Construído uma vez só — CATEGORIAS é estático, não muda em runtime.
const INDEX = buildIndex();

/**
 * Pontua cada item pela quantidade de PALAVRAS da busca que aparecem no
 * texto indexado (substring, não exige palavra inteira — "iogurt" já bate
 * com "iogurte"). Ordena do mais relevante pro menos, devolve só quem bateu
 * pelo menos uma palavra.
 */
export function searchContent(query: string, limit = 5): SearchResult[] {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  const scored = INDEX.map((entry) => {
    const score = words.reduce((sum, word) => sum + (entry.searchText.includes(word) ? 1 : 0), 0);
    return { entry, score };
  }).filter((s) => s.score > 0);

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map(({ entry }) => ({
    id: entry.id,
    titulo: entry.titulo,
    subtitulo: entry.subtitulo,
    to: entry.to,
    params: entry.params,
  }));
}
