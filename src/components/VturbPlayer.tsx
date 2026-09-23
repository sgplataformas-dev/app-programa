import { useCallback, useEffect, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";

const ACCOUNT = "ea5a7ffd-7736-4982-b451-ffa20a0d2e1e";

type SmartPlayerInstance = {
  on?: (event: string, cb: () => void) => void;
  play?: () => void;
  seek?: (t: number) => void;
  destroy?: () => void;
};

declare global {
  interface Window {
    smartplayer?: {
      instances?: Record<string, SmartPlayerInstance>;
    };
  }
}

/**
 * Player VTurb com recuperação: quando o vídeo termina, o web component às
 * vezes fica preto e não aceita play. Aqui:
 *  - mostramos sempre um botão "Assistir novamente" abaixo do player;
 *  - ao clicar, tentamos rebobinar o <video> nativo; se não der, remontamos
 *    o player do zero (removendo instância + script e recarregando).
 */
export function VturbPlayer({
  vturbId,
  className,
}: {
  vturbId: string;
  className?: string;
}) {
  const playerId = vturbId.replace("vid-", "");
  const [mountKey, setMountKey] = useState(0);
  const [ended, setEnded] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const scriptSrc = `https://scripts.converteai.net/${ACCOUNT}/players/${playerId}/v4/player.js?v=${playerId}`;

  // Carrega (ou recarrega) o script do player a cada montagem
  useEffect(() => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[data-vturb="${playerId}"]`,
    );
    if (existing && mountKey === 0) return;
    existing?.remove();
    const s = document.createElement("script");
    s.src = mountKey === 0 ? scriptSrc : `${scriptSrc}&r=${mountKey}`;
    s.async = true;
    s.dataset.vturb = playerId;
    document.head.appendChild(s);
  }, [playerId, scriptSrc, mountKey]);

  // Detecta o fim do vídeo (API do smartplayer ou o <video> interno)
  useEffect(() => {
    setEnded(false);
    let cancelled = false;
    const cleanups: Array<() => void> = [];

    const onEnded = () => {
      if (!cancelled) setEnded(true);
    };
    const onPlaying = () => {
      if (!cancelled) setEnded(false);
    };

    const seen = new WeakSet<HTMLVideoElement>();

    const tryAttach = () => {
      if (cancelled) return;

      const instance = window.smartplayer?.instances?.[playerId];
      if (instance?.on && !(instance as { __hooked?: boolean }).__hooked) {
        (instance as { __hooked?: boolean }).__hooked = true;
        instance.on("ended", onEnded);
        instance.on("play", onPlaying);
      }

      const video = containerRef.current?.querySelector("video");
      if (video && !seen.has(video)) {
        seen.add(video);
        video.addEventListener("ended", onEnded);
        video.addEventListener("playing", onPlaying);
        cleanups.push(() => {
          video.removeEventListener("ended", onEnded);
          video.removeEventListener("playing", onPlaying);
        });
      }
    };

    tryAttach();
    const timer = window.setInterval(tryAttach, 1500);
    cleanups.push(() => window.clearInterval(timer));

    return () => {
      cancelled = true;
      cleanups.forEach((fn) => fn());
    };
  }, [playerId, mountKey]);

  const replay = useCallback(() => {
    setEnded(false);
    const video = containerRef.current?.querySelector("video");
    if (video) {
      try {
        video.currentTime = 0;
        const p = video.play();
        if (p && typeof p.then === "function") {
          p.then(() => undefined).catch(() => setMountKey((k) => k + 1));
        }
        return;
      } catch {
        /* cai no remount */
      }
    }
    // Remonta do zero
    try {
      const inst = window.smartplayer?.instances?.[playerId];
      inst?.destroy?.();
      if (window.smartplayer?.instances) delete window.smartplayer.instances[playerId];
    } catch {
      /* ignore */
    }
    setMountKey((k) => k + 1);
  }, [playerId]);

  const Player = "vturb-smartplayer" as unknown as React.ElementType;

  return (
    <div ref={containerRef} className={`relative h-full w-full ${className ?? ""}`}>
      <Player
        key={`${vturbId}-${mountKey}`}
        id={vturbId}
        style={{ display: "block", margin: "0 auto", width: "100%", height: "100%" }}
      />

      {ended ? (
        <button
          type="button"
          onClick={replay}
          className="absolute inset-0 z-20 flex items-center justify-center bg-black/70"
        >
          <span className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-lg">
            <RotateCcw className="h-4 w-4" />
            Assistir novamente
          </span>
        </button>
      ) : null}

      {/* Sempre disponível: se a tela ficar preta, recarrega o player */}
      <button
        type="button"
        onClick={replay}
        title="Assistir novamente"
        aria-label="Assistir novamente"
        className="absolute right-2 top-2 z-30 inline-flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-[11px] font-semibold text-white backdrop-blur active:scale-95"
      >
        <RotateCcw className="h-3.5 w-3.5" />
        Recarregar
      </button>
    </div>
  );
}

