import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ShieldCheck } from "lucide-react";

export function AppHeader() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      const user = sess.session?.user;
      if (!user) return;
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .limit(1);
      if (!cancelled) setIsAdmin(!!data && data.length > 0);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 mx-auto flex h-14 max-w-md items-center justify-between border-b border-border bg-background/90 px-6 backdrop-blur">
      <Link to="/hoje" className="text-lg font-semibold tracking-wide" aria-label="Programa ACTIVE">
        Programa ACTIVE
      </Link>
      {isAdmin && (
        <Link
          to="/admin"
          className="flex items-center gap-1 text-xs font-medium text-primary"
          aria-label="Painel admin"
        >
          <ShieldCheck className="h-4 w-4" /> Admin
        </Link>
      )}
    </header>
  );
}
