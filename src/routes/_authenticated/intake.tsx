import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { salvarIntake } from "@/lib/active.functions";
import {
  OBJETIVOS_OPCOES,
  CONDICOES_OPCOES,
  MEDICAMENTOS_OPCOES,
  RESTRICOES_OPCOES,
  BRISTOL_OPCOES,
  type IntakeRespostas,
} from "@/content/diagnosticos";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { captureMonitoringEvent } from "@/lib/monitoring";

import bristol1 from "@/assets/bristol-1.webp";
import bristol2 from "@/assets/bristol-2.webp";
import bristol3 from "@/assets/bristol-3.webp";
import bristol4 from "@/assets/bristol-4.webp";
import bristol5 from "@/assets/bristol-5.webp";
import bristol6 from "@/assets/bristol-6.webp";
import bristol7 from "@/assets/bristol-7.webp";

const BRISTOL_IMAGES: Record<string, string> = {
  "1": bristol1,
  "2": bristol2,
  "3": bristol3,
  "4": bristol4,
  "5": bristol5,
  "6": bristol6,
  "7": bristol7,
};

export const Route = createFileRoute("/_authenticated/intake")({
  component: IntakePage,
});

type Etapa = "form1" | "loading1" | "chart" | "form2" | "loading2" | "transicao" | "form3";
type EtapaPersistida = Extract<Etapa, "form1" | "form2" | "form3">;

const INTAKE_DRAFT_KEY = "active:intake:draft";

function IntakePage() {
  const navigate = useNavigate();
  const salvar = useServerFn(salvarIntake);
  const qc = useQueryClient();
  const [draftInicial] = useState(loadIntakeDraft);
  const [etapa, setEtapa] = useState<Etapa>(draftInicial?.etapa ?? "form1");
  const [step, setStep] = useState(draftInicial?.step ?? 0);
  const [d, setD] = useState<IntakeRespostas>(draftInicial?.respostas ?? {});
  const [loading, setLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!isEtapaPersistida(etapa)) return;
    saveIntakeDraft({ respostas: d, etapa, step });
  }, [d, etapa, step]);

  // ============ Loadings transicionais ============
  function runLoading(next: Etapa, ms = 2200) {
    setTimeout(() => {
      setEtapa(next);
      setStep(0);
    }, ms);
  }

  if (etapa === "loading1") return <LoadingTela texto="Analisando resultados..." onMount={() => runLoading("chart")} />;
  if (etapa === "loading2")
    return <LoadingTela texto="Analisando respostas..." onMount={() => runLoading("transicao")} />;
  if (etapa === "chart") return <ChartProjecao data={d} onContinuar={() => { setEtapa("form2"); setStep(0); }} />;
  if (etapa === "transicao") return <TransicaoAntesDepois onContinuar={() => { setEtapa("form3"); setStep(0); }} />;

  // ============ Formulários ============
  const steps1: PerguntaConfig[] = [
    { key: "idade", label: "Qual a sua idade?", input: <NumInput value={d.idade} onChange={(v) => setD({ ...d, idade: v })} suffix="anos" /> },
    { key: "peso", label: "Qual o seu peso atual?", input: <NumInput value={d.peso} onChange={(v) => setD({ ...d, peso: v })} suffix="kg" allowDecimal /> },
    { key: "altura", label: "Qual a sua altura?", input: <NumInput value={d.altura} onChange={(v) => setD({ ...d, altura: v })} suffix="cm" /> },
    { key: "pesoDesejado", label: "Qual o peso que você deseja alcançar?", input: <NumInput value={d.pesoDesejado} onChange={(v) => setD({ ...d, pesoDesejado: v })} suffix="kg" allowDecimal /> },
    {
      key: "objetivos",
      label: "Quais são os seus objetivos?",
      ajuda: "Pode marcar mais de uma opção.",
      input: (
        <MultiCheck
          opcoes={OBJETIVOS_OPCOES}
          selected={d.objetivos ?? []}
          onChange={(v) => setD({ ...d, objetivos: v })}
        />
      ),
    },
  ];

  const steps2: PerguntaConfig[] = [
    {
      key: "condicoes",
      label: "Você possui alguma destas condições?",
      ajuda: "Pode marcar mais de uma. Se nenhuma se aplica, selecione \"Nenhuma das anteriores\".",
      input: (
        <MultiCheck opcoes={CONDICOES_OPCOES} selected={d.condicoes ?? []} onChange={(v) => setD({ ...d, condicoes: v })} />
      ),
    },
    {
      key: "usaMedicamentos",
      label: "Você faz uso de algum medicamento?",
      input: (
        <RadioGroup
          value={d.usaMedicamentos ?? ""}
          onValueChange={(v) => setD({ ...d, usaMedicamentos: v as "sim" | "nao", medicamentos: v === "nao" ? [] : d.medicamentos, medicamentosOutro: v === "nao" ? "" : d.medicamentosOutro })}
          className="space-y-3"
        >
          <Opt value="sim" label="Sim" checked={d.usaMedicamentos === "sim"} />
          <Opt value="nao" label="Não" checked={d.usaMedicamentos === "nao"} />
        </RadioGroup>
      ),
    },
    ...(d.usaMedicamentos === "sim"
      ? [
          {
            key: "medicamentos",
            label: "Quais medicamentos você usa?",
            ajuda: "Pode marcar mais de um.",
            input: (
              <div className="space-y-3">
                <MultiCheck
                  opcoes={MEDICAMENTOS_OPCOES}
                  selected={d.medicamentos ?? []}
                  onChange={(v) => setD({ ...d, medicamentos: v })}
                />
                {(d.medicamentos ?? []).includes("Outro") && (
                  <Textarea
                    placeholder="Descreva qual(is) outro(s)"
                    value={d.medicamentosOutro ?? ""}
                    onChange={(e) => setD({ ...d, medicamentosOutro: e.target.value })}
                    className="min-h-20"
                  />
                )}
              </div>
            ),
          } as PerguntaConfig,
        ]
      : []),
    {
      key: "bristol",
      label: "Qual destes melhor descreve o seu cocô?",
      ajuda: "Use a escala de Bristol como referência.",
      input: (
        <RadioGroup
          value={d.bristol ?? ""}
          onValueChange={(v) => setD({ ...d, bristol: v })}
          className="space-y-2"
        >
          {BRISTOL_OPCOES.map((b) => {
            const isChecked = d.bristol === b.id;
            return (
              <Label
                key={b.id}
                className={`flex items-center gap-3 rounded-2xl p-4 cursor-pointer shadow-sm transition-all active:scale-[0.98] ${
                  isChecked
                    ? "border-2 border-primary bg-primary-soft"
                    : "border border-border bg-card hover:border-primary/30"
                }`}
              >
                <RadioGroupItem value={b.id} className="sr-only" />
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors ${
                    isChecked
                      ? "bg-primary text-primary-foreground"
                      : "border-2 border-border bg-background"
                  }`}
                >
                  {isChecked && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-semibold leading-tight text-foreground">{b.titulo}</p>
                  <p className="text-sm text-muted-foreground">{b.descricao}</p>
                </div>
                <img
                  src={BRISTOL_IMAGES[b.id]}
                  alt={`Ilustração ${b.titulo}`}
                  className="h-14 w-auto object-contain shrink-0"
                  loading="lazy"
                  decoding="async"
                  width="56"
                  height="56"
                />

              </Label>
            );
          })}
        </RadioGroup>
      ),
    },
    {
      key: "frequenciaIntestinal",
      label: "Quantas vezes por semana você faz cocô?",
      input: (
        <RadioGroup
          value={d.frequenciaIntestinal ?? ""}
          onValueChange={(v) => setD({ ...d, frequenciaIntestinal: v })}
          className="space-y-3"
        >
          <Opt value="diariamente" label="Diariamente" checked={d.frequenciaIntestinal === "diariamente"} />
          <Opt value="3_5" label="3 a 5 vezes por semana" checked={d.frequenciaIntestinal === "3_5"} />
          <Opt value="menos_3" label="Menos de 3 vezes por semana" checked={d.frequenciaIntestinal === "menos_3"} />
        </RadioGroup>
      ),
    },
    {
      key: "qualidadeSono",
      label: "Como você avalia a qualidade do seu sono?",
      input: (
        <RadioGroup
          value={d.qualidadeSono ?? ""}
          onValueChange={(v) => setD({ ...d, qualidadeSono: v })}
          className="space-y-3"
        >
          <Opt value="excelente" label="Excelente" checked={d.qualidadeSono === "excelente"} />
          <Opt value="regular" label="Regular" checked={d.qualidadeSono === "regular"} />
          <Opt value="ruim" label="Ruim" checked={d.qualidadeSono === "ruim"} />
          <Opt value="insonia" label="Insônia" checked={d.qualidadeSono === "insonia"} />
        </RadioGroup>
      ),
    },
    {
      key: "horasSono",
      label: "Quantas horas por dia você dorme por noite?",
      input: <NumInput value={d.horasSono} onChange={(v) => setD({ ...d, horasSono: v })} suffix="horas" allowDecimal />,
    },
  ];

  const steps3: PerguntaConfig[] = [
    {
      key: "refeicoesPorDia",
      label: "Quantas refeições você faz por dia?",
      input: (
        <RadioGroup
          value={d.refeicoesPorDia ?? ""}
          onValueChange={(v) => setD({ ...d, refeicoesPorDia: v })}
          className="space-y-3"
        >
          <Opt value="1_3" label="Entre 1 e 3" checked={d.refeicoesPorDia === "1_3"} />
          <Opt value="3_6" label="Entre 3 e 6" checked={d.refeicoesPorDia === "3_6"} />
          <Opt value="6_10" label="Entre 6 e 10" checked={d.refeicoesPorDia === "6_10"} />
        </RadioGroup>
      ),
    },
    {
      key: "cafeDaManha",
      label: "Você toma café da manhã?",
      input: (
        <RadioGroup
          value={d.cafeDaManha ?? ""}
          onValueChange={(v) => setD({ ...d, cafeDaManha: v })}
          className="space-y-3"
        >
          <Opt value="sempre" label="Sim, sempre" checked={d.cafeDaManha === "sempre"} />
          <Opt value="as_vezes" label="Às vezes" checked={d.cafeDaManha === "as_vezes"} />
          <Opt value="raramente" label="Raramente" checked={d.cafeDaManha === "raramente"} />
          <Opt value="nunca" label="Nunca" checked={d.cafeDaManha === "nunca"} />
        </RadioGroup>
      ),
    },
    {
      key: "restricoesAlimentares",
      label: "Você tem algum tipo de restrição alimentar?",
      ajuda: "Pode marcar mais de uma.",
      input: (
        <div className="space-y-3">
          <MultiCheck
            opcoes={RESTRICOES_OPCOES}
            selected={d.restricoesAlimentares ?? []}
            onChange={(v) => setD({ ...d, restricoesAlimentares: v })}
          />
          {(d.restricoesAlimentares ?? []).includes("Outro") && (
            <Textarea
              placeholder="Descreva qual(is) outra(s)"
              value={d.restricoesOutro ?? ""}
              onChange={(e) => setD({ ...d, restricoesOutro: e.target.value })}
              className="min-h-20"
            />
          )}
        </div>
      ),
    },
    {
      key: "alcool",
      label: "Você consome bebidas alcoólicas?",
      input: (
        <RadioGroup
          value={d.alcool ?? ""}
          onValueChange={(v) => setD({ ...d, alcool: v })}
          className="space-y-3"
        >
          <Opt value="nao" label="Não" checked={d.alcool === "nao"} />
          <Opt value="raramente" label="Raramente" checked={d.alcool === "raramente"} />
          <Opt value="menos_2x" label="Menos de 2x na semana" checked={d.alcool === "menos_2x"} />
          <Opt value="mais_3x" label="Mais de 3x na semana" checked={d.alcool === "mais_3x"} />
        </RadioGroup>
      ),
    },
    {
      key: "mlAgua",
      label: "Quanta água você bebe por dia?",
      ajuda: "Escolha a faixa que mais se aproxima do seu consumo médio.",
      input: (
        <RadioGroup
          value={d.mlAgua !== undefined ? String(d.mlAgua) : ""}
          onValueChange={(v) => setD({ ...d, mlAgua: Number(v) })}
          className="space-y-3"
        >
          <Opt value="250" label="Menos de 500 mL (menos de 2 copos)" checked={String(d.mlAgua) === "250"} />
          <Opt value="750" label="Entre 500 mL e 1 litro (2 a 4 copos)" checked={String(d.mlAgua) === "750"} />
          <Opt value="1500" label="Entre 1 e 2 litros (4 a 8 copos)" checked={String(d.mlAgua) === "1500"} />
          <Opt value="2500" label="Mais de 2 litros (mais de 8 copos)" checked={String(d.mlAgua) === "2500"} />
        </RadioGroup>
      ),
    },
  ];

  const stepsAtuais = etapa === "form1" ? steps1 : etapa === "form2" ? steps2 : steps3;
  const totalGlobal = steps1.length + steps2.length + steps3.length;
  const indexGlobal =
    (etapa === "form1" ? 0 : etapa === "form2" ? steps1.length : steps1.length + steps2.length) + step + 1;

  const current = stepsAtuais[step];
  const value = current ? (d as Record<string, unknown>)[current.key] : undefined;
  const canContinue = validarValor(value);

  async function avancar() {
    setSaveError(null);
    if (step < stepsAtuais.length - 1) {
      setStep(step + 1);
      return;
    }
    if (etapa === "form1") {
      setEtapa("loading1");
      return;
    }
    if (etapa === "form2") {
      setEtapa("loading2");
      return;
    }
    // form3 — concluir
    setLoading(true);
    try {
      const payload = stripUndefined(d) as IntakeRespostas;
      await salvarComFallback(payload);
      sessionStorage.setItem("active:intake", JSON.stringify(payload));
      localStorage.removeItem(INTAKE_DRAFT_KEY);
      void qc.invalidateQueries({ queryKey: ["dashboard"] });
      navigate({ to: "/seu-protocolo" });
    } catch (e) {
      console.error(e);
      captureMonitoringEvent(e, {
        phase: "manual",
        routeId: "/_authenticated/intake",
        route: "/intake",
        action: "finalizar_anamnese",
        step: "mlAgua",
      });
      const msg = navigator.onLine
        ? "Não consegui salvar agora. Suas respostas continuam salvas neste aparelho."
        : "Você está sem conexão. Suas respostas continuam salvas neste aparelho.";
      setSaveError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  async function salvarComFallback(payload: IntakeRespostas) {
    const controller = new AbortController();
    try {
      await withTimeout(
        salvar({ data: payload as never, signal: controller.signal } as never),
        10000,
        () => controller.abort(),
      );
      return;
    } catch (serverError) {
      captureMonitoringEvent(serverError, {
        phase: "manual",
        routeId: "/_authenticated/intake",
        route: "/intake",
        action: "salvar_anamnese_server_fn",
      });
      await withTimeout(salvarIntakeNoCliente(payload), 10000);
    }
  }

  function voltar() {
    if (step > 0) {
      setStep(step - 1);
      return;
    }
    if (etapa === "form2") {
      setEtapa("form1");
      setStep(steps1.length - 1);
    } else if (etapa === "form3") {
      setEtapa("form2");
      setStep(steps2.length - 1);
    }
  }

  if (!current) return null;
  const ehUltimoGlobal = etapa === "form3" && step === stepsAtuais.length - 1;

  const progresso = Math.round((indexGlobal / totalGlobal) * 100);

  return (
    <div className="px-6 pt-6 pb-40">
      {/* Progress */}
      <div className="mb-8">
        <div className="mb-2 flex items-end justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Pergunta {indexGlobal} de {totalGlobal}
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
        <h1 className="text-2xl font-bold leading-tight text-foreground">{current.label}</h1>
        {current.ajuda && (
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{current.ajuda}</p>
        )}
      </div>

      <div>{current.input}</div>

      {saveError && (
        <div className="mt-6 rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-sm font-medium text-destructive">
          {saveError}
        </div>
      )}

      {/* Sticky footer */}
      <div className="fixed inset-x-0 bottom-16 z-40 mx-auto max-w-md bg-gradient-to-t from-background via-background to-transparent px-4 pb-4 pt-10">
        <div className="flex gap-3">
          {(step > 0 || etapa !== "form1") && (
            <Button variant="outline" className="h-14 flex-1 rounded-2xl" onClick={voltar}>
              Voltar
            </Button>
          )}
          <Button
            className="h-14 flex-1 rounded-2xl text-base font-bold shadow-lg shadow-primary/20"
            disabled={!canContinue || loading}
            onClick={avancar}
          >
            <span>
              {ehUltimoGlobal ? (loading ? "Salvando..." : "Concluir avaliação") : "Continuar"}
            </span>
            {!loading && <ArrowRight className="ml-2 h-5 w-5 opacity-60" />}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ============ Auxiliares ============
type PerguntaConfig = {
  key: keyof IntakeRespostas;
  label: string;
  ajuda?: string;
  input: React.ReactNode;
};

function validarValor(v: unknown): boolean {
  if (v === undefined || v === null || v === "") return false;
  if (typeof v === "number") return !isNaN(v);
  if (Array.isArray(v)) return v.length > 0;
  return true;
}

function stripUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const out: Partial<T> = {};
  for (const k in obj) {
    if (obj[k] !== undefined && obj[k] !== "") out[k] = obj[k];
  }
  return out;
}

function isEtapaPersistida(etapa: Etapa): etapa is EtapaPersistida {
  return etapa === "form1" || etapa === "form2" || etapa === "form3";
}

function loadIntakeDraft(): { respostas: IntakeRespostas; etapa: EtapaPersistida; step: number } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(INTAKE_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      respostas?: IntakeRespostas;
      etapa?: Etapa;
      step?: number;
      savedAt?: number;
    };
    if (!parsed.savedAt || Date.now() - parsed.savedAt > 7 * 24 * 60 * 60 * 1000) {
      localStorage.removeItem(INTAKE_DRAFT_KEY);
      return null;
    }
    if (!parsed.respostas || !parsed.etapa || !isEtapaPersistida(parsed.etapa)) return null;
    return {
      respostas: parsed.respostas,
      etapa: parsed.etapa,
      step: Math.max(0, parsed.step ?? 0),
    };
  } catch {
    localStorage.removeItem(INTAKE_DRAFT_KEY);
    return null;
  }
}

function saveIntakeDraft(draft: { respostas: IntakeRespostas; etapa: EtapaPersistida; step: number }) {
  if (typeof window === "undefined") return;
  localStorage.setItem(INTAKE_DRAFT_KEY, JSON.stringify({ ...draft, savedAt: Date.now() }));
}

function withTimeout<T>(promise: Promise<T>, ms: number, onTimeout?: () => void): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      onTimeout?.();
      reject(new Error("Tempo esgotado ao salvar a avaliação"));
    }, ms);
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

async function salvarIntakeNoCliente(payload: IntakeRespostas) {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  const userId = sessionData.session?.user.id;
  if (!userId) throw new Error("Sessão não encontrada para salvar a avaliação.");

  const intake = await supabase
    .from("intake_responses")
    .insert({ user_id: userId, respostas: payload as never });
  if (intake.error) throw intake.error;

  const prog = await supabase
    .from("user_progress")
    .select("user_id, pesos, protocolo_iniciado_em")
    .eq("user_id", userId)
    .maybeSingle();
  if (prog.error) throw prog.error;

  const hoje = new Date().toISOString().slice(0, 10);
  const pesosAtuais: Array<{ data: string; peso: number }> = Array.isArray(prog.data?.pesos)
    ? (prog.data!.pesos as Array<{ data: string; peso: number }>)
    : [];
  const pesos = [
    ...pesosAtuais.filter((p) => p.data !== hoje),
    { data: hoje, peso: payload.peso ?? 0 },
  ];

  const progress = await supabase.from("user_progress").upsert(
    {
      user_id: userId,
      protocolo_iniciado_em: prog.data?.protocolo_iniciado_em ?? new Date().toISOString(),
      pesos: pesos as unknown as never,
    },
    { onConflict: "user_id" },
  );
  if (progress.error) throw progress.error;
}

function NumInput({
  value,
  onChange,
  suffix,
  allowDecimal,
}: {
  value?: number;
  onChange: (n: number) => void;
  suffix?: string;
  allowDecimal?: boolean;
}) {
  // Buffer de texto para permitir estados intermediários ("85,") durante a
  // digitação. Antes usávamos <input type="number">, mas em celular
  // brasileiro o teclado decimal mostra vírgula e type="number" rejeita
  // vírgula silenciosamente — o valor nunca era registrado, o botão
  // "Continuar" ficava desabilitado e o usuário travava no quiz.
  const [text, setText] = useState<string>(
    value !== undefined && !Number.isNaN(value) ? String(value).replace(".", ",") : "",
  );

  useEffect(() => {
    const normalizado = text.replace(",", ".");
    const atualNum = allowDecimal ? parseFloat(normalizado) : parseInt(normalizado, 10);
    if (!Number.isNaN(atualNum) && atualNum === value) return;
    setText(value !== undefined && !Number.isNaN(value) ? String(value).replace(".", ",") : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className="flex items-end gap-3">
      <Input
        type="text"
        inputMode={allowDecimal ? "decimal" : "numeric"}
        pattern={allowDecimal ? "[0-9]*[.,]?[0-9]*" : "[0-9]*"}
        autoComplete="off"
        value={text}
        onChange={(e) => {
          let raw = e.target.value;
          if (allowDecimal) {
            raw = raw.replace(/[^0-9.,]/g, "");
            const firstSep = raw.search(/[.,]/);
            if (firstSep !== -1) {
              raw = raw.slice(0, firstSep + 1) + raw.slice(firstSep + 1).replace(/[.,]/g, "");
            }
          } else {
            raw = raw.replace(/\D/g, "");
          }
          setText(raw);
          if (raw === "" || raw === "," || raw === ".") {
            onChange(NaN);
            return;
          }
          const normalizado = raw.replace(",", ".");
          const n = allowDecimal ? parseFloat(normalizado) : parseInt(normalizado, 10);
          onChange(Number.isNaN(n) ? NaN : n);
        }}
        className="h-14 text-2xl font-semibold"
        autoFocus
      />
      {suffix && <span className="pb-3 text-base text-muted-foreground">{suffix}</span>}
    </div>
  );
}

function Opt({
  value,
  label,
  checked,
}: {
  value: string;
  label: string;
  checked: boolean;
}) {
  // Evita depender do seletor CSS `:has()` (não suportado em WebViews
  // Android antigos) para o feedback visual de seleção: os usuários
  // clicavam, o estado mudava por baixo mas nada aparecia selecionado,
  // dando a sensação de que o quiz tinha travado — especialmente na
  // etapa final de "Quanta água você bebe por dia?".
  return (
    <Label
      className={
        "flex items-center gap-4 rounded-2xl p-4 cursor-pointer shadow-sm transition-all active:scale-[0.98] " +
        (checked
          ? "border-2 border-primary bg-primary-soft"
          : "border border-border bg-card hover:border-primary/30")
      }
    >
      <RadioGroupItem value={value} className="sr-only" />
      <span
        className={
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors " +
          (checked
            ? "bg-primary text-primary-foreground"
            : "border-2 border-border bg-background")
        }
      >
        {checked && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
      </span>
      <span
        className={
          "text-[15px] " +
          (checked
            ? "font-semibold text-primary"
            : "font-medium text-foreground")
        }
      >
        {label}
      </span>
    </Label>
  );
}

function MultiCheck({
  opcoes,
  selected,
  onChange,
}: {
  opcoes: string[];
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  function toggle(item: string) {
    onChange(selected.includes(item) ? selected.filter((x) => x !== item) : [...selected, item]);
  }
  return (
    <ul className="space-y-3">
      {opcoes.map((opt) => {
        const checked = selected.includes(opt);
        return (
          <li key={opt}>
            <button
              type="button"
              onClick={() => toggle(opt)}
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
  );
}

function LoadingTela({ texto, onMount }: { texto: string; onMount: () => void }) {
  // dispara o avanço uma vez
  useState(() => {
    onMount();
    return null;
  });
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      <p className="mt-6 text-base text-muted-foreground">{texto}</p>
    </div>
  );
}

function ChartProjecao({ data, onContinuar }: { data: IntakeRespostas; onContinuar: () => void }) {
  const pesoAtual = data.peso ?? 80;
  const pesoMeta = data.pesoDesejado ?? pesoAtual - 8;
  const semanas = 12;
  const diff = pesoAtual - pesoMeta;
  const projecao = Array.from({ length: semanas + 1 }, (_, i) => ({
    semana: `S${i}`,
    peso: Number((pesoAtual - (diff * i) / semanas).toFixed(1)),
  }));

  return (
    <div className="px-6 py-8">
      <h2 className="text-2xl font-bold leading-tight">Sua projeção em 12 semanas</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Seguindo o protocolo ACTIVE, você pode chegar dos {pesoAtual.toFixed(1)} kg atuais até o seu peso desejado de {pesoMeta.toFixed(1)} kg.
      </p>

      <div className="mt-6 h-72 w-full rounded-2xl border border-border bg-card p-3">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={projecao} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <XAxis dataKey="semana" tick={{ fontSize: 11 }} />
            <YAxis domain={[Math.floor(pesoMeta - 2), Math.ceil(pesoAtual + 2)]} tick={{ fontSize: 11 }} />
            <Tooltip
              formatter={(v: number) => [`${v} kg`, "Peso"]}
              labelFormatter={(l) => `Semana ${l.replace("S", "")}`}
            />
            <ReferenceLine y={pesoMeta} stroke="hsl(var(--primary))" strokeDasharray="4 4" label={{ value: "Meta", position: "insideTopRight", fontSize: 11 }} />
            <Bar dataKey="peso" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-6 rounded-2xl bg-primary-soft p-4 text-sm">
        <p className="font-semibold">Você pode perder até {diff.toFixed(1)} kg em 12 semanas.</p>
        <p className="mt-1 text-muted-foreground">Projeção educacional baseada no protocolo ACTIVE.</p>
      </div>

      <Button className="mt-8 h-14 w-full text-base" onClick={onContinuar}>
        Continuar
      </Button>
    </div>
  );
}

function TransicaoAntesDepois({ onContinuar }: { onContinuar: () => void }) {
  useState(() => {
    setTimeout(onContinuar, 3200);
    return null;
  });
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-6 text-center">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex h-40 w-32 items-center justify-center rounded-2xl bg-muted text-xs text-muted-foreground">
          Antes
        </div>
        <div className="flex h-40 w-32 items-center justify-center rounded-2xl bg-primary-soft text-xs text-primary">
          Depois
        </div>
      </div>
      <p className="mt-8 text-lg font-semibold leading-tight">
        Pessoas com o mesmo perfil que você perdem cerca de 38% de gordura corporal nas primeiras 8 semanas.
      </p>
      <div className="mt-6 h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}
