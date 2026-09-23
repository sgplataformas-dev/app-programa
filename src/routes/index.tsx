import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  ssr: false,
  beforeLoad: async () => {
    // getSession() is local (localStorage) — avoids a blocking network call
    // to the auth API that could hang the app on the first load.
    const { data } = await supabase.auth.getSession();
    if (data.session?.user) throw redirect({ to: "/hoje" });
    throw redirect({ to: "/auth" });
  },
  component: () => null,
});
