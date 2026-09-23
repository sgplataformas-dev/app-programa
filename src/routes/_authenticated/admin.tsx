import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  bulkProvisionPendingLeads,
  bulkResendAccess,
  checkIsAdmin,
  grantAccess,
  listUsersAdmin,
  reactivateAccess,
  revokeAccess,
  sendPasswordReset,
  setUserPasswordAdmin,
  updateUserAdmin,
} from "@/lib/admin.functions";
import AdminContactExport from "@/components/AdminContactExport";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Bug,
  Check,
  CheckCircle2,
  KeyRound,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  ShieldOff,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";



export const Route = createFileRoute("/_authenticated/admin")({
  ssr: false,
  beforeLoad: async () => {
    try {
      const res = await checkIsAdmin();
      if (!res.isAdmin) throw redirect({ to: "/hoje" });
    } catch {
      throw redirect({ to: "/hoje" });
    }
  },
  component: AdminPanel,
});

type Row = Awaited<ReturnType<typeof listUsersAdmin>>["rows"][number];

function StatusBadge({ row }: { row: Row }) {
  if (row.banido) return <Badge variant="destructive">Bloqueado</Badge>;
  if (!row.acesso_enviado) return <Badge variant="secondary">Não enviado</Badge>;
  if (!row.email_confirmado) return <Badge variant="outline">Pendente</Badge>;
  return <Badge className="bg-emerald-600 hover:bg-emerald-600">Ativo</Badge>;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const d = new Date(value);
  const date = d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const time = d.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${date} ${time}`;
}

function AdminPanel() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "blocked" | "pending"
  >("all");
  const list = useServerFn(listUsersAdmin);
  const grant = useServerFn(grantAccess);
  const revoke = useServerFn(revokeAccess);
  const reactivate = useServerFn(reactivateAccess);
  const reset = useServerFn(sendPasswordReset);
  const update = useServerFn(updateUserAdmin);
  const setPassword = useServerFn(setUserPasswordAdmin);
  const bulkProvision = useServerFn(bulkProvisionPendingLeads);
  const bulkResend = useServerFn(bulkResendAccess);
  const [provisioning, setProvisioning] = useState<null | {
    running: boolean;
    created: number;
    linked: number;
    remaining: number;
    errors: number;
  }>(null);
  const [resending, setResending] = useState(false);

  async function runBulkProvision() {
    if (
      !confirm(
        "Criar contas no Auth para TODOS os leads importados ainda sem acesso? Isso pode demorar alguns minutos.",
      )
    )
      return;
    setProvisioning({ running: true, created: 0, linked: 0, remaining: 0, errors: 0 });
    let totalCreated = 0;
    let totalLinked = 0;
    let totalErrors = 0;
    let safety = 400; // máx 400 lotes * 25 = 10.000 contas
    try {
      while (safety-- > 0) {
        const res = await bulkProvision({ data: { limit: 25 } });
        totalCreated += res.created;
        totalLinked += res.linked;
        totalErrors += res.errors.length;
        setProvisioning({
          running: res.remaining > 0,
          created: totalCreated,
          linked: totalLinked,
          remaining: res.remaining,
          errors: totalErrors,
        });
        if (res.processed === 0 || res.remaining === 0) break;
      }
      toast.success(
        `Provisionamento concluído. ${totalCreated} contas criadas, ${totalLinked} vinculadas.`,
      );
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
    } catch (e: any) {
      toast.error(e?.message ?? "Falha no provisionamento em lote");
    } finally {
      setProvisioning((p) => (p ? { ...p, running: false } : p));
    }
  }

  async function runBulkResend() {
    try {
      const preview = await bulkResend({ data: { dryRun: true } });
      const total = preview.total;
      if (total === 0) {
        toast.info("Nenhum cliente com compra ativa e status Não enviado encontrado.");
        return;
      }
      if (
        !confirm(
          `Reenviar o e-mail de acesso para ${total} cliente(s) com compra ativa e status "Não enviado"?\n\nO envio respeita o limite do provedor e pode levar alguns minutos.`,
        )
      )
        return;
      setResending(true);
      const res = await bulkResend({ data: {} });
      toast.success(
        `Reenvio concluído: ${res.invited} enviado(s), ${res.skipped} pulado(s)${
          res.errors.length ? `, ${res.errors.length} erro(s)` : ""
        }.`,
      );
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
    } catch (e: any) {
      toast.error(e?.message ?? "Falha no reenvio em massa");
    } finally {
      setResending(false);
    }
  }


  const queryKey = useMemo(() => ["admin", "users", page] as const, [page]);
  const query = useQuery({
    queryKey,
    queryFn: () => list({ data: { search: "", page, perPage: 200 } }),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  // Atualiza em tempo real quando o webhook insere/atualiza compras
  // ou registra novos eventos — assim novos leads aparecem sem refresh.
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    const invalidate = () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        qc.invalidateQueries({ queryKey: ["admin", "users"] });
      }, 400);
    };
    const channel = supabase
      .channel("admin-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "purchases" },
        invalidate,
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "webhook_events" },
        invalidate,
      )
      .subscribe();
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      supabase.removeChannel(channel);
    };
  }, [qc]);

  const allRows = query.data?.rows ?? [];

  const counts = useMemo(() => {
    const active = allRows.filter(
      (r) => !r.banido && r.acesso_enviado && r.email_confirmado,
    ).length;
    const blocked = allRows.filter((r) => r.banido).length;
    const pending = allRows.filter(
      (r) => !r.banido && (!r.acesso_enviado || !r.email_confirmado),
    ).length;
    return { total: allRows.length, active, blocked, pending };
  }, [allRows]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return allRows.filter((r) => {
      if (statusFilter === "active" && !(!r.banido && r.acesso_enviado && r.email_confirmado))
        return false;
      if (statusFilter === "blocked" && !r.banido) return false;
      if (
        statusFilter === "pending" &&
        !(!r.banido && (!r.acesso_enviado || !r.email_confirmado))
      )
        return false;
      if (!term) return true;
      return (
        r.email.toLowerCase().includes(term) ||
        (r.nome ?? "").toLowerCase().includes(term)
      );
    });
  }, [allRows, search, statusFilter]);

  function refresh() {
    qc.invalidateQueries({ queryKey: ["admin", "users"] });
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = "/auth";
  }

  const grantMut = useMutation({
    mutationFn: (data: { email: string; nome?: string; telefone?: string; password?: string }) =>
      grant({ data }),
    onSuccess: (_res, vars) => {
      toast.success(vars.password ? "Acesso liberado com senha definida." : "Acesso enviado por e-mail.");
      refresh();
    },
    onError: (e: any) => toast.error(e?.message ?? "Falha ao liberar acesso"),
  });

  const resetMut = useMutation({
    mutationFn: (data: { userId: string; email: string }) => reset({ data }),
    onSuccess: () => toast.success("E-mail de redefinição enviado."),
    onError: (e: any) => toast.error(e?.message ?? "Falha ao enviar redefinição"),
  });

  const revokeMut = useMutation({
    mutationFn: (data: { userId: string; email: string }) => revoke({ data }),
    onSuccess: () => {
      toast.success("Acesso cancelado.");
      refresh();
    },
    onError: (e: any) => toast.error(e?.message ?? "Falha ao cancelar acesso"),
  });

  const reactivateMut = useMutation({
    mutationFn: (data: { userId: string; email: string }) => reactivate({ data }),
    onSuccess: () => {
      toast.success("Acesso reativado.");
      refresh();
    },
    onError: (e: any) => toast.error(e?.message ?? "Falha ao reativar"),
  });

  const updateMut = useMutation({
    mutationFn: (data: {
      userId: string;
      email?: string;
      nome?: string;
      telefone?: string | null;
    }) => update({ data }),
    onSuccess: () => {
      toast.success("Usuário atualizado.");
      refresh();
    },
    onError: (e: any) => toast.error(e?.message ?? "Falha ao atualizar"),
  });

  const setPasswordMut = useMutation({
    mutationFn: (data: { userId: string; email: string; password: string }) =>
      setPassword({ data }),
    onSuccess: () => toast.success("Senha alterada com sucesso."),
    onError: (e: any) => toast.error(e?.message ?? "Falha ao alterar senha"),
  });

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-semibold leading-tight">Painel Admin</h1>
              <p className="text-xs text-muted-foreground">
                Controle de acessos · Programa ACTIVE
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/hoje">
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao app
              </Link>
            </Button>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-6 py-8">
        {/* Stat cards */}
        <section className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard
            label="Total de usuários"
            value={counts.total}
            icon={<Users className="h-5 w-5" />}
          />
          <StatCard
            label="Ativos"
            value={counts.active}
            icon={<ShieldCheck className="h-5 w-5" />}
            accent="text-emerald-600"
          />
          <StatCard
            label="Pendentes"
            value={counts.pending}
            icon={<Send className="h-5 w-5" />}
            accent="text-amber-600"
          />
          <StatCard
            label="Bloqueados"
            value={counts.blocked}
            icon={<ShieldOff className="h-5 w-5" />}
            accent="text-destructive"
          />
        </section>

        {/* Toolbar */}
        <section className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-1 flex-wrap items-center gap-2">
            <div className="relative min-w-[280px] flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou e-mail…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-1 rounded-md border bg-card p-1">
              {(
                [
                  ["all", "Todos"],
                  ["active", "Ativos"],
                  ["pending", "Pendentes"],
                  ["blocked", "Bloqueados"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setStatusFilter(key)}
                  className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                    statusFilter === key
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {filtered.length} resultado(s)
            </span>
            <Button variant="outline" size="sm" onClick={refresh}>
              <RefreshCw className="mr-2 h-4 w-4" /> Atualizar
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={runBulkProvision}
              disabled={provisioning?.running}
            >
              {provisioning?.running ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Users className="mr-2 h-4 w-4" />
              )}
              {provisioning?.running
                ? `Provisionando… ${provisioning.created} criadas · ${provisioning.remaining} restam`
                : "Provisionar leads importados"}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={runBulkResend}
              disabled={resending}
            >
              {resending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              {resending ? "Reenviando acessos…" : "Reenviar acesso em massa"}
            </Button>
            <GrantDialog
              onSubmit={(d) => grantMut.mutate(d)}
              loading={grantMut.isPending}
            />
          </div>
        </section>
        {provisioning && !provisioning.running && (provisioning.created > 0 || provisioning.linked > 0) && (
          <div className="mb-4 rounded-md border border-emerald-500/30 bg-emerald-500/5 px-4 py-2 text-sm text-emerald-700">
            Último lote: {provisioning.created} contas criadas, {provisioning.linked} vinculadas
            {provisioning.errors > 0 && ` · ${provisioning.errors} erros`}.
          </div>
        )}

        {/* Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="w-[22%]">Usuário</TableHead>
                  <TableHead className="w-[22%]">E-mail</TableHead>
                  <TableHead className="w-[10%]">Criado em</TableHead>
                  <TableHead className="w-[10%]">Último acesso</TableHead>
                  <TableHead className="w-[8%]">Enviado</TableHead>
                  <TableHead className="w-[10%]">Status</TableHead>
                  <TableHead className="w-[10%]">Compra</TableHead>
                  <TableHead className="w-[8%] text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {query.isLoading && (
                  <TableRow>
                    <TableCell colSpan={8} className="py-12 text-center">
                      <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                )}
                {query.isError && (
                  <TableRow>
                    <TableCell colSpan={8} className="py-12 text-center text-destructive">
                      Erro ao carregar usuários.
                    </TableCell>
                  </TableRow>
                )}
                {!query.isLoading && filtered.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="py-12 text-center text-muted-foreground"
                    >
                      Nenhum usuário encontrado.
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map((row) => (
                  <TableRow key={row.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium leading-tight">
                          {row.nome || "—"}
                        </span>
                        {row.telefone && (
                          <span className="text-xs text-muted-foreground">
                            {row.telefone}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {row.email}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(row.criado_em)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(row.ultimo_login)}
                    </TableCell>
                    <TableCell>
                      {row.acesso_enviado ? (
                        <Badge variant="outline" className="border-emerald-500/40 text-emerald-700">
                          Sim
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Não</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge row={row} />
                    </TableCell>
                    <TableCell className="text-sm">
                      {row.compra_ativa ? (
                        <span className="font-medium text-emerald-600">Ativa</span>
                      ) : row.total_compras > 0 ? (
                        <span className="text-amber-600">Reembolsada</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <RowActions
                        row={row}
                        onReset={() =>
                          resetMut.mutate({ userId: row.id, email: row.email })
                        }
                        onRevoke={() =>
                          revokeMut.mutate({ userId: row.id, email: row.email })
                        }
                        onReactivate={() =>
                          reactivateMut.mutate({ userId: row.id, email: row.email })
                        }
                        onResend={() =>
                          grantMut.mutate({
                            email: row.email,
                            nome: row.nome,
                            telefone: row.telefone ?? undefined,
                          })
                        }
                        onEdit={(patch) =>
                          updateMut.mutate({ userId: row.id, ...patch })
                        }
                        onSetPassword={(password) =>
                          setPasswordMut.mutate({ userId: row.id, email: row.email, password })
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* Pagination */}
        <div className="mt-4 flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            ← Anterior
          </Button>
          <span className="text-sm text-muted-foreground">Página {page}</span>
          <Button
            variant="outline"
            size="sm"
            disabled={!query.data?.hasMore}
            onClick={() => setPage((p) => p + 1)}
          >
            Próxima →
          </Button>
        </div>

        

        <AdminContactExport />

        <IssueReportsSection />


        <p className="mt-8 text-xs text-muted-foreground">
          Por segurança, as senhas dos usuários nunca são armazenadas em texto e
          não podem ser exibidas. Use "Redefinir senha" para que o usuário crie uma nova.
        </p>
      </main>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  accent = "text-foreground",
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  accent?: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className={`mt-1 text-3xl font-semibold ${accent}`}>{value}</p>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-muted ${accent}`}>
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}

function GrantDialog({
  onSubmit,
  loading,
}: {
  onSubmit: (data: { email: string; nome?: string; telefone?: string; password?: string }) => void;
  loading: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [password, setPassword] = useState("");

  const passwordInvalid = password.length > 0 && password.length < 8;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <UserPlus className="mr-2 h-4 w-4" /> Liberar acesso
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Liberar acesso manual</DialogTitle>
          <DialogDescription>
            Cria a conta caso ainda não exista. Informe uma senha para deixar o acesso pronto, ou deixe em branco para enviar convite por e-mail.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div>
            <Label htmlFor="g-email">E-mail</Label>
            <Input
              id="g-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="cliente@email.com"
            />
          </div>
          <div>
            <Label htmlFor="g-nome">Nome</Label>
            <Input id="g-nome" value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="g-tel">Telefone</Label>
            <Input
              id="g-tel"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="g-pwd">Senha (opcional)</Label>
            <Input
              id="g-pwd"
              type="text"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
            />
            {passwordInvalid && (
              <p className="mt-1 text-xs text-destructive">A senha precisa ter pelo menos 8 caracteres.</p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              Se informada, o acesso fica pronto imediatamente com essa senha. Se em branco, será enviado convite por e-mail.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            disabled={!email || loading || passwordInvalid}
            onClick={() => {
              onSubmit({
                email,
                nome: nome || undefined,
                telefone: telefone || undefined,
                password: password || undefined,
              });
              setOpen(false);
              setEmail("");
              setNome("");
              setTelefone("");
              setPassword("");
            }}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enviar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RowActions({
  row,
  onReset,
  onRevoke,
  onReactivate,
  onResend,
  onEdit,
  onSetPassword,
}: {
  row: Row;
  onReset: () => void;
  onRevoke: () => void;
  onReactivate: () => void;
  onResend: () => void;
  onEdit: (patch: { email?: string; nome?: string; telefone?: string | null }) => void;
  onSetPassword: (password: string) => void;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [pwdOpen, setPwdOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [nome, setNome] = useState(row.nome ?? "");
  const [email, setEmail] = useState(row.email);
  const [telefone, setTelefone] = useState(row.telefone ?? "");

  const isLead = row.id.startsWith("lead:");

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="ghost" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>Ações</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {isLead ? (
            <DropdownMenuItem onClick={onResend}>
              <Send className="mr-2 h-4 w-4" /> Criar acesso
            </DropdownMenuItem>
          ) : (
            <>
              <DropdownMenuItem onClick={() => setEditOpen(true)}>
                <Pencil className="mr-2 h-4 w-4" /> Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onReset}>
                <KeyRound className="mr-2 h-4 w-4" /> Redefinir senha
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setNewPassword(""); setPwdOpen(true); }}>
                <KeyRound className="mr-2 h-4 w-4" /> Alterar senha
              </DropdownMenuItem>
              {!row.acesso_enviado && (
                <DropdownMenuItem onClick={onResend}>
                  <Send className="mr-2 h-4 w-4" /> Enviar acesso
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {row.banido ? (
                <DropdownMenuItem onClick={onReactivate}>
                  <ShieldCheck className="mr-2 h-4 w-4" /> Reativar
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => {
                    if (confirm(`Cancelar o acesso de ${row.email}?`)) onRevoke();
                  }}
                >
                  <ShieldOff className="mr-2 h-4 w-4" /> Cancelar acesso
                </DropdownMenuItem>
              )}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar usuário</DialogTitle>
            <DialogDescription>{row.email}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label>Nome</Label>
              <Input value={nome} onChange={(e) => setNome(e.target.value)} />
            </div>
            <div>
              <Label>E-mail</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <Label>Telefone</Label>
              <Input value={telefone} onChange={(e) => setTelefone(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                const patch: { email?: string; nome?: string; telefone?: string | null } = {};
                if (nome !== (row.nome ?? "")) patch.nome = nome;
                if (email !== row.email) patch.email = email;
                if (telefone !== (row.telefone ?? "")) patch.telefone = telefone || null;
                onEdit(patch);
                setEditOpen(false);
              }}
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={pwdOpen} onOpenChange={setPwdOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar senha</DialogTitle>
            <DialogDescription>{row.email}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label>Nova senha</Label>
              <Input
                type="text"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                A nova senha substitui a atual imediatamente. Informe ao usuário pelo canal apropriado.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPwdOpen(false)}>
              Cancelar
            </Button>
            <Button
              disabled={newPassword.length < 8}
              onClick={() => {
                onSetPassword(newPassword);
                setPwdOpen(false);
              }}
            >
              Alterar senha
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

type IssueAttachment = {
  path: string;
  name: string;
  type: string;
  size: number;
};

type IssueReport = {
  id: string;
  reporter_id: string;
  reporter_email: string | null;
  title: string;
  description: string;
  area: string | null;
  severity: string;
  status: string;
  approved_for_fix: boolean;
  approved_at: string | null;
  resolved_at: string | null;
  resolution_notes: string | null;
  attachments: IssueAttachment[] | null;
  created_at: string;
};

function SeverityBadge({ value }: { value: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    low: { label: "Baixa", cls: "bg-muted text-foreground" },
    medium: { label: "Média", cls: "bg-amber-500/15 text-amber-700" },
    high: { label: "Alta", cls: "bg-orange-500/15 text-orange-700" },
    critical: { label: "Crítica", cls: "bg-destructive/15 text-destructive" },
  };
  const v = map[value] ?? map.medium;
  return <span className={`rounded px-2 py-0.5 text-xs font-medium ${v.cls}`}>{v.label}</span>;
}

function IssueStatusBadge({ row }: { row: IssueReport }) {
  if (row.status === "resolved")
    return <Badge className="bg-emerald-600 hover:bg-emerald-600">Resolvido</Badge>;
  if (row.approved_for_fix)
    return <Badge className="bg-blue-600 hover:bg-blue-600">Aprovado p/ correção</Badge>;
  return <Badge variant="secondary">Aberto</Badge>;
}

function IssueReportsSection() {
  const qc = useQueryClient();
  const [openNew, setOpenNew] = useState(false);
  const [filter, setFilter] = useState<"all" | "open" | "approved" | "resolved">("all");

  const issuesQuery = useQuery({
    queryKey: ["admin", "issue-reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_issue_reports")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as IssueReport[];
    },
    staleTime: 15_000,
  });

  useEffect(() => {
    const channel = supabase
      .channel("admin-issues-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "admin_issue_reports" },
        () => qc.invalidateQueries({ queryKey: ["admin", "issue-reports"] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  const rows = (issuesQuery.data ?? []).filter((r) => {
    if (filter === "open") return r.status !== "resolved" && !r.approved_for_fix;
    if (filter === "approved") return r.approved_for_fix && r.status !== "resolved";
    if (filter === "resolved") return r.status === "resolved";
    return true;
  });

  async function toggleApprove(row: IssueReport) {
    const next = !row.approved_for_fix;
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("admin_issue_reports")
      .update({
        approved_for_fix: next,
        approved_at: next ? new Date().toISOString() : null,
        approved_by: next ? u.user?.id ?? null : null,
      })
      .eq("id", row.id);
    if (error) toast.error(error.message);
    else toast.success(next ? "Aprovado para correção." : "Aprovação removida.");
  }

  async function markResolved(row: IssueReport) {
    const notes = prompt("Notas de resolução (opcional):", row.resolution_notes ?? "") ?? null;
    const { error } = await supabase
      .from("admin_issue_reports")
      .update({
        status: "resolved",
        resolved_at: new Date().toISOString(),
        resolution_notes: notes,
      })
      .eq("id", row.id);
    if (error) toast.error(error.message);
    else toast.success("Marcado como resolvido.");
  }

  async function reopen(row: IssueReport) {
    const { error } = await supabase
      .from("admin_issue_reports")
      .update({ status: "open", resolved_at: null })
      .eq("id", row.id);
    if (error) toast.error(error.message);
  }

  async function remove(row: IssueReport) {
    if (!confirm(`Excluir o relato "${row.title}"?`)) return;
    const { error } = await supabase.from("admin_issue_reports").delete().eq("id", row.id);
    if (error) toast.error(error.message);
    else toast.success("Relato excluído.");
  }

  const counts = useMemo(() => {
    const all = issuesQuery.data ?? [];
    return {
      total: all.length,
      open: all.filter((r) => r.status !== "resolved" && !r.approved_for_fix).length,
      approved: all.filter((r) => r.approved_for_fix && r.status !== "resolved").length,
      resolved: all.filter((r) => r.status === "resolved").length,
    };
  }, [issuesQuery.data]);

  return (
    <section className="mt-10">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
            <Bug className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold leading-tight">Relatos de problemas</h2>
            <p className="text-xs text-muted-foreground">
              Admins relatam problemas. Marque "Aprovar p/ correção" para que sejam executados.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-md border bg-card p-1">
            {(
              [
                ["all", `Todos (${counts.total})`],
                ["open", `Abertos (${counts.open})`],
                ["approved", `Aprovados (${counts.approved})`],
                ["resolved", `Resolvidos (${counts.resolved})`],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                  filter === key
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <NewIssueDialog open={openNew} onOpenChange={setOpenNew} />
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="w-[5%]">Aprovar</TableHead>
                <TableHead className="w-[28%]">Título / Descrição</TableHead>
                <TableHead className="w-[12%]">Área</TableHead>
                <TableHead className="w-[8%]">Severidade</TableHead>
                <TableHead className="w-[12%]">Status</TableHead>
                <TableHead className="w-[15%]">Relatado por</TableHead>
                <TableHead className="w-[10%]">Criado</TableHead>
                <TableHead className="w-[10%] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {issuesQuery.isLoading && (
                <TableRow>
                  <TableCell colSpan={8} className="py-10 text-center">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
                  </TableCell>
                </TableRow>
              )}
              {!issuesQuery.isLoading && rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                    Nenhum relato nesta visão.
                  </TableCell>
                </TableRow>
              )}
              {rows.map((row) => (
                <TableRow key={row.id} className="hover:bg-muted/30 align-top">
                  <TableCell>
                    <button
                      onClick={() => toggleApprove(row)}
                      title={row.approved_for_fix ? "Remover aprovação" : "Aprovar para correção"}
                      className={`flex h-6 w-6 items-center justify-center rounded border transition-colors ${
                        row.approved_for_fix
                          ? "border-blue-600 bg-blue-600 text-white"
                          : "border-input bg-background hover:bg-muted"
                      }`}
                    >
                      {row.approved_for_fix && <Check className="h-4 w-4" />}
                    </button>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium leading-tight">{row.title}</span>
                      <span className="mt-1 line-clamp-3 text-xs text-muted-foreground whitespace-pre-wrap">
                        {row.description}
                      </span>
                      {row.resolution_notes && (
                        <span className="mt-1 text-xs text-emerald-700">
                          ✓ {row.resolution_notes}
                        </span>
                      )}
                      {row.attachments && row.attachments.length > 0 && (
                        <AttachmentsList items={row.attachments} />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {row.area || "—"}
                  </TableCell>
                  <TableCell>
                    <SeverityBadge value={row.severity} />
                  </TableCell>
                  <TableCell>
                    <IssueStatusBadge row={row} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {row.reporter_email ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(row.created_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {row.status !== "resolved" ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => markResolved(row)}
                          title="Marcar como resolvido"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => reopen(row)}
                          title="Reabrir"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => remove(row)}
                        title="Excluir"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </section>
  );
}

function NewIssueDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [area, setArea] = useState("");
  const [severity, setSeverity] = useState("medium");
  const [files, setFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);

  const MAX_FILES = 6;
  const MAX_SIZE = 20 * 1024 * 1024; // 20MB

  function addFiles(picked: FileList | null) {
    if (!picked) return;
    const next = [...files];
    for (const f of Array.from(picked)) {
      if (f.size > MAX_SIZE) {
        toast.error(`"${f.name}" passa de 20MB.`);
        continue;
      }
      if (next.length >= MAX_FILES) {
        toast.error(`Máximo de ${MAX_FILES} arquivos por relato.`);
        break;
      }
      next.push(f);
    }
    setFiles(next);
  }

  async function submit() {
    if (!title.trim() || !description.trim()) {
      toast.error("Preencha título e descrição.");
      return;
    }
    setSaving(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Sessão expirada.");

      // Upload anexos primeiro
      const uploaded: IssueAttachment[] = [];
      const reportId = crypto.randomUUID();
      for (const f of files) {
        const safe = f.name.replace(/[^a-zA-Z0-9._-]+/g, "_");
        const path = `${u.user.id}/${reportId}/${Date.now()}-${safe}`;
        const { error: upErr } = await supabase.storage
          .from("issue-attachments")
          .upload(path, f, { contentType: f.type || "application/octet-stream" });
        if (upErr) throw upErr;
        uploaded.push({ path, name: f.name, type: f.type, size: f.size });
      }

      const { error } = await supabase.from("admin_issue_reports").insert({
        id: reportId,
        reporter_id: u.user.id,
        reporter_email: u.user.email ?? null,
        title: title.trim(),
        description: description.trim(),
        area: area.trim() || null,
        severity,
        attachments: uploaded,
      });
      if (error) throw error;
      toast.success("Relato enviado.");
      setTitle("");
      setDescription("");
      setArea("");
      setSeverity("medium");
      setFiles([]);
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message ?? "Falha ao enviar relato.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" /> Novo relato
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Relatar problema</DialogTitle>
          <DialogDescription>
            Descreva o problema observado. O dono do app revisa e aprova para correção.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div>
            <Label>Título</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex.: Botão de salvar não funciona em Aulas"
              maxLength={200}
            />
          </div>
          <div>
            <Label>Descrição</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="O que acontece, passos para reproduzir, dispositivo etc."
              rows={5}
              maxLength={4000}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Área (opcional)</Label>
              <Input
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="Aulas, Painel, Auth…"
                maxLength={60}
              />
            </div>
            <div>
              <Label>Severidade</Label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="low">Baixa</option>
                <option value="medium">Média</option>
                <option value="high">Alta</option>
                <option value="critical">Crítica</option>
              </select>
            </div>
          </div>
          <div>
            <Label>Anexos (prints, vídeos, PDFs — até {MAX_FILES} arquivos, 20MB cada)</Label>
            <Input
              type="file"
              multiple
              accept="image/*,video/*,application/pdf,text/plain,application/json"
              onChange={(e) => {
                addFiles(e.target.files);
                e.target.value = "";
              }}
            />
            {files.length > 0 && (
              <ul className="mt-2 space-y-1 text-xs">
                {files.map((f, i) => (
                  <li
                    key={`${f.name}-${i}`}
                    className="flex items-center justify-between rounded border bg-muted/30 px-2 py-1"
                  >
                    <span className="truncate">
                      {f.name}{" "}
                      <span className="text-muted-foreground">
                        ({(f.size / 1024).toFixed(0)} KB)
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setFiles(files.filter((_, idx) => idx !== i))}
                      className="text-destructive hover:underline"
                    >
                      remover
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enviar relato
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AttachmentsList({ items }: { items: IssueAttachment[] }) {
  const [urls, setUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const paths = items.map((i) => i.path);
      const { data, error } = await supabase.storage
        .from("issue-attachments")
        .createSignedUrls(paths, 60 * 60);
      if (error || cancelled) return;
      const map: Record<string, string> = {};
      data?.forEach((entry, i) => {
        if (entry.signedUrl) map[paths[i]] = entry.signedUrl;
      });
      setUrls(map);
    })();
    return () => {
      cancelled = true;
    };
  }, [items]);

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {items.map((a) => {
        const url = urls[a.path];
        const isImage = a.type.startsWith("image/");
        if (isImage && url) {
          return (
            <a
              key={a.path}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="block h-14 w-14 overflow-hidden rounded border bg-muted"
              title={a.name}
            >
              <img src={url} alt={a.name} className="h-full w-full object-cover" />
            </a>
          );
        }
        return (
          <a
            key={a.path}
            href={url ?? "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded border bg-muted/40 px-2 py-1 text-xs hover:bg-muted"
            title={a.name}
          >
            📎 {a.name}
          </a>
        );
      })}
    </div>
  );
}
