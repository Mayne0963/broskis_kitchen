"use client";
import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";

type Track = { id:string; src_mp3?:string; src_m4a?:string; title?:string; genre?:string };
type Ctx = {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  tracks: Track[]; currentIndex: number;
  play:(i?:number)=>void; pause:()=>void; next:()=>void; prev:()=>void;
  current?: Track; time:number; duration:number; setTime:(n:number)=>void;
  isPlaying: boolean;
};
const AudioCtx = createContext<Ctx|null>(null);
export const useGlobalAudio = () => {
  const context = useContext(AudioCtx);
  if (!context) {
    throw new Error('useGlobalAudio must be used within a GlobalAudioProvider');
  }
  return context;
};

// Safe version that doesn't throw errors - useful for optional components
export const useSafeGlobalAudio = () => {
  const context = useContext(AudioCtx);
  return context; // Returns null if not within provider
};

export default function GlobalAudioProvider({children}:{children:React.ReactNode}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [tracks,setTracks]=useState<Track[]>([]);
  const [currentIndex,setIdx]=useState(0);
  const [time,setTime]=useState(0);
  const [duration,setDuration]=useState(0);
  const [isPlaying,setIsPlaying]=useState(false);
  const [mounted, setMounted] = useState(false);

  // Ensure we're on the client side
  useEffect(() => {
    setMounted(true);
  }, []);

  // load tracks once - only on client side
  useEffect(()=>{ 
    if (!mounted) return;
    
    (async ()=>{
      console.log("🎵 GLOBAL AUDIO: Loading tracks...");
      try{
        console.log("🎵 GLOBAL AUDIO: Fetching from /data/tracks.json");
        const response = await fetch("/data/tracks.json",{cache:"no-store"});
        console.log("🎵 GLOBAL AUDIO: Fetch response status:", response.status);
        const t = await response.json();
        console.log("🎵 GLOBAL AUDIO: Tracks loaded:", Array.isArray(t) ? t.length : 'not array', t);
        setTracks(Array.isArray(t)?t:[]);
      }catch(e){ 
        console.error("🎵 GLOBAL AUDIO: tracks load failed",e); 
      }
    })(); 
  },[mounted]);

  // autoplay attempt when tracks ready
  useEffect(()=>{
    if (!mounted) return;
    
    console.debug("[audio] autoplay-init", { tracks: tracks.length, currentIndex });
    const el=audioRef.current; 
    if(!el || tracks.length===0) {
      if (process.env.NODE_ENV !== 'production') {
        console.debug("[audio] autoplay-skip", { reason: !el ? 'no-element' : 'no-tracks' });
      }
      return;
    }
    const tr=tracks[currentIndex]; 
    const src=tr?.src_m4a||tr?.src_mp3; 
    if(!src) {
      console.warn("[audio] no-src", { trackId: tr?.id, title: tr?.title });
      return;
    }
    const fullSrc = src.startsWith('http') ? src : location.origin + src;
    console.debug("[audio] set-src", { fullSrc });
    if(el.src !== fullSrc){ 
      el.src = fullSrc; 
      el.load(); 
      if (process.env.NODE_ENV !== 'production') {
        console.debug("[audio] loaded", { src: el.src });
      }
    }
    const p=el.play(); 
    if(p) p.catch((err)=>{
      if (process.env.NODE_ENV !== 'production') {
        console.info("[audio] autoplay-blocked", { error: String(err) });
      }
    });
  },[tracks,currentIndex,mounted]);

  // iOS unlock: one time
  useEffect(()=>{
    if (!mounted) return;
    
    const unlocked=localStorage.getItem("broski_audio_unlocked");
    console.debug("[audio] ios-unlock-check", { unlocked });
    if(unlocked) return;
    const handler=()=>{ 
      console.debug("[audio] ios-unlock-gesture");
      const el=audioRef.current; 
      if(el) el.play().catch(()=>{}); 
      localStorage.setItem("broski_audio_unlocked","1");
      window.removeEventListener("touchstart",handler); 
      window.removeEventListener("click",handler); 
    };
    window.addEventListener("touchstart",handler,{passive:true}); 
    window.addEventListener("click",handler,{passive:true});
    return ()=>{ 
      window.removeEventListener("touchstart",handler); 
      window.removeEventListener("click",handler); 
    };
  },[mounted]);

  const next = useCallback(()=>{
    console.debug("[audio] next");
    setIdx(i=> (i+1)%Math.max(tracks.length,1));
  }, [tracks.length]);

  // events
  useEffect(()=>{
    if (!mounted) return;
    
    const el=audioRef.current; if(!el) return;
    const t=()=>setTime(el.currentTime||0);
    const d=()=>setDuration(isFinite(el.duration)?el.duration:0);
    const e=()=>{
      // Auto-advance on end
      next();
    };
    const err=(ev: Event)=>{
      console.error('[audio] element-error', {
        message: (ev as any)?.message,
        src: el.src
      });
      // Attempt to skip to next track on error
      next();
    };
    el.addEventListener("timeupdate",t); el.addEventListener("loadedmetadata",d); el.addEventListener("ended",e);
    el.addEventListener("error", err as any);
    return ()=>{ 
      el.removeEventListener("timeupdate",t); 
      el.removeEventListener("loadedmetadata",d); 
      el.removeEventListener("ended",e);
      el.removeEventListener("error", err as any);
    };
  },[tracks,currentIndex,mounted,next]);

  const play=(i?:number)=>{ 
    console.debug("[audio] play", { index: i });
    if(typeof i==="number") setIdx(Math.max(0,Math.min(i,tracks.length-1))); 
    else audioRef.current?.play().catch(()=>{}); 
  };
  const pause=()=>{
    console.debug("[audio] pause");
    audioRef.current?.pause();
  };
  const prev =()=>{
    console.debug("[audio] prev");
    setIdx(i=> (i-1+Math.max(tracks.length,1))%Math.max(tracks.length,1));
  };
  const current=tracks[currentIndex];

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <AudioCtx.Provider value={{audioRef,tracks,currentIndex,play,pause,next,prev,current,time,duration,setTime,isPlaying}}>
      <audio ref={audioRef} preload="auto" playsInline crossOrigin="anonymous" />
      {children}
    </AudioCtx.Provider>
  );
}