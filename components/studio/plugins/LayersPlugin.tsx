"use client"
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

  const [selectedAdjustmentLayer, setSelectedAdjustmentLayer] = useState<any | null>(null);

  const handleAddAdjustmentLayer = (type: 'brightness' | 'contrast' | 'saturation' | 'hue') => {
    if (!engine) return;
    const defaultVals = { brightness: 0.1, contrast: 0.1, saturation: 0.2, hue: 30 };
    const id = engine.addAdjustmentLayer(type, defaultVals[type]);
    updateLayers();
  }

  const handleAdjustmentChange = (value: number) => {
    if (!engine || !selectedAdjustmentLayer) return;
    engine.updateAdjustmentLayer(selectedAdjustmentLayer.id, value);
    setSelectedAdjustmentLayer({
      ...selectedAdjustmentLayer,
      adjustmentValue: value
    });
    updateLayers();
  }

  // Detecta se a camada selecionada atual é uma Adjustment Layer
  useEffect(() => {
    if (selectedIds.length === 1) {
      const activeLayer = layers.find(l => l.id === selectedIds[0]);
      if (activeLayer && activeLayer.isAdjustmentLayer) {
        setSelectedAdjustmentLayer(activeLayer);
      } else {
        setSelectedAdjustmentLayer(null);
      }
    } else {
      setSelectedAdjustmentLayer(null);
    }
  }, [selectedIds, layers]);

  return (
    <div className="w-72 flex flex-col h-full bg-background border-r">
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4" />
          <h3 className="text-sm font-semibold">Camadas</h3>
        </div>
      </div>
      
      {/* Botões para criar Camadas de Ajuste */}
      <div className="p-2 border-b bg-muted/30 flex flex-col gap-1.5">
        <span className="text-[10px] uppercase font-bold text-muted-foreground px-1">Criar Camada de Ajuste</span>
        <div className="grid grid-cols-2 gap-1">
          <Button variant="outline" size="xs" className="text-[10px] h-6" onClick={() => handleAddAdjustmentLayer("brightness")}>+ Brilho</Button>
          <Button variant="outline" size="xs" className="text-[10px] h-6" onClick={() => handleAddAdjustmentLayer("contrast")}>+ Contraste</Button>
          <Button variant="outline" size="xs" className="text-[10px] h-6" onClick={() => handleAddAdjustmentLayer("saturation")}>+ Saturação</Button>
          <Button variant="outline" size="xs" className="text-[10px] h-6" onClick={() => handleAddAdjustmentLayer("hue")}>+ Matiz</Button>
        </div>
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
                    "flex items-center justify-between p-2 rounded-md cursor-pointer group transition-colors text-xs",
                    isSelected ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted"
                  )}
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    {layer.isAdjustmentLayer ? (
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
                    ) : (
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                    )}
                    <span className="truncate max-w-[140px]" title={layer.id}>
                      {layer.type}
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

      {/* Painel do Slider de Ajuste da Camada selecionada */}
      {selectedAdjustmentLayer && (
        <div className="p-4 border-t bg-muted/20 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-purple-600 uppercase">Ajuste da Camada</span>
            <span className="text-[10px] font-mono text-muted-foreground">
              {selectedAdjustmentLayer.adjustmentValue}
            </span>
          </div>
          
          <input
            type="range"
            min={selectedAdjustmentLayer.adjustmentType === "hue" ? -180 : -1}
            max={selectedAdjustmentLayer.adjustmentType === "hue" ? 180 : 1}
            step={0.05}
            value={selectedAdjustmentLayer.adjustmentValue}
            onChange={(e) => handleAdjustmentChange(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-purple-500"
          />
          <p className="text-[10px] text-muted-foreground leading-tight">
            Este efeito afeta dinamicamente todos os elementos de imagem posicionados abaixo desta camada.
          </p>
        </div>
      )}
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
