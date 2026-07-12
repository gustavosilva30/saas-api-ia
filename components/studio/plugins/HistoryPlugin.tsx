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
        <div className="flex flex-col gap-2">
          {history.map((item, index) => (
            <div key={item.id} className="flex items-center justify-between p-2 rounded-lg border bg-card hover:bg-accent cursor-pointer transition" onClick={() => handleGoTo(index)}>
              <span className="text-xs truncate max-w-[150px]">
                {item.label}
              </span>
              <RotateCcw className="h-3 w-3 text-muted-foreground" />
            </div>
          ))}
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
