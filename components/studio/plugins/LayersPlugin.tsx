import React, { useEffect, useState } from "react"
import { Layers, ArrowUp, ArrowDown, Trash2 } from "lucide-react"
import { StudioPlugin } from "@/lib/studio/plugins/BasePlugin"
import { useStudioStore } from "@/store/useStudioStore"
import { EventBus, StudioEvent } from "@/lib/studio/events/EventBus"
import { MoveLayerCommand } from "@/lib/studio/commands/MoveLayerCommand"
import { DeleteObjectCommand } from "@/lib/studio/commands/DeleteObjectCommand"
import { globalCommandManager } from "@/lib/studio/commands/GlobalCommandManager"
import { Button } from "@/components/ui/button"

function LayersSidebar() {
  const engine = useStudioStore((state) => state.engine)
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

  const handleBringForward = (id: string) => {
    if (localCommandManager) {
      localCommandManager.executeCommand(new MoveLayerCommand(id, "forward"))
      updateLayers()
    }
  }

  const handleSendBackwards = (id: string) => {
    if (localCommandManager) {
      localCommandManager.executeCommand(new MoveLayerCommand(id, "backward"))
      updateLayers()
    }
  }

  const handleDelete = (id: string) => {
    if (localCommandManager) {
      localCommandManager.executeCommand(new DeleteObjectCommand(id))
      updateLayers()
    }
  }

  return (
    <div className="w-64 p-4 flex flex-col h-full overflow-y-auto">
      <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
        <Layers className="h-4 w-4" />
        Camadas
      </h3>
      
      {layers.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center mt-10">Nenhuma camada no palco.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {layers.map((layer) => (
            <div key={layer.id} className="flex items-center justify-between p-2 rounded-lg border bg-card">
              <span className="text-xs truncate max-w-[100px]" title={layer.id}>
                {layer.type === "image" ? "Imagem" : layer.type}
              </span>
              
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleBringForward(layer.id)} title="Trazer para Frente">
                  <ArrowUp className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleSendBackwards(layer.id)} title="Enviar para Trás">
                  <ArrowDown className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500 hover:text-red-400" onClick={() => handleDelete(layer.id)} title="Excluir Camada">
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export const LayersPlugin: StudioPlugin = {
  id: "layers",
  name: "Camadas",
  icon: Layers,
  SidebarComponent: LayersSidebar,
}
