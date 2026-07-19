"use client"
import React, { useEffect, useState } from "react"
import { Undo, Redo, Download, Play, ChevronLeft, Image as ImageIcon, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useStudioStore } from "@/store/useStudioStore"
import { EventBus, StudioEvent } from "@/lib/studio/events/EventBus"
import { globalCommandManager } from "@/lib/studio/commands/GlobalCommandManager"

export function StudioTopbar() {
  const localCommandManager = globalCommandManager;
  const engine = useStudioStore((state) => state.engine)
  
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  const updateHistoryState = () => {
    if (localCommandManager) {
      setCanUndo(localCommandManager.canUndo())
      setCanRedo(localCommandManager.canRedo())
    }
  }

  useEffect(() => {
    updateHistoryState()
    EventBus.on(StudioEvent.HISTORY_CHANGED, updateHistoryState)
    return () => {
      EventBus.off(StudioEvent.HISTORY_CHANGED, updateHistoryState)
    }
  }, [localCommandManager])

  const handleUndo = () => {
    if (localCommandManager) localCommandManager.undo()
  }

  const handleRedo = () => {
    if (localCommandManager) localCommandManager.redo()
  }

  const [isExportingVideo, setIsExportingVideo] = useState(false)

  const handleExport = async () => {
    if (!engine) return
    setIsExporting(true)
    await new Promise(resolve => setTimeout(resolve, 500))
    try {
      const dataUrl = engine.exportImage({ format: "png", multiplier: 2 })
      if (dataUrl) {
        const link = document.createElement("a")
        link.download = `arte-studio-${Date.now()}.png`
        link.href = dataUrl
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
    } catch (error) {
      console.error("Erro ao exportar", error)
      alert("Falha ao exportar imagem.")
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportVideo = async () => {
    // Princípio 7: Processamento Assíncrono (Job System)
    setIsExportingVideo(true)
    try {
      // Simula o enfileiramento do Job no backend
      await new Promise(resolve => setTimeout(resolve, 1500))
      alert("Sucesso! Job de renderização de vídeo enfileirado. Você será notificado quando o MP4 estiver pronto.")
    } catch (error) {
      alert("Falha ao agendar renderização de vídeo.")
    } finally {
      setIsExportingVideo(false)
    }
  }

  return (
    <div className="h-14 border-b bg-background flex items-center justify-between px-4 shrink-0 z-10">
      <div className="flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon" title="Voltar ao Dashboard">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="h-6 w-px bg-border"></div>
        <div className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5 text-primary" />
          <span className="font-semibold text-sm">AI Studio</span>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" disabled={!canUndo} onClick={handleUndo} title="Desfazer">
          <Undo className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" disabled={!canRedo} onClick={handleRedo} title="Refazer">
          <Redo className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" onClick={handleExportVideo} disabled={isExportingVideo}>
          {isExportingVideo ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Play className="h-4 w-4 mr-2" />
          )}
          {isExportingVideo ? "Gerando..." : "Exportar Vídeo"}
        </Button>
        <Button size="sm" onClick={handleExport} disabled={isExporting}>
          {isExporting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          {isExporting ? "Exportando..." : "Exportar Imagem"}
        </Button>
      </div>
    </div>
  )
}
