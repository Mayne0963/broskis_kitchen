"use client";
import { useGlobalAudio } from "@/providers/GlobalAudioProvider";
import { useEffect, useState } from "react";

export default function MiniNowPlaying() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null;

  try {
    const audioContext = useGlobalAudio();
    if (!audioContext) return null;
    
    const { current, time, duration, setTime, play, pause, next, prev } = audioContext;
    if (!current) return null;
  
    return (
      <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-40 rounded-xl px-3 py-2 bg-black/70 text-white shadow">
        <span className="mr-2 text-sm">{current.title || "Broski's Vibes"}</span>
        <button onClick={() => prev()}>⏮</button>
        <button onClick={() => play()}>▶️</button>
        <button onClick={() => pause()}>⏸</button>
        <button onClick={() => next()}>⏭</button>
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
          className="align-middle w-40 ml-2" 
        />
      </div>
    );
  } catch (error) {
    console.warn('MiniNowPlaying: GlobalAudioProvider not available', error);
    return null;
  }
}