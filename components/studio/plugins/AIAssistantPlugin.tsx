"use client"
import React, { useState, useEffect } from "react"
import { Sparkles, Scissors, Wand2, Image as ImageIcon } from "lucide-react"
import { useStudioStore } from "@/store/useStudioStore"
import { EventBus, StudioEvent } from "@/lib/studio/events/EventBus"
import { StudioPlugin } from "@/lib/studio/plugins/BasePlugin"
import { AIProviderManager } from "@/lib/studio/ai/AIProviderManager"
import { Button } from "@/components/ui/button"

function AIAssistantContextPanel() {
  const [hasImageSelection, setHasImageSelection] = useState(false)
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null)
  
  const [isInpaintingActive, setIsInpaintingActive] = useState(false)
  const [inpaintPrompt, setInpaintPrompt] = useState("")

  const setIsProcessingAI = useStudioStore(state => state.setIsProcessingAI)
  const engine = useStudioStore(state => state.engine)

  const toggleInpaintBrush = () => {
    if (!engine) return
    if (isInpaintingActive) {
      engine.stopInpaintBrush()
      setIsInpaintingActive(false)
    } else {
      engine.startInpaintBrush()
      setIsInpaintingActive(true)
    }
  }

  const handleGenerativeFill = async () => {
    if (!engine || !selectedObjectId || !inpaintPrompt.trim()) {
      const { toast } = require("sonner")
      return toast.error("Por favor, pinte uma área e digite o prompt de preenchimento.")
    }

    setIsProcessingAI(true)
    const { toast } = require("sonner")
    toast.info("Processando preenchimento generativo...")

    try {
      // Capturar os arquivos de imagem e máscara do canvas
      const files = await engine.getInpaintMaskAndImage()
      if (!files) {
        toast.error("Nenhuma área pintada foi encontrada. Pinte sobre a imagem antes de gerar.")
        setIsProcessingAI(false)
        return
      }

      const { imageFile, maskFile } = files

      // Enviar os arquivos para o Provider de IA
      const response = await AIProviderManager.inpaint(imageFile, maskFile, inpaintPrompt)

      if (response.success && response.data) {
        // Sucesso: atualiza o objeto com a imagem resultante
        await engine.updateObjectImageUrl(selectedObjectId, response.data)
        engine.stopInpaintBrush()
        setIsInpaintingActive(false)
        setInpaintPrompt("")
        engine.requestRender()
        EventBus.emit(StudioEvent.HISTORY_CHANGED)
        toast.success("Preenchimento generativo aplicado com sucesso!")
      } else {
        toast.error(response.error || "Erro no preenchimento generativo.")
      }
    } catch (error) {
      console.error(error)
      toast.error("Ocorreu um erro ao processar o preenchimento generativo.")
    } finally {
      setIsProcessingAI(false)
    }
  }

  useEffect(() => {
    const handleSelection = (selected: any[]) => {
      const isImage = selected && selected.length === 1 && selected[0].type === "image"
      setHasImageSelection(isImage)
      if (isImage) {
        setSelectedObjectId(selected[0].id)
      } else {
        setSelectedObjectId(null)
      }
    }

    const unsubSelected = EventBus.on(StudioEvent.OBJECT_SELECTED, handleSelection)
    const unsubCleared = EventBus.on(StudioEvent.SELECTION_CLEARED, () => setHasImageSelection(false))
    
    return () => {
      unsubSelected()
      unsubCleared()
    }
  }, [])

  const urlToFile = async (url: string, filename: string, mimeType: string): Promise<File> => {
    const res = await fetch(url)
    const buf = await res.arrayBuffer()
    return new File([buf], filename, { type: mimeType })
  }

  const handleRemoveBackground = async () => {
    if (!engine || !selectedObjectId) return

    const imageUrl = engine.getSelectedObjectImageUrl()
    if (!imageUrl) return

    setIsProcessingAI(true)

    try {
      // Converte a URL em File
      const file = await urlToFile(imageUrl, "image.png", "image/png")
      
      const response = await AIProviderManager.removeBackground(file)
      
      const { toast } = require("sonner");

      if (response.success && response.data) {
        // Sucesso: a IA retornou uma nova URL da imagem sem fundo
        // Substituir a imagem atual pela nova
        engine.updateObjectImageUrl(selectedObjectId, response.data)
        engine.requestRender()
        EventBus.emit(StudioEvent.HISTORY_CHANGED)
        toast.success("Fundo removido com sucesso!")
      } else {
        toast.error(response.error || "Erro ao remover o fundo.")
      }
    } catch (error) {
      console.error(error)
      const { toast } = require("sonner");
      toast.error("Ocorreu um erro ao processar a IA.")
    } finally {
      setIsProcessingAI(false)
    }
  }

  const handleUpscale = async () => {
    if (!engine || !selectedObjectId) return
    const imageUrl = engine.getSelectedObjectImageUrl()
    if (!imageUrl) return
    setIsProcessingAI(true)
    try {
      const file = await urlToFile(imageUrl, "image.png", "image/png")
      const response = await AIProviderManager.upscale(file, 2)
      const { toast } = require("sonner");
      if (response.success && response.data) {
        engine.updateObjectImageUrl(selectedObjectId, response.data)
        engine.requestRender()
        EventBus.emit(StudioEvent.HISTORY_CHANGED)
        toast.success("Upscale concluído com sucesso!")
      } else {
        toast.error(response.error || "Erro ao realizar upscale.")
      }
    } catch (error) {
      console.error(error)
      const { toast } = require("sonner");
      toast.error("Ocorreu um erro ao processar a IA.")
    } finally {
      setIsProcessingAI(false)
    }
  }

  const handleMockAction = (name: string) => {
    alert(`Ferramenta ${name} em desenvolvimento!`)
  }

  if (!hasImageSelection) return null

  return (
    <div className="flex flex-col p-4 gap-4 border-b">
      <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2 border-b pb-2">
        <Sparkles className="h-4 w-4" /> AI Assistant
      </h3>

      <div className="flex flex-col gap-2">
        <Button 
          variant="outline" 
          className="justify-start text-left font-medium" 
          onClick={handleRemoveBackground}
        >
          <Scissors className="h-4 w-4 mr-2 text-primary" />
          Remover Fundo
        </Button>

        <Button 
          variant="outline" 
          className="justify-start text-left font-medium" 
          onClick={() => handleMockAction('Borracha Mágica')}
        >
          <Wand2 className="h-4 w-4 mr-2" />
          Borracha Mágica
        </Button>
        
        <Button 
          variant="outline" 
          className="justify-start text-left font-medium" 
          onClick={() => handleUpscale()}
        >
          <ImageIcon className="h-4 w-4 mr-2" />
          Upscale (Melhorar Qualidade)
        </Button>

        {/* Generative Fill / Inpainting */}
        <div className="border-t pt-3 mt-1 flex flex-col gap-2">
          <span className="text-[10px] uppercase font-bold text-muted-foreground">Preenchimento Generativo (IA)</span>
          
          <Button 
            variant={isInpaintingActive ? "default" : "outline"} 
            className="justify-start text-left font-medium" 
            onClick={toggleInpaintBrush}
          >
            <Sparkles className="h-4 w-4 mr-2 text-purple-500" />
            {isInpaintingActive ? "Desativar Pincel IA" : "Pintar Área de Substituição"}
          </Button>

          {isInpaintingActive && (
            <div className="flex flex-col gap-2 mt-1 p-2 border border-purple-500/20 bg-purple-500/5 rounded-md animate-in slide-in-from-top-2">
              <label className="text-[10px] font-semibold">O que deseja colocar/substituir nesta área?</label>
              <textarea
                className="text-xs p-2 border rounded bg-background resize-none h-16"
                placeholder="Ex: 'um relógio clássico dourado', 'remover objeto'"
                value={inpaintPrompt}
                onChange={(e) => setInpaintPrompt(e.target.value)}
              />
              <Button 
                size="sm" 
                className="w-full text-xs bg-purple-600 hover:bg-purple-700 text-white" 
                onClick={handleGenerativeFill}
              >
                Gerar Preenchimento
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-2 p-3 bg-primary/10 rounded-lg">
        <p className="text-xs text-primary font-medium flex items-center gap-1">
          <Sparkles className="h-3 w-3" />
          Dica de IA
        </p>
        <p className="text-[10px] text-muted-foreground mt-1">
          O removedor de fundo usa machine learning na nuvem. Mantenha objetos bem iluminados para o melhor resultado.
        </p>
      </div>
    </div>
  )
}

export const AIAssistantPlugin: StudioPlugin = {
  id: "ai-assistant",
  name: "IA",
  icon: Sparkles,
  ContextComponent: AIAssistantContextPanel,
  propertyTab: "ia"
}
