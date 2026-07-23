"use client"
import React from "react"
import { Pencil, Eraser, PenTool, MousePointer2 } from "lucide-react"
import { StudioPlugin } from "@/lib/studio/sdk/PluginSDK"
import { useStudioStore } from "@/store/useStudioStore"
import { Button } from "@/components/ui/button"

function DrawingToolbar() {
  const engine = useStudioStore((state) => state.engine)
  // Estado local para o modo ativo para UI
  const [activeMode, setActiveMode] = React.useState<'pencil' | 'eraser' | 'pen' | 'none'>('none')

  const setMode = (mode: 'pencil' | 'eraser' | 'pen' | 'none') => {
    setActiveMode(mode)
    if (engine) {
      engine.setDrawingMode(mode, { color: '#3b82f6', width: 5 })
    }
  }

  return (
    <div className="flex items-center gap-1 p-1 bg-background border rounded-md shadow-sm">
      <Button 
        variant={activeMode === 'none' ? "default" : "ghost"} 
        size="icon" 
        className="h-8 w-8"
        onClick={() => setMode('none')}
        title="Cursor / Selecionar"
      >
        <MousePointer2 className="h-4 w-4" />
      </Button>
      <div className="w-px h-5 bg-border mx-1" />
      <Button 
        variant={activeMode === 'pencil' ? "default" : "ghost"} 
        size="icon" 
        className="h-8 w-8"
        onClick={() => setMode('pencil')}
        title="Lápis (Pencil)"
      >
        <Pencil className="h-4 w-4" />
      </Button>
      <Button 
        variant={activeMode === 'pen' ? "default" : "ghost"} 
        size="icon" 
        className="h-8 w-8"
        onClick={() => setMode('pen')}
        title="Caneta (Pen Tool)"
      >
        <PenTool className="h-4 w-4" />
      </Button>
      <Button 
        variant={activeMode === 'eraser' ? "default" : "ghost"} 
        size="icon" 
        className="h-8 w-8"
        onClick={() => setMode('eraser')}
        title="Borracha (Eraser)"
      >
        <Eraser className="h-4 w-4" />
      </Button>
    </div>
  )
}

export const DrawingPlugin: StudioPlugin = {
  id: "drawing",
  name: "Desenho",
  icon: Pencil,
  category: "Ferramentas",
  capabilities: {},
  ToolbarComponent: DrawingToolbar,
}
