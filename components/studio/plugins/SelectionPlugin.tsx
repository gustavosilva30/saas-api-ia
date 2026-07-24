"use client"
import React, { useState, useEffect } from "react"
import { MousePointer2, Square, Circle, Crop, Scissors, Eraser, Move } from "lucide-react"
import { StudioPlugin } from "@/lib/studio/plugins/BasePlugin"
import { useStudioStore } from "@/store/useStudioStore"
import { EventBus } from "@/lib/studio/events/EventBus"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"

function SelectionSidebar() {
  const engine = useStudioStore((state) => state.engine)
  const [activeTool, setActiveTool] = useState<string | null>(null)
  const [brushSize, setBrushSize] = useState(2)
  const [lastPath, setLastPath] = useState<any>(null)

  useEffect(() => {
    const handlePathCreated = (path: any) => {
      setLastPath(path)
      const { toast } = require("sonner")
      toast.success("Contorno finalizado! Escolha uma ação abaixo.")
      // Pausa o modo desenho temporariamente para o usuário não desenhar de novo sem querer
      if (engine) engine.stopSelection()
      setActiveTool(null)
    }

    EventBus.on('LASSO_PATH_CREATED', handlePathCreated)
    return () => {
      EventBus.off('LASSO_PATH_CREATED', handlePathCreated)
    }
  }, [engine])

  const handleTool = (tool: 'rect' | 'ellipse' | 'lasso' | 'crop') => {
    if (!engine) return
    
    if (activeTool === tool) {
      engine.stopSelection()
      setActiveTool(null)
    } else {
      setLastPath(null) // Reseta o path anterior
      engine.startSelection(tool, { brushSize })
      setActiveTool(tool)
    }
  }

  const executeAction = async (action: 'crop' | 'erase-external') => {
    if (!engine || !engine.canvas || !lastPath) return;
    
    // Assumimos que há uma imagem ativa selecionada por trás, ou usamos a primeira do canvas
    let targetImage = engine.canvas.getActiveObject();
    if (!targetImage || targetImage.type !== 'image') {
      const { toast } = require("sonner");
      toast.error("Selecione a imagem primeiro antes de desenhar o laço sobre ela!");
      // Apaga o path
      engine.canvas.remove(lastPath);
      setLastPath(null);
      return;
    }

    const { SelectionEngine } = require('@/lib/studio/engine/SelectionEngine');

    if (action === 'crop') {
      await SelectionEngine.cropImageToSelection(engine.canvas, targetImage, lastPath);
      const { toast } = require("sonner");
      toast.success("Figura recortada com sucesso!");
    } else if (action === 'erase-external') {
      SelectionEngine.eraseExternalBackground(engine.canvas, targetImage, lastPath);
      const { toast } = require("sonner");
      toast.success("Fundo externo removido!");
    }

    setLastPath(null);
  }

  return (
    <div className="w-80 border-r bg-background flex flex-col p-4 overflow-y-auto">
      <h3 className="text-sm font-semibold flex items-center gap-2 mb-2 uppercase tracking-wider text-muted-foreground">
        <MousePointer2 className="h-4 w-4" />
        Ferramentas de Seleção
      </h3>
      
      <p className="text-xs text-muted-foreground mb-4">
        Escolha uma ferramenta para recortar ou isolar partes da imagem ativa.
      </p>
      
      <div className="grid grid-cols-2 gap-2 mb-6">
        <button 
          onClick={() => handleTool('rect')}
          className={`flex flex-col items-center justify-center p-4 border rounded-lg hover:border-primary transition bg-card ${activeTool === 'rect' ? 'ring-2 ring-primary bg-primary/5' : ''}`}
        >
          <Square className="h-6 w-6 mb-2 text-muted-foreground" />
          <span className="text-xs font-medium">Retângulo</span>
        </button>
        
        <button 
          onClick={() => handleTool('ellipse')}
          className={`flex flex-col items-center justify-center p-4 border rounded-lg hover:border-primary transition bg-card ${activeTool === 'ellipse' ? 'ring-2 ring-primary bg-primary/5' : ''}`}
        >
          <Circle className="h-6 w-6 mb-2 text-muted-foreground" />
          <span className="text-xs font-medium">Elipse</span>
        </button>
        
        <button 
          onClick={() => handleTool('lasso')}
          className={`flex flex-col items-center justify-center p-4 border rounded-lg hover:border-primary transition bg-card ${activeTool === 'lasso' ? 'ring-2 ring-primary bg-primary/5' : ''}`}
        >
          <MousePointer2 className="h-6 w-6 mb-2 text-muted-foreground" />
          <span className="text-xs font-medium">Laço Livre</span>
        </button>
        
        <button 
          onClick={() => handleTool('crop')}
          className={`flex flex-col items-center justify-center p-4 border rounded-lg hover:border-primary transition bg-card ${activeTool === 'crop' ? 'ring-2 ring-primary bg-primary/5' : ''}`}
        >
          <Crop className="h-6 w-6 mb-2 text-muted-foreground" />
          <span className="text-xs font-medium">Crop</span>
        </button>
      </div>

      {activeTool === 'lasso' && (
        <div className="p-4 border border-primary/20 bg-primary/5 rounded-lg mb-4 animate-in fade-in slide-in-from-top-4">
          <label className="text-xs font-semibold mb-3 flex items-center justify-between">
            <span>Grossura do Laço</span>
            <span className="text-muted-foreground font-mono">{brushSize}px</span>
          </label>
          <Slider 
            value={[brushSize]} 
            onValueChange={(v) => {
              setBrushSize(v[0])
              if (engine && engine.canvas) {
                engine.canvas.freeDrawingBrush.width = v[0]
              }
            }} 
            min={1} 
            max={50} 
            step={1} 
          />
          <p className="text-[10px] text-muted-foreground mt-3">
            Contorne o objeto mantendo o clique pressionado. Quanto maior a grossura, maior será a área selecionada.
          </p>
        </div>
      )}

      {lastPath && (
        <div className="p-4 border rounded-lg bg-card animate-in slide-in-from-bottom-4 shadow-lg border-primary/50">
          <h4 className="font-semibold text-xs mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Contorno Fechado!
          </h4>
          <div className="flex flex-col gap-2">
            <Button size="sm" onClick={() => executeAction('crop')} className="w-full flex items-center justify-start gap-2">
              <Scissors className="h-4 w-4" /> Recortar (Nova Figura)
            </Button>
            <Button size="sm" variant="secondary" onClick={() => executeAction('erase-external')} className="w-full flex items-center justify-start gap-2">
              <Eraser className="h-4 w-4" /> Apagar Fundo Externo
            </Button>
            <Button size="sm" variant="ghost" onClick={() => {
              engine?.canvas?.remove(lastPath)
              setLastPath(null)
            }} className="w-full flex items-center justify-start gap-2 text-red-500 hover:text-red-600 hover:bg-red-50">
              Descartar Seleção
            </Button>
          </div>
        </div>
      )}

    </div>
  )
}

function Sparkles(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </svg>
  )
}

export const SelectionPlugin: StudioPlugin = {
  id: "selection",
  name: "Seleção",
  icon: MousePointer2,
  SidebarComponent: SelectionSidebar,
}
