"use client"
import React from "react"
import { Wand2, Layers, Circle, Type } from "lucide-react"
import { StudioPlugin } from "@/lib/studio/plugins/BasePlugin"
import { useStudioStore } from "@/store/useStudioStore"
import { EventBus, StudioEvent } from "@/lib/studio/events/EventBus"

const PRESET_STYLES = [
  {
    id: 'neon',
    name: 'Neon',
    fill: 'transparent',
    stroke: '#ff00ff',
    strokeWidth: 2,
    shadow: {
      color: '#ff00ff',
      blur: 15,
      offsetX: 0,
      offsetY: 0
    }
  },
  {
    id: 'glass',
    name: 'Glassmorphism',
    fill: 'rgba(255, 255, 255, 0.2)',
    stroke: 'rgba(255, 255, 255, 0.4)',
    strokeWidth: 1,
    shadow: {
      color: 'rgba(0, 0, 0, 0.1)',
      blur: 10,
      offsetX: 4,
      offsetY: 4
    }
  },
  {
    id: 'outline-bold',
    name: 'Outline Pesado',
    fill: 'transparent',
    stroke: '#000000',
    strokeWidth: 6,
    shadow: null
  },
  {
    id: 'soft-shadow',
    name: 'Minimalista (Soft)',
    fill: '#f8fafc',
    stroke: '#e2e8f0',
    strokeWidth: 1,
    shadow: {
      color: 'rgba(0,0,0,0.05)',
      blur: 20,
      offsetX: 0,
      offsetY: 10
    }
  }
]

import { useSelectionStore } from "@/store/useSelectionStore"

// ... (Restante do arquivo)

function StylesSidebar() {
  const applyStyle = (style: any) => {
    const engine = useStudioStore.getState().engine
    const selectedIds = useSelectionStore.getState().selectedIds
    
    if (!engine || selectedIds.length === 0) return

    selectedIds.forEach(id => {
      engine.updateObjectProperties(id, {
        fill: style.fill,
        stroke: style.stroke,
        strokeWidth: style.strokeWidth
      })
      
      if (style.shadow) {
        // Assume active object shadow for now, since applyShadowToSelected uses active object
        // We should probably update applyShadowToSelected to take an ID or apply to all selected
        engine.applyShadowToSelected(style.shadow)
      } else {
        engine.applyShadowToSelected(null)
      }
    })
    
    engine.requestRender()
    EventBus.emit(StudioEvent.HISTORY_CHANGED)
  }

  return (
    <div className="w-64 p-4 flex flex-col h-full overflow-y-auto gap-4">
      <h3 className="text-sm font-semibold flex items-center gap-2 mb-2">
        <Wand2 className="h-4 w-4" />
        Estilos Prontos
      </h3>
      <p className="text-xs text-muted-foreground">
        Aplique visuais instantâneos em textos e formas selecionadas.
      </p>
      
      <div className="grid grid-cols-2 gap-2 mt-2">
        {PRESET_STYLES.map(style => (
          <button 
            key={style.id}
            onClick={() => applyStyle(style)}
            className="flex flex-col items-center justify-center p-4 border rounded-lg hover:bg-accent transition bg-card"
          >
            <div 
              className="w-8 h-8 rounded-full mb-2"
              style={{
                backgroundColor: style.fill,
                border: `${style.strokeWidth}px solid ${style.stroke}`,
                boxShadow: style.shadow ? `${style.shadow.offsetX}px ${style.shadow.offsetY}px ${style.shadow.blur}px ${style.shadow.color}` : 'none'
              }}
            />
            <span className="text-xs font-medium text-center">{style.name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export const StylesLibraryPlugin: StudioPlugin = {
  id: "styles-library",
  name: "Estilos",
  icon: Wand2,
  SidebarComponent: StylesSidebar,
}
