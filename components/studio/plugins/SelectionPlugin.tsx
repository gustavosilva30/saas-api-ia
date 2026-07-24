"use client"
import React, { useState, useEffect } from "react"
import { MousePointer2, Square, Circle, Crop, Scissors, Eraser, Sparkles, Move, Trash2, Loader2, Wand2 } from "lucide-react"
import { StudioPlugin } from "@/lib/studio/plugins/BasePlugin"
import { useStudioStore } from "@/store/useStudioStore"
import { EventBus } from "@/lib/studio/events/EventBus"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

function SelectionSidebar() {
  const engine = useStudioStore((state) => state.engine)
  const [activeTool, setActiveTool] = useState<string | null>(null)
  const [brushSize, setBrushSize] = useState(4)
  const [lastPath, setLastPath] = useState<any>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progressMsg, setProgressMsg] = useState("")

  useEffect(() => {
    const handlePathCreated = (path: any) => {
      setLastPath(path)
      const { toast } = require("sonner")
      toast.success("Contorno finalizado! Escolha uma ação abaixo.")
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
      setLastPath(null)
      engine.startSelection(tool, { brushSize })
      setActiveTool(tool)
    }
  }

  const getTargetImage = () => {
    if (!engine || !engine.canvas || !lastPath) return null
    const target = engine.canvas.getActiveObject()
    if (!target || target.type !== 'image') {
      const { toast } = require("sonner")
      toast.error("Selecione a imagem primeiro antes de desenhar o laço!")
      engine.canvas.remove(lastPath)
      setLastPath(null)
      return null
    }
    return target
  }

  const executeAction = async (action: 'crop' | 'erase-external' | 'extract' | 'remove-bg-ai') => {
    const targetImage = getTargetImage()
    if (!targetImage || !engine?.canvas) return

    const { SelectionEngine } = require('@/lib/studio/engine/SelectionEngine')
    const { toast } = require("sonner")

    setIsProcessing(true)
    setProgressMsg("")

    try {
      if (action === 'crop') {
        await SelectionEngine.cropImageToSelection(engine.canvas, targetImage, lastPath)
        toast.success("Figura recortada com sucesso!")

      } else if (action === 'erase-external') {
        SelectionEngine.eraseExternalBackground(engine.canvas, targetImage, lastPath)
        toast.success("Fundo externo removido!")

      } else if (action === 'extract') {
        await SelectionEngine.extractAsNewObject(engine.canvas, targetImage, lastPath)
        toast.success("Seleção extraída como nova figura independente!")

      } else if (action === 'remove-bg-ai') {
        toast.info("Removendo fundo da seleção com IA...")
        await SelectionEngine.removeBackgroundFromSelection(
          engine.canvas, 
          targetImage, 
          lastPath,
          (msg: string) => setProgressMsg(msg)
        )
        toast.success("Fundo da seleção removido com IA!")
      }

      setLastPath(null)
    } catch (err: any) {
      toast.error(typeof err === 'string' ? err : "Ocorreu um erro ao processar.")
    } finally {
      setIsProcessing(false)
      setProgressMsg("")
    }
  }

  const discardSelection = () => {
    if (engine?.canvas && lastPath) {
      engine.canvas.remove(lastPath)
    }
    setLastPath(null)
  }

  return (
    <div className="w-80 border-r bg-background flex flex-col p-4 overflow-y-auto">
      <h3 className="text-sm font-semibold flex items-center gap-2 mb-1 uppercase tracking-wider text-muted-foreground">
        <MousePointer2 className="h-4 w-4" />
        Ferramentas de Seleção
      </h3>
      <p className="text-xs text-muted-foreground mb-4">
        Selecione um modo e contorne o objeto para isolar, extrair ou editar partes da imagem.
      </p>

      {/* Modos de seleção */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <button
          onClick={() => handleTool('rect')}
          className={`flex flex-col items-center justify-center p-3 border rounded-lg hover:border-primary transition bg-card text-center ${activeTool === 'rect' ? 'ring-2 ring-primary bg-primary/5' : ''}`}
        >
          <Square className="h-5 w-5 mb-1 text-muted-foreground" />
          <span className="text-xs font-medium">Retângulo</span>
        </button>

        <button
          onClick={() => handleTool('ellipse')}
          className={`flex flex-col items-center justify-center p-3 border rounded-lg hover:border-primary transition bg-card text-center ${activeTool === 'ellipse' ? 'ring-2 ring-primary bg-primary/5' : ''}`}
        >
          <Circle className="h-5 w-5 mb-1 text-muted-foreground" />
          <span className="text-xs font-medium">Elipse</span>
        </button>

        <button
          onClick={() => handleTool('lasso')}
          className={`flex flex-col items-center justify-center p-3 border rounded-lg hover:border-primary transition bg-card text-center ${activeTool === 'lasso' ? 'ring-2 ring-primary bg-primary/5 border-primary' : ''}`}
        >
          <MousePointer2 className="h-5 w-5 mb-1 text-muted-foreground" />
          <span className="text-xs font-medium">Laço Livre</span>
          <span className="text-[9px] text-muted-foreground">Contorno manual</span>
        </button>

        <button
          onClick={() => handleTool('crop')}
          className={`flex flex-col items-center justify-center p-3 border rounded-lg hover:border-primary transition bg-card text-center ${activeTool === 'crop' ? 'ring-2 ring-primary bg-primary/5' : ''}`}
        >
          <Crop className="h-5 w-5 mb-1 text-muted-foreground" />
          <span className="text-xs font-medium">Crop</span>
        </button>
      </div>

      {/* Configurações do Laço Livre */}
      {activeTool === 'lasso' && (
        <div className="p-3 border border-blue-500/30 bg-blue-500/5 rounded-lg mb-4 animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">Modo Laço Ativo</span>
          </div>
          <label className="text-xs font-semibold mb-2 flex items-center justify-between">
            <span>Grossura do Traço</span>
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
          <p className="text-[10px] text-muted-foreground mt-2">
            Contorne o objeto e solte o mouse para fechar o contorno.
          </p>
        </div>
      )}

      {/* Barra de ações pós-contorno */}
      {lastPath && (
        <div className="p-4 border border-green-500/30 bg-card rounded-lg animate-in slide-in-from-bottom-4 shadow-md">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-green-500" />
            <h4 className="font-semibold text-xs text-green-600 dark:text-green-400">Contorno Fechado!</h4>
            <Badge variant="outline" className="ml-auto text-[9px]">Selecione uma ação</Badge>
          </div>

          {isProcessing && (
            <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin text-primary" />
              <span>{progressMsg || "Processando..."}</span>
            </div>
          )}

          <div className="flex flex-col gap-2">
            {/* Recortar como nova figura */}
            <Button
              size="sm"
              onClick={() => executeAction('crop')}
              disabled={isProcessing}
              className="w-full flex items-center justify-start gap-2 h-9"
            >
              <Scissors className="h-4 w-4" />
              <div className="text-left">
                <div className="text-xs font-medium">Recortar</div>
                <div className="text-[9px] opacity-80">Nova figura recortada</div>
              </div>
            </Button>

            {/* Extrair como objeto independente */}
            <Button
              size="sm"
              variant="secondary"
              onClick={() => executeAction('extract')}
              disabled={isProcessing}
              className="w-full flex items-center justify-start gap-2 h-9"
            >
              <Move className="h-4 w-4" />
              <div className="text-left">
                <div className="text-xs font-medium">Extrair & Mover</div>
                <div className="text-[9px] opacity-80">Figura independente editável</div>
              </div>
            </Button>

            {/* Apagar fundo externo */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => executeAction('erase-external')}
              disabled={isProcessing}
              className="w-full flex items-center justify-start gap-2 h-9"
            >
              <Eraser className="h-4 w-4" />
              <div className="text-left">
                <div className="text-xs font-medium">Apagar Fundo Externo</div>
                <div className="text-[9px] opacity-80">Mantém só o interior do contorno</div>
              </div>
            </Button>

            {/* Remover fundo da seleção via IA */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => executeAction('remove-bg-ai')}
              disabled={isProcessing}
              className="w-full flex items-center justify-start gap-2 h-9 border-purple-500/30 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/30"
            >
              <Wand2 className="h-4 w-4" />
              <div className="text-left">
                <div className="text-xs font-medium">Remover Fundo com IA</div>
                <div className="text-[9px] opacity-80">Remove bg apenas da seleção</div>
              </div>
            </Button>

            {/* Descartar */}
            <Button
              size="sm"
              variant="ghost"
              onClick={discardSelection}
              disabled={isProcessing}
              className="w-full flex items-center justify-center gap-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 text-xs"
            >
              <Trash2 className="h-3 w-3" />
              Descartar Seleção
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export const SelectionPlugin: StudioPlugin = {
  id: "selection",
  name: "Seleção",
  icon: MousePointer2,
  SidebarComponent: SelectionSidebar,
}

