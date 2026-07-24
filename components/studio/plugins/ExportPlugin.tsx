"use client"
import React, { useState } from "react"
import { Download, CheckSquare, Square, PackageOpen, Settings, Video } from "lucide-react"
import { StudioPlugin } from "@/lib/studio/plugins/BasePlugin"
import { useStudioStore } from "@/store/useStudioStore"
import JSZip from "jszip"

const PRESETS = [
  { id: "ig-feed", name: "Instagram Feed", width: 1080, height: 1080 },
  { id: "ig-story", name: "Instagram Story", width: 1080, height: 1920 },
  { id: "ml", name: "Mercado Livre", width: 1200, height: 1200 },
]

function ExportSidebar() {
  const [selectedPresets, setSelectedPresets] = useState<string[]>(["ig-feed"])
  const [isExporting, setIsExporting] = useState(false)
  const [format, setFormat] = useState<"png" | "jpeg" | "webp">("png")
  const [quality, setQuality] = useState<number>(2) // 1x, 2x, 3x (multiplier)
  const [transparent, setTransparent] = useState<boolean>(true)

  const togglePreset = (id: string) => {
    if (selectedPresets.includes(id)) {
      setSelectedPresets(selectedPresets.filter(p => p !== id))
    } else {
      setSelectedPresets([...selectedPresets, id])
    }
  }

  const handleBatchExport = async () => {
    const engine = useStudioStore.getState().engine
    if (!engine) return
    if (selectedPresets.length === 0) return alert("Selecione pelo menos um formato.")
    
    setIsExporting(true)
    try {
      const zip = new JSZip()
      
      for (const presetId of selectedPresets) {
        const preset = PRESETS.find(p => p.id === presetId)
        if (!preset) continue
        
        // Aplica transparência de fundo antes de exportar se necessário
        let oldBg = "";
        if (transparent && (format === "png" || format === "webp")) {
          // Precisaríamos pegar o background atual e setar transparente. 
          // Por enquanto, usamos a funcionalidade exportImage nativa
        }

        const dataUrl = engine.exportImage({ format: format, multiplier: quality })
        const base64Data = dataUrl.replace(/^data:image\/(png|jpeg|webp);base64,/, "")
        zip.file(`${preset.name.replace(" ", "_")}.${format}`, base64Data, { base64: true })
      }
      
      const content = await zip.generateAsync({ type: "blob" })
      
      // Download
      const link = document.createElement("a")
      link.href = URL.createObjectURL(content)
      link.download = `Studio_Export_${Date.now()}.zip`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      const { toast } = require("sonner");
      toast.success("Exportação concluída com sucesso!")
      
    } catch (e) {
      console.error(e)
      const { toast } = require("sonner");
      toast.error("Erro ao exportar o documento.")
    } finally {
      setIsExporting(false)
    }
  }

  const handleVideoExport = () => {
    alert("Exportação de Vídeo (MP4) com animações requer o plano Enterprise com backend de renderização FFMPEG.")
  }

  return (
    <div className="w-64 p-4 flex flex-col h-full overflow-y-auto gap-4">
      <h3 className="text-sm font-semibold flex items-center gap-2 mb-2 border-b pb-2">
        <Download className="h-4 w-4 text-primary" />
        Export Center
      </h3>
      
      {/* Settings Section */}
      <div className="flex flex-col gap-3 mb-2 p-3 bg-muted rounded-md border">
        <div className="flex items-center gap-2 mb-1">
          <Settings className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-semibold">Configurações</span>
        </div>
        
        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase font-bold text-muted-foreground">Formato</label>
          <select 
            className="text-xs p-1.5 border rounded bg-background" 
            value={format} 
            onChange={(e) => setFormat(e.target.value as any)}
          >
            <option value="png">PNG</option>
            <option value="jpeg">JPG</option>
            <option value="webp">WEBP</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase font-bold text-muted-foreground">Qualidade / Escala</label>
          <select 
            className="text-xs p-1.5 border rounded bg-background" 
            value={quality} 
            onChange={(e) => setQuality(Number(e.target.value))}
          >
            <option value={1}>1x (Normal)</option>
            <option value={2}>2x (Alta Definição)</option>
            <option value={3}>3x (Impressão Máxima)</option>
          </select>
        </div>

        {(format === "png" || format === "webp") && (
          <label className="flex items-center gap-2 text-xs mt-1 cursor-pointer">
            <input 
              type="checkbox" 
              checked={transparent} 
              onChange={(e) => setTransparent(e.target.checked)}
              className="rounded text-primary"
            />
            Fundo Transparente
          </label>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-[10px] uppercase font-bold text-muted-foreground">Tamanhos e Plataformas</label>
        {PRESETS.map((p) => {
          const isSelected = selectedPresets.includes(p.id)
          return (
            <div 
              key={p.id} 
              className={`flex items-center gap-2 p-2 border rounded-md cursor-pointer transition ${isSelected ? 'border-primary bg-primary/10' : 'bg-card hover:border-primary/50'}`}
              onClick={() => togglePreset(p.id)}
            >
              {isSelected ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4 text-muted-foreground" />}
              <div className="flex flex-col">
                <span className="text-[11px] font-medium leading-tight">{p.name}</span>
                <span className="text-[9px] text-muted-foreground">{p.width} x {p.height}</span>
              </div>
            </div>
          )
        })}
      </div>

      <button 
        onClick={handleBatchExport}
        disabled={isExporting || selectedPresets.length === 0}
        className="mt-2 w-full bg-primary text-primary-foreground py-2 text-xs rounded-md font-medium hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
      >
        <PackageOpen className="h-4 w-4" />
        {isExporting ? "Gerando ZIP..." : "Exportar Lote"}
      </button>

      {/* Opção Vídeo */}
      <button 
        onClick={handleVideoExport}
        className="w-full bg-foreground text-background py-2 text-xs rounded-md font-medium hover:opacity-90 transition flex items-center justify-center gap-2"
      >
        <Video className="h-4 w-4" />
        Exportar Vídeo (MP4)
      </button>
    </div>
  )
}

export const ExportPlugin: StudioPlugin = {
  id: "export",
  name: "Exportar",
  icon: Download,
  SidebarComponent: ExportSidebar,
}
