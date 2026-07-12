"use client"

import { useState } from "react"
import { Upload, ImageIcon, Download, RefreshCw, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/dashboard/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { api } from "@/lib/api"
import { toast } from "sonner"

export default function ProcessPage() {
  const [file, setFile] = useState<File | null>(null)
  const [originalUrl, setOriginalUrl] = useState<string | null>(null)
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [sliderPosition, setSliderPosition] = useState(50)
  const [isDragging, setIsDragging] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      setupImages(selectedFile)
    }
  }

  const setupImages = (selectedFile: File) => {
    setFile(selectedFile)
    setOriginalUrl(URL.createObjectURL(selectedFile))
    setResultUrl(null)
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
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selectedFile = e.dataTransfer.files[0]
      if (selectedFile.type.startsWith("image/")) {
        setupImages(selectedFile)
      } else {
        toast.error("Por favor, envie apenas arquivos de imagem.")
      }
    }
  }

  const handleProcess = async () => {
    if (!file) return
    setLoading(true)
    const toastId = toast.loading("Enviando imagem para a IA...")

    try {
      const result = await api.removeBackground(file)
      setResultUrl(result.resultUrl)
      toast.success("Fundo removido com sucesso!", { id: toastId })
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "Erro ao conectar com a API da VPS. Verifique se o servidor está online.", { id: toastId })
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    if (!resultUrl || !file) return
    const link = document.createElement("a")
    link.href = resultUrl
    link.download = `sem-fundo-${file.name.split(".")[0]}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleReset = () => {
    setFile(null)
    setOriginalUrl(null)
    setResultUrl(null)
  }

  return (
    <>
      <PageHeader
        title="Processar imagem"
        description="Faça upload de uma imagem e nossa inteligência artificial removerá o fundo automaticamente."
      />

      <div className="grid gap-6 max-w-4xl mx-auto">
        <Card className="border border-border bg-card">
          <CardContent className="pt-6">
            {!file ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-12 text-center transition-all ${
                  isDragging
                    ? "border-primary bg-primary/5 scale-[0.99]"
                    : "border-muted hover:border-primary/50 bg-muted/20"
                }`}
              >
                <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
                  <Upload className="size-6" />
                </div>
                <h3 className="text-lg font-semibold mb-1">Arrastar & Soltar Imagem</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Suporta PNG, JPG, WEBP de até 10MB
                </p>
                <input
                  type="file"
                  id="image-file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <Button render={<label htmlFor="image-file" className="cursor-pointer" />}>
                  Selecionar arquivo
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Visualizador */}
                <div className="relative w-full aspect-video md:aspect-[16/9] rounded-lg border overflow-hidden bg-checkerboard flex items-center justify-center">
                  {!resultUrl ? (
                    // Imagem original antes do processamento
                    <img
                      src={originalUrl || ""}
                      alt="Original"
                      className="max-h-full object-contain"
                    />
                  ) : (
                    // Comparador de Slider (Antes/Depois)
                    <div className="relative w-full h-full select-none overflow-hidden flex items-center justify-center">
                      {/* Antes (Fundo) */}
                      <img
                        src={originalUrl || ""}
                        alt="Original"
                        className="absolute max-h-full object-contain pointer-events-none"
                      />
                      
                      {/* Depois (Frente com clip) */}
                      <div
                        className="absolute inset-0 flex items-center justify-center overflow-hidden"
                        style={{ clipPath: `inset(0 0 0 ${sliderPosition}%)` }}
                      >
                        <img
                          src={resultUrl}
                          alt="Processada"
                          className="max-h-full object-contain pointer-events-none"
                        />
                      </div>

                      {/* Controle do Slider */}
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={sliderPosition}
                        onChange={(e) => setSliderPosition(Number(e.target.value))}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30"
                      />

                      {/* Barra Visual do Divisor */}
                      <div
                        className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize z-20 pointer-events-none shadow-[0_0_10px_rgba(0,0,0,0.5)]"
                        style={{ left: `${sliderPosition}%` }}
                      >
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-8 rounded-full border-2 border-white bg-primary shadow-lg flex items-center justify-center">
                          <div className="flex gap-0.5">
                            <div className="w-0.5 h-3 bg-white rounded-full" />
                            <div className="w-0.5 h-3 bg-white rounded-full" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {loading && (
                    <div className="absolute inset-0 bg-background/70 backdrop-blur-xs flex flex-col items-center justify-center gap-3 z-40">
                      <RefreshCw className="size-8 text-primary animate-spin" />
                      <span className="text-sm font-medium">Removendo o fundo com IA...</span>
                    </div>
                  )}
                </div>

                {/* Controles de Ação */}
                <div className="flex flex-col sm:flex-row gap-3 justify-end items-center">
                  <Button variant="ghost" onClick={handleReset} disabled={loading} className="w-full sm:w-auto">
                    Limpar
                  </Button>

                  {!resultUrl ? (
                    <Button onClick={handleProcess} disabled={loading} className="w-full sm:w-auto">
                      <ImageIcon className="mr-2 size-4" />
                      Remover Fundo
                    </Button>
                  ) : (
                    <Button onClick={handleDownload} className="w-full sm:w-auto">
                      <Download className="mr-2 size-4" />
                      Baixar Imagem (PNG)
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
