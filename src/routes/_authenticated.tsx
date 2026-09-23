import { createFileRoute, Outlet, redirect, isRedirect, useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { BottomNav } from "@/components/BottomNav";
import { AppHeader } from "@/components/AppHeader";
import { FernandinhoChat } from "@/components/FernandinhoChat";
import { captureMonitoringEvent } from "@/lib/monitoring";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    try {
      // Use getSession() (reads localStorage, no network) instead of getUser()
      // to keep route navigation instant and avoid hanging the app when the
      // auth API is slow or unreachable. The session JWT is still validated
      // server-side by requireSupabaseAuth on every server function call.
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      if (!data.session?.user) throw redirect({ to: "/auth" });
      return { user: data.session.user };
    } catch (err) {
      if (isRedirect(err)) throw err;
      captureMonitoringEvent(err, {
        phase: "beforeLoad",
        routeId: "/_authenticated",
        route: location.pathname,
      });
      throw err;
    }
  },
  onError: (error) => {
    if (isRedirect(error)) return;
    captureMonitoringEvent(error, {
      phase: "navigation",
      routeId: "/_authenticated",
    });
  },
  component: AuthLayout,
});

function AuthLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isAdmin = pathname.startsWith("/admin");

  if (isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Outlet />
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-md bg-background pb-20">
      <AppHeader />
      <Outlet />
      <FernandinhoChat />
      <BottomNav />
    </div>
  );
}
