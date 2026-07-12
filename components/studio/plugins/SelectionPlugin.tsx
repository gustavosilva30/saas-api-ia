"use client"
import React, { useState } from "react"
import { MousePointer2, Square, Circle, Crop } from "lucide-react"
import { StudioPlugin } from "@/lib/studio/plugins/BasePlugin"
import { useStudioStore } from "@/store/useStudioStore"

function SelectionSidebar() {
  const [activeTool, setActiveTool] = useState<string | null>(null)

  const handleTool = (tool: 'rect' | 'ellipse' | 'lasso' | 'crop') => {
    const engine = useStudioStore.getState().engine
    if (!engine) return
    
    if (activeTool === tool) {
      engine.stopSelection()
      setActiveTool(null)
    } else {
      engine.startSelection(tool)
      setActiveTool(tool)
    }
  }

  return (
    <div className="w-64 p-4 flex flex-col h-full overflow-y-auto gap-4">
      <h3 className="text-sm font-semibold flex items-center gap-2">
        <MousePointer2 className="h-4 w-4" />
        Ferramentas de Seleção
      </h3>
      
      <p className="text-xs text-muted-foreground">
        Escolha uma ferramenta para recortar ou isolar partes da imagem ativa.
      </p>
      
      <div className="grid grid-cols-2 gap-2 mt-2">
        <button 
          onClick={() => handleTool('rect')}
          className={`flex flex-col items-center justify-center p-4 border rounded-lg hover:bg-accent transition ${activeTool === 'rect' ? 'bg-accent border-primary' : 'bg-card'}`}
        >
          <Square className="h-6 w-6 mb-2 text-muted-foreground" />
          <span className="text-xs font-medium">Retângulo</span>
        </button>
        
        <button 
          onClick={() => handleTool('ellipse')}
          className={`flex flex-col items-center justify-center p-4 border rounded-lg hover:bg-accent transition ${activeTool === 'ellipse' ? 'bg-accent border-primary' : 'bg-card'}`}
        >
          <Circle className="h-6 w-6 mb-2 text-muted-foreground" />
          <span className="text-xs font-medium">Elipse</span>
        </button>
        
        <button 
          onClick={() => handleTool('lasso')}
          className={`flex flex-col items-center justify-center p-4 border rounded-lg hover:bg-accent transition ${activeTool === 'lasso' ? 'bg-accent border-primary' : 'bg-card'}`}
        >
          <MousePointer2 className="h-6 w-6 mb-2 text-muted-foreground" />
          <span className="text-xs font-medium">Laço</span>
        </button>
        
        <button 
          onClick={() => handleTool('crop')}
          className={`flex flex-col items-center justify-center p-4 border rounded-lg hover:bg-accent transition ${activeTool === 'crop' ? 'bg-accent border-primary' : 'bg-card'}`}
        >
          <Crop className="h-6 w-6 mb-2 text-muted-foreground" />
          <span className="text-xs font-medium">Crop</span>
        </button>
      </div>
    </div>
  )
}

export const SelectionPlugin: StudioPlugin = {
  id: "selection",
  name: "Seleção",
  icon: MousePointer2,
  SidebarComponent: SelectionSidebar,
}
