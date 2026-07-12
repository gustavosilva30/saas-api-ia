import { create } from 'zustand'
import { IRenderEngine } from '@/lib/studio/engine/IRenderEngine'
import { EventBus, StudioEvent } from '@/lib/studio/events/EventBus'

interface StudioState {
  engine: IRenderEngine | null
  isReady: boolean
  zoom: number
  pan: { x: number, y: number }
  activePlugin: string | null
  
  // Actions
  setEngine: (engine: IRenderEngine) => void
  setReady: (ready: boolean) => void
  setZoom: (zoom: number) => void
  setPan: (x: number, y: number) => void
  setActivePlugin: (pluginId: string | null) => void
}

export const useStudioStore = create<StudioState>((set) => {
  // Listen to EventBus to sync state that the UI needs
  EventBus.on<number>(StudioEvent.ZOOM_CHANGED, (zoom) => {
    set({ zoom })
  })

  EventBus.on<{ x: number, y: number }>(StudioEvent.PAN_CHANGED, (pan) => {
    set({ pan })
  })

  EventBus.on(StudioEvent.CANVAS_READY, () => {
    set({ isReady: true })
  })

  return {
    engine: null,
    isReady: false,
    zoom: 1,
    pan: { x: 0, y: 0 },
    activePlugin: null,
    
    setEngine: (engine) => set({ engine }),
    setReady: (ready) => set({ isReady: ready }),
    setZoom: (zoom) => set({ zoom }),
    setPan: (x, y) => set({ pan: { x, y } }),
    setActivePlugin: (pluginId) => set({ activePlugin: pluginId })
  }
})
