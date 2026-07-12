"use client"
import React from "react"
import { Image as ImageIcon } from "lucide-react"
import { StudioPlugin } from "@/lib/studio/plugins/BasePlugin"
import { Button } from "@/components/ui/button"
import { AddImageCommand } from "@/lib/studio/commands/AddImageCommand"
import { CommandManager } from "@/lib/studio/commands/CommandManager"

// Instância local temporária apenas para registrar os comandos nesta fase
// Na versão final, isso deve ficar em um React Context superior.
export const localCommandManager = new CommandManager();

const testImages = [
  "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=200&auto=format&fit=crop", // Headphone
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=200&auto=format&fit=crop", // Shoe
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=200&auto=format&fit=crop", // Watch
]

function AssetsSidebar() {
  const handleAddImage = (url: string) => {
    const cmd = new AddImageCommand(url);
    localCommandManager.executeCommand(cmd);
  }

  return (
    <div className="w-64 border-r bg-background flex flex-col p-4 overflow-y-auto">
      <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">Assets</h3>
      <p className="text-xs text-muted-foreground mb-4">
        Clique para adicionar imagens de teste ao canvas.
      </p>
      
      <div className="grid grid-cols-2 gap-2">
        {testImages.map((url, i) => (
          <div 
            key={i} 
            className="border rounded-md overflow-hidden cursor-pointer hover:border-primary transition"
            onClick={() => handleAddImage(url)}
          >
            <img src={url} alt={`Asset ${i}`} className="w-full h-24 object-cover" />
          </div>
        ))}
      </div>
      
      <Button variant="outline" className="mt-4 w-full" disabled>
        Fazer Upload
      </Button>
    </div>
  )
}

export const AssetsPlugin: StudioPlugin = {
  id: "assets",
  name: "Assets",
  icon: ImageIcon,
  SidebarComponent: AssetsSidebar,
}
