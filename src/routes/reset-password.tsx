import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { traduzirErroAuth } from "@/lib/auth-errors";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"checking" | "confirm" | "ready" | "invalid">("checking");
  const tokenHash = useMemo(() => {
    if (typeof window === "undefined") return null;
    const params = new URLSearchParams(window.location.search);
    return params.get("token_hash");
  }, []);

  useEffect(() => {
    let mounted = true;

    async function validateCurrentUrl() {
      if (typeof window === "undefined") return;

      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");

      if (params.get("token_hash")) {
        setStatus("confirm");
        return;
      }

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!mounted) return;
        if (error) {
          setStatus("invalid");
          return;
        }
        window.history.replaceState(null, "", window.location.pathname);
        setStatus("ready");
        return;
      }

      await new Promise((r) => setTimeout(r, 500));
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      if (data.session) {
        setStatus("ready");
        return;
      }

      setTimeout(async () => {
        if (!mounted) return;
        const { data: d2 } = await supabase.auth.getSession();
        if (d2.session) setStatus("ready");
        else setStatus((s) => (s === "ready" || s === "confirm" ? s : "invalid"));
      }, 2500);
    }

    // Escuta o evento PASSWORD_RECOVERY que o supabase-js dispara ao processar o hash da URL
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
        setStatus("ready");
      }
    });

    // Verifica se já existe sessão, código PKCE ou token_hash enviado pelo WhatsApp.
    validateCurrentUrl();

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function confirmRecoveryToken() {
    if (!tokenHash) {
      setStatus("invalid");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "recovery" });
    setLoading(false);
    if (error) {
      setStatus("invalid");
      toast.error("Este link não pôde ser validado. Peça um novo link em Esqueci minha senha.");
      return;
    }
    window.history.replaceState(null, "", window.location.pathname);
    setStatus("ready");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (senha.length < 8) {
      toast.error("Sua senha precisa ter pelo menos 8 caracteres para ficar mais segura.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: senha });
    setLoading(false);
    if (error) {
      toast.error(traduzirErroAuth(error, "Não conseguimos salvar sua senha agora. Tente novamente em instantes."));
      return;
    }
    toast.success("Pronto! Sua nova senha foi salva.");
    navigate({ to: "/hoje" });
  }

  return (
    <div className="mx-auto min-h-screen max-w-md px-6 py-10">
      <h1 className="text-2xl font-bold">Criar nova senha</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Digite a nova senha que você quer usar para entrar.
      </p>

      {status === "checking" && (
        <p className="mt-8 text-sm text-muted-foreground">Validando seu link de recuperação...</p>
      )}

      {status === "confirm" && (
        <div className="mt-8 space-y-4">
          <p className="text-sm text-muted-foreground">
            Confirme para abrir o formulário de nova senha com segurança.
          </p>
          <Button onClick={confirmRecoveryToken} disabled={loading} className="h-12 w-full text-base">
            {loading ? "Validando..." : "Continuar"}
          </Button>
        </div>
      )}

      {status === "invalid" && (
        <div className="mt-8 space-y-4">
          <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            Este link de recuperação é inválido ou expirou. Peça um novo link em "Esqueci minha senha".
          </div>
          <Button onClick={() => navigate({ to: "/auth" })} className="h-12 w-full text-base">
            Voltar para o login
          </Button>
        </div>
      )}

      {status === "ready" && (
        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nova">Nova senha</Label>
            <Input id="nova" type="password" required value={senha} onChange={(e) => setSenha(e.target.value)} className="h-12" />
          </div>
          <Button type="submit" disabled={loading} className="h-12 w-full text-base">
            {loading ? "Salvando..." : "Salvar nova senha"}
          </Button>
        </form>
      )}
    </div>
  );
}
