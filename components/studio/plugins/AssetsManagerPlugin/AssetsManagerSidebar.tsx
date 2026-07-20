"use client"
import React, { useState, useRef } from "react"
import { Image as ImageIcon, Search, Upload, Folder, Layers, Sparkles, Shapes, Package, Video, Music, Type, Heart, Clock, Users, ChevronDown, ChevronRight, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAssetStore } from "@/store/useAssetStore"
import { AssetCategory } from "@/lib/studio/assets/AssetTypes"
import { cn } from "@/lib/utils"
import { AssetGrid } from "./AssetGrid"
import { AssetInfoPanel } from "./AssetInfoPanel"

// Estrutura de categorias escalável do Assets Manager
const CATEGORY_GROUPS = [
  {
    title: "Biblioteca",
    items: [
      { id: "all", label: "Todos os Assets", icon: Package },
      { id: "uploads", label: "Meus Uploads", icon: Upload },
      { id: "products", label: "Produtos", icon: Folder },
      { id: "ai_generated", label: "IA Geradas", icon: Sparkles },
    ]
  },
  {
    title: "Mídias & Design",
    items: [
      { id: "backgrounds", label: "Fundos", icon: ImageIcon },
      { id: "textures", label: "Texturas", icon: Shapes },
      { id: "mockups", label: "Mockups", icon: Layers },
      { id: "logos", label: "Logos", icon: ImageIcon },
      { id: "fonts", label: "Fontes", icon: Type },
    ]
  },
  {
    title: "Organização",
    items: [
      { id: "favorites", label: "Favoritos", icon: Heart },
      { id: "recents", label: "Recentes", icon: Clock },
      { id: "shared", label: "Compartilhados", icon: Users },
    ]
  }
];

export function AssetsManagerSidebar() {
  const [activeTab, setActiveTab] = useState<AssetCategory>("all");
  const [search, setSearch] = useState("");
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const addAsset = useAssetStore(state => state.addAsset);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      Array.from(files).forEach(file => {
        if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
          // IA Classification mock
          addAsset(file, "uploads");
        }
      });
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  const selectedAsset = useAssetStore(state => state.assets.find(a => a.id === selectedAssetId));

  return (
    <div className="flex h-full w-full">
      {/* Categoria Nav */}
      <div className="w-[200px] border-r bg-muted/10 flex flex-col h-full overflow-y-auto">
        <div className="p-4 shrink-0 flex items-center justify-between">
          <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Package className="h-4 w-4" /> Assets Manager
          </h3>
          <Button size="icon-sm" variant="ghost" className="h-6 w-6 shrink-0" onClick={() => fileInputRef.current?.click()} title="Upload Local">
            <Upload className="h-4 w-4" />
          </Button>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            multiple 
            accept="image/*,video/*" 
            onChange={handleFileUpload}
          />
        </div>

        <div className="flex-1 px-2 space-y-4">
          {CATEGORY_GROUPS.map((group, idx) => (
            <div key={idx} className="space-y-1">
              <h4 className="text-[10px] font-semibold text-muted-foreground/70 uppercase px-2 mb-1">{group.title}</h4>
              {group.items.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => { setActiveTab(cat.id as AssetCategory); setSelectedAssetId(null); }}
                  className={cn(
                    "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs font-medium transition-colors text-left",
                    activeTab === cat.id 
                      ? "bg-primary text-primary-foreground shadow-sm" 
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <cat.icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{cat.label}</span>
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Grid Area */}
      <div className="w-[320px] flex flex-col border-r h-full bg-background relative">
        <div className="p-4 border-b shrink-0">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar em todas as categorias..." 
              className="pl-9 h-9 text-xs" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-hidden relative">
           <AssetGrid 
             category={activeTab} 
             searchQuery={search} 
             onSelectAsset={setSelectedAssetId} 
             selectedAssetId={selectedAssetId}
           />
        </div>
      </div>

      {/* Info Panel Contextual (Abre se um asset for selecionado no Manager) */}
      {selectedAsset && (
        <AssetInfoPanel asset={selectedAsset} onClose={() => setSelectedAssetId(null)} />
      )}
    </div>
  )
}
