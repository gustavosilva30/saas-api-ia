import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type WorkspaceMode = 'Designer' | 'SocialMedia' | 'Marketplace' | 'Motion' | 'Fotografia' | 'Compacto' | 'Personalizado'

interface WorkspaceState {
  mode: WorkspaceMode
  leftPanelOpen: boolean
  rightPanelOpen: boolean
  timelineOpen: boolean
  activeTabRight: string
  activePluginLeft: string | null
  
  setMode: (mode: WorkspaceMode) => void
  toggleLeftPanel: () => void
  toggleRightPanel: () => void
  toggleTimeline: () => void
  setActiveTabRight: (tab: string) => void
  setActivePluginLeft: (pluginId: string | null) => void
  applyPreset: (mode: WorkspaceMode) => void
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      mode: 'Designer',
      leftPanelOpen: true,
      rightPanelOpen: true,
      timelineOpen: false,
      activeTabRight: 'properties',
      activePluginLeft: null,

      setMode: (mode) => {
        set({ mode })
        get().applyPreset(mode)
      },
      
      toggleLeftPanel: () => set((state) => ({ leftPanelOpen: !state.leftPanelOpen, mode: 'Personalizado' })),
      toggleRightPanel: () => set((state) => ({ rightPanelOpen: !state.rightPanelOpen, mode: 'Personalizado' })),
      toggleTimeline: () => set((state) => ({ timelineOpen: !state.timelineOpen, mode: 'Personalizado' })),
      setActiveTabRight: (tab) => set({ activeTabRight: tab }),
      setActivePluginLeft: (pluginId) => set({ activePluginLeft: pluginId }),

      applyPreset: (mode) => {
        switch (mode) {
          case 'Designer':
            set({ leftPanelOpen: true, rightPanelOpen: true, timelineOpen: false, activeTabRight: 'properties' })
            break
          case 'SocialMedia':
            set({ leftPanelOpen: true, rightPanelOpen: true, timelineOpen: false, activeTabRight: 'ia' })
            break
          case 'Marketplace':
            set({ leftPanelOpen: true, rightPanelOpen: true, timelineOpen: false, activeTabRight: 'properties' })
            break
          case 'Motion':
            set({ leftPanelOpen: true, rightPanelOpen: true, timelineOpen: true, activeTabRight: 'motion' })
            break
          case 'Fotografia':
            set({ leftPanelOpen: false, rightPanelOpen: true, timelineOpen: false, activeTabRight: 'appearance' })
            break
          case 'Compacto':
            set({ leftPanelOpen: false, rightPanelOpen: false, timelineOpen: false })
            break
          case 'Personalizado':
            // Mantém como está
            break
        }
      }
    }),
    {
      name: 'ai-studio-workspace',
    }
  )
)
