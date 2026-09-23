import { createFileRoute, Link } from "@tanstack/react-router";
import { Play, ChevronRight, Download, Lock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CATEGORIAS } from "@/content/aulas";
import { hasFlacidezAccess } from "@/lib/flacidez-access.functions";


export const Route = createFileRoute("/_authenticated/flacidez")({
  head: () => ({
    meta: [
      { title: "Programa Flacidez — Programa Active" },
      {
        name: "description",
        content:
          "Plano completo para estimular a produção natural de colágeno: combata flacidez, rugas e fortaleça cabelos, unhas e articulações.",
      },
      { property: "og:title", content: "Programa Flacidez — Programa Active" },
      {
        property: "og:description",
        content:
          "Plano completo para estimular a produção natural de colágeno e combater a flacidez.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Flacidez,
});

function Flacidez() {

  const colageno = CATEGORIAS.find((c) => c.slug === "colageno");
  const checkAccess = useServerFn(hasFlacidezAccess);
  const { data, isLoading } = useQuery({
    queryKey: ["flacidez-access"],
    queryFn: () => checkAccess(),
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="py-10 px-4 sm:px-6">
        <div className="h-32 animate-pulse rounded-3xl bg-muted" />
      </div>
    );
  }

  if (!data?.hasAccess) {
    return (
      <div className="py-6 px-4 sm:px-6">
        <div className="rounded-3xl border border-gold/40 bg-card p-6 text-center shadow-sm">
          <Lock className="mx-auto h-8 w-8 text-gold" />
          <h1 className="mt-3 text-xl font-extrabold leading-tight">
            Flacidez Nunca Mais
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Este programa é vendido separadamente e não consta uma compra dele no seu
            e-mail. Se você já comprou, fale com o suporte para liberarmos o acesso.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6">
      <header className="px-4 sm:px-6">
        <h1 className="text-2xl font-bold leading-tight">Programa Flacidez</h1>

        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Material extra para você firmar a pele de dentro pra fora.
        </p>
      </header>

      {colageno?.modulos.map((m) => (
        <section key={m.id} className="mt-6 px-4 sm:px-6">
          <div className="overflow-hidden rounded-3xl border border-gold/40 bg-card p-4 shadow-sm sm:p-5">
            <p className="text-[11px] font-bold uppercase tracking-widest text-gold">
              Flacidez Nunca Mais
            </p>
            <h2 className="mt-1 text-xl font-extrabold leading-tight text-foreground">
              {m.titulo}
            </h2>
            {m.subtitulo && (
              <p className="mt-1 text-sm font-semibold text-primary">{m.subtitulo}</p>
            )}
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{m.descricao}</p>

            {m.materiais?.map((mat, i) => (
              <a
                key={i}
                href={mat.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 flex items-center gap-3 rounded-2xl bg-gold px-4 py-3 text-gold-foreground active:scale-[0.99]"
              >
                <Download className="h-5 w-5" />
                <div className="flex-1 text-left">
                  <p className="text-sm font-bold leading-tight">Baixar PDF</p>
                  <p className="text-[11px] opacity-80">{mat.titulo}</p>
                </div>
              </a>
            ))}

            <Link
              to="/aulas/modulo/$moduloId"
              params={{ moduloId: m.id }}
              className="mt-3 flex items-center justify-between rounded-2xl border border-border bg-background px-4 py-3 active:scale-[0.99]"
            >
              <div className="flex items-center gap-2">
                <Play className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">Ver aulas do plano</span>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </Link>
          </div>
        </section>
      ))}
    </div>
  );
}
