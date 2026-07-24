"use client"
import React, { useEffect, useState } from "react"
import { History, Undo, RotateCcw } from "lucide-react"
import { StudioPlugin } from "@/lib/studio/plugins/BasePlugin"
import { EventBus, StudioEvent } from "@/lib/studio/events/EventBus"
import { globalCommandManager } from "@/lib/studio/commands/GlobalCommandManager"
import { Button } from "@/components/ui/button"

function HistorySidebar() {
  const [history, setHistory] = useState<any[]>([])

  const updateHistory = () => {
    setHistory(globalCommandManager.getHistory())
  }

  useEffect(() => {
    updateHistory()
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

  return (
    <div className="w-64 p-4 flex flex-col h-full overflow-y-auto">
      <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
        <History className="h-4 w-4" />
        Histórico
      </h3>
      
      {history.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center mt-10">Nenhuma ação recente.</p>
      ) : (
        <div className="flex flex-col gap-2 relative">
          {/* Linha vertical conectando os itens */}
          <div className="absolute left-[15px] top-4 bottom-4 w-px bg-border z-0" />
          
          {history.map((item, index) => {
            const isLatest = index === history.length - 1;
            return (
              <div 
                key={item.id} 
                className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition relative z-10 
                  ${isLatest ? 'bg-primary/10 border border-primary/20' : 'bg-card border border-transparent hover:border-border'}
                `} 
                onClick={() => handleGoTo(index)}
              >
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isLatest ? 'bg-primary ring-2 ring-primary/20' : 'bg-muted-foreground'}`} />
                <span className={`text-xs truncate max-w-[150px] ${isLatest ? 'font-medium text-primary' : 'text-foreground'}`}>
                  {item.label}
                </span>
                <RotateCcw className="h-3 w-3 text-muted-foreground ml-auto flex-shrink-0" />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export const HistoryPlugin: StudioPlugin = {
  id: "history",
  name: "Histórico",
  icon: Undo,
  SidebarComponent: HistorySidebar,
}
