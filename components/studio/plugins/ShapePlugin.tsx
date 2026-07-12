"use client"
import React, { useState } from "react"
import { Hexagon, Square, Circle, Minus } from "lucide-react"
import { StudioPlugin } from "@/lib/studio/plugins/BasePlugin"

function ShapeSidebar() {
  const handleAddShape = (type: string) => {
    alert("Adicionando forma: " + type)
  }

  return (
    <div className="w-64 p-4 flex flex-col h-full overflow-y-auto gap-4">
      <h3 className="text-sm font-semibold flex items-center gap-2 mb-2">
        <Hexagon className="h-4 w-4" />
        Formas Vetoriais
      </h3>
      
      <div className="grid grid-cols-2 gap-2 mt-2">
        <button 
          onClick={() => handleAddShape('rect')}
          className="flex flex-col items-center justify-center p-4 border rounded-lg hover:bg-accent transition bg-card"
        >
          <Square className="h-6 w-6 mb-2 text-muted-foreground" />
          <span className="text-xs font-medium">Retângulo</span>
        </button>
        
        <button 
          onClick={() => handleAddShape('ellipse')}
          className="flex flex-col items-center justify-center p-4 border rounded-lg hover:bg-accent transition bg-card"
        >
          <Circle className="h-6 w-6 mb-2 text-muted-foreground" />
          <span className="text-xs font-medium">Elipse</span>
        </button>
        
        <button 
          onClick={() => handleAddShape('line')}
          className="flex flex-col items-center justify-center p-4 border rounded-lg hover:bg-accent transition bg-card"
        >
          <Minus className="h-6 w-6 mb-2 text-muted-foreground" />
          <span className="text-xs font-medium">Linha</span>
        </button>
      </div>
    </div>
  )
}

export const ShapePlugin: StudioPlugin = {
  id: "shapes",
  name: "Formas",
  icon: Hexagon,
  SidebarComponent: ShapeSidebar,
}
