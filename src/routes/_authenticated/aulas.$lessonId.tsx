import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate, notFound } from "@tanstack/react-router";
import { ChevronLeft, FileText, CheckCircle2, Info, Play, Download, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { findAula, findModulo } from "@/content/aulas";
import { supabase } from "@/integrations/supabase/client";

import { VturbPlayer } from "@/components/VturbPlayer";

export const Route = createFileRoute("/_authenticated/aulas/$lessonId")({
  component: AulaPage,
  notFoundComponent: () => (
    <div className="p-6 text-center text-muted-foreground">Aula não encontrada.</div>
  ),
  errorComponent: () => (
    <div className="p-6 text-center text-destructive">Erro ao carregar a aula.</div>
  ),
});

function AulaPage() {
  const navigate = useNavigate();
  const { lessonId } = Route.useParams();
  const found = findAula(lessonId);
  if (!found) throw notFound();
  const { aula, modulo } = found;

  // Find sibling lessons for navigation
  const moduloFull = findModulo(modulo.id)?.modulo;
  const aulas = moduloFull?.aulas ?? [];
  const idx = aulas.findIndex((a) => a.id === aula.id);
  const prev = idx > 0 ? aulas[idx - 1] : null;
  const next = idx >= 0 && idx < aulas.length - 1 ? aulas[idx + 1] : null;

  const [watched, setWatched] = useState(false);
  const [marking, setMarking] = useState(false);
  const [quizFase1Completo, setQuizFase1Completo] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;
      const { data } = await supabase
        .from("lesson_progress")
        .select("completed_at")
        .eq("lesson_id", lessonId)
        .eq("user_id", auth.user.id)
        .maybeSingle();
      setWatched(!!data?.completed_at);
      // Registra a visita (touch watched_at) para "Continue assistindo".
      // IMPORTANT: nunca tocar em completed_at aqui — isso é só uma visita.
      await supabase
        .from("lesson_progress")
        .upsert(
          { user_id: auth.user.id, lesson_id: lessonId, watched_at: new Date().toISOString() },
          { onConflict: "user_id,lesson_id" },
        );
    })();
  }, [lessonId]);

  useEffect(() => {
    if (!aula.cta?.lockWhenQuizFase1Completo) return;
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;
      const { data } = await supabase
        .from("user_progress")
        .select("quiz_fase1_completo")
        .eq("user_id", auth.user.id)
        .maybeSingle();
      setQuizFase1Completo(Boolean(data?.quiz_fase1_completo));
    })();
  }, [aula.cta?.lockWhenQuizFase1Completo]);

  const markWatched = async () => {
    if (watched || marking) return;
    setMarking(true);
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      setMarking(false);
      return;
    }
    await supabase
      .from("lesson_progress")
      .upsert(
        {
          user_id: auth.user.id,
          lesson_id: lessonId,
          completed_at: new Date().toISOString(),
        },
        { onConflict: "user_id,lesson_id" },
      );
    setWatched(true);
    setMarking(false);
  };

  const isIframe = aula.videoUrl.includes("youtube") || aula.videoUrl.includes("vimeo");

  useEffect(() => {
    if (!aula.vturbId) return;
    const playerId = aula.vturbId.replace("vid-", "");
    const scriptSrc = `https://scripts.converteai.net/ea5a7ffd-7736-4982-b451-ffa20a0d2e1e/players/${playerId}/v4/player.js?v=${playerId}`;
    if (document.querySelector(`script[src="${scriptSrc}"]`)) return;
    const s = document.createElement("script");
    s.src = scriptSrc;
    s.async = true;
    document.head.appendChild(s);
  }, [aula.vturbId]);

  // Compose materiais list (legacy pdfUrl + materiais array)
  const materiais = [
    ...(aula.pdfUrl
      ? [{ titulo: "Resumo da aula em PDF", url: aula.pdfUrl, descricao: "Toque para baixar" }]
      : []),
    ...(aula.materiais ?? []),
  ];

  return (
    <div className="pb-8">
      {/* Header above player */}
      <div className="px-5 pt-5 pb-4">
        <Link
          to="/aulas/modulo/$moduloId"
          params={{ moduloId: modulo.id }}
          className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground"
        >
          <ChevronLeft className="h-4 w-4" /> Voltar
        </Link>
        <p className="mt-3 text-[11px] font-bold uppercase tracking-widest text-primary">
          {modulo.numero !== undefined ? `Módulo ${modulo.numero}` : modulo.titulo}
          {modulo.subtitulo ? ` — ${modulo.subtitulo}` : ""}
        </p>
        <h1 className="mt-1 text-2xl font-extrabold leading-tight">{aula.titulo}</h1>
      </div>

      {/* Player */}
      <div className="aspect-video w-full overflow-hidden bg-black">
        {aula.vturbId ? (
          <VturbPlayer vturbId={aula.vturbId} />
        ) : aula.videoUrl ? (
          isIframe ? (
            <iframe
              src={aula.videoUrl}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <video
              src={aula.videoUrl}
              controls
              className="h-full w-full"
              onEnded={markWatched}
              poster={aula.thumbnailUrl}
            />
          )
        ) : aula.thumbnailUrl ? (
          <div className="relative h-full w-full">
            <img src={aula.thumbnailUrl} alt={aula.titulo} className="h-full w-full object-cover opacity-70" />
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <div className="rounded-2xl bg-background/90 px-4 py-3 text-center">
                <Play className="mx-auto h-6 w-6 text-primary" />
                <p className="mt-1 text-xs font-semibold text-foreground">Em breve</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-primary-foreground/70">
            Em breve: aula em vídeo
          </div>
        )}
      </div>

      <div className="px-5">
        {/* CTA — somente quando configurado */}
        {aula.cta && (() => {
          const locked = Boolean(aula.cta.lockWhenQuizFase1Completo && quizFase1Completo);
          return (
            <Button
              className="mt-4 h-14 w-full text-base"
              onClick={() => navigate({ to: aula.cta!.to as string })}
              disabled={locked}
            >
              {locked ? (
                <>
                  <Lock className="h-4 w-4" /> Fase 1 já iniciada
                </>
              ) : (
                aula.cta.label
              )}
            </Button>
          );
        })()}

        {/* Progresso */}
        <div className="mt-4 flex items-center gap-2">
          {watched ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" /> Aula concluída
            </span>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={markWatched}
              disabled={marking}
              className="h-8"
            >
              <CheckCircle2 className="h-4 w-4" />
              Marcar como concluída
            </Button>
          )}
        </div>

        {/* Tabs: Sobre / Materiais Extras */}
        <Tabs defaultValue="sobre" className="mt-5">
          <TabsList className="grid h-12 w-full grid-cols-2 p-1">
            <TabsTrigger value="sobre" className="h-10 gap-1.5 text-sm">
              <Info className="h-4 w-4" /> Sobre
            </TabsTrigger>
            <TabsTrigger value="materiais" className="h-10 gap-1.5 text-sm">
              <FileText className="h-4 w-4" /> Materiais Extras
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sobre" className="mt-4 space-y-4">
            <p className="text-sm leading-relaxed text-muted-foreground">{aula.descricao}</p>

            {(prev || next) && (
              <div className="flex gap-2 pt-2">
                {prev && (
                  <Link
                    to="/aulas/$lessonId"
                    params={{ lessonId: prev.id }}
                    className="flex-1 rounded-xl border border-border bg-card p-3 text-left active:scale-[0.99]"
                  >
                    <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                      Anterior
                    </p>
                    <p className="mt-0.5 truncate text-xs font-semibold">{prev.titulo}</p>
                  </Link>
                )}
                {next && idx !== 0 && (
                  <Link
                    to="/aulas/$lessonId"
                    params={{ lessonId: next.id }}
                    className="flex-1 rounded-xl border border-primary/40 bg-primary/10 p-3 text-left active:scale-[0.99]"
                  >
                    <p className="text-[10px] font-bold uppercase tracking-wide text-primary">
                      Próxima
                    </p>
                    <p className="mt-0.5 truncate text-xs font-semibold">{next.titulo}</p>
                  </Link>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="materiais" className="mt-4 space-y-3">
            {materiais.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-6 text-center">
                <FileText className="mx-auto h-6 w-6 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">
                  Nenhum material extra para esta aula ainda.
                </p>
              </div>
            ) : (
              materiais.map((m, i) => (
                <a
                  key={i}
                  href={m.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 active:scale-[0.99]"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold/20 text-gold-foreground">
                    <Download className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <p className="text-base font-semibold leading-tight">{m.titulo}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {m.descricao ?? "Toque para baixar"}
                    </p>
                  </div>
                </a>
              ))
            )}
          </TabsContent>
        </Tabs>

      </div>
    </div>
  );
}
