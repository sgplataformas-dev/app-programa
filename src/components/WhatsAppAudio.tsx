import { useEffect, useRef, useState } from "react";
import { Play, Pause, Mic } from "lucide-react";
import avatar from "@/assets/fernandinho-avatar.png";

const BARS = [
  6, 10, 14, 9, 18, 22, 13, 8, 16, 24, 20, 11, 7, 15, 21, 26, 18, 12, 9, 14,
  20, 25, 17, 10, 8, 13, 19, 23, 16, 11, 7, 12, 18, 22, 15, 9, 6, 10, 8, 5,
];

export function WhatsAppAudio({ src }: { src: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onTime = () => setCurrent(el.currentTime);
    const onMeta = () => setDuration(el.duration || 0);
    const onEnd = () => {
      setPlaying(false);
      setCurrent(0);
    };
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("loadedmetadata", onMeta);
    el.addEventListener("ended", onEnd);
    return () => {
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("loadedmetadata", onMeta);
      el.removeEventListener("ended", onEnd);
    };
  }, []);

  const toggle = () => {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) {
      void el.play();
      setPlaying(true);
    } else {
      el.pause();
      setPlaying(false);
    }
  };

  const pct = duration > 0 ? current / duration : 0;
  const fmt = (s: number) => {
    if (!Number.isFinite(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = audioRef.current;
    if (!el || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1);
    el.currentTime = ratio * duration;
    setCurrent(el.currentTime);
  };

  return (
    <div className="rounded-2xl rounded-tl-md bg-[#1f2c34] p-2.5 shadow-md">
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? "Pausar áudio" : "Tocar áudio"}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#8696a0] transition active:scale-95"
        >
          {playing ? (
            <Pause className="h-6 w-6 fill-current" />
          ) : (
            <Play className="h-6 w-6 fill-current" />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <div
            onClick={seek}
            className="flex h-8 cursor-pointer items-center gap-[2px]"
          >
            {BARS.map((h, i) => {
              const active = i / BARS.length <= pct;
              return (
                <span
                  key={i}
                  className="w-[2px] shrink-0 rounded-full transition-colors"
                  style={{
                    height: `${h}px`,
                    backgroundColor: active ? "#25d366" : "#667781",
                  }}
                />
              );
            })}
          </div>
          <div className="mt-0.5 flex items-center justify-between text-[11px] text-[#8696a0]">
            <span>{fmt(current)}</span>
            <span>{fmt(duration)}</span>
          </div>
        </div>

        <div className="relative shrink-0">
          <img
            src={avatar}
            alt="Fernandinho"
            className="h-12 w-12 rounded-full object-cover"
          />
          <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#25d366]">
            <Mic className="h-3 w-3 fill-white text-white" />
          </span>
        </div>
      </div>
      <audio ref={audioRef} preload="metadata" src={src} className="hidden" />
    </div>
  );
}
