import React, { useState, useEffect } from "react"
import { Sun } from "lucide-react"
import { StudioPlugin } from "@/lib/studio/plugins/BasePlugin"
import { useStudioStore } from "@/store/useStudioStore"
import { EventBus, StudioEvent } from "@/lib/studio/events/EventBus"

function ShadowContextPanel() {
  const [hasSelection, setHasSelection] = useState(false)
  const [shadowParams, setShadowParams] = useState({
    color: "rgba(0,0,0,0.5)",
    blur: 15,
    offsetX: 10,
    offsetY: 10,
  })

  useEffect(() => {
    // Escuta a seleção de objetos para mostrar o painel ou não
    const handleSelection = (selected: any[]) => {
      setHasSelection(selected && selected.length > 0)
      if (selected && selected.length === 1) {
        const engine = useStudioStore.getState().engine
        const currentShadow = engine?.getSelectedObjectShadow()
        if (currentShadow) {
          setShadowParams({
            color: currentShadow.color || "rgba(0,0,0,0.5)",
            blur: currentShadow.blur || 15,
            offsetX: currentShadow.offsetX || 10,
            offsetY: currentShadow.offsetY || 10,
          })
        }
      }
    }

    const unsubSelected = EventBus.on(StudioEvent.OBJECT_SELECTED, handleSelection)
    const unsubCleared = EventBus.on(StudioEvent.SELECTION_CLEARED, () => setHasSelection(false))
    
    return () => {
      unsubSelected()
      unsubCleared()
    }
  }, [])

  const updateShadow = (key: string, value: any) => {
    const newParams = { ...shadowParams, [key]: value }
    setShadowParams(newParams)
    
    const engine = useStudioStore.getState().engine
    if (engine) {
      // Aplica dinamicamente
      engine.applyShadowToSelected(newParams)
    }
  }

  if (!hasSelection) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-muted-foreground text-sm">
        <Sun className="h-8 w-8 mb-2 opacity-20" />
        <p>Selecione uma imagem no palco para aplicar sombras e efeitos.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col p-4 gap-4">
      <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground border-b pb-2">
        Sombra (Drop Shadow)
      </h3>
      
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold flex justify-between">
          <span>Desfoque (Blur)</span>
          <span>{shadowParams.blur}px</span>
        </label>
        <input 
          type="range" min="0" max="100" 
          value={shadowParams.blur} 
          onChange={(e) => updateShadow("blur", parseInt(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold flex justify-between">
          <span>Distância X</span>
          <span>{shadowParams.offsetX}px</span>
        </label>
        <input 
          type="range" min="-50" max="50" 
          value={shadowParams.offsetX} 
          onChange={(e) => updateShadow("offsetX", parseInt(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold flex justify-between">
          <span>Distância Y</span>
          <span>{shadowParams.offsetY}px</span>
        </label>
        <input 
          type="range" min="-50" max="50" 
          value={shadowParams.offsetY} 
          onChange={(e) => updateShadow("offsetY", parseInt(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="mt-4">
        <button 
          onClick={() => {
            const engine = useStudioStore.getState().engine
            if (engine) engine.applyShadowToSelected(null)
          }}
          className="w-full bg-secondary text-secondary-foreground text-xs py-2 rounded-md hover:opacity-80 transition"
        >
          Remover Sombra
        </button>
      </div>
    </div>
  )
}

export const ShadowPlugin: StudioPlugin = {
  id: "shadow",
  name: "Sombra",
  icon: Sun,
  ContextComponent: ShadowContextPanel,
}
