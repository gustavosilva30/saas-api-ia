"use client"

import React, { useEffect, useRef } from "react"
import { FabricAdapter } from "@/lib/studio/adapters/FabricAdapter"
import { MotionEngine } from "@/lib/studio/engine/MotionEngine"
import { useStudioStore } from "@/store/useStudioStore"
import { EventBus, StudioEvent } from "@/lib/studio/events/EventBus"
import { Loader2 } from "lucide-react"
import { AssetClassifier } from "@/lib/studio/ai/AssetClassifier"

const AUTOSAVE_KEY = "ai_studio_autosave"

export function StudioCanvasArea() {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const setEngine = useStudioStore((state) => state.setEngine)
  const isProcessingAI = useStudioStore((state) => state.isProcessingAI)
  
  // Guardamos a referência do adapter para limpar no unmount
  const adapterRef = useRef<FabricAdapter | null>(null)

  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return

    const { clientWidth, clientHeight } = containerRef.current

    // Instancia o motor gráfico (FabricAdapter)
    const adapter = new FabricAdapter()
    adapter.init(canvasRef.current, clientWidth, clientHeight)
    
    adapterRef.current = adapter
    setEngine(adapter)

    // Tenta carregar o estado salvo previamente com um leve atraso 
    // para evitar crash do Fabric.js no Strict Mode (unmount imediato)
    const savedState = localStorage.getItem(AUTOSAVE_KEY)
    let loadTimeout: NodeJS.Timeout | null = null;
    
    if (savedState) {
      loadTimeout = setTimeout(() => {
        if (adapterRef.current) {
           adapter.loadState(savedState).catch(e => console.error("Error loading autosave:", e))
        }
      }, 200);
    }

    // Auto-Save: Escutamos eventos que modificam o canvas
    let saveTimeout: NodeJS.Timeout
    const saveState = () => {
      clearTimeout(saveTimeout)
      saveTimeout = setTimeout(() => {
        if (adapterRef.current) {
          const state = adapterRef.current.exportState()
          localStorage.setItem(AUTOSAVE_KEY, state)
        }
      }, 500) // debounce de 500ms
    }

    const unsubAdd = EventBus.on(StudioEvent.OBJECT_ADDED, saveState)
    const unsubRemove = EventBus.on(StudioEvent.OBJECT_REMOVED, saveState)
    const unsubMod = EventBus.on(StudioEvent.OBJECT_MODIFIED, saveState)
    const unsubHistory = EventBus.on(StudioEvent.HISTORY_CHANGED, saveState)

    // Acopla o MotionEngine
    const motion = MotionEngine.getInstance()
    motion.attachRenderEngine(adapter)
    
    // Inicia o Classificador de IA em Background
    AssetClassifier.getInstance().startListening()

    // Handle Window Resize
    const handleResize = () => {
      if (containerRef.current && adapterRef.current) {
        adapterRef.current.resize(
          containerRef.current.clientWidth,
          containerRef.current.clientHeight
        )
      }
    }

    window.addEventListener("resize", handleResize)

    return () => {
      if (loadTimeout) clearTimeout(loadTimeout);
      window.removeEventListener("resize", handleResize)
      unsubAdd()
      unsubRemove()
      unsubMod()
      unsubHistory()
      motion.detachRenderEngine()
      if (adapterRef.current) {
        adapterRef.current.destroy()
        adapterRef.current = null;
      }
    }
  }, [setEngine])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const url = e.dataTransfer.getData("text/plain");
    if (url && adapterRef.current) {
      // Inicia um AddImageCommand
      const { AddImageCommand } = require("@/lib/studio/commands/AddImageCommand")
      const { globalCommandManager } = require("@/lib/studio/commands/GlobalCommandManager")
      globalCommandManager.executeCommand(new AddImageCommand(url));
    }
  }

  return (
    <div 
      ref={containerRef} 
      className="flex-1 relative bg-neutral-900 overflow-hidden flex items-center justify-center cursor-default"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Overlay de IA - Bloqueia interação enquanto processa */}
      {isProcessingAI && (
        <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center pointer-events-auto text-white">
          <Loader2 className="h-12 w-12 text-blue-500 animate-spin mb-4" />
          <h2 className="text-xl font-bold">Processando IA...</h2>
          <p className="text-neutral-300 text-sm">Removendo o fundo da sua imagem de forma inteligente.</p>
        </div>
      )}

      {/* Wrapper do Canvas: Protege o Fabric.js contra re-renders do React */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div className="pointer-events-auto" style={{ width: "100%", height: "100%" }}>
          <canvas ref={canvasRef} />
        </div>
      </div>
      
      {/* Aqui podemos adicionar uma grade (Grid) estática de fundo via CSS se desejado,
          mas o motor gráfico cuida do fundo por padrão. */}
    </div>
  )
}
