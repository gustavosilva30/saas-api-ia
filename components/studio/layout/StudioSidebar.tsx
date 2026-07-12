"use client"
import React from "react"
import { useStudioStore } from "@/store/useStudioStore"
import { PluginManager } from "@/lib/studio/plugins/PluginManager"
import { registerAllPlugins } from "@/lib/studio/plugins/pluginRegistry"
import { Button } from "@/components/ui/button"

export function StudioSidebar() {
  registerAllPlugins();
  const plugins = PluginManager.getAllPlugins();
  const activePlugin = useStudioStore((state) => state.activePlugin);
  const setActivePlugin = useStudioStore((state) => state.setActivePlugin);

  return (
    <div className="flex h-full">
      {/* Menu Ícones */}
      <div className="w-16 border-r bg-background flex flex-col items-center py-4 gap-4 shrink-0 z-10">
        {plugins.filter(p => p.SidebarComponent).map((tool) => (
          <Button 
            key={tool.id} 
            variant={activePlugin === tool.id ? "secondary" : "ghost"} 
            size="icon" 
            title={tool.name} 
            onClick={() => setActivePlugin(activePlugin === tool.id ? null : tool.id)}
            className="rounded-xl h-10 w-10"
          >
            <tool.icon className="h-5 w-5" />
          </Button>
        ))}
      </div>

      {/* Painel do Plugin Ativo */}
      {activePlugin && (
        <div className="h-full border-r bg-background">
          {plugins.find(p => p.id === activePlugin)?.SidebarComponent?.({})}
        </div>
      )}
    </div>
  )
}
