import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { getDashboard } from "@/lib/active.functions";
import { Download, FileDown, ArrowRight } from "lucide-react";
import planoAlimentarPdf from "@/assets/plano-alimentar-10-dias-ari.pdf.asset.json";
import capaProtocolo from "@/assets/capa-protocolo-10-dias.jpg.asset.json";

export const Route = createFileRoute("/_authenticated/seu-protocolo")({
  component: SeuProtocolo,
});

function SeuProtocolo() {
  const fetchDashboard = useServerFn(getDashboard);
  const { data } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => fetchDashboard(),
  });

  const nome = (data?.nome || "").split(" ")[0];

  return (
    <div className="px-5 py-6 sm:px-6 sm:py-8">
      <h1 className="text-xl font-bold leading-tight sm:text-2xl">
        {nome ? `Parabéns, ${nome}! 🎉` : "Parabéns! 🎉"}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Com base nas suas respostas, preparamos o seu Protocolo de 10 Dias Personalizado. Baixe agora para começar.
      </p>

      <div className="mt-6 rounded-2xl border border-border bg-card p-4">
        <img
          src={capaProtocolo.url}
          alt="Capa do Protocolo de 10 Dias Personalizado"
          className="w-full rounded-xl object-cover"
          width={1024}
          height={1024}
          loading="lazy"
        />
        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="flex-1">
            <p className="text-base font-semibold leading-tight">SEU PROTOCOLO DE 10 DIAS PERSONALIZADO</p>
            <p className="mt-0.5 text-xs text-muted-foreground flex items-center gap-1">
              <FileDown className="h-3.5 w-3.5" />
              Toque no botão ao lado para baixar
            </p>
          </div>
          <a
            href={planoAlimentarPdf.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-xl bg-gold px-4 py-2.5 text-sm font-semibold text-gold-foreground active:scale-[0.97]"
          >
            <Download className="h-4 w-4" />
            Baixar PDF
          </a>
        </div>
      </div>

      <Link to="/diagnostico" className="mt-6 block">
        <Button className="h-14 w-full text-base">
          Ver meu diagnóstico
          <ArrowRight className="ml-2 h-5 w-5 opacity-70" />
        </Button>
      </Link>
    </div>
  );
}
