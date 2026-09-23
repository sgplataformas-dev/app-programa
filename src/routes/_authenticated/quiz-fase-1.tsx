import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ATNN_GRUPOS, ARI_GRUPOS } from "@/content/aulas";
import { salvarQuizFase1 } from "@/lib/active.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/quiz-fase-1")({
  component: QuizFase1,
});

function QuizFase1() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const salvar = useServerFn(salvarQuizFase1);
  const [step, setStep] = useState(0);
  const [atnn, setAtnn] = useState<string[]>([]);
  const [ari, setAri] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  function toggle(list: string[], setList: (v: string[]) => void, item: string) {
    setList(list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);
  }

  async function avancar() {
    if (step === 0) {
      setStep(1);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setLoading(true);
    try {
      await salvar({ data: { evitar_atnn: atnn, evitar_ari: ari } });
      await qc.refetchQueries({ queryKey: ["dashboard"] });
      navigate({ to: "/hoje" });
    } catch (e) {
      console.error(e);
      toast.error("Não consegui salvar agora. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  const pergunta =
    step === 0
      ? {
          titulo: "Dos ATNNs, quais você não consegue ficar sem comer?",
          ajuda:
            "Marque os Alimentos Tóxicos Não Necessários que mais aparecem na sua rotina. Vamos olhar com carinho para esses.",
          grupos: ATNN_GRUPOS,
          selected: atnn,
          setSelected: setAtnn,
        }
      : {
          titulo: "Dos ARIs, quais você tem alergia, restrição ou não gosta?",
          ajuda:
            "Marque os Alimentos Reparadores Intestinais que você prefere evitar. Vamos sugerir sempre as outras opções.",
          grupos: ARI_GRUPOS,
          selected: ari,
          setSelected: setAri,
        };

  const progresso = Math.round(((step + 1) / 2) * 100);

  return (
    <div className="px-6 pt-6 pb-40">
      {/* Progress */}
      <div className="mb-8">
        <div className="mb-2 flex items-end justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Passo {step + 1} de 2
          </span>
          <span className="text-[10px] font-bold text-primary">{progresso}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${progresso}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold leading-tight text-foreground">{pergunta.titulo}</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{pergunta.ajuda}</p>
      </div>

      {/* Categories */}
      <div className="space-y-8">
        {pergunta.grupos.map((grupo) => (
          <section key={grupo.categoria}>
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-soft text-base">
                {grupo.emoji}
              </div>
              <h2 className="text-xs font-bold uppercase tracking-wide text-primary">
                {grupo.categoria}
              </h2>
            </div>
            <ul className="space-y-3">
              {grupo.itens.map((opt) => {
                const checked = pergunta.selected.includes(opt);
                return (
                  <li key={opt}>
                    <button
                      type="button"
                      onClick={() => toggle(pergunta.selected, pergunta.setSelected, opt)}
                      className={`group flex w-full items-center gap-4 rounded-2xl p-4 text-left shadow-sm transition-all active:scale-[0.98] ${
                        checked
                          ? "border-2 border-primary bg-primary-soft"
                          : "border border-border bg-card hover:border-primary/30"
                      }`}
                    >
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors ${
                          checked
                            ? "bg-primary text-primary-foreground"
                            : "border-2 border-border bg-background"
                        }`}
                      >
                        {checked && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                      </span>
                      <span
                        className={`text-[15px] leading-snug ${
                          checked ? "font-semibold text-primary" : "font-medium text-foreground"
                        }`}
                      >
                        {opt}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      {/* Sticky footer */}
      <div className="fixed inset-x-0 bottom-16 z-40 mx-auto max-w-md bg-gradient-to-t from-background via-background to-transparent px-4 pb-4 pt-10">
        <div className="flex gap-3">
          {step > 0 && (
            <Button
              variant="outline"
              className="h-14 flex-1 rounded-2xl"
              onClick={() => setStep(0)}
            >
              Voltar
            </Button>
          )}
          <Button
            className="h-14 flex-1 rounded-2xl text-base font-bold shadow-lg shadow-primary/20"
            onClick={avancar}
            disabled={loading}
          >
            <span>{step === 0 ? "Continuar" : loading ? "Salvando..." : "Concluir"}</span>
            {!loading && <ArrowRight className="ml-2 h-5 w-5 opacity-60" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
