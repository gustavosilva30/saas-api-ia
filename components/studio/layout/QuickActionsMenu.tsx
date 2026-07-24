"use client"
import React from "react"
import { useSelectionStore } from "@/store/useSelectionStore"
import { Button } from "@/components/ui/button"
import { globalCommandManager } from "@/lib/studio/commands/GlobalCommandManager"
import { DeleteObjectCommand } from "@/lib/studio/commands/DeleteObjectCommand"
import { DuplicateObjectCommand } from "@/lib/studio/commands/DuplicateObjectCommand"
import { MoveLayerCommand } from "@/lib/studio/commands/MoveLayerCommand"
import { Copy, Trash2, ArrowUpToLine, ArrowDownToLine, Lock, Unlock, Group, Combine } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export function QuickActionsMenu() {
  const { selectedIds } = useSelectionStore()

  if (selectedIds.length === 0) return null;

  const handleDuplicate = () => {
    selectedIds.forEach(id => {
      globalCommandManager.executeCommand(new DuplicateObjectCommand(id))
    })
  }

  const handleDelete = () => {
    selectedIds.forEach(id => {
      globalCommandManager.executeCommand(new DeleteObjectCommand(id))
    })
  }

  const handleBringForward = () => {
    selectedIds.forEach(id => {
      globalCommandManager.executeCommand(new MoveLayerCommand(id, 'up'))
    })
  }

  const handleSendBackward = () => {
    selectedIds.forEach(id => {
      globalCommandManager.executeCommand(new MoveLayerCommand(id, 'down'))
    })
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-background/90 backdrop-blur-md border rounded-2xl shadow-2xl px-2 py-1.5 flex items-center gap-1 z-20 animate-in slide-in-from-bottom-8 fade-in duration-200">
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={handleDuplicate} className="h-9 w-9 rounded-xl hover:bg-muted">
              <Copy className="h-4 w-4 text-foreground/80" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">Duplicar</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={handleBringForward} className="h-9 w-9 rounded-xl hover:bg-muted">
              <ArrowUpToLine className="h-4 w-4 text-foreground/80" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">Trazer para Frente</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={handleSendBackward} className="h-9 w-9 rounded-xl hover:bg-muted">
              <ArrowDownToLine className="h-4 w-4 text-foreground/80" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">Enviar para Trás</TooltipContent>
        </Tooltip>

        <div className="w-px h-5 bg-border mx-1" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-muted text-destructive hover:text-destructive hover:bg-destructive/10" onClick={handleDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">Excluir</TooltipContent>
        </Tooltip>

      </div>
    </TooltipProvider>
  )
}
