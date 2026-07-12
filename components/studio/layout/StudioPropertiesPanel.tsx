import React from "react"

export function StudioPropertiesPanel() {
  return (
    <div className="w-64 border-l bg-background flex flex-col shrink-0 z-10 p-4">
      <h3 className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wider">
        Propriedades
      </h3>
      <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground text-center">
        Selecione um objeto no canvas para editar suas propriedades.
      </div>
    </div>
  )
}
