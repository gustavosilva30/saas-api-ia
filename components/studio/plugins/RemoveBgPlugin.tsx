"use client"
import React, { useRef } from "react"
import { Wand2, UploadCloud, Loader2 } from "lucide-react"
import { StudioPlugin } from "@/lib/studio/plugins/BasePlugin"
import { useStudioStore } from "@/store/useStudioStore"
import { AIProviderManager } from "@/lib/studio/ai/AIProviderManager"
import { AddImageCommand } from "@/lib/studio/commands/AddImageCommand"
import { localCommandManager } from "./AssetsPlugin"

function RemoveBgSidebar() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isProcessingAI = useStudioStore((state) => state.isProcessingAI)
  const setProcessingAI = useStudioStore((state) => state.setProcessingAI)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setProcessingAI(true)
      
      const response = await AIProviderManager.removeBackground(file)
      
      if (response.success && response.data) {
        // Sucesso: a IA devolveu a imagem sem fundo. Adiciona ao palco via Command!
        const cmd = new AddImageCommand(response.data)
        localCommandManager.executeCommand(cmd)
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

  return (
    <div className="w-64 border-r bg-background flex flex-col p-4 overflow-y-auto">
      <h3 className="font-semibold mb-2 text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
        <Wand2 className="h-4 w-4" /> AI Magic
      </h3>
      <p className="text-xs text-muted-foreground mb-6">
        Faça upload de uma foto de produto. Nossa IA removerá o fundo automaticamente antes de inserir no palco.
      </p>

      <input 
        type="file" 
        accept="image/*" 
        className="hidden" 
        ref={fileInputRef}
        onChange={handleFileChange}
      />

      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isProcessingAI}
        className="w-full flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-primary/50 rounded-xl hover:bg-primary/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isProcessingAI ? (
          <>
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <span className="text-sm font-medium text-primary">Processando IA...</span>
          </>
        ) : (
          <>
            <UploadCloud className="h-8 w-8 text-primary" />
            <span className="text-sm font-medium text-primary">Upload & Remover Fundo</span>
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
