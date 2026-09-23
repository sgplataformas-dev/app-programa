import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { escolherPerfil, FASES, type IntakeRespostas, type PerfilDiagnostico } from "@/content/diagnosticos";

export const Route = createFileRoute("/_authenticated/diagnostico")({
  component: Diagnostico,
});

function Diagnostico() {
  const navigate = useNavigate();
  const [perfil, setPerfil] = useState<PerfilDiagnostico | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("active:intake");
    const r: IntakeRespostas = raw ? JSON.parse(raw) : {};
    const t = setTimeout(() => setPerfil(escolherPerfil(r)), 1200);
    return () => clearTimeout(t);
  }, []);

  if (!perfil) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="mt-6 text-base text-muted-foreground">Analisando suas respostas...</p>
      </div>
    );
  }

  return (
    <div className="px-6 py-8">
      <span className="text-xs font-semibold uppercase tracking-wide text-primary">Seu perfil</span>
      <h1 className="mt-2 text-2xl font-bold leading-tight">{perfil.titulo}</h1>
      <div className="mt-5 space-y-4 text-base leading-relaxed text-foreground">
        {perfil.paragrafos.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>

      <h2 className="mt-8 text-lg font-bold">As 4 fases do protocolo</h2>
      <div className="mt-4 space-y-3">
        {FASES.map((f) => (
          <div key={f.numero} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                {f.numero}
              </div>
              <p className="text-base font-semibold leading-tight">{f.titulo}</p>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-6 rounded-xl bg-muted p-3 text-xs text-muted-foreground">
        Sugestão educacional baseada no protocolo do Programa ACTIVE. Não substitui acompanhamento médico ou nutricional.
      </p>

      <Button
        className="mt-8 h-14 w-full text-base"
        onClick={() =>
          navigate({ to: "/aulas/$lessonId", params: { lessonId: "fase-1-intro" } })
        }
      >
        Assistir aula de introdução
      </Button>
    </div>
  );
}
