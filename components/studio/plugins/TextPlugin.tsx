"use client"
import React, { useState } from "react"
import { Type, Bold, Italic, AlignLeft, AlignCenter, AlignRight } from "lucide-react"
import { StudioPlugin } from "@/lib/studio/plugins/BasePlugin"
import { useStudioStore } from "@/store/useStudioStore"

function TextSidebar() {
  const [text, setText] = useState("Novo Texto")
  const [fontSize, setFontSize] = useState(40)
  const [fill, setFill] = useState("#ffffff")

  const handleAddText = () => {
    // In a real implementation we would send an AddTextCommand
    // For now we simulate an alert or standard operation
    alert("Adicionando texto: " + text)
  }

  return (
    <div className="w-64 p-4 flex flex-col h-full overflow-y-auto gap-4">
      <h3 className="text-sm font-semibold flex items-center gap-2 mb-2">
        <Type className="h-4 w-4" />
        Tipografia
      </h3>
      
      <div className="flex flex-col gap-2">
        <label className="text-xs text-muted-foreground">Texto</label>
        <input 
          type="text" 
          value={text} 
          onChange={(e) => setText(e.target.value)}
          className="w-full px-3 py-2 text-sm bg-background border rounded-md"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs text-muted-foreground">Tamanho</label>
        <input 
          type="number" 
          value={fontSize} 
          onChange={(e) => setFontSize(Number(e.target.value))}
          className="w-full px-3 py-2 text-sm bg-background border rounded-md"
        />
      </div>
      
      <div className="flex flex-col gap-2">
        <label className="text-xs text-muted-foreground">Cor</label>
        <input 
          type="color" 
          value={fill} 
          onChange={(e) => setFill(e.target.value)}
          className="w-full h-8 cursor-pointer rounded-md border-0 p-0"
        />
      </div>

      <button 
        onClick={handleAddText}
        className="mt-4 w-full bg-primary text-primary-foreground py-2 text-sm rounded-md hover:opacity-90 transition"
      >
        Adicionar Texto
      </button>
    </div>
  )
}

export const TextPlugin: StudioPlugin = {
  id: "text",
  name: "Texto",
  icon: Type,
  SidebarComponent: TextSidebar,
}
