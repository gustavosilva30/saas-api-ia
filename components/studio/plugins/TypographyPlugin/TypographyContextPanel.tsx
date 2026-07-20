"use client"
import React, { useState, useEffect } from "react"
import { Type } from "lucide-react"
import { useStudioStore } from "@/store/useStudioStore"
import { EventBus, StudioEvent } from "@/lib/studio/events/EventBus"
import { TYPOGRAPHY_TEMPLATES, TextEffectTemplate } from "./TypographyTemplates"
import { loadFont } from "./TypographyFonts"

export function TypographyContextPanel() {
  const [hasTextSelection, setHasTextSelection] = useState(false)
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null)
  
  // States to represent the current properties
  const [fill, setFill] = useState("#ffffff")
  const [stroke, setStroke] = useState("")
  const [strokeWidth, setStrokeWidth] = useState(0)
  
  useEffect(() => {
    const handleSelection = (selected: any[]) => {
      const isText = selected && selected.length === 1 && (selected[0].type === "i-text" || selected[0].type === "textbox" || selected[0].type === "text")
      setHasTextSelection(isText)
      
      if (isText) {
        setSelectedObjectId(selected[0].id)
        setFill(selected[0].fill || "#ffffff")
        setStroke(selected[0].stroke || "")
        setStrokeWidth(selected[0].strokeWidth || 0)
      } else {
        setSelectedObjectId(null)
      }
    }

    const unsubSelected = EventBus.on(StudioEvent.OBJECT_SELECTED, handleSelection)
    const unsubCleared = EventBus.on(StudioEvent.SELECTION_CLEARED, () => setHasTextSelection(false))
    
    return () => {
      unsubSelected()
      unsubCleared()
    }
  }, [])

  const applyProperty = (key: string, value: any) => {
    if (!selectedObjectId) return
    const engine = useStudioStore.getState().engine
    if (engine) {
      engine.updateObjectProperties(selectedObjectId, { [key]: value })
      engine.requestRender()
      
      // Update local state to reflect changes
      if (key === 'fill') setFill(value)
      if (key === 'stroke') setStroke(value)
      if (key === 'strokeWidth') setStrokeWidth(value)
    }
  }

  const applyTemplate = async (template: TextEffectTemplate) => {
    if (!selectedObjectId) return
    const engine = useStudioStore.getState().engine
    if (!engine) return
    
    // Carregar fonte antes se necessário
    if (template.fontFamily) {
      await loadFont(template.fontFamily).catch(() => {})
    }

    const properties: any = {
      fontFamily: template.fontFamily,
      fill: template.fill,
      stroke: template.stroke || null,
      strokeWidth: template.strokeWidth || 0,
    }

    engine.updateObjectProperties(selectedObjectId, properties)
    
    if (template.shadow) {
      engine.applyShadowToSelected(template.shadow)
    } else {
      engine.applyShadowToSelected(null)
    }
    
    engine.requestRender()
    
    // Atualiza estados locais
    setFill(template.fill)
    setStroke(template.stroke || "")
    setStrokeWidth(template.strokeWidth || 0)
  }

  if (!hasTextSelection) return null

  return (
    <div className="flex flex-col p-4 gap-4 border-b">
      <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2 border-b pb-2">
        <Type className="h-4 w-4" /> Efeitos de Texto
      </h3>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold">Cor de Preenchimento</label>
          <div className="flex items-center gap-2 h-9 border rounded-md px-2 bg-background">
            <input 
              type="color" 
              value={typeof fill === 'string' ? fill : '#ffffff'}
              onChange={(e) => applyProperty("fill", e.target.value)}
              className="w-6 h-6 rounded cursor-pointer border-0 p-0"
            />
            <span className="text-xs uppercase">{typeof fill === 'string' ? fill : 'Gradient'}</span>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold flex justify-between">
            <span>Cor do Contorno</span>
          </label>
          <div className="flex items-center gap-2 h-9 border rounded-md px-2 bg-background">
            <input 
              type="color" 
              value={stroke || "#000000"}
              onChange={(e) => applyProperty("stroke", e.target.value)}
              className="w-6 h-6 rounded cursor-pointer border-0 p-0"
            />
            <span className="text-xs uppercase">{stroke || "Nenhum"}</span>
            <button 
              className="ml-auto text-xs text-muted-foreground hover:text-primary"
              onClick={() => applyProperty("stroke", null)}
            >
              Remover
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold flex justify-between">
            <span>Espessura do Contorno</span>
            <span>{strokeWidth}px</span>
          </label>
          <input 
            type="range" min="0" max="20" 
            value={strokeWidth} 
            onChange={(e) => applyProperty("strokeWidth", parseInt(e.target.value))}
            className="w-full"
          />
        </div>
      </div>

      <div className="mt-2 space-y-2">
        <h4 className="text-xs font-semibold text-muted-foreground">Templates Rápidos</h4>
        <div className="grid grid-cols-2 gap-2">
          {TYPOGRAPHY_TEMPLATES.map(template => (
            <button
              key={template.id}
              onClick={() => applyTemplate(template)}
              className="text-xs p-2 rounded border bg-muted/30 hover:bg-muted text-center transition-colors truncate"
              title={template.name}
            >
              {template.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
