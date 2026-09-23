import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getPontosExtrato } from "@/lib/active.functions";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/pontos")({
  component: Pontos,
});

function Pontos() {
  const fetchExtrato = useServerFn(getPontosExtrato);
  const { data, isLoading } = useQuery({
    queryKey: ["pontos"],
    queryFn: () => fetchExtrato(),
  });

  return (
    <div className="px-6 py-7">
      <h1 className="text-2xl font-bold">Seus pontos</h1>
      <div className="mt-5 rounded-2xl bg-primary p-6 text-primary-foreground">
        <p className="text-xs uppercase tracking-wide opacity-80">Saldo deste mês</p>
        <p className="mt-1 text-5xl font-bold">{data?.total ?? 0}</p>
        <p className="mt-1 text-sm opacity-90">pontos</p>
      </div>

      <div className="mt-6 rounded-2xl border border-gold/40 bg-gold/10 p-4">
        <div className="flex items-center gap-3">
          <Sparkles className="h-6 w-6 text-gold-foreground" />
          <div>
            <p className="text-sm font-bold">Premiação do mês</p>
            <p className="text-xs text-muted-foreground">Em breve — fique de olho!</p>
          </div>
        </div>
      </div>

      <h2 className="mt-8 text-base font-bold">Extrato</h2>
      <div className="mt-3 space-y-2">
        {isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}
        {data?.extrato.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Você ainda não tem pontos. Complete suas missões na aba Hoje!
          </p>
        )}
        {data?.extrato.map((p, i) => (
          <div key={i} className="flex items-center justify-between rounded-xl border border-border bg-card p-3">
            <div>
              <p className="text-sm font-medium">{p.motivo}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(p.criado_em).toLocaleDateString("pt-BR")}
              </p>
            </div>
            <p className="text-base font-bold text-primary">+{p.pontos}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
