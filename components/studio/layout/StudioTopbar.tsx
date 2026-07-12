import React from "react"
import { Undo, Redo, Download, Play, Image as ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

export function StudioTopbar() {
  return (
    <div className="h-14 border-b bg-background flex items-center justify-between px-4 shrink-0 z-10">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon">
          <ImageIcon className="h-5 w-5" />
        </Button>
        <span className="font-semibold text-sm">AI Studio</span>
      </div>
      
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" disabled>
          <Undo className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" disabled>
          <Redo className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm">
          <Play className="h-4 w-4 mr-2" />
          Testar API
        </Button>
        <Button size="sm">
          <Download className="h-4 w-4 mr-2" />
          Exportar
        </Button>
      </div>
    </div>
  )
}
