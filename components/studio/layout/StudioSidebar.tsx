import React from "react"
import { Layers, Image as ImageIcon, Type, Sparkles, BoxSelect } from "lucide-react"
import { Button } from "@/components/ui/button"

const tools = [
  { id: "layers", icon: Layers, label: "Camadas" },
  { id: "assets", icon: ImageIcon, label: "Assets" },
  { id: "text", icon: Type, label: "Texto" },
  { id: "ai", icon: Sparkles, label: "AI Magic" },
  { id: "shapes", icon: BoxSelect, label: "Formas" },
]

export function StudioSidebar() {
  return (
    <div className="w-16 border-r bg-background flex flex-col items-center py-4 gap-4 shrink-0 z-10">
      {tools.map((tool) => (
        <Button key={tool.id} variant="ghost" size="icon" title={tool.label} className="rounded-xl h-10 w-10">
          <tool.icon className="h-5 w-5" />
        </Button>
      ))}
    </div>
  )
}
