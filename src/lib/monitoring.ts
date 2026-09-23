// Unified monitoring: Sentry (when DSN is configured) + Lovable error reporter.
// Captures navigation failures and beforeLoad/loader errors with route context.

import * as Sentry from "@sentry/react";

type Severity = "fatal" | "error" | "warning" | "info" | "debug";

type CaptureContext = Record<string, unknown> & {
  route?: string;
  routeId?: string;
  phase?: "beforeLoad" | "loader" | "navigation" | "chunk" | "render" | "manual";
};

let sentryReady = false;

export function initMonitoring() {
  if (typeof window === "undefined") return;
  if (sentryReady) return;

  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
  if (!dsn) return; // Lovable capture still works without Sentry.

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({ maskAllText: false, blockAllMedia: true }),
    ],
  });
  sentryReady = true;
}

function lovableCapture(error: unknown, context: CaptureContext, severity: Severity) {
  if (typeof window === "undefined") return;
  window.__lovableEvents?.captureException?.(
    error,
    { source: "monitoring", route: window.location.pathname, ...context },
    { mechanism: "manual", handled: true, severity: severity === "fatal" ? "error" : severity === "warning" ? "warning" : "error" },
  );
}

export function captureMonitoringEvent(
  error: unknown,
  context: CaptureContext = {},
  severity: Severity = "error",
) {
  const enriched: CaptureContext = {
    route: typeof window !== "undefined" ? window.location.pathname : undefined,
    ...context,
  };

  // Lovable's built-in monitoring
  lovableCapture(error, enriched, severity);

  // Sentry (if configured)
  if (sentryReady) {
    Sentry.withScope((scope) => {
      scope.setLevel(severity);
      if (enriched.route) scope.setTag("route", String(enriched.route));
      if (enriched.routeId) scope.setTag("routeId", String(enriched.routeId));
      if (enriched.phase) scope.setTag("phase", String(enriched.phase));
      scope.setContext("navigation", enriched);
      Sentry.captureException(error);
    });
  }

  // Always log so the failure is visible in console/devtools too.
  // eslint-disable-next-line no-console
  console.error("[monitoring]", enriched.phase ?? "error", error, enriched);
}
