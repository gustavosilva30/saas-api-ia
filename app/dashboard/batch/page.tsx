"use client"

import { useState } from "react"
import { Upload, ImageIcon, Download, RefreshCw, Trash2, CheckCircle2, AlertCircle, Eye, SlidersHorizontal, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/dashboard/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { api } from "@/lib/api"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useJobStore, Job } from "@/store/useJobStore"

type BgColor = "transparent" | "white" | "black" | "gray"

interface BatchItem {
  id: string
  file: File
  originalUrl: string
  resultUrl: string | null
  status: "idle" | "processing" | "done" | "failed"
  error?: string
}

export default function BatchPage() {
  const { jobs, addJob, removeJob, clearCompleted, getJobsArray, isProcessing } = useJobStore();
  const items = getJobsArray();
  
  const [isDragging, setIsDragging] = useState(false)
  const [bgColor, setBgColor] = useState<BgColor>("transparent")
  
  // Estados para o Modal de Comparação
  const [selectedItem, setSelectedItem] = useState<BatchItem | null>(null)
  const [sliderPosition, setSliderPosition] = useState(50)
  const [previewBgColor, setPreviewBgColor] = useState<BgColor>("transparent")

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(Array.from(e.target.files))
    }
  }

  const addFiles = (files: File[]) => {
    const validFiles = files.filter((file) => file.type.startsWith("image/"));
    
    if (validFiles.length === 0) {
      toast.error("Nenhuma imagem válida foi selecionada.")
      return
    }

    validFiles.forEach((file) => {
      addJob(file, "bg-removal");
    });
    
    toast.success(`${validFiles.length} imagens adicionadas à fila de processamento!`);
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files) {
      addFiles(Array.from(e.dataTransfer.files))
    }
  }

  const removeItem = (id: string) => {
    removeJob(id)
  }

  // Não precisamos mais do loop bloqueante manual, o JobStore orquestra isso!
  const handleProcessBatch = async () => {
    // Processamento agora é automático ao fazer o drop.
  }

  const downloadSingle = (item: Job, selectedBg: BgColor = bgColor) => {
    if (!item.resultUrl) return

    if (selectedBg === "transparent") {
      const link = document.createElement("a")
      link.href = item.resultUrl
      link.download = `sem-fundo-${item.file.name.split(".")[0]}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      return
    }

    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      const canvas = document.createElement("canvas")
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext("2d")

      if (ctx) {
        if (selectedBg === "white") ctx.fillStyle = "#ffffff"
        else if (selectedBg === "black") ctx.fillStyle = "#000000"
        else if (selectedBg === "gray") ctx.fillStyle = "#808080"
        
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0)

        const link = document.createElement("a")
        link.href = canvas.toDataURL("image/png")
        link.download = `fundo-${selectedBg}-${item.file.name.split(".")[0]}.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
    }
    img.src = item.resultUrl
  }

  const downloadAll = () => {
    const completed = items.filter((item) => item.status === "completed")
    completed.forEach((item, index) => {
      setTimeout(() => {
        downloadSingle(item)
      }, index * 300)
    })
  }

  const handleReset = () => {
    clearCompleted()
    setBgColor("transparent")
  }

  const doneCount = items.filter((i) => i.status === "completed").length
  const hasItems = items.length > 0

  return (
    <>
      <PageHeader
        title="Processamento em lote"
        description="Envie várias imagens ao mesmo tempo para remover o fundo em massa."
      />

      <div className="grid gap-6 max-w-4xl mx-auto">
        <Card className="border border-border bg-card">
          <CardContent className="pt-6 space-y-6">
            
            {/* Área de Drag & Drop */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={cn(
                "flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 text-center transition-all",
                isDragging
                  ? "border-primary bg-primary/5 scale-[0.99]"
                  : "border-border hover:border-primary/50 bg-muted/10"
              )}
            >
              <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary mb-3">
                <Upload className="size-5" />
              </div>
              <h3 className="text-base font-semibold mb-1">Arraste Múltiplas Imagens</h3>
              <p className="text-xs text-muted-foreground mb-4">
                Envie quantos arquivos quiser (PNG, JPG, WEBP)
              </p>
              <input
                type="file"
                id="batch-file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileChange}
              />
              <Button render={<label htmlFor="batch-file" className="cursor-pointer" />} size="sm">
                Selecionar arquivos
              </Button>
            </div>

            {/* Configurações de Fundo do Lote */}
            {hasItems && (
              <div className="flex flex-col gap-2 items-center justify-center sm:flex-row sm:justify-between border-y py-4">
                <span className="text-sm font-medium text-muted-foreground">Aplicar Fundo no Lote:</span>
                <div className="flex gap-2">
                  {(["transparent", "white", "black", "gray"] as BgColor[]).map((color) => (
                    <button
                      key={color}
                      onClick={() => setBgColor(color)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg border text-xs font-semibold shadow-xs transition-all capitalize",
                        color === "transparent" && "bg-checkerboard",
                        color === "white" && "bg-white text-black",
                        color === "black" && "bg-black text-white",
                        color === "gray" && "bg-gray-500 text-white",
                        bgColor === color ? "ring-2 ring-primary border-primary scale-105" : "border-border opacity-70 hover:opacity-100"
                      )}
                    >
                      {color === "transparent" ? "Transparente" : color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Listagem dos Itens do Lote */}
            {hasItems && (
              <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1 border rounded-lg p-2 bg-muted/5">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      "flex items-center gap-3 border rounded-lg p-2 bg-card transition-all",
                      item.status === "completed" ? "cursor-pointer hover:border-primary/50 hover:bg-muted/10" : "bg-card"
                    )}
                    onClick={() => {
                      if (item.status === "completed") {
                        setSelectedItem(item as any)
                        setPreviewBgColor(bgColor)
                        setSliderPosition(50)
                      }
                    }}
                  >
                    {/* Thumbnail */}
                    <div className="relative size-12 rounded border overflow-hidden bg-checkerboard flex items-center justify-center shrink-0">
                      <img
                        src={item.resultUrl && item.status === "completed" && bgColor !== "transparent" ? item.resultUrl : item.originalUrl}
                        alt={item.file.name}
                        className={cn(
                          "max-h-full object-contain pointer-events-none",
                          item.resultUrl && item.status === "completed" && bgColor === "white" && "bg-white",
                          item.resultUrl && item.status === "completed" && bgColor === "black" && "bg-black",
                          item.resultUrl && item.status === "completed" && bgColor === "gray" && "bg-gray-500"
                        )}
                      />
                      {item.status === "completed" && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <Eye className="w-5 h-5 text-white" />
                        </div>
                      )}
                    </div>

                    {/* Detalhes do Arquivo */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(item.file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>

                    {/* Status/Ações */}
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      {item.status === "running" && (
                        <div className="flex items-center gap-1.5 text-xs font-medium text-primary">
                          <RefreshCw className="size-3.5 animate-spin" />
                          <span>IA Processando...</span>
                        </div>
                      )}
                      
                      {item.status === "pending" && (
                        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                          <Clock className="size-3.5" />
                          <span>Na fila...</span>
                        </div>
                      )}
                      
                      {item.status === "completed" && (
                        <div className="flex items-center gap-1 text-xs font-medium text-emerald-500">
                          <CheckCircle2 className="size-4" />
                          <span>Pronto</span>
                        </div>
                      )}

                      {item.status === "failed" && (
                        <div className="flex items-center gap-1 text-xs font-medium text-destructive" title={item.error}>
                          <AlertCircle className="size-4" />
                          <span>Falhou</span>
                        </div>
                      )}

                      {item.status === "completed" && (
                        <Button size="icon-sm" variant="ghost" onClick={() => downloadSingle(item)}>
                          <Download className="size-4" />
                        </Button>
                      )}

                      <Button
                        size="icon-sm"
                        variant="ghost"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Barra de Ações do Lote */}
            {hasItems && (
              <div className="flex flex-col sm:flex-row gap-3 justify-between items-center border-t pt-4">
                <Button variant="ghost" onClick={handleReset} className="w-full sm:w-auto">
                  Limpar Concluídos
                </Button>

                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  {doneCount > 0 && (
                    <Button variant="outline" onClick={downloadAll} className="w-full sm:w-auto">
                      <Download className="mr-2 size-4" />
                      Baixar Concluídos ({doneCount})
                    </Button>
                  )}

                  {items.filter(i => i.status === "pending" || i.status === "running").length > 0 && (
                    <Button disabled className="w-full sm:w-auto">
                      <RefreshCw className="mr-2 size-4 animate-spin" />
                      Processando {items.filter(i => i.status === "pending" || i.status === "running").length}
                    </Button>
                  )}
                </div>
              </div>
            )}

          </CardContent>
        </Card>
      </div>

      {/* Modal de Comparação Slider Antes/Depois */}
      <Dialog open={selectedItem !== null} onOpenChange={(open) => !open && setSelectedItem(null)}>
        {selectedItem && (
          <DialogContent className="sm:max-w-[850px] w-[95vw] max-h-[90vh] overflow-y-auto flex flex-col gap-4 p-6">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                <SlidersHorizontal className="w-5 h-5 text-primary" />
                Comparador Antes & Depois
              </DialogTitle>
              <DialogDescription className="truncate">
                Visualizando comparativo para {selectedItem.file.name}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-6 md:grid-cols-3">
              {/* Painel Esquerdo: Comparador Slider */}
              <div className="md:col-span-2 flex flex-col items-center justify-center min-w-0">
                <div className="relative w-full aspect-square md:aspect-auto md:h-[400px] overflow-hidden rounded-xl border bg-checkerboard flex items-center justify-center select-none shadow-inner">
                  {/* Imagem de Fundo (Sem Fundo + Cor selecionada) */}
                  <div
                    className={cn(
                      "absolute inset-0 flex items-center justify-center p-4 transition-colors duration-300",
                      previewBgColor === "white" && "bg-white",
                      previewBgColor === "black" && "bg-black",
                      previewBgColor === "gray" && "bg-gray-500",
                      previewBgColor === "transparent" && "bg-checkerboard"
                    )}
                  >
                    {selectedItem.resultUrl && (
                      <img
                        src={selectedItem.resultUrl}
                        alt="Sem Fundo"
                        className="max-h-full max-w-full object-contain pointer-events-none drop-shadow-md"
                      />
                    )}
                  </div>

                  {/* Imagem Original (Sobreposta e cortada) */}
                  <div
                    className="absolute inset-0 flex items-center justify-center p-4 bg-background pointer-events-none"
                    style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
                  >
                    <img
                      src={selectedItem.originalUrl}
                      alt="Original"
                      className="max-h-full max-w-full object-contain pointer-events-none"
                    />
                  </div>

                  {/* Linha Divisória */}
                  <div
                    className="absolute inset-y-0 w-0.5 bg-white shadow-xl pointer-events-none z-20"
                    style={{ left: `${sliderPosition}%` }}
                  >
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-9 rounded-full bg-white text-black border border-border shadow-xl flex items-center justify-center text-sm font-bold">
                      ↔
                    </div>
                  </div>

                  {/* Controle deslizante oculto sobreposto */}
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={sliderPosition}
                    onChange={(e) => setSliderPosition(Number(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1.5">
                  Arraste para os lados para comparar o recorte da imagem
                </p>
              </div>

              {/* Painel Direito: Configurações e Download */}
              <div className="flex flex-col justify-between border-t md:border-t-0 md:border-l pt-4 md:pt-0 md:pl-6 gap-6 min-w-0">
                <div className="space-y-6">
                  {/* Seletor de Fundo no Modal */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold">Visualizar com Fundo:</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {(["transparent", "white", "black", "gray"] as BgColor[]).map((color) => {
                        const labels = {
                          transparent: "Transp.",
                          white: "Branco",
                          black: "Preto",
                          gray: "Cinza",
                        };
                        return (
                          <button
                            key={color}
                            onClick={() => setPreviewBgColor(color)}
                            className={cn(
                              "px-2 py-2 rounded-lg border text-xs font-semibold shadow-xs transition-all text-center truncate",
                              color === "transparent" && "bg-checkerboard border-border",
                              color === "white" && "bg-white text-black border-border",
                              color === "black" && "bg-black text-white border-zinc-800",
                              color === "gray" && "bg-gray-500 text-white border-zinc-600",
                              previewBgColor === color ? "ring-2 ring-primary border-primary scale-102" : "opacity-80 hover:opacity-100"
                            )}
                            title={labels[color]}
                          >
                            {labels[color]}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Detalhes do Arquivo */}
                  <div className="space-y-2 border-t pt-4">
                    <h4 className="text-sm font-semibold">Informações da Imagem:</h4>
                    <div className="space-y-1.5 text-xs text-muted-foreground">
                      <p className="truncate"><strong>Nome:</strong> <span className="text-foreground">{selectedItem.file.name}</span></p>
                      <p><strong>Tamanho:</strong> <span className="text-foreground">{(selectedItem.file.size / 1024).toFixed(1)} KB</span></p>
                      <p><strong>Formato:</strong> <span className="text-foreground">PNG Transparente</span></p>
                    </div>
                  </div>
                </div>

                {/* Ações de Download */}
                <div className="space-y-2 border-t pt-4 mt-auto">
                  <Button className="w-full text-xs py-2 h-auto" onClick={() => downloadSingle(selectedItem, previewBgColor)}>
                    <Download className="mr-2 h-3.5 w-3.5" />
                    {previewBgColor === "transparent" ? "Baixar Sem Fundo" : `Baixar com Fundo`}
                  </Button>
                  <Button variant="outline" className="w-full text-xs py-2 h-auto" onClick={() => setSelectedItem(null)}>
                    Fechar
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </>
  )
}
