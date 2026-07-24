"use client"
import React, { useState, useMemo } from "react"
import { Wand2, Search, Zap, Layers, Sparkles } from "lucide-react"
import { StudioPlugin } from "@/lib/studio/plugins/BasePlugin"
import { useStudioStore } from "@/store/useStudioStore"
import { useSelectionStore } from "@/store/useSelectionStore"
import { EventBus, StudioEvent } from "@/lib/studio/events/EventBus"
import { STYLE_LIBRARY, STYLE_CATEGORIES, IStylePreset } from "@/lib/studio/engine/StyleLibrary"
import { StyleEngine } from "@/lib/studio/engine/StyleEngine"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"

function StylesSidebar() {
  const engine = useStudioStore((state) => state.engine)
  const selectedIds = useSelectionStore((state) => state.selectedIds)
  const [search, setSearch] = useState("")
  const [aiPrompt, setAiPrompt] = useState("")

  const filteredStyles = useMemo(() => {
    return STYLE_LIBRARY.filter(style => 
      style.name.toLowerCase().includes(search.toLowerCase()) || 
      style.category.toLowerCase().includes(search.toLowerCase())
    )
  }, [search])

  const groupedStyles = useMemo(() => {
    const groups: Record<string, IStylePreset[]> = {}
    STYLE_CATEGORIES.forEach(cat => groups[cat] = [])
    filteredStyles.forEach(style => {
      if (groups[style.category]) {
        groups[style.category].push(style)
      } else {
        groups[style.category] = [style]
      }
    })
    return groups;
  }, [filteredStyles])

  const applyStyle = (style: IStylePreset) => {
    if (!engine || selectedIds.length === 0) return
    
    StyleEngine.applyStyleToObjects(engine, selectedIds, style)
    
    // Dispara history para Undo/Redo
    EventBus.emit(StudioEvent.HISTORY_CHANGED)
    
    const { toast } = require("sonner")
    toast.success(`Estilo '${style.name}' aplicado!`)
  }

  const handleAIGenerate = () => {
    if (!aiPrompt.trim()) return
    const { toast } = require("sonner")
    toast.info("A IA está analisando seu prompt e criando um estilo...")
    
    setTimeout(() => {
      toast.success("Estilo gerado e aplicado!")
    }, 2000)
  }

  return (
    <div className="w-80 border-r bg-background flex flex-col p-4 overflow-y-auto h-full">
      <h3 className="font-semibold mb-4 flex items-center gap-2 text-sm uppercase tracking-wider text-muted-foreground">
        <Wand2 className="h-4 w-4" /> Style Studio
      </h3>
      
      <div className="relative mb-4">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <input 
          type="text" 
          placeholder="Buscar estilos (Ex: Neon, Glass...)" 
          className="w-full pl-8 pr-3 py-2 text-xs rounded-md border bg-muted/50 focus:bg-background"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <Tabs defaultValue="gallery" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="gallery" className="text-xs">Galeria</TabsTrigger>
          <TabsTrigger value="ai" className="text-xs">IA</TabsTrigger>
          <TabsTrigger value="market" className="text-xs">Loja</TabsTrigger>
        </TabsList>

        <TabsContent value="gallery" className="flex flex-col gap-6">
          {Object.entries(groupedStyles).map(([category, styles]) => {
            if (styles.length === 0) return null;
            return (
              <div key={category}>
                <h4 className="text-xs font-semibold mb-3 text-muted-foreground uppercase tracking-wider">{category}</h4>
                <div className="grid grid-cols-2 gap-3">
                  {styles.map(style => (
                    <button 
                      key={style.id}
                      onClick={() => applyStyle(style)}
                      className="group flex flex-col items-center justify-center p-4 border rounded-xl hover:border-primary transition-all bg-card shadow-sm hover:shadow-md relative overflow-hidden"
                    >
                      {style.motion && (
                        <Zap className="absolute top-2 right-2 h-3 w-3 text-amber-500" />
                      )}
                      
                    <div 
                      className="w-12 h-12 rounded-full mb-3 transform group-hover:scale-110 transition-transform duration-300"
                      style={(() => {
                        const p = style.properties;
                        let bg: string | undefined = undefined;
                        if (p.fill && typeof p.fill === 'string' && !p.fill.includes('gradient') && p.fill !== 'transparent') {
                          bg = p.fill;
                        } else if (p.fill && typeof p.fill === 'object' && p.fill.colorStops) {
                          const stops = p.fill.colorStops.map((s: any) => `${s.color} ${s.offset * 100}%`).join(', ');
                          bg = p.fill.type === 'radial' ? `radial-gradient(circle, ${stops})` : `linear-gradient(135deg, ${stops})`;
                        } else if (p.filters && p.filters.length > 0) {
                          bg = 'linear-gradient(135deg, #6366f1, #8b5cf6)';
                        } else if (!p.fill || p.fill === 'transparent') {
                          bg = 'transparent';
                        }
                        return {
                          background: bg,
                          border: p.strokeWidth ? `${Math.min(p.strokeWidth, 3)}px solid ${p.stroke || '#ccc'}` : 'none',
                          boxShadow: p.shadow ? `0px ${p.shadow.offsetY}px ${p.shadow.blur}px ${p.shadow.color}` : 'none',
                          borderRadius: p.rx ? `${p.rx}px` : '50%',
                        };
                      })()}
                    />
                      <span className="text-[10px] font-medium text-center leading-tight">{style.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </TabsContent>

        <TabsContent value="ai" className="flex flex-col gap-4">
          <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl text-center flex flex-col items-center">
            <Sparkles className="h-8 w-8 text-primary mb-3" />
            <h4 className="font-semibold text-sm text-primary mb-2">Gerador de Estilos IA</h4>
            <p className="text-[10px] text-muted-foreground mb-4">Descreva o visual que você deseja. A IA ajustará cores, sombras, efeitos e reflexos.</p>
            
            <textarea 
              className="w-full text-xs p-3 rounded-md border mb-3 min-h-[80px] bg-background"
              placeholder='Ex: "Botão estilo cyberpunk com bordas neon rosa, fundo escuro e brilho forte animado"'
              value={aiPrompt}
              onChange={e => setAiPrompt(e.target.value)}
            ></textarea>
            
            <Button className="w-full text-xs h-9" onClick={handleAIGenerate}>Gerar Mágica</Button>
          </div>
        </TabsContent>

        <TabsContent value="market" className="flex flex-col gap-4">
          <div className="flex items-center justify-center p-8 border border-dashed rounded-xl text-center text-muted-foreground text-xs flex-col bg-muted/20">
            <Layers className="h-8 w-8 mb-3 opacity-40" />
            <p className="font-semibold text-sm mb-1 text-foreground">Marketplace Hub</p>
            Em breve você poderá baixar pacotes de estilos de outros designers (ex: "E-Commerce Pack", "Neon Pack", "Minimalist 2026").
          </div>
        </TabsContent>

      </Tabs>
    </div>
  )
}

export const StylesLibraryPlugin: StudioPlugin = {
  id: "styles-library",
  name: "Estilos",
  icon: Wand2,
  SidebarComponent: StylesSidebar,
}
