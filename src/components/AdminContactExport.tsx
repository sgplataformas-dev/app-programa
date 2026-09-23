import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { exportWhatsappContacts } from "@/lib/admin.functions";
import { MODULOS } from "@/content/aulas";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Download, Loader2, MessageCircle } from "lucide-react";

const TOTAL_LESSONS = MODULOS.reduce((acc, m) => acc + m.aulas.length, 0);

type ContactRow = {
  nome: string;
  telefone: string;
  email: string;
  ultimaCompra: string | null;
  aulas: number;
  pct: number;
};

type Result = { contacts: ContactRow[]; total: number; semTelefone: number };

function toCsv(rows: ContactRow[]) {
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const head = [
    "nome",
    "telefone",
    "email",
    "data_compra",
    "aulas_assistidas",
    "percentual_consumido",
  ];
  const lines = rows.map((r) =>
    [
      r.nome,
      r.telefone,
      r.email,
      r.ultimaCompra ? new Date(r.ultimaCompra).toLocaleString("pt-BR") : "",
      r.aulas,
      `${r.pct}%`,
    ]
      .map(esc)
      .join(","),
  );
  return "\uFEFF" + [head.join(","), ...lines].join("\r\n");
}

function download(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function todayIso(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

export default function AdminContactExport() {
  const run = useServerFn(exportWhatsappContacts);

  const [maxPct, setMaxPct] = useState(5);
  const [from, setFrom] = useState("2026-09-05");
  const [to, setTo] = useState(todayIso());
  const [loading, setLoading] = useState<"low" | "period" | null>(null);
  const [lowResult, setLowResult] = useState<Result | null>(null);
  const [periodResult, setPeriodResult] = useState<Result | null>(null);

  async function loadLow(andDownload: boolean) {
    setLoading("low");
    try {
      const res = (await run({
        data: { kind: "low_engagement", maxPct, totalLessons: TOTAL_LESSONS },
      })) as Result;
      setLowResult(res);
      if (andDownload) {
        if (!res.contacts.length) {
          toast.error("Nenhum contato com telefone nessa lista.");
        } else {
          download(`contatos-pouco-consumo-${todayIso()}.csv`, toCsv(res.contacts));
          toast.success(`${res.contacts.length} contatos exportados.`);
        }
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Falha ao gerar a lista");
    } finally {
      setLoading(null);
    }
  }

  async function loadPeriod(andDownload: boolean) {
    setLoading("period");
    try {
      // "to" é inclusivo para o usuário: somamos 1 dia no limite superior
      const end = new Date(`${to}T00:00:00-03:00`);
      end.setDate(end.getDate() + 1);
      const res = (await run({
        data: {
          kind: "period",
          from: new Date(`${from}T00:00:00-03:00`).toISOString(),
          to: end.toISOString(),
          totalLessons: TOTAL_LESSONS,
        },
      })) as Result;
      setPeriodResult(res);
      if (andDownload) {
        if (!res.contacts.length) {
          toast.error("Nenhum contato com telefone nesse período.");
        } else {
          download(`contatos-compradores-${from}_a_${to}.csv`, toCsv(res.contacts));
          toast.success(`${res.contacts.length} contatos exportados.`);
        }
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Falha ao gerar a lista");
    } finally {
      setLoading(null);
    }
  }

  return (
    <section className="mt-10">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
          <MessageCircle className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-base font-semibold leading-tight">Contatos / Disparo</h2>
          <p className="text-xs text-muted-foreground">
            Baixe a planilha com nome, telefone e e-mail dos clientes para o disparo no
            WhatsApp. Só entram compras válidas (sem reembolso, cancelamento ou bloqueio).
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="space-y-4 p-5">
            <div>
              <h3 className="text-sm font-semibold">Clientes com pouco consumo</h3>
              <p className="text-xs text-muted-foreground">
                Quem nunca entrou nas aulas ou assistiu até {maxPct}% do conteúdo (
                {TOTAL_LESSONS} aulas no total).
              </p>
            </div>
            <div className="max-w-[180px]">
              <Label htmlFor="maxpct" className="text-xs">
                Consumo máximo (%)
              </Label>
              <Input
                id="maxpct"
                type="number"
                min={0}
                max={100}
                value={maxPct}
                onChange={(e) => setMaxPct(Number(e.target.value))}
              />
            </div>
            {lowResult && (
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{lowResult.contacts.length} com telefone</Badge>
                <Badge variant="outline">{lowResult.total} clientes na regra</Badge>
                {lowResult.semTelefone > 0 && (
                  <Badge variant="outline">{lowResult.semTelefone} sem telefone</Badge>
                )}
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={loading !== null}
                onClick={() => loadLow(false)}
              >
                {loading === "low" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Contar
              </Button>
              <Button size="sm" disabled={loading !== null} onClick={() => loadLow(true)}>
                <Download className="mr-2 h-4 w-4" /> Baixar planilha
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 p-5">
            <div>
              <h3 className="text-sm font-semibold">Compradores por período</h3>
              <p className="text-xs text-muted-foreground">
                Padrão: sábado 05/09 até hoje. Datas inclusivas (horário de Brasília).
              </p>
            </div>
            <div className="flex gap-3">
              <div>
                <Label htmlFor="de" className="text-xs">
                  De
                </Label>
                <Input
                  id="de"
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="ate" className="text-xs">
                  Até
                </Label>
                <Input
                  id="ate"
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                />
              </div>
            </div>
            {periodResult && (
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">
                  {periodResult.contacts.length} com telefone
                </Badge>
                <Badge variant="outline">{periodResult.total} compradores</Badge>
                {periodResult.semTelefone > 0 && (
                  <Badge variant="outline">{periodResult.semTelefone} sem telefone</Badge>
                )}
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={loading !== null}
                onClick={() => loadPeriod(false)}
              >
                {loading === "period" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Contar
              </Button>
              <Button size="sm" disabled={loading !== null} onClick={() => loadPeriod(true)}>
                <Download className="mr-2 h-4 w-4" /> Baixar planilha
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
