import React, { useEffect, useState } from "react"
import { Layers, ArrowUp, ArrowDown, Trash2, Eye, EyeOff, Lock, Unlock } from "lucide-react"
import { StudioPlugin } from "@/lib/studio/sdk/PluginSDK"
import { useStudioStore } from "@/store/useStudioStore"
import { useSelectionStore } from "@/store/useSelectionStore"
import { EventBus, StudioEvent } from "@/lib/studio/events/EventBus"
import { MoveLayerCommand } from "@/lib/studio/commands/MoveLayerCommand"
import { DeleteObjectCommand } from "@/lib/studio/commands/DeleteObjectCommand"
import { globalCommandManager } from "@/lib/studio/commands/GlobalCommandManager"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

function LayersSidebar() {
  const engine = useStudioStore((state) => state.engine)
  const { selectedIds, setSelectedIds } = useSelectionStore()
  const localCommandManager = globalCommandManager;
  const [layers, setLayers] = useState<any[]>([])

  const updateLayers = () => {
    if (engine) {
      setLayers(engine.getLayers())
    }
  }

  useEffect(() => {
    updateLayers()

    EventBus.on(StudioEvent.OBJECT_ADDED, updateLayers)
    EventBus.on(StudioEvent.OBJECT_REMOVED, updateLayers)
    EventBus.on(StudioEvent.OBJECT_MODIFIED, updateLayers)

    return () => {
      EventBus.off(StudioEvent.OBJECT_ADDED, updateLayers)
      EventBus.off(StudioEvent.OBJECT_REMOVED, updateLayers)
      EventBus.off(StudioEvent.OBJECT_MODIFIED, updateLayers)
    }
  }, [engine])

  const handleBringForward = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (localCommandManager) {
      localCommandManager.executeCommand(new MoveLayerCommand(id, "forward"))
      updateLayers()
    }
  }

  const handleSendBackwards = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (localCommandManager) {
      localCommandManager.executeCommand(new MoveLayerCommand(id, "backward"))
      updateLayers()
    }
  }

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (localCommandManager) {
      localCommandManager.executeCommand(new DeleteObjectCommand(id))
      updateLayers()
    }
  }

  const toggleVisibility = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    // TODO: Dispatch command or engine update to hide/show layer
  }

  const toggleLock = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    // TODO: Dispatch command or engine update to lock/unlock layer
  }

  return (
    <div className="w-72 flex flex-col h-full bg-background border-r">
      <div className="p-4 border-b flex items-center gap-2">
        <Layers className="h-4 w-4" />
        <h3 className="text-sm font-semibold">Camadas</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2">
        {layers.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center mt-10">Nenhuma camada no palco.</p>
        ) : (
          <div className="flex flex-col gap-1">
            {layers.map((layer) => {
              const isSelected = selectedIds.includes(layer.id);
              return (
                <div 
                  key={layer.id} 
                  onClick={() => setSelectedIds([layer.id])}
                  className={cn(
                    "flex items-center justify-between p-2 rounded-md cursor-pointer group transition-colors text-sm",
                    isSelected ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted"
                  )}
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    {/* Aqui entraria a Color Label se existisse no Document Model */}
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                    <span className="truncate max-w-[100px]" title={layer.id}>
                      {layer.type === "image" ? "Imagem" : layer.type}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => toggleVisibility(e, layer.id)} title="Ocultar">
                      <Eye className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => toggleLock(e, layer.id)} title="Bloquear">
                      <Unlock className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => handleBringForward(e, layer.id)} title="Trazer para Frente">
                      <ArrowUp className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => handleSendBackwards(e, layer.id)} title="Enviar para Trás">
                      <ArrowDown className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500 hover:text-red-400" onClick={(e) => handleDelete(e, layer.id)} title="Excluir Camada">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export const LayersPlugin: StudioPlugin = {
  id: "layers",
  name: "Camadas",
  icon: Layers,
  category: "Workspace",
  capabilities: {},
  SidebarComponent: LayersSidebar,
}
