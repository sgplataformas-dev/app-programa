import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { signInWithEmailOnly } from "@/lib/email-only-login.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { HelpCircle } from "lucide-react";

export const Route = createFileRoute("/auth")({
  ssr: false,
  component: AuthPage,
});

function AuthPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-background px-6 py-10">
      <header className="mb-8 text-center">
        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground text-2xl font-bold">
          A
        </div>
        <h1 className="text-2xl font-bold">Programa ACTIVE</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Seu acompanhamento diário, no seu ritmo.
        </p>
      </header>

      <div className="rounded-xl bg-muted/60 p-4 text-sm text-muted-foreground mb-6">
        Use o e-mail da sua compra para entrar.
      </div>

      <LoginForm />

      <HelpSheet />
    </div>
  );
}

function LoginForm() {
  const navigate = useNavigate();
  const signInFn = useServerFn(signInWithEmailOnly);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [denied, setDenied] = useState<null | { title: string; description: string }>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      toast.error("Digite um e-mail válido.");
      return;
    }

    // Rate limit: 5 tentativas a cada 5 min por e-mail
    const WINDOW_MS = 5 * 60 * 1000;
    const MAX_ATTEMPTS = 5;
    const key = `email-login:${cleanEmail}`;
    const now = Date.now();
    let attempts: number[] = [];
    try {
      attempts = JSON.parse(localStorage.getItem(key) || "[]");
    } catch {
      attempts = [];
    }
    attempts = attempts.filter((t: number) => now - t < WINDOW_MS);
    if (attempts.length >= MAX_ATTEMPTS) {
      const waitMs = WINDOW_MS - (now - attempts[0]);
      const waitMin = Math.max(1, Math.ceil(waitMs / 60000));
      toast.error(`Muitas tentativas. Tente novamente em ${waitMin} min.`);
      return;
    }
    attempts.push(now);
    localStorage.setItem(key, JSON.stringify(attempts));

    setLoading(true);
    try {
      const result = await signInFn({ data: { email: cleanEmail } });
      if (!result.ok) {
        if (result.reason === "no_purchase") {
          setDenied({
            title: "Acesso negado",
            description:
              "Não encontramos uma compra aprovada com este e-mail. Se você já comprou, use o mesmo e-mail da compra. Se ainda não comprou, clique abaixo para garantir seu acesso.",
          });
        } else if (result.reason === "refunded") {
          setDenied({
            title: "Acesso indisponível",
            description:
              "Esta compra foi reembolsada ou cancelada. Se acredita que isso é um engano, fale com o suporte. Para renovar seu acesso, você pode fazer uma nova compra.",
          });
        } else {
          toast.error("Não foi possível entrar agora. Tente novamente em alguns minutos.");
        }
        return;
      }

      const { error: verifyErr } = await supabase.auth.verifyOtp({
        token_hash: result.token_hash,
        type: "magiclink",
      });
      if (verifyErr) {
        console.error(verifyErr);
        toast.error("Não conseguimos abrir sua sessão agora. Tente novamente em instantes.");
        return;
      }

      toast.success("Tudo certo! Bem-vinda(o) ao Programa ACTIVE.");
      navigate({ to: "/hoje" });
    } catch (err) {
      console.error(err);
      toast.error("Não foi possível entrar agora. Tente novamente em instantes.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">E-mail da compra</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12"
          />
        </div>
        <Button type="submit" className="w-full h-12 text-base" disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </Button>
      </form>

      <AlertDialog open={denied !== null} onOpenChange={(open) => !open && setDenied(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{denied?.title}</AlertDialogTitle>
            <AlertDialogDescription>{denied?.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
            <a
              href="https://payt.site/Q5CbA4m"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Quero fazer minha compra
            </a>
            <a
              href="https://wa.me/558882130565?text=Olá!%20Vim%20pelo%20aplicativo%20do%20Programa%20Active%20e%20tenho%20uma%20dúvida."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 w-full items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Falar com o suporte no WhatsApp
            </a>
            <a
              href="mailto:sarasuporte@gmail.com"
              className="inline-flex h-10 w-full items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Enviar e-mail para o suporte
            </a>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function HelpSheet() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          className="mx-auto mt-8 inline-flex items-center gap-2 text-sm text-muted-foreground"
        >
          <HelpCircle className="h-4 w-4" />
          Preciso de ajuda
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>Como acessar</SheetTitle>
          <SheetDescription>
            Basta digitar o e-mail que você usou na sua compra. Não é preciso senha.
            Se der "acesso negado", confira se o e-mail está exatamente igual ao da compra
            ou fale com o suporte.
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-3">
          <a
            href="https://wa.me/558882130565?text=Olá!%20Vim%20pelo%20aplicativo%20do%20Programa%20Active%20e%20tenho%20uma%20dúvida."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 w-full items-center justify-center rounded-md bg-green-600 text-white text-sm font-medium hover:bg-green-700"
          >
            Falar com o suporte no WhatsApp
          </a>
          <a
            href="mailto:sarasuporte@gmail.com"
            className="inline-flex h-11 w-full items-center justify-center rounded-md border border-input text-sm font-medium hover:bg-accent hover:text-accent-foreground"
          >
            Enviar e-mail para o suporte
          </a>
        </div>
      </SheetContent>
    </Sheet>
  );
}
