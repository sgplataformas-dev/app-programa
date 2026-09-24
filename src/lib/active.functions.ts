import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { retry } from "@/lib/http-retry";
import { z } from "zod";

function hojeISO() {
  return new Date().toISOString().slice(0, 10);
}
function mesCicloAtual() {
  return new Date().toISOString().slice(0, 7);
}

// Missões diárias da Fase 1:
//  - sem_atnn: não comeu ATNN nas refeições
//  - com_ari: comeu pelo menos um ARI
//  - agua: meta de 8 copos (registrada na chave "agua")
const MISSOES_DIARIAS = ["sem_atnn", "com_ari"] as const;
const META_AGUA = 8;
const DURACAO_FASE_1 = 10; // dias

export const getDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const hoje = hojeISO();
    const mes = mesCicloAtual();

    const [profileRes, progressRes, hojeRes, mesRes, intakeRes, last30Res, extratoRes, ultimaAulaRes] = await Promise.all([
      supabase.from("profiles").select("nome, avatar_url").eq("id", userId).maybeSingle(),
      supabase.from("user_progress").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("checkins").select("missao_chave, valor").eq("user_id", userId).eq("data", hoje),
      supabase.from("points").select("pontos").eq("user_id", userId).eq("mes_ciclo", mes),
      supabase.from("intake_responses").select("id").eq("user_id", userId).limit(1),
      supabase
        .from("checkins")
        .select("data")
        .eq("user_id", userId)
        .gte("data", new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)),
      supabase
        .from("points")
        .select("pontos, motivo, criado_em")
        .eq("user_id", userId)
        .eq("mes_ciclo", mes)
        .order("criado_em", { ascending: false })
        .limit(20),
      supabase
        .from("lesson_progress")
        .select("lesson_id, watched_at")
        .eq("user_id", userId)
        .order("watched_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const missoesFeitas = new Set((hojeRes.data ?? []).map((c) => c.missao_chave));
    const copoRow = (hojeRes.data ?? []).find((c) => c.missao_chave === "agua");
    const copos = copoRow ? Number(copoRow.valor ?? 0) : 0;

    const pontosMes = (mesRes.data ?? []).reduce((s, p) => s + (p.pontos ?? 0), 0);

    const dias = new Set((last30Res.data ?? []).map((d) => d.data));
    let streak = 0;
    for (let i = 0; i < 30; i++) {
      const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
      if (dias.has(d)) streak++;
      else break;
    }

    const progress = progressRes.data as
      | {
          fase_atual: number;
          protocolo_iniciado_em: string | null;
          quiz_fase1_completo?: boolean;
        }
      | null;
    let dia = 1;
    if (progress?.protocolo_iniciado_em) {
      const start = new Date(progress.protocolo_iniciado_em).getTime();
      dia = Math.floor((Date.now() - start) / 86400000) + 1;
    }

    const avatarPath = (profileRes.data as { avatar_url?: string | null } | null)?.avatar_url ?? null;
    let avatarUrl: string | null = null;
    if (avatarPath) {
      const signed = await supabase.storage.from("avatars").createSignedUrl(avatarPath, 60 * 60 * 24 * 7);
      avatarUrl = signed.data?.signedUrl ?? null;
    }

    const intakeCompleto = (intakeRes.data ?? []).length > 0;

    return {
      nome: profileRes.data?.nome ?? "",
      avatarUrl,
      faseAtual: intakeCompleto ? Math.max(progress?.fase_atual ?? 1, 2) : (progress?.fase_atual ?? 1),
      dia,
      totalDiasFase: DURACAO_FASE_1,
      protocoloIniciadoEm: progress?.protocolo_iniciado_em ?? null,
      intakeCompleto,
      quizFase1Completo: progress?.quiz_fase1_completo ?? false,
      missoesFeitas: Array.from(missoesFeitas),
      copos,
      metaAgua: META_AGUA,
      pontosMes,
      streak,
      extrato: extratoRes.data ?? [],
      ultimaAulaId: ultimaAulaRes.data?.lesson_id ?? null,
    };
  });


const missaoSchema = z.object({ missao_chave: z.enum(MISSOES_DIARIAS) });

export const marcarMissao = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => missaoSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const hoje = hojeISO();
    const mes = mesCicloAtual();

    const ins = await supabase
      .from("checkins")
      .insert({ user_id: userId, missao_chave: data.missao_chave, data: hoje })
      .select("id")
      .single();

    if (ins.error) return { ok: true, ja: true };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("points").insert({
      user_id: userId,
      checkin_id: ins.data.id,
      pontos: 1,
      motivo: `Missão: ${data.missao_chave}`,
      mes_ciclo: mes,
    });

    return { ok: true, ja: false };
  });

export const adicionarCopoAgua = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const hoje = hojeISO();
    const mes = mesCicloAtual();

    const existing = await supabase
      .from("checkins")
      .select("id, valor")
      .eq("user_id", userId)
      .eq("missao_chave", "agua")
      .eq("data", hoje)
      .maybeSingle();

    let copos = 1;
    let checkinId: string;
    let acabouDeBater = false;

    if (existing.data) {
      copos = Math.min(META_AGUA, Number(existing.data.valor ?? 0) + 1);
      const prev = Number(existing.data.valor ?? 0);
      acabouDeBater = prev < META_AGUA && copos >= META_AGUA;
      await supabase.from("checkins").update({ valor: copos }).eq("id", existing.data.id);
      checkinId = existing.data.id;
    } else {
      const ins = await supabase
        .from("checkins")
        .insert({ user_id: userId, missao_chave: "agua", data: hoje, valor: 1 })
        .select("id")
        .single();
      if (ins.error) throw new Error(ins.error.message);
      checkinId = ins.data.id;
    }

    if (acabouDeBater) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin.from("points").insert({
        user_id: userId,
        checkin_id: checkinId,
        pontos: 1,
        motivo: "Meta de água do dia",
        mes_ciclo: mes,
      });
    }

    return { copos, meta: META_AGUA, ganhouPonto: acabouDeBater };
  });

const intakeSchema = z.object({
  idade: z.number().int().min(10).max(120),
  peso: z.number().positive().max(400),
  altura: z.number().positive().max(250),
  pesoDesejado: z.number().positive().max(400),
  objetivos: z.array(z.string()).max(20).optional(),
  condicoes: z.array(z.string()).max(50).optional(),
  usaMedicamentos: z.enum(["sim", "nao"]).optional(),
  medicamentos: z.array(z.string()).max(50).optional(),
  medicamentosOutro: z.string().max(300).optional(),
  bristol: z.string().max(20).optional(),
  frequenciaIntestinal: z.string().max(40).optional(),
  qualidadeSono: z.string().max(40).optional(),
  horasSono: z.number().min(0).max(24).optional(),
  refeicoesPorDia: z.string().max(20).optional(),
  cafeDaManha: z.string().max(40).optional(),
  restricoesAlimentares: z.array(z.string()).max(20).optional(),
  restricoesOutro: z.string().max(200).optional(),
  alcool: z.string().max(40).optional(),
  mlAgua: z.number().min(0).max(10000).optional(),
});


export const salvarIntake = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => intakeSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    await retry(
      async () => {
        const { error } = await supabase.from("intake_responses").insert({ user_id: userId, respostas: data });
        if (error) throw error;
      },
      { retries: 4, label: "salvar-intake-insert" },
    );

    const prog = await retry(
      async () => {
        const res = await supabase
          .from("user_progress")
          .select("user_id, pesos, protocolo_iniciado_em")
          .eq("user_id", userId)
          .maybeSingle();
        if (res.error) throw res.error;
        return res;
      },
      { retries: 4, label: "salvar-intake-progress-select" },
    );

    const hoje = hojeISO();
    const novoPeso = { data: hoje, peso: data.peso };
    const pesosAtuais: Array<{ data: string; peso: number }> = Array.isArray(prog.data?.pesos)
      ? (prog.data!.pesos as Array<{ data: string; peso: number }>)
      : [];
    const pesos = [...pesosAtuais.filter((p) => p.data !== hoje), novoPeso];

    await retry(
      async () => {
        const { error } = await supabase.from("user_progress").upsert(
          {
            user_id: userId,
            protocolo_iniciado_em: prog.data?.protocolo_iniciado_em ?? new Date().toISOString(),
            pesos: pesos as unknown as never,
          },
          { onConflict: "user_id" },
        );
        if (error) throw error;
      },
      { retries: 4, label: "salvar-intake-progress-upsert" },
    );

    return { ok: true };
  });

export const getIntakeMaisRecente = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data } = await supabase
      .from("intake_responses")
      .select("respostas")
      .eq("user_id", userId)
      .order("completado_em", { ascending: false })
      .limit(1)
      .maybeSingle();
    return { respostas: (data?.respostas ?? null) as null | { [k: string]: string | number | null } };
  });

const quizSchema = z.object({
  evitar_atnn: z.array(z.string()).max(50),
  evitar_ari: z.array(z.string()).max(50),
});

export const salvarQuizFase1 = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => quizSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const prog = await retry(
      async () => {
        const res = await supabase.from("user_progress").select("user_id").eq("user_id", userId).maybeSingle();
        if (res.error) throw res.error;
        return res;
      },
      { retries: 4, label: "quiz-fase1-progress-select" },
    );

    const payload = {
      preferencias_alimentares: data as unknown as never,
      quiz_fase1_completo: true,
    };

    await retry(
      async () => {
        const { error } = prog.data
          ? await supabase.from("user_progress").update(payload).eq("user_id", userId)
          : await supabase.from("user_progress").insert({
              user_id: userId,
              protocolo_iniciado_em: new Date().toISOString(),
              ...payload,
            });
        if (error) throw error;
      },
      { retries: 4, label: "quiz-fase1-progress-save" },
    );
    return { ok: true };
  });

export const getPreferencias = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data } = await supabase
      .from("user_progress")
      .select("preferencias_alimentares, quiz_fase1_completo")
      .eq("user_id", userId)
      .maybeSingle();
    const pref = (data?.preferencias_alimentares ?? { evitar_atnn: [], evitar_ari: [] }) as {
      evitar_atnn: string[];
      evitar_ari: string[];
    };
    return { preferencias: pref, quizCompleto: Boolean(data?.quiz_fase1_completo) };
  });

export const getPontosExtrato = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const mes = mesCicloAtual();
    const { data } = await supabase
      .from("points")
      .select("pontos, motivo, criado_em")
      .eq("user_id", userId)
      .order("criado_em", { ascending: false })
      .limit(100);
    const total = (data ?? []).filter((p) => p.criado_em.slice(0, 7) === mes).reduce((s, p) => s + p.pontos, 0);
    return { total, extrato: data ?? [] };
  });

export const getPerfil = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId, claims } = context;
    const [p, prog] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase.from("user_progress").select("pesos").eq("user_id", userId).maybeSingle(),
    ]);
    const avatarPath = (p.data as { avatar_url?: string | null } | null)?.avatar_url ?? null;
    let avatarUrl: string | null = null;
    if (avatarPath) {
      const signed = await supabase.storage.from("avatars").createSignedUrl(avatarPath, 60 * 60 * 24 * 7);
      avatarUrl = signed.data?.signedUrl ?? null;
    }
    return {
      nome: p.data?.nome ?? "",
      email: (claims.email as string) ?? "",
      telefone: p.data?.telefone ?? "",
      bio: (p.data as { bio?: string | null } | null)?.bio ?? "",
      avatarUrl,
      pesos: (prog.data?.pesos as { data: string; peso: number }[] | null) ?? [],
    };
  });

const avatarSchema = z.object({ path: z.string().max(512).nullable() });
export const salvarAvatar = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => avatarSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await supabase.from("profiles").update({ avatar_url: data.path }).eq("id", userId);
    return { ok: true };
  });

const perfilUpdateSchema = z.object({
  nome: z.string().trim().min(1, "Nome obrigatório").max(80),
  bio: z.string().trim().max(280).optional().default(""),
});
export const atualizarPerfil = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => perfilUpdateSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await supabase
      .from("profiles")
      .update({ nome: data.nome, bio: data.bio || null })
      .eq("id", userId);
    return { ok: true };
  });

const avancarFaseSchema = z.object({ proxima: z.number().int().min(2).max(3) });
export const avancarFase = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => avancarFaseSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await supabase
      .from("user_progress")
      .update({
        fase_atual: data.proxima,
        protocolo_iniciado_em: new Date().toISOString(),
      })
      .eq("user_id", userId);
    return { ok: true, faseAtual: data.proxima };
  });

const pesoSchema = z.object({ peso: z.number().positive().max(400) });
export const atualizarPeso = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => pesoSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const prog = await supabase
      .from("user_progress")
      .select("pesos")
      .eq("user_id", userId)
      .maybeSingle();
    type PesoEntry = { data: string; peso: number };
    const atuais: PesoEntry[] = Array.isArray(prog.data?.pesos)
      ? (prog.data!.pesos as PesoEntry[])
      : [];
    const pesos: PesoEntry[] = [...atuais, { data: new Date().toISOString().slice(0, 10), peso: data.peso }];
    await supabase.from("user_progress").update({ pesos: pesos as unknown as never }).eq("user_id", userId);
    return { ok: true, pesos };
  });
