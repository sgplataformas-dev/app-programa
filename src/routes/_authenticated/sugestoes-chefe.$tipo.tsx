import { createFileRoute, useNavigate, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/sugestoes-chefe/$tipo")({
  component: SugestoesChefe,
  notFoundComponent: () => (
    <div className="p-6 text-center text-muted-foreground">Sugestão não encontrada.</div>
  ),
});

type Refeicao = "cafe" | "almoco" | "lanche" | "janta" | "sobremesa";

const OPCOES: { id: Refeicao; emoji: string; label: string }[] = [
  { id: "cafe", emoji: "☀️", label: "Sugestões pro café da manhã" },
  { id: "almoco", emoji: "🍽️", label: "Sugestões pro almoço" },
  { id: "lanche", emoji: "🥪", label: "Sugestões pro lanche da tarde" },
  { id: "janta", emoji: "🌙", label: "Sugestões pra janta" },
  { id: "sobremesa", emoji: "🍰", label: "Sugestões pra sobremesa" },
];

// Mapeia cada refeição para o módulo de bônus correspondente.
const BONUS_POR_REFEICAO: Record<Refeicao, string> = {
  cafe: "bonus-2-cafe",
  almoco: "bonus-3-almoco",
  lanche: "bonus-2-cafe", // não há bônus específico de lanche; usamos o de café
  janta: "bonus-4-jantar",
  sobremesa: "bonus-5-sobremesas",
};

function SugestoesChefe() {
  const navigate = useNavigate();
  const { tipo } = Route.useParams();
  if (tipo !== "atnn" && tipo !== "ari") throw notFound();

  const [escolha, setEscolha] = useState<Refeicao | null>(null);

  function avancar() {
    if (!escolha) return;
    const moduloId = BONUS_POR_REFEICAO[escolha];
    navigate({ to: "/aulas/modulo/$moduloId", params: { moduloId } });
  }

  const subtitulo =
    tipo === "atnn"
      ? "Vamos sugerir receitas do chefe livres de ATNNs para você."
      : "Vamos sugerir receitas do chefe ricas em ARIs para você.";

  return (
    <div className="px-6 pt-6 pb-40">
      {/* Progress */}
      <div className="mb-8">
        <div className="mb-2 flex items-end justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Sugestões do Chefe
          </span>
          <span className="text-[10px] font-bold text-primary">{escolha ? "100%" : "0%"}</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: escolha ? "100%" : "0%" }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold leading-tight text-foreground">
          Quais sugestões você está procurando agora?
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{subtitulo}</p>
      </div>

      {/* Options */}
      <ul className="space-y-3">
        {OPCOES.map((opt) => {
          const checked = escolha === opt.id;
          return (
            <li key={opt.id}>
              <button
                type="button"
                onClick={() => setEscolha(opt.id)}
                className={`group flex w-full items-center gap-4 rounded-2xl p-4 text-left shadow-sm transition-all active:scale-[0.98] ${
                  checked
                    ? "border-2 border-primary bg-primary-soft"
                    : "border border-border bg-card hover:border-primary/30"
                }`}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-base">
                  {opt.emoji}
                </span>
                <span
                  className={`flex-1 text-[15px] leading-snug ${
                    checked ? "font-semibold text-primary" : "font-medium text-foreground"
                  }`}
                >
                  {opt.label}
                </span>
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors ${
                    checked
                      ? "bg-primary text-primary-foreground"
                      : "border-2 border-border bg-background"
                  }`}
                >
                  {checked && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {/* Sticky footer */}
      <div className="fixed inset-x-0 bottom-16 z-40 mx-auto max-w-md bg-gradient-to-t from-background via-background to-transparent px-4 pb-4 pt-10">
        <Button
          className="h-14 w-full rounded-2xl text-base font-bold shadow-lg shadow-primary/20"
          onClick={avancar}
          disabled={!escolha}
        >
          <span>Ver sugestões</span>
          <ArrowRight className="ml-2 h-5 w-5 opacity-60" />
        </Button>
      </div>
    </div>
  );
}
