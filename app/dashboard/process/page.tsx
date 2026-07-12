"use client"

import { useState, useRef, useEffect } from "react"
import { Upload, ImageIcon, Download, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/dashboard/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { api } from "@/lib/api"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

type BgColor = "transparent" | "white" | "black" | "gray"

export default function ProcessPage() {
  const [file, setFile] = useState<File | null>(null)
  const [originalUrl, setOriginalUrl] = useState<string | null>(null)
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [sliderPosition, setSliderPosition] = useState(50)
  const [isDragging, setIsDragging] = useState(false)
  const [bgColor, setBgColor] = useState<BgColor>("transparent")
  
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDraggingSlider, setIsDraggingSlider] = useState(false)

  // Manipulador global de movimento do Slider para precisão máxima
  useEffect(() => {
    const handleGlobalMove = (clientX: number) => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const x = clientX - rect.left
      const position = Math.max(0, Math.min(100, (x / rect.width) * 100))
      setSliderPosition(position)
    }

    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingSlider) return
      handleGlobalMove(e.clientX)
    }

    const onMouseUp = () => {
      setIsDraggingSlider(false)
    }

    const onTouchMove = (e: TouchEvent) => {
      if (!isDraggingSlider) return
      if (e.touches.length > 0) {
        handleGlobalMove(e.touches[0].clientX)
      }
    }

    if (isDraggingSlider) {
      window.addEventListener("mousemove", onMouseMove)
      window.addEventListener("mouseup", onMouseUp)
      window.addEventListener("touchmove", onTouchMove, { passive: false })
      window.addEventListener("touchend", onMouseUp)
    }

    return () => {
      window.removeEventListener("mousemove", onMouseMove)
      window.removeEventListener("mouseup", onMouseUp)
      window.removeEventListener("touchmove", onTouchMove)
      window.removeEventListener("touchend", onMouseUp)
    }
  }, [isDraggingSlider])

  const startDrag = (clientX: number) => {
    setIsDraggingSlider(true)
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = clientX - rect.left
    const position = Math.max(0, Math.min(100, (x / rect.width) * 100))
    setSliderPosition(position)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setupImages(e.target.files[0])
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
    const toastId = toast.loading("Removendo o fundo com IA...")

    try {
      const result = await api.removeBackground(file)
      setResultUrl(result.resultUrl)
      toast.success("Fundo removido com sucesso!", { id: toastId })
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "Erro ao conectar com a API. Verifique a VPS.", { id: toastId })
    } finally {
      setLoading(false)
    }
  }

  // Função para baixar a imagem mesclando a cor de fundo selecionada
  const handleDownload = () => {
    if (!resultUrl || !file) return

    // Se o fundo for transparente, baixa o PNG direto
    if (bgColor === "transparent") {
      const link = document.createElement("a")
      link.href = resultUrl
      link.download = `sem-fundo-${file.name.split(".")[0]}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      return
    }

    // Se houver uma cor selecionada, mescla usando Canvas
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      const canvas = document.createElement("canvas")
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext("2d")

      if (ctx) {
        // Define a cor de fundo
        if (bgColor === "white") ctx.fillStyle = "#ffffff"
        else if (bgColor === "black") ctx.fillStyle = "#000000"
        else if (bgColor === "gray") ctx.fillStyle = "#808080"
        
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        
        // Desenha a imagem processada por cima
        ctx.drawImage(img, 0, 0)

        // Gera o download
        const link = document.createElement("a")
        link.href = canvas.toDataURL("image/png")
        link.download = `fundo-${bgColor}-${file.name.split(".")[0]}.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
    }
    img.src = resultUrl
  }

  const handleReset = () => {
    setFile(null)
    setOriginalUrl(null)
    setResultUrl(null)
    setBgColor("transparent")
  }

  return (
    <>
      <PageHeader
        title="Processar imagem"
        description="Faça upload de uma imagem e remova o fundo automaticamente usando nossa IA."
      />

      <div className="grid gap-6 max-w-4xl mx-auto">
        <Card className="border border-border bg-card">
          <CardContent className="pt-6">
            {!file ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={cn(
                  "flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-12 text-center transition-all",
                  isDragging
                    ? "border-primary bg-primary/5 scale-[0.99]"
                    : "border-border hover:border-primary/50 bg-muted/10"
                )}
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
                {/* Visualizador de Imagem */}
                <div
                  ref={containerRef}
                  onMouseDown={(e) => startDrag(e.clientX)}
                  onTouchStart={(e) => startDrag(e.touches[0].clientX)}
                  className="relative w-full h-[500px] rounded-lg border overflow-hidden flex items-center justify-center select-none cursor-ew-resize touch-none bg-muted/20 p-4"
                >
                  {!resultUrl ? (
                    <img
                      src={originalUrl || ""}
                      alt="Original"
                      onDragStart={(e) => e.preventDefault()}
                      className="max-h-full max-w-full object-contain pointer-events-none shadow-md rounded"
                    />
                  ) : (
                    /* Container que abraça o tamanho exato da imagem */
                    <div className="relative max-h-full max-w-full flex items-center justify-center shadow-xl rounded overflow-hidden pointer-events-none">
                      
                      {/* Fundo dinâmico da imagem completa */}
                      <div className={cn(
                        "absolute inset-0 transition-colors duration-200",
                        bgColor === "transparent" && "bg-checkerboard",
                        bgColor === "white" && "bg-white",
                        bgColor === "black" && "bg-black",
                        bgColor === "gray" && "bg-gray-500"
                      )} />

                      {/* Imagem Processada (Fica por baixo, preenchendo o container) */}
                      <img
                        src={resultUrl}
                        alt="Processada"
                        onDragStart={(e) => e.preventDefault()}
                        className="relative z-10 max-h-full max-w-full object-contain"
                      />

                      {/* Imagem Original (Fica por cima, com máscara/clip-path) */}
                      <div 
                        className="absolute inset-0 z-20 overflow-hidden"
                        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
                      >
                        {/* Fundo da original (geralmente branco/transparente, mas a original já tem fundo) */}
                        <img
                          src={originalUrl || ""}
                          alt="Original"
                          onDragStart={(e) => e.preventDefault()}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      
                      {/* Divisor do Slider */}
                      <div
                        className="absolute top-0 bottom-0 w-1 bg-white shadow-xl z-30 pointer-events-none"
                        style={{ left: `${sliderPosition}%` }}
                      >
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-8 rounded-full border-2 border-white bg-primary shadow-lg flex items-center justify-center">
                          <div className="flex gap-0.5 pointer-events-none">
                            <div className="w-0.5 h-3 bg-white rounded-full" />
                            <div className="w-0.5 h-3 bg-white rounded-full" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {loading && (
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-xs flex flex-col items-center justify-center gap-3 z-50 cursor-default pointer-events-auto">
                      <RefreshCw className="size-8 text-primary animate-spin" />
                      <span className="text-sm font-medium">Processando imagem...</span>
                    </div>
                  )}
                </div>

                {/* Seletores de Cor de Fundo */}
                {resultUrl && (
                  <div className="flex flex-col gap-2 items-center justify-center sm:flex-row sm:justify-between border-y py-4">
                    <span className="text-sm font-medium text-muted-foreground">Cor de Fundo:</span>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setBgColor("transparent")}
                        className={cn(
                          "px-3 py-1.5 rounded-lg border text-xs font-semibold bg-checkerboard shadow-xs transition-all",
                          bgColor === "transparent" ? "ring-2 ring-primary border-primary scale-105" : "border-border opacity-70 hover:opacity-100"
                        )}
                      >
                        Transparente
                      </button>
                      <button
                        onClick={() => setBgColor("white")}
                        className={cn(
                          "px-3 py-1.5 rounded-lg border text-xs font-semibold bg-white text-black shadow-xs transition-all",
                          bgColor === "white" ? "ring-2 ring-primary border-primary scale-105" : "border-border opacity-70 hover:opacity-100"
                        )}
                      >
                        Branco
                      </button>
                      <button
                        onClick={() => setBgColor("black")}
                        className={cn(
                          "px-3 py-1.5 rounded-lg border text-xs font-semibold bg-black text-white shadow-xs transition-all",
                          bgColor === "black" ? "ring-2 ring-primary border-primary scale-105" : "border-border opacity-70 hover:opacity-100"
                        )}
                      >
                        Preto
                      </button>
                      <button
                        onClick={() => setBgColor("gray")}
                        className={cn(
                          "px-3 py-1.5 rounded-lg border text-xs font-semibold bg-gray-500 text-white shadow-xs transition-all",
                          bgColor === "gray" ? "ring-2 ring-primary border-primary scale-105" : "border-border opacity-70 hover:opacity-100"
                        )}
                      >
                        Cinza
                      </button>
                    </div>
                  </div>
                )}

                {/* Botões de Ação */}
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
                      Baixar Imagem ({bgColor === "transparent" ? "PNG" : "JPEG/PNG"})
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
