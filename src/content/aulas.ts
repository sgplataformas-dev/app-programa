import aula1Fase1Thumb from "@/assets/aula1-fase1-thumb.webp.asset.json";
import fase1Banner from "@/assets/fase1-banner.webp.asset.json";
import fase2Banner from "@/assets/fase2-banner.jpg.asset.json";
import fase3Banner from "@/assets/fase3-banner.png.asset.json";
import resumoAtnnsAris from "@/assets/resumo-atnns-aris.pdf.asset.json";
import aulaBrigadeiro from "@/assets/aula2-brigadeiro.jpg.asset.json";
import aulaNhoque from "@/assets/aula3-nhoque.jpg.asset.json";
import aulaDoceBiomassa from "@/assets/aula4-doce-biomassa.jpg.asset.json";
import aulaChevry from "@/assets/aula5-chevry.jpg.asset.json";
import almoco1 from "@/assets/almoco-1-panqueca-beterraba.jpg.asset.json";
import almoco2 from "@/assets/almoco-2-mocoto-cogumelos.jpg.asset.json";
import almoco3 from "@/assets/almoco-3-file-5-graos.jpg.asset.json";
import almoco4 from "@/assets/almoco-4-quiabo-agridoce.jpg.asset.json";
import almoco5 from "@/assets/almoco-5-panqueca-ora-pro-nobis.jpg.asset.json";
import almoco6 from "@/assets/almoco-6-almondega-quinoa.jpg.asset.json";
import almoco7 from "@/assets/almoco-7-strogonoff-abobrinha.jpg.asset.json";
import almoco8 from "@/assets/almoco-8-biomassa-nhoque.jpg.asset.json";
import cafe1 from "@/assets/cafe-1-chips-banana.jpg.asset.json";
import cafe2 from "@/assets/cafe-2-drink-tpm.jpg.asset.json";
import drinkTpmPdf from "@/assets/drink-tpm-hibisco-gengibre.pdf.asset.json";
import cafe3 from "@/assets/cafe-3-semente-abobora.jpg.asset.json";
import cafe4 from "@/assets/cafe-4-leite-vegetal.jpg.asset.json";
import jantar1 from "@/assets/jantar-1-risoto-quinoa.jpg.asset.json";
import jantar2 from "@/assets/jantar-2-arroz-negro.jpg.asset.json";
import jantar3 from "@/assets/jantar-3-enroladinho-almeirao.jpg.asset.json";
import jantar4 from "@/assets/jantar-4-macarrao-abobrinha.jpg.asset.json";
import pastas1 from "@/assets/pastas-1-molho-beterraba.jpg.asset.json";
import pastas2 from "@/assets/pastas-2-chevry.jpg.asset.json";
import pastas3 from "@/assets/pastas-3-maionese-dente-leao.jpg.asset.json";
import pastas4 from "@/assets/pastas-4-erva-baleeira.jpg.asset.json";
import pastas5 from "@/assets/pastas-5-pasta-amendoim.jpg.asset.json";
import pastas6 from "@/assets/pastas-6-tahine.jpg.asset.json";
import sobremesa1 from "@/assets/sobremesa-1-adocante-natural.jpg.asset.json";
import sobremesa2 from "@/assets/sobremesa-2-sorbet-manga.jpg.asset.json";
import sobremesa3 from "@/assets/sobremesa-3-doce-biomassa.jpg.asset.json";
import sobremesa4 from "@/assets/sobremesa-4-brigadeiro-natural.jpg.asset.json";
import fase2Aula1 from "@/assets/fase2-1-iogurte-parte1.jpg.asset.json";
import fase2Aula2 from "@/assets/fase2-2-iogurte-parte2.jpg.asset.json";
import iogurte20Receitas from "@/assets/iogurte-bariatrico-20-receitas.pdf.asset.json";
import audioIogurte from "@/assets/audio-iogurte-bariatrico.ogg.asset.json";
import bonus1Tintura from "@/assets/bonus1-tintura.jpg.asset.json";
import bonus1Aloe from "@/assets/bonus1-aloe.jpg.asset.json";
import bonus1Espinheira from "@/assets/bonus1-espinheira.jpg.asset.json";
import bonus1Tonico from "@/assets/bonus1-tonico.jpg.asset.json";
import planoColagenoPdf from "@/assets/plano-colageno-natural.pdf.asset.json";






// Catálogo de aulas no estilo Netflix.
// Edite títulos, descrições, URLs de vídeos e PDFs livremente.

export type MaterialExtra = {
  titulo: string;
  url: string;
  descricao?: string;
};

export type CtaConfig = {
  label: string;
  to: string;
  lockWhenQuizFase1Completo?: boolean;
};

export type Aula = {
  id: string;
  titulo: string;
  descricao: string;
  duracao?: string;
  videoUrl: string;
  pdfUrl?: string;
  thumbnailUrl?: string;
  materiais?: MaterialExtra[];
  cta?: CtaConfig;
  vturbId?: string;
};

export type Modulo = {
  id: string; // usado como "série"
  numero?: number;
  titulo: string;
  subtitulo?: string;
  descricao: string;
  liberada: boolean;
  bannerUrl?: string;
  materiais?: MaterialExtra[];
  audio?: { url: string; mensagem: string };
  aulas: Aula[];
};

export type Categoria = {
  slug: string;
  titulo: string;
  modulos: Modulo[];
};

const vazio = { videoUrl: "", pdfUrl: "" };

export const CATEGORIAS: Categoria[] = [
  {
    slug: "protocolo",
    titulo: "Protocolo de Reativação Hormonal",
    modulos: [
      {
        id: "fase-1",
        numero: 1,
        titulo: "Fase 1",
        subtitulo: "Combatendo a inflamação intestinal",
        descricao:
          "Os primeiros 10 dias do protocolo. Reduza a inflamação e prepare o intestino para reativar seus hormônios.",
        liberada: true,
        bannerUrl: fase1Banner.url,
        aulas: [
          {
            id: "fase-1-intro",
            titulo: "Aula 1: Os ATNNs e ARIs",
            descricao:
              "Nessa aula, o professor Fernando mostra como funcionará os primeiros dez dias do protocolo.\n\nE vai explicar exatamente qual é a diferença entre os ATNNs e os ARIs e como usá-los ao seu favor para desinflamar seu intestino.",
            duracao: "12:40",
            cta: { label: "Iniciar Fase 1", to: "/quiz-fase-1", lockWhenQuizFase1Completo: true },
            vturbId: "vid-6a2e328f66b98f0059f888a4",
            thumbnailUrl: aula1Fase1Thumb.url,
            materiais: [
              {
                titulo: "Resumo: ATNNs e ARIs",
                url: resumoAtnnsAris.url,
                descricao: "PDF com o resumo da aula",
              },
            ],
            ...vazio,
          },
        ],
      },
      {
        id: "fase-2",
        numero: 2,
        titulo: "Fase 2",
        subtitulo: "Reativando a produção de GLP-1 e GIP",
        descricao: "O iogurte bariátrico e a reativação dos hormônios da saciedade.",
        liberada: true,
        bannerUrl: fase2Banner.url,
        audio: {
          url: audioIogurte.url,
          mensagem: "Antes de assistir as aulas ouça esse áudio com muita atenção",
        },
        aulas: [
          {
            id: "fase-2-iogurte-parte1",
            titulo: "Aula 1 — Iogurte Bariátrico - Parte 1",
            descricao: "Aprenda a preparar o iogurte bariátrico: ingredientes, fermentação e os primeiros passos para reativar seus hormônios da saciedade.",
            vturbId: "vid-6a261f4b7ff4029957f55d07",
            thumbnailUrl: fase2Aula1.url,
            materiais: [
              {
                titulo: "Iogurte Bariátrico ARI — 20 Receitas",
                url: iogurte20Receitas.url,
                descricao: "PDF com 20 receitas para incluir o iogurte bariátrico na sua rotina.",
              },
            ],
            ...vazio,
          },
          {
            id: "fase-2-iogurte-parte2",
            titulo: "Aula 2 — Iogurte Bariátrico - Parte 2",
            descricao: "Finalização do iogurte bariátrico, dicas de conservação e formas práticas de incluir na sua rotina diária.",
            vturbId: "vid-6a345689453bd9d641ac00cf",
            thumbnailUrl: fase2Aula2.url,
            materiais: [
              {
                titulo: "Iogurte Bariátrico ARI — 20 Receitas",
                url: iogurte20Receitas.url,
                descricao: "PDF com 20 receitas para incluir o iogurte bariátrico na sua rotina.",
              },
            ],
            ...vazio,
          },
        ],
      },
      {
        id: "fase-3",
        numero: 3,
        titulo: "Fase 3",
        subtitulo: "Regulando a microbiota intestinal",
        descricao: "Fibras, prebióticos e probióticos para uma microbiota saudável.",
        liberada: true,
        bannerUrl: fase3Banner.url,
        aulas: [
          {
            id: "fase-3-brigadeiro",
            titulo: "Aula 1 — Como Preparar Brigadeiro Natural",
            descricao:
              "Aprenda a fazer um brigadeiro 100% natural, sem açúcar refinado e sem glúten — uma sobremesa que nutre e satisfaz.",
            vturbId: "vid-6a18f33771b3640e5e7ec1af",
            thumbnailUrl: aulaBrigadeiro.url,
            ...vazio,
          },
          {
            id: "fase-3-nhoque",
            titulo: "Aula 2 — Como Preparar Biomassa de Nhoque",
            descricao:
              "Receita prática de nhoque feito com biomassa de banana verde, leve e funcional para sua rotina.",
            vturbId: "vid-6a6172795349fb69c3ddb9c7",
            thumbnailUrl: aulaNhoque.url,
            ...vazio,
          },
          {
            id: "fase-3-doce-biomassa",
            titulo: "Aula 3 — Como Preparar Doce de Biomassa",
            descricao:
              "Um doce cremoso, saudável e naturalmente delicioso feito com biomassa de banana verde.",
            vturbId: "vid-6a18f28724e6a14613b372ed",
            thumbnailUrl: aulaDoceBiomassa.url,
            ...vazio,
          },
          {
            id: "fase-3-chevry",
            titulo: "Aula 4 — Como Preparar Chevry Natural",
            descricao:
              "Aprenda a preparar um chevry natural, simples e nutritivo, para enriquecer suas refeições do dia a dia.",
            vturbId: "vid-6a18f1b5569a7d864c162d5a",
            thumbnailUrl: aulaChevry.url,
            ...vazio,
          },
        ],
      },
    ],
  },
  {
    slug: "colageno",
    titulo: "Flacidez Nunca Mais",
    modulos: [
      {
        id: "colageno-natural",
        numero: 1,
        titulo: "Flacidez Nunca Mais",
        subtitulo: "Firmeza e elasticidade da pele de dentro pra fora",
        descricao:
          "Um plano completo para estimular a produção natural de colágeno do seu corpo — combatendo flacidez, rugas e fortalecendo cabelos, unhas e articulações. Baixe o PDF e acompanhe as aulas que serão liberadas em breve.",
        liberada: true,
        materiais: [
          {
            titulo: "Flacidez Nunca Mais — PDF",
            url: planoColagenoPdf.url,
            descricao: "Material completo em PDF para você baixar agora.",
          },
        ],
        aulas: [
          {
            id: "colageno-teorica",
            titulo: "Aula Teórica — Flacidez Nunca Mais",
            descricao:
              "Aula teórica do Flacidez Nunca Mais. Será liberada no próximo domingo.",
            vturbId: "vid-6a4f184ff7eb8a77289de011",
            materiais: [
              {
                titulo: "Flacidez Nunca Mais — PDF",
                url: planoColagenoPdf.url,
                descricao: "Material completo em PDF para você baixar agora.",
              },
            ],
            ...vazio,
          },
          {
            id: "colageno-pratica",
            titulo: "Aula Prática — Flacidez Nunca Mais",
            descricao:
              "Aula prática do Flacidez Nunca Mais. Será liberada no domingo seguinte ao da aula teórica.",
            vturbId: "vid-6a70b3161c982c86efa32beb",
            materiais: [
              {
                titulo: "Flacidez Nunca Mais — PDF",
                url: planoColagenoPdf.url,
                descricao: "Material completo em PDF para você baixar agora.",
              },
            ],
            ...vazio,
          },


        ],
      },
    ],
  },
  {
    slug: "bonus",
    titulo: "Bônus",
    modulos: [
      {
        id: "bonus-1-farmacia",
        numero: 1,
        titulo: "Farmácia Nunca Mais",
        descricao:
          "Receitas caseiras simples (e baratas) para você nunca mais precisar gastar dinheiro com suplementos.",
        liberada: true,
        aulas: [
          {
            id: "bonus-1-tintura",
            titulo: "Aula 1 — Extrato de Plantas - Tintura",
            descricao: "Aprenda a preparar uma tintura (extrato de plantas) caseira para potencializar os benefícios de ervas medicinais de forma simples e eficaz.",
            vturbId: "vid-6a346efff54c50898d8f6a86",
            thumbnailUrl: bonus1Tintura.url,
            ...vazio,
          },
          {
            id: "bonus-1-pomada-aloe",
            titulo: "Aula 2 — Pomada de Aloe Vera",
            descricao: "Receita prática de pomada hidratante e cicatrizante feita com Aloe Vera, ideal para cuidados diários com a pele.",
            vturbId: "vid-6a346ed39c2599c86e02c365",
            thumbnailUrl: bonus1Aloe.url,
            ...vazio,
          },
          {
            id: "bonus-1-fermentando-espinheira",
            titulo: "Aula 3 — Fermentando Espinheira",
            descricao: "Descubra como fermentar espinheira para criar um suplemento natural rico em nutrientes e fácil de incluir na rotina.",
            vturbId: "vid-6a346e8998cf7db004874412",
            thumbnailUrl: bonus1Espinheira.url,
            ...vazio,
          },
          {
            id: "bonus-1-tonico-capilar",
            titulo: "Aula 4 — Tônico Capilar",
            descricao: "Tônico capilar caseiro para fortalecimento dos fios e saúde do couro cabeludo com ingredientes naturais acessíveis.",
            vturbId: "vid-6a346e68a7b4179972eb7117",
            thumbnailUrl: bonus1Tonico.url,
            ...vazio,
          },
        ],
      },
      {
        id: "bonus-2-cafe",
        numero: 2,
        titulo: "Café da Manhã ACTIVE",
        descricao:
          "Sugestões simples, baratas e saborosas do professor Fernando Jardim para um café da manhã livre de ATNNs.",
        liberada: true,
        aulas: [
          {
            id: "bonus-2-chips-banana",
            titulo: "Aula 1 — Chips de Banana Verde",
            descricao: "Aprenda a fazer chips crocantes de banana verde, um snack saudável e livre de ATNNs para o seu café da manhã.",
            vturbId: "vid-6a345418d1798d046586dd75",
            thumbnailUrl: cafe1.url,
            ...vazio,
          },
          {
            id: "bonus-2-drink-tpm",
            titulo: "Aula 2 — Drink TPM",
            descricao: "Uma bebida funcional e reconfortante, perfeita para os dias de TPM, com ingredientes que ajudam a reduzir a retenção de líquidos.",
            vturbId: "vid-6a3453e895b144aa5b3e3c38",
            thumbnailUrl: cafe2.url,
            ...vazio,
            materiais: [
              {
                titulo: "Drink TPM — Hibisco e Gengibre (PDF)",
                url: drinkTpmPdf.url,
                descricao: "Receita completa em PDF",
              },
            ],
          },
          {
            id: "bonus-2-semente-abobora",
            titulo: "Aula 3 — Semente de Abóbora",
            descricao: "Descubra como preparar e consumir sementes de abóbora de forma simples e nutritiva no seu café da manhã.",
            vturbId: "vid-6a3453c966e88e75bd60a519",
            thumbnailUrl: cafe3.url,
            ...vazio,
          },
          {
            id: "bonus-2-leite-vegetal",
            titulo: "Aula 4 — Leite Vegetal",
            descricao: "Receita prática de leite vegetal caseiro, livre de lactose e rico em nutrientes para complementar suas refeições.",
            vturbId: "vid-6a3453a54dfbb6f4694d734f",
            thumbnailUrl: cafe4.url,
            ...vazio,
          },
        ],
      },
      {
        id: "bonus-3-almoco",
        numero: 3,
        titulo: "O Almoço do Chefe",
        descricao:
          "Receitas incríveis (e diversas) para um almoço gostoso, barato e saudável — que mantém você com o corpo magro pra sempre.",
        liberada: true,
        aulas: [
          {
            id: "bonus-3-panqueca-beterraba",
            titulo: "Aula 1 — Panqueca de Beterraba",
            descricao: "Receita de panqueca de beterraba: leve, nutritiva e cheia de sabor para o almoço.",
            vturbId: "vid-6a3451d71bb1a6b688f3f884",
            thumbnailUrl: almoco1.url,
            ...vazio,
          },
          {
            id: "bonus-3-mocoto-cogumelos",
            titulo: "Aula 2 — Mocotó de Cogumelos",
            descricao: "Uma versão saudável e plant-based do clássico mocotó, feita com cogumelos.",
            vturbId: "vid-6a3451aae382c517d033bdbd",
            thumbnailUrl: almoco2.url,
            ...vazio,
          },
          {
            id: "bonus-3-file-5-graos",
            titulo: "Aula 3 — Filé de 5 Grãos",
            descricao: "Filé vegetal feito com 5 grãos: rico em proteínas, fibras e muito saboroso.",
            vturbId: "vid-6a34517b9c2599c86e02ac2a",
            thumbnailUrl: almoco3.url,
            ...vazio,
          },
          {
            id: "bonus-3-quiabo-agridoce",
            titulo: "Aula 4 — Quiabo Agridoce de Jasmin",
            descricao: "Quiabo agridoce com arroz jasmin: combinação equilibrada e cheia de sabor.",
            vturbId: "vid-6a34513866e88e75bd60a26a",
            thumbnailUrl: almoco4.url,
            ...vazio,
          },
          {
            id: "bonus-3-panqueca-ora-pro-nobis",
            titulo: "Aula 5 — Panqueca de Ora-Pro-Nobis",
            descricao: "Panqueca verde feita com ora-pro-nobis, uma PANC rica em proteína vegetal.",
            vturbId: "vid-6a3451158a324fd18f7d9e41",
            thumbnailUrl: almoco5.url,
            ...vazio,
          },
          {
            id: "bonus-3-almondega-quinoa",
            titulo: "Aula 6 — Almôndega de Quinoa",
            descricao: "Almôndegas de quinoa ao molho de tomate: prática, nutritiva e deliciosa.",
            vturbId: "vid-6a3450f79c2599c86e02ab95",
            thumbnailUrl: almoco6.url,
            ...vazio,
          },
          {
            id: "bonus-3-strogonoff-abobrinha",
            titulo: "Aula 7 — Strogonoff de Abobrinha",
            descricao: "Versão leve do strogonoff feito com abobrinha: cremoso, saboroso e saudável.",
            vturbId: "vid-6a3450c71bb1a6b688f3f7d4",
            thumbnailUrl: almoco7.url,
            ...vazio,
          },
          {
            id: "bonus-3-biomassa-nhoque",
            titulo: "Aula 8 — Biomassa de Banana Verde",
            descricao: "Nhoque preparado com biomassa de banana verde: funcional, leve e delicioso.",
            vturbId: "vid-6a18f3aba1389edacac818a4",
            thumbnailUrl: almoco8.url,
            ...vazio,
          },
        ],
      },
      {
        id: "bonus-4-jantar",
        numero: 4,
        titulo: "O Jantar do Chefe",
        descricao:
          "Pratos incríveis que você pode preparar no seu jantar para ter uma noite de sono reparador que vai manter seu metabolismo ativo queimando gordura pra você.",
        liberada: true,
        aulas: [
          {
            id: "bonus-4-risoto-quinoa",
            titulo: "Aula 1 — Risoto de Quínoa",
            descricao: "Risoto cremoso de quinoa: nutritivo, leve e perfeito para um jantar saudável e reconfortante.",
            vturbId: "vid-6a345518453bd9d641abffd8",
            thumbnailUrl: jantar1.url,
            ...vazio,
          },
          {
            id: "bonus-4-arroz-negro",
            titulo: "Aula 2 — Arroz Negro",
            descricao: "Arroz negro com legumes: rico em antioxidantes e fibras, ideal para um jantar leve e nutritivo.",
            vturbId: "vid-6a3454f78a324fd18f7da2cb",
            thumbnailUrl: jantar2.url,
            ...vazio,
          },
          {
            id: "bonus-4-enroladinho-almeirao",
            titulo: "Aula 3 — Enroladinheiro Almeirão",
            descricao: "Enroladinhos de almeirão recheados: uma opção criativa, saborosa e cheia de nutrientes para o jantar.",
            vturbId: "vid-6a3454d54dfbb6f4694d7417",
            thumbnailUrl: jantar3.url,
            ...vazio,
          },
          {
            id: "bonus-4-macarrao-abobrinha",
            titulo: "Aula 4 — Macarrão de Abobrinha",
            descricao: "Macarrão de abobrinha ao molho de tomate: leve, funcional e delicioso para encerrar o dia com saúde.",
            vturbId: "vid-6a3454b8e382c517d033c0d7",
            thumbnailUrl: jantar4.url,
            ...vazio,
          },
        ],
      },
      {
        id: "bonus-5-sobremesas",
        numero: 5,
        titulo: "Sobremesas Emagrecedoras",
        descricao:
          "Quem disse que você precisa cortar doce? Uma lista diversa de sobremesas incríveis como sorvete, chocolate e doce de leite — que te ajudam a emagrecer ainda mais rápido.",
        liberada: true,
        aulas: [
          {
            id: "bonus-5-adocante-natural",
            titulo: "Aula 1 — Adoçante Natural",
            descricao: "Aprenda a preparar um adoçante natural caseiro, livre de açúcar refinado e químicos, perfeito para substituir o açúcar em todas as suas receitas.",
            vturbId: "vid-6a34565bd1798d046586dfac",
            thumbnailUrl: sobremesa1.url,
            ...vazio,
          },
          {
            id: "bonus-5-sorbet-manga",
            titulo: "Aula 2 — Sorbet de Manga",
            descricao: "Sorbet refrescante de manga feito com ingredientes naturais: uma sobremesa tropical, leve e deliciosa para saborear sem culpa.",
            vturbId: "vid-6a34564095b144aa5b3e3e18",
            thumbnailUrl: sobremesa2.url,
            ...vazio,
          },
          {
            id: "bonus-5-doce-biomassa",
            titulo: "Aula 3 — Doce de Biomassa",
            descricao: "Doce cremoso e funcional feito com biomassa de banana verde: uma sobremesa saudável que nutre e satisfaz o paladar.",
            vturbId: "vid-6a345627e382c517d033c1a3",
            thumbnailUrl: sobremesa3.url,
            ...vazio,
          },
          {
            id: "bonus-5-brigadeiro-natural",
            titulo: "Aula 4 — Brigadeiro Natural",
            descricao: "Brigadeiro 100% natural, sem açúcar refinado e sem glúten: a sobremesa brasileira que você ama, reinventada de forma saudável.",
            vturbId: "vid-6a34560b453bd9d641ac0070",
            thumbnailUrl: sobremesa4.url,
            ...vazio,
          },
        ],
      },
      {
        id: "bonus-6-pastas-molhos",
        numero: 6,
        titulo: "Pastas e Molhos",
        descricao:
          "Molhos, pastas e preparações caseiras que transformam qualquer refeição em uma explosão de sabor e saúde.",
        liberada: true,
        aulas: [
          {
            id: "bonus-6-molho-beterraba",
            titulo: "Aula 1 — Molho de Beterraba",
            descricao: "Molho de beterraba caseiro: vibrante, nutritivo e perfeito para acompanhar saladas, bowls e pratos do dia a dia.",
            vturbId: "vid-6a3455ec8a324fd18f7da3a0",
            thumbnailUrl: pastas1.url,
            ...vazio,
          },
          {
            id: "bonus-6-chevry",
            titulo: "Aula 2 — Chevry",
            descricao: "Aprenda a fazer chevry, uma pasta fermentada de castanhas ou sementes: versátil, probiótica e cheia de umami.",
            vturbId: "vid-6a3455ba4dfbb6f4694d74c7",
            thumbnailUrl: pastas2.url,
            ...vazio,
          },
          {
            id: "bonus-6-maionese-dente-leao",
            titulo: "Aula 3 — Maionese de Dente de Leão",
            descricao: "Maionese verde e funcional feita com dente-de-leão: uma alternativa saudável e repleta de benefícios.",
            vturbId: "vid-6a34559c98cf7db00487345f",
            thumbnailUrl: pastas3.url,
            ...vazio,
          },
          {
            id: "bonus-6-erva-baleeira",
            titulo: "Aula 4 — Erva Baleeira",
            descricao: "Descubra como preparar erva baleeira, um tempero medicinal que eleva o sabor e o valor nutricional das refeições.",
            vturbId: "vid-6a3455741bb1a6b688f3fb70",
            thumbnailUrl: pastas4.url,
            ...vazio,
          },
          {
            id: "bonus-6-pasta-amendoim",
            titulo: "Aula 5 — Pasta de Amendoim",
            descricao: "Pasta de amendoim caseira: sem aditivos, rica em proteína vegetal e óleos saudáveis — ideal para o dia a dia.",
            vturbId: "vid-6a345553453bd9d641ac0004",
            thumbnailUrl: pastas5.url,
            ...vazio,
          },
          {
            id: "bonus-6-tahine",
            titulo: "Aula 6 — Tahine",
            descricao: "Tahine artesanal de gergelim: cremoso, nutritivo e indispensável para hummus, molhos e preparações orientais.",
            vturbId: "vid-6a3455394dfbb6f4694d7476",
            thumbnailUrl: pastas6.url,
            ...vazio,
          },
        ],
      },
    ],
  },
];

// Acesso plano para módulos e aulas
export const MODULOS: Modulo[] = CATEGORIAS.flatMap((c) => c.modulos);

export function findModulo(id: string): { modulo: Modulo; categoria: Categoria } | null {
  for (const c of CATEGORIAS) {
    const m = c.modulos.find((x) => x.id === id);
    if (m) return { modulo: m, categoria: c };
  }
  return null;
}

export function findAula(id: string): { aula: Aula; modulo: Modulo } | null {
  for (const c of CATEGORIAS) {
    for (const m of c.modulos) {
      const a = m.aulas.find((x) => x.id === id);
      if (a) return { aula: a, modulo: m };
    }
  }
  return null;
}

// Listas usadas no quiz da Fase 1 — agrupadas por categoria.
export type GrupoOpcoes = { categoria: string; emoji: string; itens: string[] };

export const ATNN_GRUPOS: GrupoOpcoes[] = [
  {
    categoria: "Glúten e Derivados",
    emoji: "🌾",
    itens: [
      "Pão francês, pão de forma, bisnaguinha",
      "Macarrão convencional de trigo",
      "Biscoitos, bolachas, bolos e tortas",
      "Farinha de trigo branca",
      "Cerveja e bebidas de cevada",
    ],
  },
  {
    categoria: "Laticínios",
    emoji: "🥛",
    itens: [
      "Leite de vaca (integral ou desnatado)",
      "Queijo amarelo, mussarela, parmesão",
      "Iogurte convencional adoçado",
      "Manteiga e creme de leite",
      "Sorvete e sobremesas lácteas",
    ],
  },
  {
    categoria: "Carnes Vermelhas e Processadas",
    emoji: "🥩",
    itens: [
      "Carne bovina (costela, picanha, hambúrguer)",
      "Salsicha, linguiça, mortadela, presunto",
      "Bacon, calabresa, salame, pepperoni",
      "Frango convencional industrializado",
    ],
  },
  {
    categoria: "Açúcar e Adoçantes",
    emoji: "🍬",
    itens: [
      "Açúcar branco refinado",
      "Açúcar mascavo, demerara e mel em excesso",
      "Refrigerantes e sucos industriais",
      "Aspartame, sacarina, ciclamato",
      "Achocolatados e néctares industriais",
    ],
  },
  {
    categoria: "Ultraprocessados e Fast Food",
    emoji: "📦",
    itens: [
      "Salgadinhos de pacote",
      "Macarrão instantâneo e sopas em pó",
      "Nuggets, empanados industriais",
      "Pizza e lasanha congeladas",
      "Cereais matinais açucarados",
      "Barras de cereal industriais",
    ],
  },
  {
    categoria: "Óleos Ruins e Gorduras",
    emoji: "🧴",
    itens: [
      "Óleo de soja, milho e girassol refinados",
      "Margarina e gordura vegetal hidrogenada",
      "Fritura de imersão (qualquer alimento)",
    ],
  },
  {
    categoria: "Álcool e Estimulantes",
    emoji: "🍺",
    itens: [
      "Bebidas alcoólicas (qualquer tipo)",
      "Energéticos (Red Bull, Monster etc.)",
      "Café em excesso",
    ],
  },
  {
    categoria: "Outros Frequentemente Ignorados",
    emoji: "🧂",
    itens: [
      "Temperos artificiais e caldos em cubo",
      "Molho shoyu industrializado",
      "Molhos prontos (ketchup, maionese industrial)",
    ],
  },
];

export const ARI_GRUPOS: GrupoOpcoes[] = [
  {
    categoria: "Frutas Reparadoras",
    emoji: "🍌",
    itens: [
      "Mamão papaia",
      "Banana verde (biomassa ou cozida)",
      "Abacaxi",
      "Manga",
      "Acerola",
      "Maracujá",
      "Goiaba vermelha",
      "Caju (fruta e castanha)",
      "Abacate",
      "Melancia e melão",
    ],
  },
  {
    categoria: "Verduras e Folhas",
    emoji: "🥬",
    itens: [
      "Couve-manteiga",
      "Rúcula",
      "Espinafre",
      "Agrião",
      "Chicória e almeirão",
      "Alface roxa",
      "Salsinha e coentro frescos",
    ],
  },
  {
    categoria: "Legumes e Tubérculos",
    emoji: "🥕",
    itens: [
      "Batata-doce (especialmente a roxa)",
      "Cenoura",
      "Beterraba",
      "Abóbora cabotiã e moranga",
      "Mandioca cozida",
      "Berinjela",
      "Chuchu e abobrinha",
    ],
  },
  {
    categoria: "Leguminosas",
    emoji: "🫘",
    itens: [
      "Feijão carioca e preto",
      "Lentilha",
      "Grão-de-bico",
      "Ervilha verde ou seca",
      "Feijão azuki e fradinho",
    ],
  },
  {
    categoria: "Grãos Integrais Sem Glúten",
    emoji: "🌾",
    itens: [
      "Arroz integral",
      "Aveia sem glúten",
      "Quinoa",
      "Milho em espiga ou fubá integral",
      "Tapioca (fécula de mandioca)",
      "Amaranto",
    ],
  },
  {
    categoria: "Sementes e Oleaginosas",
    emoji: "🌰",
    itens: [
      "Linhaça dourada ou marrom (moída)",
      "Chia",
      "Gergelim e tahine",
      "Castanha-do-pará",
      "Castanha de caju in natura",
      "Amendoim in natura ou pasta sem adição",
      "Coco ralado seco e óleo de coco virgem",
    ],
  },
  {
    categoria: "Temperos Funcionais e Fermentados",
    emoji: "🌶️",
    itens: [
      "Cúrcuma (açafrão-da-terra)",
      "Gengibre fresco",
      "Alho cru",
      "Cebola roxa e amarela",
      "Pimenta-do-reino moída na hora",
      "Canela em pó (de preferência Ceylon)",
      "Vinagre de maçã orgânico (com mãe)",
      "Kombucha artesanal",
      "Chucrute e picles lactofermentado caseiro",
      "Azeite de oliva extravirgem",
    ],
  },
];

// Listas planas (compatibilidade com persistência existente).
export const ATNN_OPTIONS: string[] = ATNN_GRUPOS.flatMap((g) => g.itens);
export const ARI_OPTIONS: string[] = ARI_GRUPOS.flatMap((g) => g.itens);
