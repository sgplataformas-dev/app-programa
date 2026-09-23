import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  isRedirect,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { captureMonitoringEvent, initMonitoring } from "../lib/monitoring";
import { supabase } from "@/integrations/supabase/client";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-6xl font-bold text-foreground">404</h1>
        <p className="mt-4 text-base text-muted-foreground">Página não encontrada.</p>
        <a
          href="/"
          className="mt-6 inline-flex h-12 items-center justify-center rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground"
        >
          Ir para o início
        </a>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
    captureMonitoringEvent(error, { phase: "render", routeId: "__root" }, "fatal");
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold text-foreground">Algo deu errado</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Tente novamente em alguns instantes.
        </p>
        <button
          onClick={() => {
            router.invalidate();
            reset();
          }}
          className="mt-6 inline-flex h-12 items-center justify-center rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground"
        >
          Tentar de novo
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#1B4D3E" },
      { title: "Programa ACTIVE" },
      { name: "description", content: "Seu acompanhamento diário do Programa ACTIVE." },
      { property: "og:title", content: "Programa ACTIVE" },
      { name: "twitter:title", content: "Programa ACTIVE" },
      { property: "og:description", content: "Seu acompanhamento diário do Programa ACTIVE." },
      { name: "twitter:description", content: "Seu acompanhamento diário do Programa ACTIVE." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/48a99f6f-d0c6-4757-b7c4-78d8e60410f6/id-preview-0234a797--bdaf87db-df2b-4355-ae46-1cf47316dbea.lovable.app-1781370286854.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/48a99f6f-d0c6-4757-b7c4-78d8e60410f6/id-preview-0234a797--bdaf87db-df2b-4355-ae46-1cf47316dbea.lovable.app-1781370286854.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700&family=Outfit:wght@600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap",
      },
      // VTurb player otimizações — boas-vindas
      { rel: "preload", as: "script", href: "https://scripts.converteai.net/ea5a7ffd-7736-4982-b451-ffa20a0d2e1e/players/6a29ada451d4532b13a677c9/v4/player.js" },
      { rel: "preload", as: "script", href: "https://scripts.converteai.net/lib/js/smartplayer-wc/v4/smartplayer.js" },
      { rel: "preload", as: "fetch", href: "https://cdn.converteai.net/ea5a7ffd-7736-4982-b451-ffa20a0d2e1e/6a29ad9391839fbacdbd636f/main.m3u8", crossOrigin: "anonymous" },
      // VTurb player otimizações — aula fase-1-intro
      { rel: "preload", as: "script", href: "https://scripts.converteai.net/ea5a7ffd-7736-4982-b451-ffa20a0d2e1e/players/6a2e328f66b98f0059f888a4/v4/player.js" },
      { rel: "preload", as: "fetch", href: "https://cdn.converteai.net/ea5a7ffd-7736-4982-b451-ffa20a0d2e1e/6a2e322d5b719ab8be0e1862/main.m3u8", crossOrigin: "anonymous" },
      { rel: "dns-prefetch", href: "https://cdn.converteai.net" },
      { rel: "dns-prefetch", href: "https://scripts.converteai.net" },
      { rel: "dns-prefetch", href: "https://images.converteai.net" },
      { rel: "dns-prefetch", href: "https://license.vturb.com" },
    ],
    scripts: [
      {
        children:
          '!function(i,n){i._plt=i._plt||(n&&n.timeOrigin?n.timeOrigin+n.now():Date.now())}(window,performance);',
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

const APP_VERSION = "2026-07-24-biomassa-nhoque-2";

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;
    (async () => {
      try {
        const stored = window.localStorage.getItem("app_version");
        if (stored === APP_VERSION) return;
        window.localStorage.setItem("app_version", APP_VERSION);
        if (stored === null) return; // first visit ever, nothing cached to bust

        // Bust every layer of cache: SW, CacheStorage, then hard reload with query param.
        try {
          if ("serviceWorker" in navigator) {
            const regs = await navigator.serviceWorker.getRegistrations();
            await Promise.all(regs.map((r) => r.unregister()));
          }
        } catch {}
        try {
          if ("caches" in window) {
            const keys = await caches.keys();
            await Promise.all(keys.map((k) => caches.delete(k)));
          }
        } catch {}
        const url = new URL(window.location.href);
        url.searchParams.set("_v", APP_VERSION);
        window.location.replace(url.toString());
      } catch {
        // ignore storage errors
      }
    })();
  }, []);


  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      router.invalidate();
      if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
    });
    return () => sub.subscription.unsubscribe();
  }, [router, queryClient]);

  useEffect(() => {
    initMonitoring();

    const unsubResolved = router.subscribe("onResolved", (event) => {
      const matches = event.toLocation
        ? router.state.matches
        : router.state.matches;
      for (const match of matches) {
        if (match.status === "error" && match.error && !isRedirect(match.error)) {
          captureMonitoringEvent(match.error, {
            phase: "loader",
            routeId: match.routeId,
            route: event.toLocation?.pathname ?? window.location.pathname,
          });
        }
      }
    });

    const onChunkError = (e: PromiseRejectionEvent) => {
      const reason = e.reason;
      const msg = String(reason?.message ?? reason ?? "");
      if (/dynamically imported module|Failed to fetch dynamically imported|ChunkLoadError|Loading chunk/i.test(msg)) {
        captureMonitoringEvent(reason, { phase: "chunk" });
      }
    };
    window.addEventListener("unhandledrejection", onChunkError);

    return () => {
      unsubResolved();
      window.removeEventListener("unhandledrejection", onChunkError);
    };
  }, [router]);


  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <Toaster richColors position="top-center" />
    </QueryClientProvider>
  );
}
