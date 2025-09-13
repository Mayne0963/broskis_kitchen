"use client";
import * as React from "react";

const SRC = process.env.NEXT_PUBLIC_RADIO_URL || "/media/radio.mp3";

export default function RadioPlayer() {
  const [playing, setPlaying] = React.useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  React.useEffect(() => {
    const saved = localStorage.getItem("bk_radio_playing");
    if (saved === "1") setPlaying(true);
  }, []);
  React.useEffect(() => {
    localStorage.setItem("bk_radio_playing", playing ? "1" : "0");
    const a = audioRef.current;
    if (!a) return;
    if (playing) a.play().catch(()=>{});  else a.pause();
  }, [playing]);

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => setPlaying(p => !p)}
        className={`px-3 py-2 rounded-md text-sm font-medium ${playing ? "bg-amber-500 text-black" : "bg-zinc-800 text-white"}`}
        aria-pressed={playing}
      >
        {playing ? "Pause Radio" : "Play Radio"}
      </button>
      <audio ref={audioRef} src={SRC} preload="none" />
    </div>
  );
}