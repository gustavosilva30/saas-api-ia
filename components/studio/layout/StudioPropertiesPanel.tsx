"use client"
import React from "react"
import { PluginManager } from "@/lib/studio/plugins/PluginManager"

export function StudioPropertiesPanel() {
  const plugins = PluginManager.getAllPlugins();
  const contextualPlugins = plugins.filter(p => p.ContextComponent);

  return (
    <div className="w-64 border-l bg-background flex flex-col shrink-0 z-10">
      {contextualPlugins.length > 0 ? (
        contextualPlugins.map(p => (
          <div key={p.id}>
            {p.ContextComponent && <p.ContextComponent />}
          </div>
        ))
      ) : (
        <div className="flex-1 flex flex-col p-4 text-center justify-center text-sm text-muted-foreground">
          Selecione um objeto para editar propriedades.
        </div>
      )}
    </div>
  )
}
