import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AnalyticsState {
  imagesToday: number;
  imagesThisMonth: number;
  totalTimeMs: number;
  totalRequests: number;
  
  // Actions
  logProcessing: (durationMs: number) => void;
  getAverageTime: () => number;
}

export const useAnalyticsStore = create<AnalyticsState>()(
  persist(
    (set, get) => ({
      imagesToday: 0,
      imagesThisMonth: 0,
      totalTimeMs: 0,
      totalRequests: 0,

      logProcessing: (durationMs) => {
        set((state) => ({
          imagesToday: state.imagesToday + 1,
          imagesThisMonth: state.imagesThisMonth + 1,
          totalTimeMs: state.totalTimeMs + durationMs,
          totalRequests: state.totalRequests + 1,
        }));
      },

      getAverageTime: () => {
        const state = get();
        if (state.totalRequests === 0) return 0;
        return state.totalTimeMs / state.totalRequests;
      },
    }),
    {
      name: "analytics-storage",
    }
  )
);
