import React from "react"
import { Palette } from "lucide-react"
import { StudioPlugin } from "@/lib/studio/plugins/BasePlugin"
import { useStudioStore } from "@/store/useStudioStore"

const solidColors = [
  "#ffffff", "#f1f5f9", "#e2e8f0", "#cbd5e1", 
  "#000000", "#0f172a", "#1e293b", "#334155",
  "#ef4444", "#f97316", "#eab308", "#22c55e", 
  "#3b82f6", "#a855f7", "#ec4899", "#f43f5e"
]

function BackgroundSidebar() {
  const setBackgroundColor = (color: string) => {
    const engine = useStudioStore.getState().engine;
    if (engine) {
      engine.setBackgroundColor(color);
      // O ideal aqui seria usar um Command para registrar no histórico, 
      // mas para simplificar esta fase, vamos alterar direto.
    }
  }

  return (
    <div className="w-64 border-r bg-background flex flex-col p-4 overflow-y-auto">
      <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">Fundo</h3>
      
      <div className="mb-6">
        <label className="text-xs font-semibold mb-2 block">Cores Sólidas</label>
        <div className="grid grid-cols-4 gap-2">
          {solidColors.map(color => (
            <button 
              key={color} 
              onClick={() => setBackgroundColor(color)}
              className="w-full aspect-square rounded-md border hover:scale-110 transition cursor-pointer"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>
      
      <div>
        <label className="text-xs font-semibold mb-2 block">Cenários de Estúdio (Em Breve)</label>
        <div className="p-4 border rounded-md border-dashed text-center text-xs text-muted-foreground">
          Fundos gerados por IA e texturas realistas entrarão aqui na Fase 3.
        </div>
      </div>
    </div>
  )
}

export const BackgroundPlugin: StudioPlugin = {
  id: "background",
  name: "Fundo",
  icon: Palette,
  SidebarComponent: BackgroundSidebar,
}
