import { useEffect } from "react";

export function useAutoplayUnlock(audioRef: React.RefObject<HTMLAudioElement | null>) {
  useEffect(() => {
    const unlocked = localStorage.getItem("broski_audio_unlocked");
    if (unlocked) return; // already unlocked this browser

    const handler = () => {
      const el = audioRef.current;
      if (el && el.paused) {
        el.play().catch(() => {});
      }
      localStorage.setItem("broski_audio_unlocked", "1");
      window.removeEventListener("touchstart", handler);
      window.removeEventListener("click", handler);
    };
    window.addEventListener("touchstart", handler, { passive: true });
    window.addEventListener("click", handler, { passive: true });
    return () => {
      window.removeEventListener("touchstart", handler);
      window.removeEventListener("click", handler);
    };
  }, [audioRef]);
}