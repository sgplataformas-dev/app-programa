// Utilidades de retry para chamadas externas (fetch e SDKs) resilientes
// a códigos 0 (conexão encerrada) e 28 (timeout / CURLE_OPERATION_TIMEDOUT).

export type RetryOptions = {
  retries?: number;
  baseDelayMs?: number;
  label?: string;
};

const RETRYABLE_MESSAGE_FRAGMENTS = [
  "aborted",
  "abort",
  "timed out",
  "timeout",
  "fetch failed",
  "network",
  "socket",
  "econnreset",
  "econnrefused",
  "etimedout",
  "und_err_socket",
  "und_err_connect_timeout",
  "und_err_headers_timeout",
  "und_err_body_timeout",
];

function isRetryableError(err: unknown): boolean {
  if (!err) return false;
  const anyErr = err as { name?: string; code?: string | number; message?: string };
  if (anyErr.name === "AbortError" || anyErr.name === "TimeoutError") return true;
  const code = String(anyErr.code ?? "").toLowerCase();
  if (code === "28" || code === "0") return true;
  if (["etimedout", "econnreset", "econnrefused", "eai_again", "und_err_socket"].includes(code)) {
    return true;
  }
  const msg = String(anyErr.message ?? err).toLowerCase();
  return RETRYABLE_MESSAGE_FRAGMENTS.some((frag) => msg.includes(frag));
}

function backoff(attempt: number, baseDelayMs: number) {
  const jitter = Math.floor(Math.random() * baseDelayMs);
  return baseDelayMs * 2 ** attempt + jitter;
}

export async function retry<T>(fn: () => Promise<T>, opts: RetryOptions = {}): Promise<T> {
  const retries = opts.retries ?? 3;
  const baseDelayMs = opts.baseDelayMs ?? 400;
  const label = opts.label ?? "retry";

  let lastError: unknown;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt === retries - 1 || !isRetryableError(err)) {
        throw err;
      }
      const delay = backoff(attempt, baseDelayMs);
      console.warn(
        `[${label}] tentativa ${attempt + 1}/${retries} falhou (${(err as Error)?.message ?? err}). Retentando em ${delay}ms...`,
      );
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastError;
}

export type FetchWithRetryOptions = RetryOptions & {
  timeoutMs?: number;
};

export async function fetchWithRetry(
  url: string,
  init: RequestInit = {},
  opts: FetchWithRetryOptions = {},
): Promise<Response> {
  const timeoutMs = opts.timeoutMs ?? 8000;
  const label = opts.label ?? `fetch ${url}`;

  return retry(async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...init, signal: controller.signal });
      // status 0 é raro em fetch server-side, mas tratamos por segurança.
      if ((res as unknown as { status: number }).status === 0) {
        throw new Error(`status 0 recebido de ${url}`);
      }
      return res;
    } finally {
      clearTimeout(timeout);
    }
  }, { retries: opts.retries ?? 3, baseDelayMs: opts.baseDelayMs ?? 400, label });
}
