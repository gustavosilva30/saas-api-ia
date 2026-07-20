"use client"
import React from "react"
import { useAssetStore } from "@/store/useAssetStore"
import { AssetCategory } from "@/lib/studio/assets/AssetTypes"
import { Image as ImageIcon, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { globalCommandManager } from "@/lib/studio/commands/GlobalCommandManager"
import { AddImageCommand } from "@/lib/studio/commands/AddImageCommand"
import { cn } from "@/lib/utils"

interface AssetGridProps {
  category: AssetCategory;
  searchQuery: string;
  onSelectAsset: (id: string) => void;
  selectedAssetId: string | null;
}

export function AssetGrid({ category, searchQuery, onSelectAsset, selectedAssetId }: AssetGridProps) {
  const assets = useAssetStore(state => state.getAssetsByCategory(category, searchQuery));

  const handleDragStart = (e: React.DragEvent, url: string) => {
    e.dataTransfer.setData("text/plain", url);
    e.dataTransfer.effectAllowed = "copy";
  }

  const handleAddToCanvas = (url: string) => {
    const cmd = new AddImageCommand(url);
    globalCommandManager.executeCommand(cmd);
  }

  if (assets.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50 p-4 text-center">
        {category === "uploads" ? (
          <>
            <Upload className="h-10 w-10 mb-3" />
            <p className="text-sm">Nenhum upload encontrado.</p>
            <p className="text-xs mt-1">Envie imagens para que a IA processe automaticamente.</p>
          </>
        ) : (
          <>
            <ImageIcon className="h-10 w-10 mb-3" />
            <p className="text-sm">Nenhum asset encontrado nesta categoria.</p>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto p-3">
      <div className="grid grid-cols-2 gap-2 pb-20">
        {assets.map((asset) => (
          <div 
            key={asset.id} 
            draggable
            onDragStart={(e) => handleDragStart(e, asset.url)}
            className={cn(
              "group relative border rounded-lg overflow-hidden cursor-pointer transition-all aspect-square bg-checkerboard flex items-center justify-center",
              selectedAssetId === asset.id ? "ring-2 ring-primary border-transparent" : "hover:border-primary/50"
            )}
            onClick={() => onSelectAsset(asset.id)}
            onDoubleClick={() => handleAddToCanvas(asset.url)}
          >
            {asset.type === "image" && (
              <img 
                src={asset.thumbnailUrl || asset.url} 
                alt={asset.name} 
                className="w-full h-full object-cover transition-transform group-hover:scale-105" 
                loading="lazy"
              />
            )}
            
            {/* Quick Hover Actions Overlay */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
              <div className="flex justify-end">
                <Button size="icon-sm" variant="secondary" className="h-6 w-6 text-[10px]" onClick={(e) => { e.stopPropagation(); handleAddToCanvas(asset.url); }} title="Adicionar ao Canvas">+</Button>
              </div>
              <p className="text-[10px] text-white font-medium truncate w-full" title={asset.name}>
                {asset.name}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
