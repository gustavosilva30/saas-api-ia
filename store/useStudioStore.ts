import { create } from 'zustand'
import { IRenderEngine } from '@/lib/studio/engine/IRenderEngine'
import { EventBus, StudioEvent } from '@/lib/studio/events/EventBus'

interface StudioLayer {
  id: string;
  name: string;
  type: string;
}

interface StudioState {
  engine: IRenderEngine | null
  isReady: boolean
  zoom: number
  pan: { x: number, y: number }
  layers: StudioLayer[]
  
  // Actions
  setEngine: (engine: IRenderEngine) => void
  setReady: (ready: boolean) => void
  setZoom: (zoom: number) => void
  setPan: (x: number, y: number) => void
  setLayers: (layers: StudioLayer[]) => void
  addLayer: (layer: StudioLayer) => void
  removeLayer: (id: string) => void
  // Estado de UI
  activePlugin: string | null;
  setActivePlugin: (pluginId: string | null) => void;
  
  // Objeto Selecionado
  selectedObjectId: string | null;
  selectedObjectType: string | null;
  
  // Estado de IA
  isProcessingAI: boolean;
  setProcessingAI: (isProcessing: boolean) => void;
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
  
  EventBus.on(StudioEvent.OBJECT_ADDED, (obj: any) => {
    if (obj && obj.id) {
      set((state) => {
        if (state.layers.some(l => l.id === obj.id)) return state;
        return {
          layers: [...state.layers, { id: obj.id, name: obj.name || obj.type || 'Layer', type: obj.type || 'Object' }]
        };
      })
    }
  })

  EventBus.on(StudioEvent.OBJECT_REMOVED, (obj: any) => {
    if (obj && obj.id) {
      set((state) => ({
        layers: state.layers.filter(l => l.id !== obj.id)
      }))
    }
  })

  EventBus.on(StudioEvent.OBJECT_SELECTED, (selectedObjects: any[]) => {
    if (selectedObjects && selectedObjects.length === 1) {
      const obj = selectedObjects[0];
      set({ selectedObjectId: obj.id || null, selectedObjectType: obj.type || null });
    } else {
      set({ selectedObjectId: null, selectedObjectType: null });
    }
  })

  EventBus.on(StudioEvent.SELECTION_CLEARED, () => {
    set({ selectedObjectId: null, selectedObjectType: null });
  })

  return {
    engine: null,
    isReady: false,
    zoom: 1,
    pan: { x: 0, y: 0 },
    layers: [],
    activePlugin: null,
    selectedObjectId: null,
    selectedObjectType: null,
    
    setEngine: (engine) => set({ engine }),
    setReady: (ready) => set({ isReady: ready }),
    setZoom: (zoom) => set({ zoom }),
    setPan: (x, y) => set({ pan: { x, y } }),
    setLayers: (layers) => set({ layers }),
    addLayer: (layer) => set((state) => ({ layers: [...state.layers, layer] })),
    removeLayer: (id) => set((state) => ({ layers: state.layers.filter(l => l.id !== id) })),
    setActivePlugin: (pluginId) => set({ activePlugin: pluginId }),

    isProcessingAI: false,
    setProcessingAI: (isProcessing) => set({ isProcessingAI: isProcessing }),
  }
})
