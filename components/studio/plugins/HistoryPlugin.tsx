"use client"
import React, { useEffect, useState } from "react"
import { History, Undo, RotateCcw, Save, Cloud, Calendar, Loader2 } from "lucide-react"
import { StudioPlugin } from "@/lib/studio/plugins/BasePlugin"
import { EventBus, StudioEvent } from "@/lib/studio/events/EventBus"
import { globalCommandManager } from "@/lib/studio/commands/GlobalCommandManager"
import { useStudioStore } from "@/store/useStudioStore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

function HistorySidebar() {
  const engine = useStudioStore((state) => state.engine)
  const [history, setHistory] = useState<any[]>([])
  
  // Versões persistidas
  const [dbVersions, setDbVersions] = useState<any[]>([])
  const [newVersionName, setNewVersionName] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [isLoadingVersions, setIsLoadingVersions] = useState(false)

  const updateHistory = () => {
    setHistory(globalCommandManager.getHistory())
  }

  const fetchVersions = async () => {
    setIsLoadingVersions(true)
    try {
      const token = localStorage.getItem("token") || ""
      const res = await fetch("/api/history/versions", {
        headers: { "Authorization": `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setDbVersions(data)
      }
    } catch (e) {
      console.error("Erro ao obter versões", e)
    } finally {
      setIsLoadingVersions(false)
    }
  }

  useEffect(() => {
    updateHistory()
    fetchVersions()
    EventBus.on(StudioEvent.HISTORY_CHANGED, updateHistory)
    EventBus.on(StudioEvent.PROJECT_SAVED, updateHistory)

    return () => {
      EventBus.off(StudioEvent.HISTORY_CHANGED, updateHistory)
      EventBus.off(StudioEvent.PROJECT_SAVED, updateHistory)
    }
  }, [])

  const handleGoTo = (index: number) => {
    globalCommandManager.goTo(index)
    updateHistory()
  }

  const handleSaveVersion = async () => {
    if (!engine || !newVersionName.trim()) return
    setIsSaving(true)
    const { toast } = require("sonner")

    try {
      const canvasState = engine.exportDocument()
      const token = localStorage.getItem("token") || ""
      const res = await fetch("/api/history/versions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newVersionName,
          state: canvasState
        })
      })

      if (res.ok) {
        toast.success("Snapshot de versão salvo com sucesso!")
        setNewVersionName("")
        fetchVersions()
      } else {
        toast.error("Erro ao salvar versão.")
      }
    } catch (e) {
      toast.error("Erro de conexão ao salvar versão.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleLoadVersion = async (version: any) => {
    if (!engine || !version.state) return
    const { toast } = require("sonner")
    
    try {
      const docState = typeof version.state === 'string' ? JSON.parse(version.state) : version.state
      await engine.loadDocument(docState)
      engine.requestRender()
      EventBus.emit(StudioEvent.HISTORY_CHANGED)
      toast.success(`Versão "${version.name}" restaurada com sucesso!`)
    } catch (e) {
      toast.error("Erro ao restaurar versão.")
    }
  }

  return (
    <div className="w-80 border-r bg-background flex flex-col p-4 overflow-y-auto gap-4">
      {/* Seção 1: Salvar versão duradoura */}
      <div className="flex flex-col gap-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Cloud className="h-3.5 w-3.5 text-purple-500 animate-pulse" />
          Snapshot do Documento
        </h3>
        <p className="text-[10px] text-muted-foreground leading-tight">
          Gere um ponto de restauração duradouro no banco de dados para poder carregar a qualquer momento.
        </p>
        <div className="flex gap-2">
          <Input
            value={newVersionName}
            onChange={(e) => setNewVersionName(e.target.value)}
            placeholder="Nome (Ex: 'Ajuste de cores')"
            className="h-8 text-xs flex-1"
          />
          <Button size="xs" onClick={handleSaveVersion} disabled={isSaving || !newVersionName.trim()} className="gap-1 h-8">
            {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Salvar
          </Button>
        </div>
      </div>

      {/* Seção 2: Histórico de Versões Persistido */}
      <div className="flex flex-col gap-2 border-t pt-3">
        <label className="text-[10px] uppercase font-bold text-muted-foreground">Versões Salvas (Cloud)</label>
        {isLoadingVersions ? (
          <div className="flex items-center gap-2 py-4 text-xs text-muted-foreground justify-center">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span>Obtendo snapshots...</span>
          </div>
        ) : dbVersions.length === 0 ? (
          <p className="text-[10px] text-muted-foreground text-center py-2">Nenhuma versão salva na nuvem.</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {dbVersions.map((v) => (
              <div 
                key={v.id} 
                className="flex items-center justify-between p-2 border rounded-lg bg-card hover:border-purple-500/50 transition cursor-pointer"
                onClick={() => handleLoadVersion(v)}
              >
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold truncate text-purple-600 dark:text-purple-400">{v.name}</span>
                  <span className="text-[9px] text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Calendar className="h-2.5 w-2.5" />
                    {new Date(v.created_at).toLocaleString()}
                  </span>
                </div>
                <RotateCcw className="h-3.5 w-3.5 text-muted-foreground shrink-0 ml-2" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Seção 3: Histórico Temporário (Undo/Redo Stack) */}
      <div className="flex flex-col gap-2 border-t pt-3">
        <label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
          <History className="h-3.5 w-3.5" /> Histórico Local
        </label>
        
        {history.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center mt-4">Nenhuma ação recente.</p>
        ) : (
          <div className="flex flex-col gap-1 relative">
            <div className="absolute left-[11px] top-3 bottom-3 w-px bg-border z-0" />
            {history.map((item, index) => {
              const isLatest = index === history.length - 1;
              return (
                <div 
                  key={item.id} 
                  className={`flex items-center gap-2 p-1.5 rounded-md cursor-pointer transition relative z-10 text-[11px]
                    ${isLatest ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted'}
                  `} 
                  onClick={() => handleGoTo(index)}
                >
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isLatest ? 'bg-primary ring-2 ring-primary/20' : 'bg-muted-foreground'}`} />
                  <span className="truncate max-w-[170px]">{item.label}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export const HistoryPlugin: StudioPlugin = {
  id: "history",
  name: "Histórico",
  icon: Undo,
  SidebarComponent: HistorySidebar,
}
