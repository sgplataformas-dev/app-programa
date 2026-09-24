import { Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ChevronLeft, Download, Sunrise, UtensilsCrossed, Moon, Info } from "lucide-react";
import { getIntakeMaisRecente } from "@/lib/active.functions";
import iogurte20Receitas from "@/assets/iogurte-bariatrico-20-receitas.pdf";

type Recomendacao = {
  colheres: number;
  resumo: string;
  refeicoes: { titulo: string; descricao: string; Icon: typeof Sunrise }[];
};

function recomendarColheres(peso: number | null | undefined): Recomendacao {
  if (typeof peso !== "number" || !isFinite(peso) || peso <= 0) {
    return {
      colheres: 2,
      resumo: "Sugestão padrão até registrarmos seu peso.",
      refeicoes: [
        { titulo: "Café da manhã", descricao: "1 colher de sopa", Icon: Sunrise },
        { titulo: "Almoço", descricao: "1 colher de sopa", Icon: UtensilsCrossed },
      ],
    };
  }
  if (peso <= 65) {
    return {
      colheres: 1,
      resumo: "Para o seu peso, 1 colher de sopa por dia é o suficiente.",
      refeicoes: [
        { titulo: "Café da manhã", descricao: "1 colher de sopa", Icon: Sunrise },
      ],
    };
  }
  if (peso <= 90) {
    return {
      colheres: 2,
      resumo: "Para o seu peso, 2 colheres de sopa por dia — no café da manhã, ou divididas entre café e almoço.",
      refeicoes: [
        { titulo: "Café da manhã", descricao: "1 colher de sopa", Icon: Sunrise },
        { titulo: "Almoço", descricao: "1 colher de sopa", Icon: UtensilsCrossed },
      ],
    };
  }
  return {
    colheres: 3,
    resumo: "Para o seu peso, 3 colheres de sopa por dia, diluídas nas 3 principais refeições.",
    refeicoes: [
      { titulo: "Café da manhã", descricao: "1 colher de sopa", Icon: Sunrise },
      { titulo: "Almoço", descricao: "1 colher de sopa", Icon: UtensilsCrossed },
      { titulo: "Jantar", descricao: "1 colher de sopa", Icon: Moon },
    ],
  };
}

export function Fase2Protocolo() {
  const fetchIntake = useServerFn(getIntakeMaisRecente);
  const { data } = useSuspenseQuery({
    queryKey: ["intake-maisrecente"],
    queryFn: () => fetchIntake(),
  });

  const peso = (() => {
    const v = data?.respostas?.peso;
    const n = typeof v === "string" ? Number(v) : v;
    return typeof n === "number" && isFinite(n) ? n : null;
  })();

  const rec = recomendarColheres(peso);

  return (
    <div className="px-6 py-6">
      <Link to="/protocolo" className="inline-flex items-center gap-1 text-sm text-primary">
        <ChevronLeft className="h-4 w-4" /> Voltar
      </Link>

      <h1 className="mt-4 text-2xl font-bold leading-tight">
        Fase 2 — Reativando GLP-1 e GIP com o Iogurte Bariátrico
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Agora começa a fase de reativar os hormônios da saciedade. O iogurte bariátrico vai te
        acompanhar todos os dias — e aqui está sua dose personalizada.
      </p>

      <section className="mt-6 rounded-2xl border border-primary bg-primary-soft p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">
          Sua dose diária
        </p>
        <p className="mt-2 text-2xl font-bold leading-tight">
          {rec.colheres} {rec.colheres === 1 ? "colher de sopa" : "colheres de sopa"} por dia
        </p>
        <p className="mt-2 text-sm text-foreground/80">{rec.resumo}</p>

        <div className="mt-4 space-y-2">
          {rec.refeicoes.map(({ titulo, descricao, Icon }) => (
            <div
              key={titulo}
              className="flex items-center gap-3 rounded-xl bg-background/60 p-3"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-primary">
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">{titulo}</p>
                <p className="text-xs text-muted-foreground">{descricao}</p>
              </div>
            </div>
          ))}
        </div>

        {peso ? (
          <p className="mt-3 text-xs text-muted-foreground">
            Baseado no seu peso registrado na anamnese ({peso} kg).
          </p>
        ) : (
          <p className="mt-3 text-xs text-muted-foreground">
            Atualize seu peso na anamnese para receber a recomendação personalizada.
          </p>
        )}
      </section>

      <section className="mt-6">
        <h2 className="text-lg font-bold">Seu guia prático</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          20 receitas para incluir o iogurte bariátrico na sua rotina e continuar o uso de forma
          gostosa e variada.
        </p>
        <a
          href={iogurte20Receitas}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition hover:border-primary"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/15 text-primary">
            <Download className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold">Iogurte Bariátrico ARI — 20 Receitas</p>
            <p className="text-xs text-muted-foreground">PDF · baixar / abrir</p>
          </div>
        </a>
      </section>

      <section className="mt-6">
        <Link
          to="/aulas/modulo/$moduloId"
          params={{ moduloId: "fase-2" }}
          className="flex h-12 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground"
        >
          Ver as aulas da Fase 2
        </Link>
      </section>

      <div className="mt-6 flex items-start gap-2 rounded-xl bg-gold/20 p-4 text-sm text-foreground">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-foreground/70" />
        <p>
          <strong>Importante:</strong> em caso de intolerâncias, alergias ou condições de saúde,
          consulte seu médico antes de iniciar o uso do iogurte bariátrico.
        </p>
      </div>

      <p className="mt-4 rounded-xl bg-muted p-3 text-xs text-muted-foreground">
        Conteúdo educacional baseado no protocolo do Programa ACTIVE. Não substitui acompanhamento
        médico ou nutricional.
      </p>
    </div>
  );
}