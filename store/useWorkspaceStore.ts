import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type WorkspaceMode = 'default' | 'compact' | 'designer' | 'social_media';
export type ThemeMode = 'light' | 'dark' | 'system';

interface WorkspaceState {
  mode: WorkspaceMode;
  theme: ThemeMode;
  
  // Visibilidade de Painéis
  showSidebar: boolean;
  showTopbar: boolean;
  showProperties: boolean;
  showTimeline: boolean;
  showLayers: boolean;
  showLibrary: boolean;
  
  // Ações
  setMode: (mode: WorkspaceMode) => void;
  setTheme: (theme: ThemeMode) => void;
  togglePanel: (panel: keyof Omit<WorkspaceState, 'mode' | 'theme' | 'setMode' | 'setTheme' | 'togglePanel' | 'resetLayout'>) => void;
  resetLayout: () => void;
}

const defaultLayouts: Record<WorkspaceMode, Partial<WorkspaceState>> = {
  default: {
    showSidebar: true, showTopbar: true, showProperties: true, showTimeline: false, showLayers: true, showLibrary: true
  },
  compact: {
    showSidebar: false, showTopbar: true, showProperties: true, showTimeline: false, showLayers: false, showLibrary: false
  },
  designer: {
    showSidebar: true, showTopbar: true, showProperties: true, showTimeline: false, showLayers: true, showLibrary: true
  },
  social_media: {
    showSidebar: true, showTopbar: true, showProperties: true, showTimeline: true, showLayers: true, showLibrary: true
  }
};

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      mode: 'default',
      theme: 'system',
      
      showSidebar: true,
      showTopbar: true,
      showProperties: true,
      showTimeline: false,
      showLayers: true,
      showLibrary: true,
      
      setMode: (mode) => set({ mode, ...defaultLayouts[mode] }),
      setTheme: (theme) => set({ theme }),
      
      togglePanel: (panel) => set((state) => ({ [panel]: !state[panel as keyof WorkspaceState] })),
      
      resetLayout: () => set({ ...defaultLayouts[get().mode] })
    }),
    {
      name: 'studio-workspace-storage',
    }
  )
);
