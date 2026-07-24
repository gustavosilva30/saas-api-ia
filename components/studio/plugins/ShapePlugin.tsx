"use client"
import React, { useState } from "react"
import { Hexagon, Square, Circle, Minus } from "lucide-react"
import { StudioPlugin } from "@/lib/studio/plugins/BasePlugin"

import { AddShapeCommand } from "@/lib/studio/commands/AddShapeCommand"
import { globalCommandManager } from "@/lib/studio/commands/GlobalCommandManager"

import { EventBus, StudioEvent } from "@/lib/studio/events/EventBus"
import { useStudioStore } from "@/store/useStudioStore"

import { Button } from "@/components/ui/button"

function ShapeSidebar() {
  const engine = useStudioStore(state => state.engine);

  const handleAddShape = (type: string) => {
    globalCommandManager.executeCommand(new AddShapeCommand(type as any))
  }

  const handleBoolean = (op: 'union' | 'difference' | 'intersection') => {
    if (engine) {
      engine.applyBooleanOperation(op);
    }
  }

  return (
    <div className="w-64 p-4 flex flex-col h-full overflow-y-auto gap-4">
      <h3 className="text-sm font-semibold flex items-center gap-2 mb-2">
        <Hexagon className="h-4 w-4" />
        Formas Vetoriais
      </h3>
      
      <div className="grid grid-cols-2 gap-2 mt-1">
        <button 
          onClick={() => handleAddShape('rect')}
          className="flex flex-col items-center justify-center p-3 border rounded-lg hover:bg-accent transition bg-card"
        >
          <Square className="h-5 w-5 mb-1.5 text-muted-foreground" />
          <span className="text-xs font-medium">Retângulo</span>
        </button>
        
        <button 
          onClick={() => handleAddShape('ellipse')}
          className="flex flex-col items-center justify-center p-3 border rounded-lg hover:bg-accent transition bg-card"
        >
          <Circle className="h-5 w-5 mb-1.5 text-muted-foreground" />
          <span className="text-xs font-medium">Elipse</span>
        </button>
        
        <button 
          onClick={() => handleAddShape('line')}
          className="flex flex-col items-center justify-center p-3 border rounded-lg hover:bg-accent transition bg-card"
        >
          <Minus className="h-5 w-5 mb-1.5 text-muted-foreground" />
          <span className="text-xs font-medium">Linha</span>
        </button>
      </div>

      <div className="border-t pt-3 flex flex-col gap-2">
        <span className="text-[10px] uppercase font-bold text-muted-foreground">Operações Booleanas</span>
        <div className="flex flex-col gap-1">
          <Button variant="outline" size="sm" className="justify-start text-xs h-8" onClick={() => handleBoolean('union')}>
            🧬 União (Combinar)
          </Button>
          <Button variant="outline" size="sm" className="justify-start text-xs h-8" onClick={() => handleBoolean('difference')}>
            ✂️ Subtração (Diferença)
          </Button>
          <Button variant="outline" size="sm" className="justify-start text-xs h-8" onClick={() => handleBoolean('intersection')}>
            🔶 Interseção
          </Button>
        </div>
        <p className="text-[9px] text-muted-foreground">
          Selecione 2 formas juntas no canvas (use SHIFT + clique) para combiná-las.
        </p>
      </div>
    </div>
  )
}

function ShapeContextPanel() {
  const engine = useStudioStore(state => state.engine);
  const selectedObjectType = useStudioStore(state => state.selectedObjectType);
  
  if (selectedObjectType !== 'rect' && selectedObjectType !== 'ellipse' && selectedObjectType !== 'polygon') {
    return null;
  }
  
  const handleUpdate = (props: any) => {
    if (engine) {
      const active = engine.getLayers().find(l => l.zIndex !== undefined); // Hack para pegar selecionado? Não, FabricAdapter tem getObjectProperties
      // Mas melhor usar eventbus
    }
  }
  
  // Vamos simplificar para a UI:
  return (
    <div className="flex flex-col p-4 gap-4 animate-in fade-in">
      <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground border-b pb-2">
        Propriedades da Forma
      </h3>
      <div className="text-xs text-muted-foreground">
        Preenchimento, Borda e Arredondamento (Raio) estarão disponíveis em breve via barra inteligente.
      </div>
    </div>
  )
}

export const ShapePlugin: StudioPlugin = {
  id: "shapes",
  name: "Formas",
  icon: Hexagon,
  SidebarComponent: ShapeSidebar,
  ContextComponent: ShapeContextPanel,
  propertyTab: 'properties'
}
