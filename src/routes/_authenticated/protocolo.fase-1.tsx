import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { ChevronLeft, X, ArrowRight } from "lucide-react";
import { ATNN, ARI } from "@/content/guia-fase-1";
import { VturbPlayer } from "@/components/VturbPlayer";

export const Route = createFileRoute("/_authenticated/protocolo/fase-1")({
  component: Fase1,
});

const FASE1_VTURB_ID = "vid-6a2e328f66b98f0059f888a4";

function Fase1() {
  useEffect(() => {
    const playerId = FASE1_VTURB_ID.replace("vid-", "");
    const scriptSrc = `https://scripts.converteai.net/ea5a7ffd-7736-4982-b451-ffa20a0d2e1e/players/${playerId}/v4/player.js?v=${playerId}`;
    if (document.querySelector(`script[src="${scriptSrc}"]`)) return;
    const s = document.createElement("script");
    s.src = scriptSrc;
    s.async = true;
    document.head.appendChild(s);
  }, []);

  return (
    <div className="px-6 py-6">
      <Link to="/protocolo" className="inline-flex items-center gap-1 text-sm text-primary">
        <ChevronLeft className="h-4 w-4" /> Voltar
      </Link>

      <h1 className="mt-4 text-2xl font-bold leading-tight">
        Fase 1 — Combatendo a inflamação intestinal
      </h1>

      <div className="mt-5 aspect-video w-full overflow-hidden rounded-2xl bg-black">
        <VturbPlayer vturbId={FASE1_VTURB_ID} />
      </div>

      <h2 className="mt-8 text-lg font-bold">ATNN — Alimentos Tóxicos Não Necessários</h2>
      <p className="mt-1 text-sm text-muted-foreground">Evite estes alimentos nesta fase.</p>
      <ul className="mt-4 space-y-2">
        {ATNN.map((item) => (
          <li key={item} className="flex items-start gap-3 rounded-xl border border-border bg-card p-3">
            <X className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
            <span className="text-base">{item}</span>
          </li>
        ))}
      </ul>

      <h2 className="mt-8 text-lg font-bold">ARI — Alimentos Reparadores Intestinais</h2>
      <p className="mt-1 text-sm text-muted-foreground">Prefira estes — troque X por Y.</p>
      <ul className="mt-4 space-y-2">
        {ARI.map(({ de, para }) => (
          <li key={de} className="rounded-xl border border-border bg-card p-3">
            <div className="flex items-center gap-2 text-base">
              <span className="line-through text-muted-foreground">{de}</span>
              <ArrowRight className="h-4 w-4 text-primary shrink-0" />
              <span className="font-semibold text-primary">{para}</span>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-8 rounded-xl bg-gold/20 p-4 text-sm text-foreground">
        <strong>Importante:</strong> se você tem alguma alergia ou intolerância, evite o
        alimento correspondente e escolha outra opção da lista. Em caso de dúvida,
        consulte seu médico.
      </div>

      <p className="mt-4 rounded-xl bg-muted p-3 text-xs text-muted-foreground">
        Conteúdo educacional baseado no protocolo do Programa ACTIVE. Não substitui
        acompanhamento médico ou nutricional.
      </p>
    </div>
  );
}

