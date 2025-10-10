import { create } from 'zustand';

export interface Track {
  id: string;
  title: string;
  artist: string;
  provider: string;
  license_type: string;
  requires_attribution: boolean;
  attribution_text: string;
  source_url: string;
  license_file_url: string;
  src_m4a: string;
  src_mp3: string;
  cover: string;
  duration: number; // in seconds
  gain_db: number;
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
      src: track.src_m4a || track.src_mp3 || track.src
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
      
      // Fetch the tracks.json file from API
      const response = await fetch("/api/tracks");
      if (!response.ok) {
        throw new Error(`Failed to fetch tracks: ${response.status}`);
      }
      
      const tracks = await response.json();
      
      if (Array.isArray(tracks) && tracks.length > 0) {
        get().setTracks(tracks);
        console.log(`✅ Loaded ${tracks.length} tracks from API`);
      } else {
        throw new Error("No tracks found in API response");
      }
    } catch (error) {
      console.error("Failed to load tracks:", error);
      set({ error: `Failed to load tracks: ${error instanceof Error ? error.message : "Unknown error"}` });
    } finally {
      set({ isLoading: false });
    }
  },

  loadPlaylistsFromJson: async () => {
    try {
      // Fetch the playlists.json file from API
      const response = await fetch("/api/playlists");
      if (!response.ok) {
        throw new Error(`Failed to fetch playlists: ${response.status}`);
      }
      
      const playlists = await response.json();
      
      if (Array.isArray(playlists) && playlists.length > 0) {
        get().setPlaylists(playlists);
        console.log(`✅ Loaded ${playlists.length} playlists from API`);
      } else {
        throw new Error("No playlists found in API response");
      }
    } catch (error) {
      console.error("Failed to load playlists:", error);
      set({ error: `Failed to load playlists: ${error instanceof Error ? error.message : "Unknown error"}` });
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