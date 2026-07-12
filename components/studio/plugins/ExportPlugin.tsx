"use client"
import React, { useState } from "react"
import { Download, CheckSquare, Square, PackageOpen } from "lucide-react"
import { StudioPlugin } from "@/lib/studio/plugins/BasePlugin"
import { useStudioStore } from "@/store/useStudioStore"
import JSZip from "jszip"
import { saveAs } from "file-saver" // Ou usar document.createElement('a') nativo

const PRESETS = [
  { id: "ig-feed", name: "Instagram Feed", width: 1080, height: 1080 },
  { id: "ig-story", name: "Instagram Story", width: 1080, height: 1920 },
  { id: "ml", name: "Mercado Livre", width: 1200, height: 1200 },
]

function ExportSidebar() {
  const [selectedPresets, setSelectedPresets] = useState<string[]>(["ig-feed"])
  const [isExporting, setIsExporting] = useState(false)

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
        
        // Em um cenário real, você redimensionaria o canvas e recentralizaria os objetos para o aspecto correto.
        // Como o FabricAdapter atual não tem função de redimensionamento instantâneo com recomposição,
        // geramos a imagem atual. (Futuro: resize canvas -> render -> toDataURL -> restore canvas)
        const dataUrl = engine.exportImage({ format: "png", multiplier: 2 })
        const base64Data = dataUrl.replace(/^data:image\/png;base64,/, "")
        zip.file(`${preset.name.replace(" ", "_")}.png`, base64Data, { base64: true })
      }
      
      const content = await zip.generateAsync({ type: "blob" })
      
      // Download
      const link = document.createElement("a")
      link.href = URL.createObjectURL(content)
      link.download = `Studio_Export_${Date.now()}.zip`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
    } catch (e) {
      console.error(e)
      alert("Erro ao exportar.")
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="w-64 p-4 flex flex-col h-full overflow-y-auto gap-4">
      <h3 className="text-sm font-semibold flex items-center gap-2 mb-2">
        <Download className="h-4 w-4" />
        Exportação Lote
      </h3>
      
      <p className="text-xs text-muted-foreground mb-2">
        Selecione os formatos desejados. Um arquivo .zip será gerado com as imagens cortadas.
      </p>

      <div className="flex flex-col gap-2">
        {PRESETS.map((p) => {
          const isSelected = selectedPresets.includes(p.id)
          return (
            <div 
              key={p.id} 
              className={`flex items-center gap-2 p-3 border rounded-md cursor-pointer transition ${isSelected ? 'border-primary bg-primary/10' : 'bg-card'}`}
              onClick={() => togglePreset(p.id)}
            >
              {isSelected ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4 text-muted-foreground" />}
              <div className="flex flex-col">
                <span className="text-sm font-medium">{p.name}</span>
                <span className="text-[10px] text-muted-foreground">{p.width} x {p.height}</span>
              </div>
            </div>
          )
        })}
      </div>

      <button 
        onClick={handleBatchExport}
        disabled={isExporting || selectedPresets.length === 0}
        className="mt-4 w-full bg-primary text-primary-foreground py-3 text-sm rounded-md font-medium hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
      >
        <PackageOpen className="h-4 w-4" />
        {isExporting ? "Gerando ZIP..." : "Exportar ZIP"}
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
