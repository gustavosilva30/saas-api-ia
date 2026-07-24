"use client"
import React from "react"
import { PluginManager } from "@/lib/studio/plugins/PluginManager"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ObjectInspector } from "@/components/studio/inspector/ObjectInspector"
import { useWorkspaceStore } from "@/store/useWorkspaceStore"

export function StudioPropertiesPanel() {
  const plugins = PluginManager.getAllPlugins();
  const contextualPlugins = plugins.filter(p => p.ContextComponent);
  const { rightPanelOpen, activeTabRight, setActiveTabRight } = useWorkspaceStore();

  if (!rightPanelOpen) return null;

  return (
    <div className="w-80 border-l bg-background flex flex-col shrink-0 z-10">
      {contextualPlugins.length > 0 ? (
        <Tabs value={activeTabRight} onValueChange={setActiveTabRight} className="flex flex-col h-full w-full">
          <div className="px-4 pt-3 pb-2 border-b">
            <TabsList className="w-full grid grid-cols-5 h-9">
              <TabsTrigger value="properties" className="text-xs">Prop</TabsTrigger>
              <TabsTrigger value="appearance" className="text-xs">Estilo</TabsTrigger>
              <TabsTrigger value="motion" className="text-xs">Anim</TabsTrigger>
              <TabsTrigger value="ia" className="text-xs">IA</TabsTrigger>
              <TabsTrigger value="metadata" className="text-xs">Meta</TabsTrigger>
            </TabsList>
          </div>
          
          <ScrollArea className="flex-1 p-4">
            <TabsContent value="properties" className="m-0 space-y-4 outline-none">
              {contextualPlugins.filter(p => !p.propertyTab || p.propertyTab === 'properties').map(p => (
                <div key={p.id}>
                  {p.ContextComponent && <p.ContextComponent />}
                </div>
              ))}
            </TabsContent>
            
            <TabsContent value="appearance" className="m-0 space-y-4 outline-none">
              {contextualPlugins.filter(p => p.propertyTab === 'appearance').map(p => (
                <div key={p.id}>
                  {p.ContextComponent && <p.ContextComponent />}
                </div>
              ))}
              {contextualPlugins.filter(p => p.propertyTab === 'appearance').length === 0 && (
                <div className="text-sm text-muted-foreground text-center py-4">Sem estilos para o objeto selecionado.</div>
              )}
            </TabsContent>
            
            <TabsContent value="motion" className="m-0 space-y-4 outline-none">
              {contextualPlugins.filter(p => p.propertyTab === 'motion').map(p => (
                <div key={p.id}>
                  {p.ContextComponent && <p.ContextComponent />}
                </div>
              ))}
              {contextualPlugins.filter(p => p.propertyTab === 'motion').length === 0 && (
                <div className="text-sm text-muted-foreground text-center py-4">Sem animações para o objeto selecionado.</div>
              )}
            </TabsContent>
            
            <TabsContent value="ia" className="m-0 space-y-4 outline-none">
              {contextualPlugins.filter(p => p.propertyTab === 'ia').map(p => (
                <div key={p.id}>
                  {p.ContextComponent && <p.ContextComponent />}
                </div>
              ))}
              {contextualPlugins.filter(p => p.propertyTab === 'ia').length === 0 && (
                <div className="text-sm text-muted-foreground text-center py-4">Sem ações inteligentes disponíveis.</div>
              )}
            </TabsContent>
            <TabsContent value="metadata" className="m-0 outline-none">
              <ObjectInspector />
            </TabsContent>
          </ScrollArea>
        </Tabs>
      ) : (
        <div className="flex-1 flex flex-col p-4 text-center justify-center text-sm text-muted-foreground">
          Selecione um objeto para editar propriedades.
        </div>
      )}
    </div>
  )
}
