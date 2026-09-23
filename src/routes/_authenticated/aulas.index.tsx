import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Lock, Play, Sparkles, ChevronRight } from "lucide-react";
import { CATEGORIAS, type Modulo } from "@/content/aulas";
import { supabase } from "@/integrations/supabase/client";

type ThumbInfo = { url: string; x: number; y: number };

export const Route = createFileRoute("/_authenticated/aulas/")({
  component: Aulas,
});

function Aulas() {
  const bonus = CATEGORIAS.filter((c) => c.slug !== "protocolo" && c.slug !== "colageno");

  const [thumbs, setThumbs] = useState<Record<string, ThumbInfo>>({});
  useEffect(() => {
    (async () => {
      const { data: rows } = await supabase
        .from("module_thumbnails")
        .select("module_id,url,position_x,position_y");
      const map: Record<string, ThumbInfo> = {};
      (rows ?? []).forEach((r: { module_id: string; url: string; position_x: number | null; position_y: number | null }) => {
        map[r.module_id] = { url: r.url, x: r.position_x ?? 50, y: r.position_y ?? 50 };
      });
      setThumbs(map);
    })();
  }, []);

  return (
    <div className="py-6">
      {/* Bônus */}
      <section className="mt-10 px-4 sm:px-6">

        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-gold" />
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
            Bônus
          </h2>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Dicas extras para melhorar sua qualidade de vida!
        </p>

        <div className="mt-4 space-y-3">
          {bonus.flatMap((cat) => cat.modulos).map((m) => (
            <BonusCard key={m.id} m={m} thumb={thumbs[m.id]} />
          ))}
        </div>
      </section>
    </div>
  );
}


function BonusCard({ m, thumb }: { m: Modulo; thumb?: ThumbInfo }) {
  const cover = (
    <div className="relative aspect-video w-40 shrink-0 self-stretch overflow-hidden bg-gradient-to-br from-gold/20 to-gold/5 sm:w-48">
      {thumb?.url ? (
        <img
          src={thumb.url}
          alt={m.titulo}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gold">Bônus</span>
          <span className="text-4xl font-extrabold leading-none text-gold">{m.numero}</span>
        </div>
      )}
    </div>
  );

  const body = (
    <div className="flex min-w-0 flex-1 items-center gap-2 py-3 pr-3">
      <div className="flex min-w-0 flex-1 flex-col justify-center">
        <p className="text-sm font-bold leading-tight text-foreground break-words">{m.titulo}</p>
        <p className="mt-1 text-xs leading-snug text-muted-foreground line-clamp-2">{m.descricao}</p>
        <div className="mt-1.5 flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
          {m.liberada ? (
            <>
              <Play className="h-3 w-3 fill-current" />
              {m.aulas.length} {m.aulas.length === 1 ? "aula" : "aulas"}
            </>
          ) : (
            <>
              <Lock className="h-3 w-3" /> Em breve
            </>
          )}
        </div>
      </div>
      {m.liberada && <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />}
    </div>
  );

  return (
    <div className="flex items-stretch gap-3 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      {cover}
      {m.liberada ? (
        <Link
          to="/aulas/modulo/$moduloId"
          params={{ moduloId: m.id }}
          className="flex min-w-0 flex-1 active:scale-[0.99] transition"
        >
          {body}
        </Link>
      ) : (
        body
      )}
    </div>
  );
}


