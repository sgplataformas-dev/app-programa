import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import {
  PlayCircle,
  ChevronRight,
  AlertCircle,
  RefreshCw,
  Lock,
  Play,
  MessageCircle,
} from "lucide-react";
import { getDashboard } from "@/lib/active.functions";
import { findAula, CATEGORIAS, type Modulo } from "@/content/aulas";
import { captureMonitoringEvent } from "@/lib/monitoring";
import fernandinhoStickerAsset from "@/assets/fernandinho-sticker.jpeg";

const PROTOCOLO = CATEGORIAS.find((c) => c.slug === "protocolo")!;



export const Route = createFileRoute("/_authenticated/hoje")({
  component: Hoje,
});

function Hoje() {
  const navigate = useNavigate();
  const fetchDashboard = useServerFn(getDashboard);



  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => withTimeout(fetchDashboard(), 10000),
    retry: false,
  });

  useEffect(() => {
    if (!isError || data) return;
    captureMonitoringEvent(error, {
      phase: "manual",
      routeId: "/_authenticated/hoje",
      route: "/hoje",
      action: "carregar_dashboard",
    });
  }, [data, error, isError]);

  useEffect(() => {
    if (!data) return;
    if (!data.intakeCompleto) {
      navigate({ to: "/boas-vindas" });
    } else if (!data.quizFase1Completo) {
      navigate({ to: "/aulas/$lessonId", params: { lessonId: "fase-1-intro" } });
    }
  }, [data, navigate]);

  if (isLoading) {
    return <div className="p-6 text-muted-foreground">Carregando...</div>;
  }

  if (isError && !data) {
    return <DashboardError onRetry={() => void refetch()} pending={isFetching} />;
  }

  if (!data) {
    return <DashboardError onRetry={() => void refetch()} pending={isFetching} />;
  }

  const ultimaAulaId = data.ultimaAulaId ?? null;
  const faseAtual = data.faseAtual ?? 1;
  const totalDias = data.totalDiasFase ?? 10;
  const diaAtual = data.dia ?? 1;
  const diasRestantes = Math.max(0, totalDias - diaAtual + 1);


  return (
    <div className="px-5 py-7">
      <header className="flex items-center gap-3">
        {data.avatarUrl ? (
          <img
            src={data.avatarUrl}
            alt={data.nome || "Perfil"}
            loading="eager"
            decoding="async"
            className="h-12 w-12 shrink-0 rounded-full object-cover"
          />
        ) : null}
        <div className="flex-1">
          <h1 className="text-2xl font-bold leading-tight">
            Olá, {data.nome || "querida"} 👋
          </h1>
        </div>
      </header>

      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        Você está na <strong className="text-foreground">área de alunos</strong> do Programa
        Active — esse é o espaço onde você pode acessar as video aulas do professor Fernando.
      </p>

      {/* Banner aulas — continue assistindo */}
      {ultimaAulaId ? (
        <Link
          to="/aulas/$lessonId"
          params={{ lessonId: ultimaAulaId }}
          className="mt-7 flex items-center gap-4 rounded-2xl bg-gradient-to-br from-primary to-primary/80 p-5 text-primary-foreground active:scale-[0.99]"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15">
            <PlayCircle className="h-7 w-7" />
          </div>
          <div className="flex-1">
            <p className="text-base font-bold leading-tight">Continue assistindo</p>
            <p className="mt-1 text-xs opacity-90">
              {findAula(ultimaAulaId)?.aula.titulo ?? "Retome de onde parou."}
            </p>
          </div>
          <ChevronRight className="h-5 w-5 opacity-80" />
        </Link>
      ) : (
        <Link
          to="/aulas"
          className="mt-7 flex items-center gap-4 rounded-2xl bg-gradient-to-br from-primary to-primary/80 p-5 text-primary-foreground active:scale-[0.99]"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15">
            <PlayCircle className="h-7 w-7" />
          </div>
          <div className="flex-1">
            <p className="text-base font-bold leading-tight">Assista às aulas do curso</p>
            <p className="mt-1 text-xs opacity-90">
              Módulos, receitas e bônus na sua área de membros.
            </p>
          </div>
          <ChevronRight className="h-5 w-5 opacity-80" />
        </Link>
      )}

      {/* Protocolo — curso principal (espelhado de /aulas) */}
      <section className="mt-6">
        <div className="overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary to-primary/85 p-5 text-primary-foreground shadow-lg">
          <p className="text-[11px] font-bold uppercase tracking-widest text-primary-foreground/70">
            Curso principal
          </p>
          <h2 className="mt-1 text-xl font-extrabold leading-tight sm:text-2xl">
            Protocolo de Reativação Hormonal
          </h2>
          <p className="mt-2 text-sm leading-snug text-primary-foreground/90">
            O protocolo desenhado pelo professor Fernando Jardim para te ajudar a atingir seus
            objetivos de perda de peso através do Iogurte Bariátrico.
          </p>
        </div>

        <div className="mt-4 space-y-3">
          {PROTOCOLO.modulos.map((m) => (
            <FaseRow
              key={m.id}
              modulo={m}
              faseAtual={faseAtual}
              diasRestantes={diasRestantes}
            />
          ))}
        </div>
      </section>

      {/* Banner de suporte */}
      <section className="relative mt-6 overflow-hidden rounded-3xl border border-primary/10 bg-card p-4 shadow-md sm:p-5">
        {/* Folhas decorativas no canto direito */}
        <div className="pointer-events-none absolute -right-6 -top-6 h-32 w-32 text-primary/10 sm:-right-4 sm:-top-4 sm:h-40 sm:w-40">
          <LeafDecoration className="h-full w-full" />
        </div>
        <div className="pointer-events-none absolute -bottom-8 -right-4 h-24 w-24 text-primary/10 sm:-bottom-6 sm:-right-2 sm:h-28 sm:w-28">
          <LeafDecoration className="h-full w-full rotate-45" />
        </div>

        <div className="relative flex flex-col items-center gap-4">
          {/* Imagem do Fernando com balão */}
          <div className="flex shrink-0 justify-center">
            <img
              src={fernandinhoStickerAsset}
              alt="Professor Fernando"
              loading="lazy"
              className="h-44 w-44 object-contain sm:h-52 sm:w-52"
            />
          </div>

          {/* Texto e botão */}
          <div className="flex min-w-0 flex-1 flex-col items-center text-center">
            <p className="font-phase-display text-xl font-extrabold leading-tight text-primary sm:text-2xl">
              Estamos aqui para você!
            </p>
            <p className="mt-2 max-w-xs text-sm leading-snug text-muted-foreground sm:max-w-sm">
              Dúvidas, dificuldades ou suporte? Fale com a nossa equipe — teremos o maior prazer em te ajudar.
            </p>
            <a
              href="https://wa.me/5588982130565?text=Vim+do+App+e+quero+suporte"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex w-full max-w-xs items-center justify-center gap-2 whitespace-nowrap rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-sm transition active:scale-[0.98] sm:w-auto sm:min-w-[260px]"
            >
              <WhatsAppIcon className="h-5 w-5 shrink-0" />
              Fale com o nosso suporte
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error("Tempo esgotado ao carregar dados do app")), ms);
    promise.then(
      (value) => {
        window.clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        window.clearTimeout(timer);
        reject(error);
      },
    );
  });
}

function DashboardError({ onRetry, pending }: { onRetry: () => void; pending: boolean }) {
  return (
    <div className="px-5 py-7">
      <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-5 text-destructive">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <h1 className="text-base font-bold">Erro ao carregar dados do app</h1>
            <p className="mt-1 text-sm text-destructive/80">
              Verifique sua conexão e tente novamente. O app não ficará preso no carregamento.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onRetry}
          disabled={pending}
          className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-destructive px-4 text-sm font-semibold text-destructive-foreground disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${pending ? "animate-spin" : ""}`} />
          {pending ? "Tentando novamente..." : "Tentar novamente"}
        </button>
      </div>
    </div>
  );
}

function FaseRow({
  modulo,
  faseAtual,
  diasRestantes,
}: {
  modulo: Modulo;
  faseAtual: number;
  diasRestantes: number;
}) {
  const aqui = modulo.numero === faseAtual;
  const futura = (modulo.numero ?? 0) > faseAtual;
  const liberada = modulo.liberada;

  const labelText = aqui
    ? "Você está aqui"
    : futura
      ? modulo.numero === 2
        ? "Disponível"
        : diasRestantes > 0
          ? `Em ${diasRestantes} ${diasRestantes === 1 ? "dia" : "dias"}`
          : "Disponível"
      : "Concluída";


  const content = (
    <div
      className={`relative flex min-h-28 items-stretch overflow-hidden rounded-2xl border bg-card text-left shadow-sm transition duration-200 ${
        aqui ? "border-gold shadow-md ring-1 ring-gold" : "border-border"
      } ${liberada ? "hover:-translate-y-0.5 hover:shadow-md" : "opacity-70"}`}
    >
      {aqui && (
        <span className="absolute right-3 top-2 z-20 rounded-full bg-gold px-2 py-0.5 font-phase-body text-[8px] font-bold uppercase text-gold-foreground">
          Você está aqui
        </span>
      )}

      <div className="relative min-h-28 w-[62%] shrink-0 overflow-hidden bg-muted">
        {modulo.bannerUrl ? (
          <img
            src={modulo.bannerUrl}
            alt={`${modulo.titulo}: ${modulo.subtitulo ?? modulo.titulo}`}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center bg-primary-soft px-3 text-center">
            {liberada ? (
              <>
                <span className="font-phase-body text-[10px] font-bold uppercase text-primary">Fase</span>
                <span className="font-phase-display text-4xl font-extrabold leading-none text-primary">{modulo.numero}</span>
              </>
            ) : (
              <Lock className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        )}
      </div>

      <div className={`flex min-w-0 flex-1 items-center justify-center px-2.5 pb-3 pt-6 ${aqui ? "bg-gold/10" : "bg-card"}`}>
        <div className="flex min-w-0 flex-col items-center text-center">
          <div className={`flex h-8 w-8 items-center justify-center rounded-full ${aqui ? "bg-gold text-gold-foreground" : liberada ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
            {liberada ? <Play className="ml-0.5 h-3.5 w-3.5 fill-current" /> : <Lock className="h-3.5 w-3.5" />}
          </div>
          <p className="mt-2 font-phase-display text-[11px] font-bold leading-[1.15] text-foreground">
            {liberada ? "Clique aqui para acessar as aulas" : "Aulas em breve"}
          </p>
          <div className={`mt-1.5 flex items-center gap-0.5 font-phase-body text-[9px] font-semibold ${aqui ? "text-gold-foreground" : "text-muted-foreground"}`}>
            <span>{liberada ? labelText : "Bloqueada"}</span>
            {liberada && <ChevronRight className="h-3.5 w-3.5" />}
          </div>
        </div>
      </div>
    </div>
  );

  if (!liberada) return <div className="block">{content}</div>;
  return (
    <Link
      to="/aulas/modulo/$moduloId"
      params={{ moduloId: modulo.id }}
      className="block w-full text-left transition active:scale-[0.99]"
    >
      {content}
    </Link>
  );


}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.203-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function LeafDecoration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M95.5 12.5c-8 14-26 24-42 28-12 3-22 1-30-4 10 18 32 28 54 24 18-3 30-16 34-34 2-8 1-14-1-18-2 0-10 1-15 4z" opacity="0.5" />
      <path d="M78 38c-16 4-30 14-38 30-6 12-6 26 0 38 2-16 10-30 24-40 10-8 22-12 34-12-6-10-14-16-20-16z" opacity="0.4" />
      <path d="M105 55c-18 2-34 12-44 28-8 12-10 28-4 42 8-14 22-24 38-28 12-3 24-2 34 2-8-24-16-42-24-44z" opacity="0.3" />
    </svg>
  );
}

