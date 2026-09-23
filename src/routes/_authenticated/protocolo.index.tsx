import { createFileRoute } from "@tanstack/react-router";
import {
  INGREDIENTES_CORINGA,
  NOTAS_FINAIS,
  PLANO_DIAS,
  PLANO_INTRO,
} from "@/content/plano-10-dias";
import {
  CORINGA_HIPO,
  TABELA_GERAL,
  TROCAS_INTRO,
  TROCAS_POR_DIA,
  type Troca,
} from "@/content/trocas-hipoalergenicas";

export const Route = createFileRoute("/_authenticated/protocolo/")({
  component: Protocolo,
});

function TrocaBloco({ troca }: { troca: Troca }) {
  return (
    <div className="mt-2 rounded-xl border-l-4 border-gold bg-gold/10 px-3 py-2.5">
      <span className="inline-block rounded-full bg-gold px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gold-foreground">
        Troca · {troca.alerta}
      </span>
      <p className="mt-1.5 text-xs text-muted-foreground">No lugar de: {troca.de}</p>
      <p className="mt-0.5 text-xs leading-relaxed">
        <span className="font-semibold">Use:</span> {troca.para}
      </p>
    </div>
  );
}


function Protocolo() {
  return (
    <div className="px-6 py-8">
      <h1 className="text-2xl font-bold">Seu Protocolo</h1>

      <section className="mt-6 rounded-2xl border border-primary bg-primary-soft p-5">
        <h2 className="text-lg font-semibold leading-tight">{PLANO_INTRO.titulo}</h2>
        <p className="mt-1 text-sm font-medium text-muted-foreground">
          {PLANO_INTRO.subtitulo}
        </p>
        <p className="mt-3 text-sm leading-relaxed">{PLANO_INTRO.descricao}</p>
        <ul className="mt-4 space-y-2">
          {PLANO_INTRO.regras.map((r) => (
            <li key={r} className="flex gap-2 text-sm">
              <span aria-hidden>•</span>
              <span>{r}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6 rounded-2xl border border-gold bg-gold/10 p-5">
        <h2 className="text-base font-semibold leading-tight">{TROCAS_INTRO.titulo}</h2>
        <p className="mt-2 text-sm leading-relaxed">{TROCAS_INTRO.descricao}</p>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          {TROCAS_INTRO.principio}
        </p>
      </section>

      <div className="mt-8 space-y-4">
        {PLANO_DIAS.map((dia) => {
          const trocasDia = TROCAS_POR_DIA.find((t) => t.dia === dia.numero);
          const trocas = trocasDia?.trocas ?? [];
          return (
            <article key={dia.numero} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Dia {String(dia.numero).padStart(2, "0")}
                  </p>
                  <h3 className="text-base font-semibold leading-tight">{dia.tema}</h3>
                </div>
                {trocas.length > 0 && (
                  <span className="shrink-0 rounded-full bg-gold/20 px-2.5 py-1 text-[11px] font-bold text-gold-foreground">
                    {trocas.length} {trocas.length === 1 ? "troca" : "trocas"}
                  </span>
                )}
              </div>
              <div className="mt-4 space-y-4">
                {dia.refeicoes.map((r) => (
                  <div key={r.titulo}>
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                      {r.titulo}
                    </p>
                    {r.nome && <p className="text-sm font-semibold">{r.nome}</p>}
                    <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
                      {r.descricao}
                    </p>
                    {trocas
                      .filter((t) => t.refeicao === r.titulo)
                      .map((t) => (
                        <TrocaBloco key={`${t.de}-${t.para}`} troca={t} />
                      ))}
                  </div>
                ))}
              </div>
              {trocasDia?.nota && (
                <p className="mt-4 text-xs italic text-muted-foreground">{trocasDia.nota}</p>
              )}
            </article>
          );
        })}
      </div>

      <section className="mt-8">
        <h2 className="text-lg font-bold">Tabela geral de substituições</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Consulta rápida para adaptar qualquer receita, não só as citadas nos dias.
        </p>
        <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-card">
          {TABELA_GERAL.map((linha) => (
            <div key={linha.original} className="border-b border-border p-4 last:border-b-0">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-semibold">{linha.original}</p>
                <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                  {linha.motivo}
                </span>
              </div>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {linha.substituicao}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-bold">Coringas em versão hipoalergênica</h2>
        <div className="mt-4 space-y-3">
          {CORINGA_HIPO.map((item) => (
            <div key={item.categoria} className="rounded-2xl border border-border bg-card p-4">
              <p className="text-sm font-semibold">{item.categoria}</p>
              <p className="mt-1 text-xs text-muted-foreground">Com alerta: {item.alerta}</p>
              <p className="mt-1 text-sm leading-relaxed">{item.seguro}</p>
            </div>
          ))}
        </div>
      </section>


      <section className="mt-8">
        <h2 className="text-lg font-bold">Lista de ingredientes coringa</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Use quando não conseguir seguir uma receita do plano — estes alimentos nunca erram.
        </p>
        <div className="mt-4 space-y-4">
          {INGREDIENTES_CORINGA.map((grupo) => (
            <div key={grupo.titulo} className="rounded-2xl border border-border bg-card p-5">
              <h3 className="text-sm font-semibold leading-tight">{grupo.titulo}</h3>
              <ul className="mt-3 space-y-1.5">
                {grupo.itens.map((item) => (
                  <li key={item} className="flex gap-2 text-sm text-muted-foreground">
                    <span aria-hidden>•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-border bg-muted/40 p-5">
        <h2 className="text-sm font-semibold">Observações importantes</h2>
        <ul className="mt-3 space-y-2.5">
          {NOTAS_FINAIS.map((n) => (
            <li key={n} className="flex gap-2 text-sm text-muted-foreground">
              <span aria-hidden>•</span>
              <span>{n}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
