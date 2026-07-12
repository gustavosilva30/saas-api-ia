"use client"

import React, { useEffect, useRef } from "react"
import { FabricAdapter } from "@/lib/studio/adapters/FabricAdapter"
import { useStudioStore } from "@/store/useStudioStore"
import { Loader2 } from "lucide-react"

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
      window.removeEventListener("resize", handleResize)
      if (adapterRef.current) {
        adapterRef.current.destroy()
      }
    }
  }, [setEngine])

  return (
    <div 
      ref={containerRef} 
      className="flex-1 relative bg-neutral-900 overflow-hidden flex items-center justify-center cursor-default"
    >
      {/* Overlay de IA - Bloqueia interação enquanto processa */}
      {isProcessingAI && (
        <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center pointer-events-auto text-white">
          <Loader2 className="h-12 w-12 text-blue-500 animate-spin mb-4" />
          <h2 className="text-xl font-bold">Processando IA...</h2>
          <p className="text-neutral-300 text-sm">Removendo o fundo da sua imagem de forma inteligente.</p>
        </div>
      )}

      <canvas ref={canvasRef} className="absolute inset-0" />
      
      {/* Aqui podemos adicionar uma grade (Grid) estática de fundo via CSS se desejado,
          pois o background color está sendo controlado pelo FabricAdapter */}
    </div>
  )
}
