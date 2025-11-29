"use client";
import { useSafeGlobalAudio } from "@/providers/GlobalAudioProvider";
import { useEffect, useRef, useState } from "react";

export default function MiniNowPlaying() {
  const [isClient, setIsClient] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  
  // Always call hooks at the top level - never conditionally
  // Use safe version that returns null instead of throwing
  const audioContext = useSafeGlobalAudio();

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Close the panel when users interact outside the player (click/scroll)
  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleScroll = () => setIsOpen(false);

    document.addEventListener("pointerdown", handlePointerDown, { passive: true });
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [isOpen]);

  // Early returns after all hooks are called
  if (!isClient) return null;
  if (!audioContext) return null;
  
  try {
    const { current, time, duration, setTime, play, pause, next, prev } = audioContext;
    if (!current) return null;
  
    const translateX = isOpen ? "0" : "calc(-100% + 36px)";
    
    return (
      <div
        ref={panelRef}
        className="fixed bottom-4 left-0 z-40 text-white"
        style={{ 
          transform: `translateX(${translateX})`,
          transition: "transform 220ms ease, opacity 220ms ease",
          opacity: isOpen ? 1 : 0.92,
        }}
      >
        <div className="relative bg-black/80 backdrop-blur-md border border-white/10 rounded-xl shadow-lg px-4 py-3 flex items-center gap-3 min-w-[320px]">
          <button
            aria-label={isOpen ? "Hide music player" : "Show music player"}
            onClick={() => setIsOpen(!isOpen)}
            className="absolute -right-8 top-1/2 -translate-y-1/2 bg-black/80 border border-white/15 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg hover:border-white/30 transition"
          >
            {isOpen ? "<" : ">"}
          </button>

          <span className="mr-2 text-sm font-semibold whitespace-nowrap">
            {current.title || "Broski's Vibes"}
          </span>
          <div className="flex items-center gap-2 text-lg">
            <button onClick={() => prev()} aria-label="Previous track">⏮</button>
            <button onClick={() => play()} aria-label="Play">▶️</button>
            <button onClick={() => pause()} aria-label="Pause">⏸</button>
            <button onClick={() => next()} aria-label="Next track">⏭</button>
          </div>
          <input 
            type="range" 
            min={0} 
            max={duration || 0} 
            step="0.25"
            value={time} 
            onChange={e => setTime(Number(e.target.value))} 
            onMouseUp={e => { 
              const el = document.querySelector("audio") as HTMLAudioElement; 
              if (el) el.currentTime = Number((e.target as HTMLInputElement).value); 
            }} 
            className="align-middle w-32 ml-2 accent-[#FFD700]"
          />
        </div>
      </div>
    );
  } catch (error) {
    console.warn('MiniNowPlaying: GlobalAudioProvider not available', error);
    return null;
  }
}