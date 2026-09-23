import { useEffect, useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ChevronLeft, PlayCircle, CheckCircle2, Play, Download } from "lucide-react";
import { findModulo } from "@/content/aulas";
import { supabase } from "@/integrations/supabase/client";
import { WhatsAppAudio } from "@/components/WhatsAppAudio";
import { AudioAckCheckbox } from "@/components/AudioAckCheckbox";

export const Route = createFileRoute("/_authenticated/aulas/modulo/$moduloId")({
  component: ModuloPage,
  notFoundComponent: () => (
    <div className="p-6 text-center text-muted-foreground">Módulo não encontrado.</div>
  ),
  errorComponent: () => (
    <div className="p-6 text-center text-destructive">Erro ao carregar o módulo.</div>
  ),
});

function ModuloPage() {
  const { moduloId } = Route.useParams();
  const found = findModulo(moduloId);
  if (!found) throw notFound();
  const { modulo, categoria } = found;

  const [watched, setWatched] = useState<Set<string>>(new Set());
  const [customThumb, setCustomThumb] = useState<string | null>(null);
  const [thumbX, setThumbX] = useState(50);
  const [thumbY, setThumbY] = useState(50);

  useEffect(() => {
    (async () => {
      const ids = modulo.aulas.map((a) => a.id);
      const { data } = await supabase
        .from("lesson_progress")
        .select("lesson_id, completed_at")
        .in("lesson_id", ids);
      setWatched(
        new Set(
          (data ?? [])
            .filter((r: { completed_at: string | null }) => !!r.completed_at)
            .map((r: { lesson_id: string }) => r.lesson_id),
        ),
      );
    })();
  }, [modulo.aulas]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("module_thumbnails")
        .select("url,position_x,position_y")
        .eq("module_id", modulo.id)
        .maybeSingle();
      if (data?.url) {
        setCustomThumb(data.url);
        setThumbX(data.position_x ?? 50);
        setThumbY(data.position_y ?? 50);
      }
    })();
  }, [modulo.id]);

  const bannerSrc = customThumb ?? modulo.bannerUrl;

  const total = modulo.aulas.length;
  const done = modulo.aulas.filter((a) => watched.has(a.id)).length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="pb-6">
      {/* Banner */}
      <div className="relative aspect-video w-full overflow-hidden">
        {bannerSrc ? (
          <img
            src={bannerSrc}
            alt={modulo.titulo}
            className="h-full w-full object-cover"
            style={{ objectPosition: `${thumbX}% ${thumbY}%` }}
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-primary via-primary/80 to-primary/40" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />
        <Link
          to="/aulas"
          className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-full bg-background/90 px-3 py-1.5 text-xs font-semibold text-foreground shadow backdrop-blur"
        >
          <ChevronLeft className="h-4 w-4" /> Voltar
        </Link>
        <p className="absolute bottom-3 left-6 right-6 text-[11px] font-bold uppercase tracking-widest text-white/90 drop-shadow">
          {categoria.titulo}
        </p>
      </div>

      <div className="px-6 pt-5">
        <h1 className="text-2xl font-extrabold leading-tight">
          {modulo.numero !== undefined ? `Módulo ${modulo.numero} — ` : ""}
          {modulo.titulo}
        </h1>
        {modulo.subtitulo && (
          <p className="mt-1 text-base font-semibold text-primary">{modulo.subtitulo}</p>
        )}
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{modulo.descricao}</p>

        {/* Progresso */}
        <div className="mt-4 rounded-2xl border border-border bg-card p-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-foreground">
              {done} de {total} aulas concluídas
            </span>
            <span className="font-bold text-primary">{pct}%</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>

        {/* Materiais do módulo (PDFs, etc.) */}
        {modulo.materiais && modulo.materiais.length > 0 && (
          <div className="mt-5 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Materiais
            </h2>
            {modulo.materiais.map((mat, i) => (
              <a
                key={i}
                href={mat.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 active:scale-[0.99]"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold/20 text-gold-foreground">
                  <Download className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <p className="text-base font-semibold leading-tight">{mat.titulo}</p>
                  {mat.descricao && (
                    <p className="mt-0.5 text-xs text-muted-foreground">{mat.descricao}</p>
                  )}
                </div>
              </a>
            ))}
          </div>
        )}

        {/* Áudio introdutório */}
        {modulo.audio && (
          <div className="mt-5 rounded-2xl border border-gold/40 bg-gold/10 p-4">
            <p className="text-sm font-bold leading-snug text-foreground">
              {modulo.audio.mensagem}
            </p>
            <div className="mt-3">
              <WhatsAppAudio src={modulo.audio.url} />
            </div>
            <AudioAckCheckbox moduleId={modulo.id} />
          </div>
        )}

        {/* Aulas */}
        <h2 className="mt-6 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Aulas
        </h2>
        <ul className="mt-3 space-y-3">
          {modulo.aulas.map((a, i) => {
            const isWatched = watched.has(a.id);
            return (
              <li key={a.id}>
                <Link
                  to="/aulas/$lessonId"
                  params={{ lessonId: a.id }}
                  className="flex items-stretch gap-3 overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition active:scale-[0.99]"
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video w-40 shrink-0 self-start overflow-hidden bg-muted">
                    {a.thumbnailUrl ? (
                      <img
                        src={a.thumbnailUrl}
                        alt={a.titulo}
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/30 to-primary/5">
                        <span className="text-2xl font-extrabold text-primary/70">{i + 1}</span>
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-background/90 text-primary">
                        <Play className="h-5 w-5 fill-current" />
                      </div>
                    </div>
                    {isWatched && (
                      <div className="absolute right-1.5 top-1.5 rounded-full bg-emerald-500 p-0.5 text-white">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                    )}
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col justify-center py-2 pr-3">
                    <div className="mb-1 flex items-center gap-2 text-[10px] font-medium text-muted-foreground">
                      {isWatched ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
                          <CheckCircle2 className="h-3 w-3" /> Assistida
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1">
                          <PlayCircle className="h-3 w-3" /> Não iniciada
                        </span>
                      )}
                    </div>
                    <p
                      className={`text-sm font-bold leading-tight line-clamp-2 ${
                        isWatched ? "text-muted-foreground" : "text-foreground"
                      }`}
                    >
                      {a.titulo}
                    </p>
                    <p className="mt-1 line-clamp-1 text-xs leading-snug text-muted-foreground">
                      {a.descricao}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
