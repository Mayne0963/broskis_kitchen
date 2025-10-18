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
    
    console.log("🎵 GLOBAL AUDIO: Autoplay effect triggered, tracks:", tracks.length, "currentIndex:", currentIndex);
    const el=audioRef.current; 
    if(!el || tracks.length===0) {
      console.log("🎵 GLOBAL AUDIO: No audio element or no tracks");
      return;
    }
    const tr=tracks[currentIndex]; 
    const src=tr?.src_m4a||tr?.src_mp3; 
    if(!src) {
      console.log("🎵 GLOBAL AUDIO: No src for track", tr);
      return;
    }
    console.log("🎵 GLOBAL AUDIO: Attempting to play:", src);
    if(el.src!==location.origin+src){ 
      el.src=src; 
      el.load(); 
      console.log("🎵 GLOBAL AUDIO: Audio src set to:", el.src);
    }
    const p=el.play(); 
    if(p) p.catch((err)=>console.log("🎵 GLOBAL AUDIO: Autoplay blocked—waiting for gesture", err));
  },[tracks,currentIndex,mounted]);

  // iOS unlock: one time
  useEffect(()=>{
    if (!mounted) return;
    
    const unlocked=localStorage.getItem("broski_audio_unlocked");
    console.log("🎵 GLOBAL AUDIO: iOS unlock check, unlocked:", unlocked);
    if(unlocked) return;
    const handler=()=>{ 
      console.log("🎵 GLOBAL AUDIO: User gesture detected, unlocking audio");
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
    console.log("🎵 GLOBAL AUDIO: Next called");
    setIdx(i=> (i+1)%Math.max(tracks.length,1));
  }, [tracks.length]);

  // events
  useEffect(()=>{
    if (!mounted) return;
    
    const el=audioRef.current; if(!el) return;
    const t=()=>setTime(el.currentTime||0);
    const d=()=>setDuration(isFinite(el.duration)?el.duration:0);
    const e=()=>next();
    el.addEventListener("timeupdate",t); el.addEventListener("loadedmetadata",d); el.addEventListener("ended",e);
    return ()=>{ el.removeEventListener("timeupdate",t); el.removeEventListener("loadedmetadata",d); el.removeEventListener("ended",e); };
  },[tracks,currentIndex,mounted,next]);

  const play=(i?:number)=>{ 
    console.log("🎵 GLOBAL AUDIO: Play called with index:", i);
    if(typeof i==="number") setIdx(Math.max(0,Math.min(i,tracks.length-1))); 
    else audioRef.current?.play().catch(()=>{}); 
  };
  const pause=()=>{
    console.log("🎵 GLOBAL AUDIO: Pause called");
    audioRef.current?.pause();
  };
  const prev =()=>{
    console.log("🎵 GLOBAL AUDIO: Prev called");
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