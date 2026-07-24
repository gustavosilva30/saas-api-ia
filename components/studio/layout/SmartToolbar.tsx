"use client"
import React from "react"
import { useSelectionStore } from "@/store/useSelectionStore"
import { useStudioStore } from "@/store/useStudioStore"
import { Button } from "@/components/ui/button"
import { 
  Type, 
  Image as ImageIcon, 
  Square,
  Crop,
  Sparkles,
  Scissors,
  Wand2,
  SlidersHorizontal,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline
} from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export function SmartToolbar() {
  const { selectedIds } = useSelectionStore()
  const engine = useStudioStore((state) => state.engine)
  const selectedObjectType = useStudioStore((state) => state.selectedObjectType)

  if (selectedIds.length === 0 || !selectedObjectType) {
    return null;
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-background border rounded-lg shadow-lg px-2 py-1 flex items-center gap-1 z-20 animate-in fade-in slide-in-from-top-4">
        
        {/* Ferramentas Comuns */}
        <div className="flex items-center gap-1 border-r pr-2 mr-1 text-muted-foreground text-xs font-semibold px-2">
          {selectedObjectType === 'image' && <ImageIcon className="h-4 w-4 mr-1" />}
          {selectedObjectType === 'i-text' && <Type className="h-4 w-4 mr-1" />}
          {selectedObjectType === 'rect' && <Square className="h-4 w-4 mr-1" />}
          {selectedObjectType.toUpperCase()}
        </div>

        {/* Ferramentas de Imagem */}
        {selectedObjectType === 'image' && (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 px-2 text-xs"><Crop className="h-4 w-4 mr-1" /> Cortar</Button>
              </TooltipTrigger>
              <TooltipContent>Recortar imagem</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 px-2 text-xs"><SlidersHorizontal className="h-4 w-4 mr-1" /> Ajustes</Button>
              </TooltipTrigger>
              <TooltipContent>Brilho, Contraste e Saturação</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 px-2 text-xs text-purple-500 hover:text-purple-600"><Sparkles className="h-4 w-4 mr-1" /> IA</Button>
              </TooltipTrigger>
              <TooltipContent>Opções de Inteligência Artificial</TooltipContent>
            </Tooltip>
          </>
        )}

        {/* Ferramentas de Texto */}
        {selectedObjectType === 'i-text' && (
          <>
            <div className="flex items-center gap-1 border-r pr-2 mr-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8"><Bold className="h-4 w-4" /></Button>
                </TooltipTrigger>
                <TooltipContent>Negrito</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8"><Italic className="h-4 w-4" /></Button>
                </TooltipTrigger>
                <TooltipContent>Itálico</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8"><Underline className="h-4 w-4" /></Button>
                </TooltipTrigger>
                <TooltipContent>Sublinhado</TooltipContent>
              </Tooltip>
            </div>
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8"><AlignLeft className="h-4 w-4" /></Button>
                </TooltipTrigger>
                <TooltipContent>Alinhar à Esquerda</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8"><AlignCenter className="h-4 w-4" /></Button>
                </TooltipTrigger>
                <TooltipContent>Centralizar</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8"><AlignRight className="h-4 w-4" /></Button>
                </TooltipTrigger>
                <TooltipContent>Alinhar à Direita</TooltipContent>
              </Tooltip>
            </div>
          </>
        )}
      </div>
    </TooltipProvider>
  )
}
