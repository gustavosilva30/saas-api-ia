"use client"
import React, { useState, useRef } from "react"
import { Image as ImageIcon, Search, Upload, Folder, Layers, Sparkles, Shapes } from "lucide-react"
import { StudioPlugin } from "@/lib/studio/plugins/BasePlugin"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AddImageCommand } from "@/lib/studio/commands/AddImageCommand"
import { CommandManager } from "@/lib/studio/commands/CommandManager"
import { useAssetStore, AssetCategory } from "@/store/useAssetStore"
import { cn } from "@/lib/utils"

export const localCommandManager = new CommandManager();

const CATEGORIES: { id: AssetCategory; label: string; icon: React.ElementType }[] = [
  { id: "uploads", label: "Meus Uploads", icon: Folder },
  { id: "mockups", label: "Mockups", icon: Layers },
  { id: "textures", label: "Texturas", icon: Shapes },
  { id: "logos", label: "Logos", icon: ImageIcon },
  { id: "ia", label: "IA Geradas", icon: Sparkles },
];

function AssetsSidebar() {
  const [activeTab, setActiveTab] = useState<AssetCategory>("mockups");
  const [search, setSearch] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { getAssetsByCategory, addAsset } = useAssetStore();
  const filteredAssets = getAssetsByCategory(activeTab, search);

  const handleAddImage = (url: string) => {
    const cmd = new AddImageCommand(url);
    localCommandManager.executeCommand(cmd);
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      Array.from(files).forEach(file => {
        if (file.type.startsWith("image/")) {
          // If we are not on "uploads" tab, adding an upload switches us there
          if (activeTab !== "uploads") setActiveTab("uploads");
          addAsset(file, "uploads");
        }
      });
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="w-[320px] border-r bg-background flex flex-col h-full overflow-hidden">
      {/* Header & Search */}
      <div className="p-4 border-b space-y-4 shrink-0">
        <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground flex items-center justify-between">
          Biblioteca Visual
          <Button size="icon-sm" variant="ghost" className="h-6 w-6" onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-4 w-4" />
          </Button>
        </h3>
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          multiple 
          accept="image/*" 
          onChange={handleFileUpload}
        />
        
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar assets..." 
            className="pl-9 h-9 text-xs" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>
      
      {/* Categories Horizontal Scroll */}
      <div className="flex overflow-x-auto p-2 gap-1 border-b shrink-0 no-scrollbar">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveTab(cat.id)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
              activeTab === cat.id 
                ? "bg-primary text-primary-foreground shadow-sm" 
                : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <cat.icon className="h-3.5 w-3.5" />
            {cat.label}
          </button>
        ))}
      </div>

      {/* Assets Grid */}
      <div className="flex-1 overflow-y-auto p-3">
        {filteredAssets.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
            {activeTab === "uploads" ? (
              <>
                <Upload className="h-10 w-10 mb-3" />
                <p className="text-sm">Nenhum upload ainda.</p>
                <Button variant="link" onClick={() => fileInputRef.current?.click()}>
                  Fazer upload agora
                </Button>
              </>
            ) : (
              <>
                <ImageIcon className="h-10 w-10 mb-3" />
                <p className="text-sm">Nenhum asset encontrado.</p>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {filteredAssets.map((asset) => (
              <div 
                key={asset.id} 
                className="group relative border rounded-lg overflow-hidden cursor-pointer hover:border-primary transition-all aspect-square bg-checkerboard"
                onClick={() => handleAddImage(asset.url)}
              >
                <img 
                  src={asset.url} 
                  alt={asset.name} 
                  className="w-full h-full object-cover transition-transform group-hover:scale-105" 
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                  <p className="text-[10px] text-white font-medium truncate w-full" title={asset.name}>
                    {asset.name}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Footer Quick Action */}
      <div className="p-4 border-t shrink-0 bg-muted/20">
        <Button className="w-full text-xs h-9" onClick={() => fileInputRef.current?.click()}>
          <Upload className="mr-2 h-4 w-4" />
          Fazer Upload Local
        </Button>
      </div>
    </div>
  )
}

export const AssetsPlugin: StudioPlugin = {
  id: "assets",
  name: "Assets",
  icon: ImageIcon,
  SidebarComponent: AssetsSidebar,
}
