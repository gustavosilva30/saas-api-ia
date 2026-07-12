import { create } from "zustand";

interface TimelineState {
  currentTime: number; // Em milissegundos
  duration: number; // Duração total em milissegundos
  isPlaying: boolean;
  fps: number; // Configuração visual/lógica (ex: 60)
  
  play: () => void;
  pause: () => void;
  seek: (timeMs: number) => void;
  setDuration: (durationMs: number) => void;
}

// Controla o loop externo do rAF fora do estado reativo para evitar sobrecarga no React
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
    
    const delta = timestamp - lastTimestamp;
    lastTimestamp = timestamp;

    let newTime = state.currentTime + delta;
    
    // Auto-loop quando chega no fim
    if (newTime >= state.duration) {
      newTime = 0;
    }

    set({ currentTime: newTime });
    animationFrameId = requestAnimationFrame(tick);
  };

  return {
    currentTime: 0,
    duration: 5000, // 5 segundos padrão
    isPlaying: false,
    fps: 60,

    play: () => {
      const { isPlaying, currentTime, duration } = get();
      if (isPlaying) return;
      
      let startFrom = currentTime;
      // Se estava no final, recomeça
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
    }
  };
});
