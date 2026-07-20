"use client"
import React, { useRef } from "react"
import { Wand2, UploadCloud, Loader2, ImageIcon } from "lucide-react"
import { StudioPlugin } from "@/lib/studio/plugins/BasePlugin"
import { useStudioStore } from "@/store/useStudioStore"
import { AIProviderManager } from "@/lib/studio/ai/AIProviderManager"
import { AddImageCommand } from "@/lib/studio/commands/AddImageCommand"
import { UpdateImageCommand } from "@/lib/studio/commands/UpdateImageCommand"
import { globalCommandManager } from "@/lib/studio/commands/GlobalCommandManager"

function RemoveBgSidebar() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const isProcessingAI = useStudioStore((state) => state.isProcessingAI)
  const setProcessingAI = useStudioStore((state) => state.setProcessingAI)
  const engine = useStudioStore((state) => state.engine)
  const selectedObjectId = useStudioStore((state) => state.selectedObjectId)
  const selectedObjectType = useStudioStore((state) => state.selectedObjectType)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setProcessingAI(true)
      
      const response = await AIProviderManager.removeBackground(file)
      
      if (response.success && response.data) {
        // Sucesso: a IA devolveu a imagem sem fundo. Adiciona ao palco via Command!
        const cmd = new AddImageCommand(response.data)
        globalCommandManager.executeCommand(cmd)
      } else {
        alert("Erro na IA: " + response.error)
      }
    } catch (error: any) {
      alert("Erro ao processar imagem: " + error.message)
    } finally {
      setProcessingAI(false)
      // Limpar o input para permitir enviar a mesma imagem novamente se necessário
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleRemoveBgSelected = async () => {
    if (!engine || !selectedObjectId || selectedObjectType !== 'image') return;

    const imageUrl = engine.getSelectedObjectImageUrl();
    if (!imageUrl) return;

    try {
      setProcessingAI(true);
      
      // Converte URL em File para a API
      const responseImg = await fetch(imageUrl);
      const blob = await responseImg.blob();
      const file = new File([blob], 'selected_image.png', { type: 'image/png' });

      const response = await AIProviderManager.removeBackground(file);
      
      if (response.success && response.data) {
        // Sucesso: Atualiza a imagem existente no palco mantendo posição via Command!
        const cmd = new UpdateImageCommand(selectedObjectId, imageUrl, response.data);
        globalCommandManager.executeCommand(cmd);
      } else {
        alert("Erro na IA: " + response.error);
      }
    } catch (error: any) {
      alert("Erro ao processar imagem selecionada: " + error.message);
    } finally {
      setProcessingAI(false);
    }
  }

  const isImageSelected = selectedObjectId !== null && selectedObjectType === 'image';

  return (
    <div className="w-64 border-r bg-background flex flex-col p-4 overflow-y-auto">
      <h3 className="font-semibold mb-2 text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
        <Wand2 className="h-4 w-4" /> AI Magic
      </h3>
      <p className="text-xs text-muted-foreground mb-6">
        Faça upload de uma foto ou remova o fundo da imagem que já está no palco.
      </p>

      <input 
        type="file" 
        accept="image/*" 
        className="hidden" 
        ref={fileInputRef}
        onChange={handleFileChange}
      />

      {isImageSelected ? (
        <button
          onClick={handleRemoveBgSelected}
          disabled={isProcessingAI}
          className="w-full flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-primary/50 rounded-xl hover:bg-primary/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-4"
        >
          {isProcessingAI ? (
            <>
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <span className="text-sm font-medium text-primary text-center">Processando IA...</span>
            </>
          ) : (
            <>
              <ImageIcon className="h-8 w-8 text-primary" />
              <span className="text-sm font-medium text-primary text-center">Remover fundo da imagem selecionada</span>
            </>
          )}
        </button>
      ) : null}

      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isProcessingAI}
        className="w-full flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-muted rounded-xl hover:bg-muted/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isProcessingAI && !isImageSelected ? (
          <>
            <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
            <span className="text-sm font-medium text-muted-foreground text-center">Processando...</span>
          </>
        ) : (
          <>
            <UploadCloud className="h-8 w-8 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground text-center">Fazer Upload & Remover</span>
          </>
        )}
      </button>

      <div className="mt-8 p-4 bg-muted rounded-lg border text-xs text-muted-foreground">
        <strong>Dica:</strong> Certifique-se de que o produto esteja bem iluminado para obter o recorte mais perfeito possível.
      </div>
    </div>
  )
}

export const RemoveBgPlugin: StudioPlugin = {
  id: "remove-bg",
  name: "Remover Fundo",
  icon: Wand2,
  SidebarComponent: RemoveBgSidebar,
}
