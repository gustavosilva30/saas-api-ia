"use client"
import React from "react"
import { Blocks, ShoppingCart, Tag, Zap } from "lucide-react"
import { StudioPlugin } from "@/lib/studio/plugins/BasePlugin"

function ComponentsSidebar() {
  const handleAddComponent = (type: string) => {
    // Para v1, apenas logamos, no futuro envia um JSON para o engine
    console.log("Adding component:", type);
    alert("Componente " + type + " adicionado ao centro da tela!");
  }

  return (
    <div className="w-64 p-4 flex flex-col h-full overflow-y-auto gap-4">
      <h3 className="text-sm font-semibold flex items-center gap-2 mb-2">
        <Blocks className="h-4 w-4" />
        Componentes (Prontos)
      </h3>
      
      <div className="grid grid-cols-2 gap-2 mt-2">
        <button 
          onClick={() => handleAddComponent('btn-comprar')}
          className="flex flex-col items-center justify-center p-4 border rounded-lg hover:bg-accent transition bg-card"
        >
          <ShoppingCart className="h-6 w-6 mb-2 text-green-500" />
          <span className="text-xs font-medium text-center">Botão<br/>Comprar</span>
        </button>
        
        <button 
          onClick={() => handleAddComponent('tag-desconto')}
          className="flex flex-col items-center justify-center p-4 border rounded-lg hover:bg-accent transition bg-card"
        >
          <Tag className="h-6 w-6 mb-2 text-red-500" />
          <span className="text-xs font-medium text-center">Selo de<br/>Desconto</span>
        </button>
        
        <button 
          onClick={() => handleAddComponent('selo-pix')}
          className="flex flex-col items-center justify-center p-4 border rounded-lg hover:bg-accent transition bg-card"
        >
          <Zap className="h-6 w-6 mb-2 text-cyan-500" />
          <span className="text-xs font-medium text-center">Tag PIX</span>
        </button>
      </div>
    </div>
  )
}

export const ComponentsLibraryPlugin: StudioPlugin = {
  id: "components",
  name: "Prontos",
  icon: Blocks,
  SidebarComponent: ComponentsSidebar,
}
