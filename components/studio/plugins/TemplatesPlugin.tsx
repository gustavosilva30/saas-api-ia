"use client"
import React, { useEffect, useState } from "react"
import { LayoutTemplate, Loader2, Plus, Sparkles, Folder, Globe, Search } from "lucide-react"
import { StudioPlugin } from "@/lib/studio/plugins/BasePlugin"
import { useStudioStore } from "@/store/useStudioStore"
import { EventBus, StudioEvent } from "@/lib/studio/events/EventBus"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

function TemplatesSidebar() {
  const engine = useStudioStore(state => state.engine)
  const [templates, setTemplates] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Filtros e Criador
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("")
  const [newTemplateName, setNewTemplateName] = useState("")
  const [newTemplateCategory, setNewTemplateCategory] = useState("Varejo")
  const [newTemplateIndustry, setNewTemplateIndustry] = useState("Moda")
  const [isPublishing, setIsPublishing] = useState(false)

  const fetchTemplates = async () => {
    setIsLoading(true)
    try {
      const url = new URL("/api/templates", window.location.origin)
      if (category) url.searchParams.append("category", category)
      
      const res = await fetch(url.toString())
      if (res.ok) {
        const data = await res.json()
        setTemplates(data)
      }
    } catch (e) {
      console.error("Erro ao obter templates", e)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTemplates()
  }, [category])

  const loadTemplate = async (template: any) => {
    if (!engine) return
    const confirm = window.confirm("Carregar um template irá substituir todo o seu documento atual. Deseja continuar?")
    if (!confirm) return

    const { toast } = require("sonner")
    try {
      const state = typeof template.state === 'string' ? JSON.parse(template.state) : template.state
      engine.clear()
      await engine.loadDocument(state)
      engine.canvas?.setWidth(template.width)
      engine.canvas?.setHeight(template.height)
      engine.requestRender()
      
      EventBus.emit(StudioEvent.HISTORY_CHANGED)
      toast.success(`Template "${template.name}" carregado com sucesso!`)
    } catch (e) {
      toast.error("Erro ao carregar o template.")
    }
  }

  const handlePublishTemplate = async () => {
    if (!engine || !newTemplateName.trim()) return
    setIsPublishing(true)
    const { toast } = require("sonner")

    try {
      const canvasState = engine.exportDocument()
      const width = engine.canvas?.width || 1080
      const height = engine.canvas?.height || 1080

      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newTemplateName,
          category: newTemplateCategory,
          industry: newTemplateIndustry,
          width,
          height,
          state: canvasState,
          thumbnail: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?q=80&w=300&auto=format&fit=crop"
        })
      })

      if (res.ok) {
        toast.success("Template publicado no catálogo com sucesso!")
        setNewTemplateName("")
        fetchTemplates()
      } else {
        toast.error("Erro ao publicar template.")
      }
    } catch (e) {
      toast.error("Erro de conexão ao publicar template.")
    } finally {
      setIsPublishing(false)
    }
  }

  const filteredTemplates = templates.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) || 
    t.industry.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="w-80 border-r bg-background flex flex-col p-4 overflow-y-auto gap-4">
      {/* Seção 1: Filtros de Busca */}
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <LayoutTemplate className="h-4 w-4 text-primary" />
          Templates Catalog
        </h3>
        
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou setor..."
            className="pl-8 h-8 text-xs"
          />
        </div>

        <div className="flex gap-1.5 mt-1 overflow-x-auto pb-1">
          <Button size="xs" variant={category === "" ? "default" : "outline"} onClick={() => setCategory("")} className="text-[10px]">Tudo</Button>
          <Button size="xs" variant={category === "Varejo" ? "default" : "outline"} onClick={() => setCategory("Varejo")} className="text-[10px]">Varejo</Button>
          <Button size="xs" variant={category === "E-Commerce" ? "default" : "outline"} onClick={() => setCategory("E-Commerce")} className="text-[10px]">E-Commerce</Button>
          <Button size="xs" variant={category === "Moda" ? "default" : "outline"} onClick={() => setCategory("Moda")} className="text-[10px]">Moda</Button>
        </div>
      </div>

      {/* Seção 2: Lista Real de Templates */}
      <div className="flex-1 min-h-[200px]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span>Carregando templates...</span>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <p className="text-[10px] text-muted-foreground text-center py-4">Nenhum template disponível.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {filteredTemplates.map(template => (
              <button 
                key={template.id}
                onClick={() => loadTemplate(template)}
                className="group relative border rounded-lg overflow-hidden cursor-pointer transition-all hover:border-purple-500/50 text-left bg-card shadow-sm"
              >
                <div className="aspect-video w-full bg-muted">
                  <img src={template.thumbnail} alt={template.name} className="w-full h-full object-cover opacity-85 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="p-2 border-t">
                  <span className="text-xs font-semibold block truncate">{template.name}</span>
                  <div className="flex items-center justify-between text-[9px] text-muted-foreground mt-0.5">
                    <span>{template.width} x {template.height}</span>
                    <span className="bg-muted px-1.5 py-0.5 rounded text-[8px] uppercase font-bold text-purple-600">
                      {template.category}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Seção 3: Criar/Publicar Template */}
      <div className="border-t pt-3 flex flex-col gap-2 p-3 bg-purple-500/5 border border-purple-500/20 rounded-lg">
        <label className="text-[10px] uppercase font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1">
          <Sparkles className="h-3.5 w-3.5" /> Publicar como Template
        </label>
        <p className="text-[9px] text-muted-foreground leading-tight">
          Transforme seu layout atual em um template para reutilizar ou disponibilizar no catálogo.
        </p>

        <div className="flex flex-col gap-1.5 mt-1">
          <Input
            value={newTemplateName}
            onChange={(e) => setNewTemplateName(e.target.value)}
            placeholder="Nome do Template"
            className="h-8 text-xs"
          />
          <div className="grid grid-cols-2 gap-1.5">
            <select
              value={newTemplateCategory}
              onChange={(e) => setNewTemplateCategory(e.target.value)}
              className="text-[10px] p-1.5 border rounded bg-background"
            >
              <option value="Varejo">Varejo</option>
              <option value="E-Commerce">E-Commerce</option>
              <option value="Moda">Moda</option>
            </select>
            <select
              value={newTemplateIndustry}
              onChange={(e) => setNewTemplateIndustry(e.target.value)}
              className="text-[10px] p-1.5 border rounded bg-background"
            >
              <option value="Moda">Moda</option>
              <option value="Cosméticos">Cosméticos</option>
              <option value="Alimentação">Alimentação</option>
            </select>
          </div>
          <Button size="xs" onClick={handlePublishTemplate} disabled={isPublishing || !newTemplateName.trim()} className="w-full gap-1 h-8 mt-1">
            {isPublishing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            Publicar Template
          </Button>
        </div>
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
