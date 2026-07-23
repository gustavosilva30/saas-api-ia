import React, { useState } from "react"
import { useStudioStore } from "@/store/useStudioStore"
import { PluginManager } from "@/lib/studio/plugins/PluginManager"
import { registerAllPlugins } from "@/lib/studio/plugins/pluginRegistry"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// Fallback manual para plugins que não têm category definida ainda
const CATEGORY_MAP: Record<string, string> = {
  'assets': 'Adicionar',
  'typography': 'Adicionar',
  'shapes': 'Adicionar',
  'selection': 'Ferramentas',
  'background': 'Estilo',
  'shadow': 'Estilo',
  'adjustments': 'Estilo',
  'layers': 'Workspace',
  'history': 'Workspace',
  'export': 'Arquivo',
  'motion-props': 'Transformar'
};

const CATEGORY_ORDER = ['Arquivo', 'Ferramentas', 'Adicionar', 'Transformar', 'Estilo', 'Workspace', 'Outros'];

export function StudioSidebar() {
  registerAllPlugins();
  const plugins = PluginManager.getAllPlugins();
  const activePlugin = useStudioStore((state) => state.activePlugin);
  const setActivePlugin = useStudioStore((state) => state.setActivePlugin);

  // Agrupar plugins
  const groupedPlugins = plugins.reduce((acc, plugin) => {
    if (!plugin.SidebarComponent) return acc;
    const cat = plugin.category || CATEGORY_MAP[plugin.id] || 'Outros';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(plugin);
    return acc;
  }, {} as Record<string, typeof plugins>);

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex h-full">
        {/* Menu Ícones (Nova Sidebar) */}
        <div className="w-[72px] border-r bg-background flex flex-col items-center py-4 gap-6 shrink-0 z-10 overflow-y-auto hide-scrollbar">
          
          {CATEGORY_ORDER.map(cat => {
            if (!groupedPlugins[cat] || groupedPlugins[cat].length === 0) return null;
            return (
              <div key={cat} className="flex flex-col items-center gap-2 w-full">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">{cat}</span>
                {groupedPlugins[cat].map((tool) => (
                  <Tooltip key={tool.id}>
                    <TooltipTrigger asChild>
                      <Button 
                        variant={activePlugin === tool.id ? "default" : "ghost"} 
                        size="icon" 
                        onClick={() => setActivePlugin(activePlugin === tool.id ? null : tool.id)}
                        className={`rounded-xl h-11 w-11 transition-all ${activePlugin === tool.id ? 'shadow-md bg-primary text-primary-foreground' : 'text-foreground/70 hover:bg-muted hover:text-foreground'}`}
                      >
                        <tool.icon className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="font-medium">
                      {tool.name}
                    </TooltipContent>
                  </Tooltip>
                ))}
                <div className="w-8 h-px bg-border/50 mt-2" />
              </div>
            );
          })}
        </div>

        {/* Painel do Plugin Ativo */}
        {activePlugin && (
          <div className="h-full border-r bg-background w-72 animate-in slide-in-from-left-2 duration-200">
            {(() => {
              const ActiveComponent = plugins.find(p => p.id === activePlugin)?.SidebarComponent;
              return ActiveComponent ? <ActiveComponent /> : null;
            })()}
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}
