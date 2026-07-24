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
  
  const setIsProcessingAI = useStudioStore(state => state.setIsProcessingAI)
  const engine = useStudioStore(state => state.engine)

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
      
      if (response.success && response.data) {
        // Sucesso: a IA retornou uma nova URL da imagem sem fundo
        // Substituir a imagem atual pela nova
        engine.updateObjectImageUrl(selectedObjectId, response.data)
        engine.requestRender()
        EventBus.emit(StudioEvent.HISTORY_CHANGED)
      } else {
        alert(response.error || "Erro ao remover o fundo.")
      }
    } catch (error) {
      console.error(error)
      alert("Ocorreu um erro ao processar a IA.")
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
          onClick={() => handleMockAction('Upscale')}
        >
          <ImageIcon className="h-4 w-4 mr-2" />
          Upscale (Melhorar Qualidade)
        </Button>
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
