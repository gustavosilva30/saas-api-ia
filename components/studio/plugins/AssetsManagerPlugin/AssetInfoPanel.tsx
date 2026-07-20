"use client"
import React from "react"
import { AssetItem } from "@/lib/studio/assets/AssetTypes"
import { X, Info, Calendar, Link2, Download, Trash2, Wand2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface AssetInfoPanelProps {
  asset: AssetItem;
  onClose: () => void;
}

export function AssetInfoPanel({ asset, onClose }: AssetInfoPanelProps) {
  return (
    <div className="w-[280px] border-l bg-background flex flex-col h-full overflow-hidden relative">
      <div className="p-4 border-b flex items-center justify-between shrink-0">
        <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Info className="h-4 w-4" /> Detalhes
        </h3>
        <Button size="icon-sm" variant="ghost" className="h-6 w-6" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div className="aspect-video w-full rounded-md border overflow-hidden bg-checkerboard flex items-center justify-center">
          {asset.type === "image" && (
            <img src={asset.url} alt={asset.name} className="max-w-full max-h-full object-contain" />
          )}
        </div>

        <div className="space-y-1">
          <h4 className="font-semibold text-sm break-words">{asset.name}</h4>
          <p className="text-xs text-muted-foreground capitalize">{asset.category.replace("_", " ")}</p>
        </div>

        <div className="space-y-3">
          <h5 className="text-[10px] font-semibold text-muted-foreground/70 uppercase">Informações</h5>
          
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="text-muted-foreground">Tipo</div>
            <div className="text-right font-medium uppercase">{asset.type}</div>
            
            <div className="text-muted-foreground">Adicionado em</div>
            <div className="text-right font-medium">{new Date(asset.createdAt).toLocaleDateString()}</div>
            
            <div className="text-muted-foreground">Usos</div>
            <div className="text-right font-medium">{asset.usageCount}x</div>
            
            <div className="text-muted-foreground">Permissão</div>
            <div className="text-right font-medium capitalize">{asset.permission}</div>
          </div>
        </div>

        <div className="space-y-3">
          <h5 className="text-[10px] font-semibold text-muted-foreground/70 uppercase">Ações IA</h5>
          <div className="grid grid-cols-1 gap-2">
            <Button size="sm" variant="outline" className="w-full text-xs justify-start">
              <Wand2 className="h-3 w-3 mr-2 text-primary" />
              Remover Fundo
            </Button>
            <Button size="sm" variant="outline" className="w-full text-xs justify-start">
              <Wand2 className="h-3 w-3 mr-2 text-primary" />
              Gerar Fundo Expandido
            </Button>
          </div>
        </div>
      </div>
      
      <div className="p-4 border-t shrink-0 flex gap-2">
        <Button size="icon" variant="outline" title="Copiar URL" className="flex-1">
          <Link2 className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="outline" title="Download" className="flex-1">
          <Download className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="destructive" title="Excluir" className="flex-1">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
