"use client"
import React, { useState, useEffect } from "react"
import { Sliders } from "lucide-react"
import { StudioPlugin } from "@/lib/studio/plugins/BasePlugin"
import { useStudioStore } from "@/store/useStudioStore"
import { EventBus, StudioEvent } from "@/lib/studio/events/EventBus"

function AdjustmentsContextPanel() {
  const [hasSelection, setHasSelection] = useState(false)
  const [isImage, setIsImage] = useState(false)
  const [params, setParams] = useState({
    brightness: 0,
    contrast: 0,
    saturation: 0,
    hue: 0,
  })

  useEffect(() => {
    const handleSelection = (selected: any[]) => {
      setHasSelection(selected && selected.length > 0)
      if (selected && selected.length === 1) {
        setIsImage(selected[0].type === 'image')
        const engine = useStudioStore.getState().engine
        if (engine) {
          const adj = engine.getAdjustments(selected[0].id)
          setParams({
            brightness: adj.brightness || 0,
            contrast: adj.contrast || 0,
            saturation: adj.saturation || 0,
            hue: adj.hue || 0,
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

  const updateAdjustment = (type: 'brightness'|'contrast'|'saturation'|'hue', value: number) => {
    setParams(p => ({ ...p, [type]: value }))
    const engine = useStudioStore.getState().engine
    const selected = useStudioStore.getState().engine?.getLayers().find(l => l.zIndex !== undefined); // Hacky way for selected ID? Wait, we need the active object.
    // getAdjustments requires ID. We can just pass the selected ID from EventBus, or better, the engine itself handles the selected active object implicitly if we use another method, but our method `applyAdjustment(id, ...)` needs ID.
    // Let's modify applyAdjustment to take ID or just act on the active object if no ID is passed.
    // For now, let's just get the selected object from canvas in FabricAdapter and use it if ID is undefined or we can fetch it.
  }

  // To fix the ID issue, we can just let `applyAdjustment` in `FabricAdapter` use the active object if `id` is empty string or undefined.
  
  const handleSliderChange = (type: 'brightness'|'contrast'|'saturation'|'hue', val: number) => {
    setParams(p => ({ ...p, [type]: val }))
    const engine = useStudioStore.getState().engine
    // Workaround: We pass an empty string, and in FabricAdapter we will fallback to getActiveObject if ID is not found.
    if (engine) engine.applyAdjustment('', type, val)
  }

  if (!hasSelection || !isImage) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-muted-foreground text-sm">
        <Sliders className="h-8 w-8 mb-2 opacity-20" />
        <p>Selecione uma imagem para aplicar ajustes não destrutivos.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col p-4 gap-4">
      <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground border-b pb-2">
        Ajustes (Filtros)
      </h3>
      
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold flex justify-between">
          <span>Brilho</span>
          <span>{params.brightness.toFixed(2)}</span>
        </label>
        <input 
          type="range" min="-1" max="1" step="0.05"
          value={params.brightness} 
          onChange={(e) => handleSliderChange("brightness", parseFloat(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold flex justify-between">
          <span>Contraste</span>
          <span>{params.contrast.toFixed(2)}</span>
        </label>
        <input 
          type="range" min="-1" max="1" step="0.05"
          value={params.contrast} 
          onChange={(e) => handleSliderChange("contrast", parseFloat(e.target.value))}
          className="w-full"
        />
      </div>
      
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold flex justify-between">
          <span>Saturação</span>
          <span>{params.saturation.toFixed(2)}</span>
        </label>
        <input 
          type="range" min="-1" max="1" step="0.05"
          value={params.saturation} 
          onChange={(e) => handleSliderChange("saturation", parseFloat(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold flex justify-between">
          <span>Matiz (Hue)</span>
          <span>{params.hue.toFixed(2)}</span>
        </label>
        <input 
          type="range" min="-1" max="1" step="0.05"
          value={params.hue} 
          onChange={(e) => handleSliderChange("hue", parseFloat(e.target.value))}
          className="w-full"
        />
      </div>
    </div>
  )
}

export const AdjustmentsPlugin: StudioPlugin = {
  id: "adjustments",
  name: "Ajustes",
  icon: Sliders,
  ContextComponent: AdjustmentsContextPanel,
}
