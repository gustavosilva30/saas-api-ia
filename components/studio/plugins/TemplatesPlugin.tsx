"use client"
import React from "react"
import { LayoutTemplate } from "lucide-react"
import { StudioPlugin } from "@/lib/studio/plugins/BasePlugin"
import { useStudioStore } from "@/store/useStudioStore"
import { EventBus, StudioEvent } from "@/lib/studio/events/EventBus"

const MOCK_TEMPLATES = [
  {
    id: 't-instagram',
    name: 'Post Instagram',
    width: 1080,
    height: 1080,
    preview: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=200&auto=format&fit=crop'
  },
  {
    id: 't-story',
    name: 'Story Animado',
    width: 1080,
    height: 1920,
    preview: 'https://images.unsplash.com/photo-1512428559087-560fa5ceab42?q=80&w=200&auto=format&fit=crop'
  },
  {
    id: 't-youtube',
    name: 'Thumbnail YouTube',
    width: 1280,
    height: 720,
    preview: 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?q=80&w=200&auto=format&fit=crop'
  }
]

function TemplatesSidebar() {
  const engine = useStudioStore(state => state.engine)

  const loadTemplate = async (template: any) => {
    if (!engine) return
    const confirm = window.confirm("Carregar um template irá substituir todo o seu documento atual. Deseja continuar?")
    if (!confirm) return

    engine.clear()
    engine.resize(template.width, template.height)
    engine.setBackgroundColor("#ffffff")
    
    // In a real app we'd load the JSON Document representation
    // Here we just set a basic template setup
    EventBus.emit(StudioEvent.HISTORY_CHANGED)
  }

  return (
    <div className="w-64 p-4 flex flex-col h-full overflow-y-auto gap-4">
      <h3 className="text-sm font-semibold flex items-center gap-2 mb-2">
        <LayoutTemplate className="h-4 w-4" />
        Templates
      </h3>
      <p className="text-xs text-muted-foreground">
        Comece com um formato predefinido.
      </p>
      
      <div className="grid grid-cols-1 gap-4 mt-2">
        {MOCK_TEMPLATES.map(template => (
          <button 
            key={template.id}
            onClick={() => loadTemplate(template)}
            className="group relative border rounded-lg overflow-hidden cursor-pointer transition-all hover:border-primary/50 text-left"
          >
            <div className="aspect-video w-full bg-muted">
              <img src={template.preview} alt={template.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="p-2 bg-card border-t">
              <span className="text-xs font-medium block">{template.name}</span>
              <span className="text-[10px] text-muted-foreground">{template.width} x {template.height}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

export const TemplatesPlugin: StudioPlugin = {
  id: "templates",
  name: "Templates",
  icon: LayoutTemplate,
  SidebarComponent: TemplatesSidebar,
}
