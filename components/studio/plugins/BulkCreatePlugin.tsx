"use client"
import React, { useState, useEffect } from "react"
import { Database, UploadCloud, FileText, Sparkles, Check, Play, AlertCircle, Loader2 } from "lucide-react"
import { StudioPlugin } from "@/lib/studio/plugins/BasePlugin"
import { useStudioStore } from "@/store/useStudioStore"
import { useSelectionStore } from "@/store/useSelectionStore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import JSZip from "jszip"

interface Mapping {
  column: string
  objectId: string
  objectType: string
}

function BulkCreateSidebar() {
  const engine = useStudioStore((state) => state.engine)
  const { selectedIds } = useSelectionStore()
  
  const [csvData, setCsvData] = useState<any[] | null>(null)
  const [columns, setColumns] = useState<string[]>([])
  const [mappings, setMappings] = useState<Mapping[]>([])
  const [selectedColumn, setSelectedColumn] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0 })

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      if (!text) return

      const lines = text.split("\n").map(l => l.trim()).filter(Boolean)
      if (lines.length === 0) return

      const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""))
      const rows = lines.slice(1).map(line => {
        const values = line.split(",").map(v => v.trim().replace(/^"|"$/g, ""))
        const rowObj: any = {}
        headers.forEach((header, index) => {
          rowObj[header] = values[index] || ""
        })
        return rowObj
      })

      setColumns(headers)
      setCsvData(rows)
      setMappings([])
      
      const { toast } = require("sonner")
      toast.success(`Planilha carregada! ${rows.length} registros prontos para geração.`)
    }
    reader.readAsText(file)
  }

  const addMapping = () => {
    if (selectedIds.length !== 1 || !selectedColumn) {
      const { toast } = require("sonner")
      return toast.error("Selecione um único elemento no canvas e uma coluna da planilha.")
    }

    const objectId = selectedIds[0]
    const layers = engine?.getLayers() || []
    const layer = layers.find(l => l.id === objectId)
    if (!layer) return

    // Evita duplicados para o mesmo objeto
    if (mappings.some(m => m.objectId === objectId)) {
      const { toast } = require("sonner")
      return toast.error("Este elemento já possui um mapeamento de coluna.")
    }

    const newMapping: Mapping = {
      column: selectedColumn,
      objectId,
      objectType: layer.type
    }

    setMappings([...mappings, newMapping])
    setSelectedColumn("")
  }

  const removeMapping = (objectId: string) => {
    setMappings(mappings.filter(m => m.objectId !== objectId))
  }

  const handleGenerateBulk = async () => {
    if (!engine || !csvData || mappings.length === 0) return
    
    setIsProcessing(true)
    setProgress({ current: 0, total: csvData.length })

    const { toast } = require("sonner")
    const zip = new JSZip()

    try {
      // Salva o estado base do design
      const templateDoc = engine.exportDocument()

      for (let i = 0; i < csvData.length; i++) {
        const row = csvData[i]
        setProgress({ current: i + 1, total: csvData.length })

        // Aplica as substituições de campos mapeados no Canvas
        mappings.forEach(mapping => {
          const value = row[mapping.column]
          if (value !== undefined) {
            if (mapping.objectType === "image") {
              engine.updateObjectProperties(mapping.objectId, { src: value })
            } else {
              // Textos e formas
              engine.updateObjectProperties(mapping.objectId, { text: value, fill: value.startsWith("#") ? value : undefined })
            }
          }
        })

        engine.requestRender()
        // Aguarda renderização dos frames
        await new Promise(r => setTimeout(r, 120))

        const dataUrl = engine.exportImage({ format: "png", multiplier: 1.5 })
        const base64Data = dataUrl.replace(/^data:image\/png;base64,/, "")
        zip.file(`Bulk_Design_${i + 1}.png`, base64Data, { base64: true })

        // Restaura para a próxima iteração
        await engine.loadDocument(templateDoc)
      }

      // Conclui e baixa o ZIP
      const content = await zip.generateAsync({ type: "blob" })
      const link = document.createElement("a")
      link.href = URL.createObjectURL(content)
      link.download = `Bulk_Designs_${Date.now()}.zip`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast.success("Produção em lote concluída com sucesso!")
      setCsvData(null)
      setMappings([])
    } catch (err) {
      console.error(err)
      toast.error("Erro durante a produção em lote.")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="w-80 border-r bg-background flex flex-col p-4 overflow-y-auto gap-4">
      <div className="border-b pb-2">
        <h3 className="text-sm font-semibold flex items-center gap-2 uppercase tracking-wider text-muted-foreground">
          <Database className="h-4 w-4 text-primary" />
          Bulk Create
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Crie variações de design em massa a partir de arquivos de planilha (CSV).
        </p>
      </div>

      {!csvData ? (
        <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-border rounded-lg bg-card hover:bg-muted/30 transition cursor-pointer relative">
          <UploadCloud className="h-10 w-10 text-muted-foreground mb-2" />
          <span className="text-xs font-semibold text-center">Fazer upload de planilha CSV</span>
          <span className="text-[10px] text-muted-foreground mt-1">Colunas separadas por vírgula</span>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
        </div>
      ) : (
        <div className="flex flex-col gap-4 animate-in fade-in">
          {/* Info planilha carregada */}
          <div className="flex items-center gap-2 p-2 bg-green-500/5 border border-green-500/20 rounded-md">
            <FileText className="h-5 w-5 text-green-500" />
            <div className="flex-1 flex flex-col min-w-0">
              <span className="text-xs font-semibold text-green-600 dark:text-green-400">Planilha Carregada</span>
              <span className="text-[10px] text-muted-foreground">{csvData.length} linhas de dados</span>
            </div>
            <Button size="xs" variant="ghost" className="text-red-500 hover:text-red-600" onClick={() => setCsvData(null)}>
              Limpar
            </Button>
          </div>

          {/* Seção de Mapeamento de Variáveis */}
          <div className="flex flex-col gap-2 border-t pt-3">
            <label className="text-[10px] uppercase font-bold text-muted-foreground">Mapeamento de Colunas</label>
            <p className="text-[10px] text-muted-foreground leading-tight mb-1">
              Selecione o objeto no Canvas, escolha a coluna abaixo e clique em Mapear.
            </p>

            <div className="flex gap-2">
              <select
                value={selectedColumn}
                onChange={(e) => setSelectedColumn(e.target.value)}
                className="text-xs p-1.5 border rounded bg-background flex-1"
              >
                <option value="">Selecione a coluna...</option>
                {columns.map((c, i) => (
                  <option key={i} value={c}>{c}</option>
                ))}
              </select>
              <Button size="xs" onClick={addMapping} className="h-8">
                Mapear
              </Button>
            </div>

            {/* Lista de Mapeamentos */}
            <div className="flex flex-col gap-1.5 mt-2 bg-muted/30 p-2 rounded-lg min-h-[40px]">
              {mappings.length === 0 ? (
                <div className="text-[10px] text-muted-foreground text-center py-2">
                  Nenhum campo mapeado.
                </div>
              ) : (
                mappings.map((mapping, i) => (
                  <div key={i} className="flex items-center justify-between text-xs p-1.5 border rounded bg-card">
                    <div className="flex flex-col min-w-0">
                      <span className="font-semibold truncate text-[11px] text-purple-600">
                        {mapping.column}
                      </span>
                      <span className="text-[9px] text-muted-foreground truncate">
                        ID: {mapping.objectId.slice(0, 8)}... ({mapping.objectType})
                      </span>
                    </div>
                    <Button size="icon" variant="ghost" className="h-6 w-6 text-red-500" onClick={() => removeMapping(mapping.objectId)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Botão de Disparo */}
          <div className="border-t pt-3 flex flex-col gap-2">
            {isProcessing ? (
              <div className="flex flex-col gap-1.5 p-3 border border-purple-500/20 bg-purple-500/5 rounded-lg animate-in slide-in-from-bottom-2">
                <div className="flex items-center justify-between text-[11px] font-semibold text-purple-600">
                  <span className="flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Gerando designs em massa...
                  </span>
                  <span>{progress.current}/{progress.total}</span>
                </div>
                <div className="w-full bg-muted h-1 rounded-full overflow-hidden">
                  <div 
                    className="bg-purple-600 h-full transition-all duration-150" 
                    style={{ width: `${(progress.current / progress.total) * 100}%` }}
                  />
                </div>
              </div>
            ) : (
              <Button 
                onClick={handleGenerateBulk}
                disabled={mappings.length === 0}
                className="w-full bg-primary text-primary-foreground gap-2 h-9 text-xs font-semibold"
              >
                <Play className="h-4 w-4" />
                Gerar Designs em Lote (ZIP)
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export const BulkCreatePlugin: StudioPlugin = {
  id: "bulkcreate",
  name: "Em Lote",
  icon: Database,
  SidebarComponent: BulkCreateSidebar,
}
