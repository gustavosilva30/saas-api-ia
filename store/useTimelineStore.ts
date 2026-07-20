import { create } from "zustand";

export type AnimationPreset = "fade-in" | "slide-in" | "float" | "pulse";

export interface AnimationClip {
  id: string;
  preset: AnimationPreset;
  startTime: number;
  duration: number;
}

export interface AnimationTrack {
  layerId: string;
  clips: AnimationClip[];
}

interface TimelineState {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  fps: number;
  playbackRate: number;
  
  tracks: Record<string, AnimationTrack>;
  
  play: () => void;
  pause: () => void;
  seek: (timeMs: number) => void;
  setDuration: (durationMs: number) => void;
  setPlaybackRate: (rate: number) => void;
  
  addClip: (layerId: string, clip: AnimationClip) => void;
  removeClip: (layerId: string, clipId: string) => void;
  updateClip: (layerId: string, clipId: string, updates: Partial<AnimationClip>) => void;
  clearTracks: () => void;
}

let animationFrameId: number | null = null;
let lastTimestamp: number | null = null;

export const useTimelineStore = create<TimelineState>((set, get) => {
  const tick = (timestamp: number) => {
    const state = get();
    
    if (!state.isPlaying) {
      lastTimestamp = null;
      return;
    }

    if (!lastTimestamp) lastTimestamp = timestamp;
    
    const rawDelta = timestamp - lastTimestamp;
    const delta = rawDelta * state.playbackRate;
    lastTimestamp = timestamp;

    let newTime = state.currentTime + delta;
    
    if (newTime >= state.duration) {
      newTime = 0;
    }

    set({ currentTime: newTime });
    animationFrameId = requestAnimationFrame(tick);
  };

  return {
    currentTime: 0,
    duration: 5000,
    isPlaying: false,
    fps: 60,
    playbackRate: 1,
    tracks: {},

    play: () => {
      const { isPlaying, currentTime, duration } = get();
      if (isPlaying) return;
      
      let startFrom = currentTime;
      if (startFrom >= duration) {
        startFrom = 0;
        set({ currentTime: 0 });
      }

      set({ isPlaying: true });
      lastTimestamp = null;
      animationFrameId = requestAnimationFrame(tick);
    },

    pause: () => {
      set({ isPlaying: false });
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      lastTimestamp = null;
    },

    seek: (timeMs: number) => {
      let clamped = Math.max(0, Math.min(timeMs, get().duration));
      set({ currentTime: clamped });
    },

    setDuration: (durationMs: number) => {
      set({ duration: durationMs });
    },
    
    setPlaybackRate: (rate: number) => {
      set({ playbackRate: rate });
    },
    
    addClip: (layerId, clip) => set((state) => {
      const track = state.tracks[layerId] || { layerId, clips: [] };
      return {
        tracks: {
          ...state.tracks,
          [layerId]: { ...track, clips: [...track.clips, clip] }
        }
      };
    }),
    
    removeClip: (layerId, clipId) => set((state) => {
      const track = state.tracks[layerId];
      if (!track) return state;
      return {
        tracks: {
          ...state.tracks,
          [layerId]: { ...track, clips: track.clips.filter(c => c.id !== clipId) }
        }
      };
    }),
    
    updateClip: (layerId, clipId, updates) => set((state) => {
      const track = state.tracks[layerId];
      if (!track) return state;
      return {
        tracks: {
          ...state.tracks,
          [layerId]: {
            ...track,
            clips: track.clips.map(c => c.id === clipId ? { ...c, ...updates } : c)
          }
        }
      };
    }),
    
    clearTracks: () => set({ tracks: {} })
  };
});
