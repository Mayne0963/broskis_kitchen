import { create } from 'zustand';
import { analytics } from '@/lib/analytics';

export interface Track {
  id: string;
  title: string;
  artist: string;
  src_mp3: string;
  duration: number; // in seconds
  genre: string;
  // Computed property for backward compatibility
  src?: string;
}

export interface Playlist {
  id: string;
  title: string;
  trackIds: string[];
}

export type RepeatMode = 'off' | 'one' | 'all';

interface MusicState {
  tracks: Track[];
  playlists: Playlist[];
  queue: string[];
  currentId: string | null;
  currentPlaylistId: string | null;
  isPlaying: boolean;
  position: number; // in seconds
  duration: number; // in seconds
  volume: number; // 0-1
  shuffle: boolean;
  repeat: RepeatMode;
  isLoading: boolean;
  error: string | null;
}

interface MusicActions {
  // Track management
  setTracks: (tracks: Track[]) => void;
  setPlaylists: (playlists: Playlist[]) => void;
  setQueue: (queue: string[]) => void;
  loadTracksFromJson: () => Promise<void>;
  loadPlaylistsFromJson: () => Promise<void>;
  
  // Playlist management
  loadPlaylist: (playlistId: string) => void;
  
  // Playback controls
  play: (trackId?: string) => void;
  pause: () => void;
  toggle: () => void;
  stop: () => void;
  
  // Navigation
  next: () => void;
  prev: () => void;
  
  // Position and volume
  seek: (position: number) => void;
  setPosition: (position: number) => void;
  setDuration: (duration: number) => void;
  setVolume: (volume: number) => void;
  
  // Player modes
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  
  // State management
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Persistence
  saveState: () => void;
  loadState: () => void;
}

type MusicStore = MusicState & MusicActions;

const initialState: MusicState = {
  tracks: [],
  playlists: [],
  queue: [],
  currentId: null,
  currentPlaylistId: null,
  isPlaying: false,
  position: 0,
  duration: 0,
  volume: 1,
  shuffle: false,
  repeat: 'off',
  isLoading: false,
  error: null,
};

export const useMusicStore = create<MusicStore>((set, get) => ({
  ...initialState,

  // Track management
  setTracks: (tracks) => {
    // Add computed src property for backward compatibility
    const tracksWithSrc = tracks.map(track => ({
      ...track,
      src: track.src_mp3 || track.src
    }));
    
    set({ tracks: tracksWithSrc });
    
    // Auto-generate queue if empty
    const state = get();
    if (state.queue.length === 0) {
      const trackIds = tracksWithSrc.map(t => t.id);
      set({ queue: trackIds });
    }
  },

  setPlaylists: (playlists) => set({ playlists }),

  setQueue: (queue) => set({ queue }),

  loadTracksFromJson: async () => {
    try {
      set({ isLoading: true, error: null });
      
      // Fetch the tracks.json file directly from /data/
      const response = await fetch("/data/tracks.json");
      if (!response.ok) {
        throw new Error(`Failed to fetch tracks: ${response.status} ${response.statusText}`);
      }
      
      const tracks = await response.json();
      console.log("Loaded tracks:", tracks);
      console.log("Loaded tracks count:", tracks.length);
      
      if (Array.isArray(tracks)) {
        if (tracks.length > 0) {
          get().setTracks(tracks);
          console.log(`✅ Loaded ${tracks.length} tracks from /data/tracks.json`);
          
          // Track analytics for successful music loading
          const state = get();
          analytics.musicLoaded(tracks.length, state.playlists.length);
        } else {
          console.warn("⚠️ No tracks found in tracks.json");
          set({ tracks: [], error: null }); // Clear error for empty but valid response
        }
      } else {
        throw new Error("Invalid tracks data format - expected array");
      }
    } catch (error) {
      console.error("Failed to load tracks:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      set({ 
        tracks: [], // Fallback to empty array
        error: `Failed to load tracks: ${errorMessage}` 
      });
    } finally {
      set({ isLoading: false });
    }
  },

  loadPlaylistsFromJson: async () => {
    try {
      set({ error: null }); // Clear any previous errors
      
      // Fetch the playlists.json file directly from /data/
      const response = await fetch("/data/playlists.json");
      if (!response.ok) {
        throw new Error(`Failed to fetch playlists: ${response.status} ${response.statusText}`);
      }
      
      const playlists = await response.json();
      console.log("Loaded playlists:", playlists);
      console.log("Loaded playlists count:", playlists.length);
      
      if (Array.isArray(playlists)) {
        if (playlists.length > 0) {
          get().setPlaylists(playlists);
          console.log(`✅ Loaded ${playlists.length} playlists from /data/playlists.json`);
        } else {
          console.warn("⚠️ No playlists found in playlists.json");
          set({ playlists: [], error: null }); // Clear error for empty but valid response
        }
      } else {
        throw new Error("Invalid playlists data format - expected array");
      }
    } catch (error) {
      console.error("Failed to load playlists:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      set({ 
        playlists: [], // Fallback to empty array
        error: `Failed to load playlists: ${errorMessage}` 
      });
    }
  },

  // Playlist management
  loadPlaylist: (playlistId) => {
    const state = get();
    const playlist = state.playlists.find(p => p.id === playlistId);
    if (playlist) {
      set({ 
        currentPlaylistId: playlistId,
        queue: playlist.trackIds 
      });
      // Play first track of the playlist if available
      if (playlist.trackIds.length > 0) {
        state.play(playlist.trackIds[0]);
      }
    }
  },

  // Playback controls
  play: (trackId) => {
    const state = get();
    if (trackId && trackId !== state.currentId) {
      set({ currentId: trackId, isPlaying: true, position: 0 });
    } else {
      set({ isPlaying: true });
    }
    state.saveState();
  },

  pause: () => {
    set({ isPlaying: false });
    get().saveState();
  },

  toggle: () => {
    const state = get();
    if (state.isPlaying) {
      state.pause();
    } else {
      state.play();
    }
  },

  stop: () => {
    set({ isPlaying: false, position: 0 });
    get().saveState();
  },

  // Navigation
  next: () => {
    const state = get();
    const { queue, currentId, shuffle, repeat } = state;
    
    if (queue.length === 0) return;
    
    const currentIndex = currentId ? queue.indexOf(currentId) : -1;
    let nextIndex: number;
    
    if (shuffle) {
      // Random next track (excluding current)
      const availableIndices = queue.map((_, i) => i).filter(i => i !== currentIndex);
      nextIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
    } else {
      nextIndex = currentIndex + 1;
      if (nextIndex >= queue.length) {
        if (repeat === 'all') {
          nextIndex = 0;
        } else {
          return; // End of queue
        }
      }
    }
    
    const nextTrackId = queue[nextIndex];
    state.play(nextTrackId);
  },

  prev: () => {
    const state = get();
    const { queue, currentId, shuffle } = state;
    
    if (queue.length === 0) return;
    
    const currentIndex = currentId ? queue.indexOf(currentId) : -1;
    let prevIndex: number;
    
    if (shuffle) {
      // Random previous track (excluding current)
      const availableIndices = queue.map((_, i) => i).filter(i => i !== currentIndex);
      prevIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
    } else {
      prevIndex = currentIndex - 1;
      if (prevIndex < 0) {
        prevIndex = queue.length - 1;
      }
    }
    
    const prevTrackId = queue[prevIndex];
    state.play(prevTrackId);
  },

  // Position and volume
  seek: (position) => {
    set({ position });
    get().saveState();
  },

  setPosition: (position) => set({ position }),
  setDuration: (duration) => set({ duration }),
  setVolume: (volume) => {
    set({ volume: Math.max(0, Math.min(1, volume)) });
    get().saveState();
  },

  // Player modes
  toggleShuffle: () => {
    set(state => ({ shuffle: !state.shuffle }));
    get().saveState();
  },

  cycleRepeat: () => {
    set(state => ({
      repeat: state.repeat === 'off' ? 'all' : state.repeat === 'all' ? 'one' : 'off'
    }));
    get().saveState();
  },

  // State management
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  // Persistence
  saveState: () => {
    try {
      const state = get();
      const stateToSave = {
        currentId: state.currentId,
        currentPlaylistId: state.currentPlaylistId,
        position: state.position,
        volume: state.volume,
        shuffle: state.shuffle,
        repeat: state.repeat,
        queue: state.queue,
      };
      localStorage.setItem('musicPlayerState', JSON.stringify(stateToSave));
    } catch (error) {
      console.warn('Failed to save music player state:', error);
    }
  },

  loadState: () => {
    try {
      const saved = localStorage.getItem('musicPlayerState');
      console.log('Loading saved state:', saved);
      if (saved) {
        const state = JSON.parse(saved);
        console.log('Parsed state:', state);
        set({
          currentId: state.currentId || null,
          currentPlaylistId: state.currentPlaylistId || null,
          position: state.position || 0,
          volume: state.volume ?? 1,
          shuffle: state.shuffle || false,
          repeat: state.repeat || 'off',
          queue: state.queue || [],
        });
      }
    } catch (error) {
      console.warn('Failed to load music player state:', error);
    }
  },

  clearState: () => {
    try {
      localStorage.removeItem('musicPlayerState');
      console.log('Cleared music player state');
    } catch (error) {
      console.warn('Failed to clear music player state:', error);
    }
  },
}));

// Helper functions
export const getCurrentTrack = () => {
  const { tracks, currentId } = useMusicStore.getState();
  return tracks.find(track => track.id === currentId) || null;
};

export const getTrackById = (id: string) => {
  const { tracks } = useMusicStore.getState();
  return tracks.find(track => track.id === id) || null;
};