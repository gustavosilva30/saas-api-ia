import React, { useState } from "react"
import { Palette, Upload, Sparkles, Image as ImageIcon, Layers, Settings2, Loader2 } from "lucide-react"
import { StudioPlugin } from "@/lib/studio/plugins/BasePlugin"
import { useStudioStore } from "@/store/useStudioStore"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { globalCommandManager } from "@/lib/studio/commands/GlobalCommandManager"
import { SetBackgroundCommand } from "@/lib/studio/commands/SetBackgroundCommand"
import { BackgroundAIProvider } from "@/lib/studio/ai/BackgroundAIProvider"

const SOLID_COLORS = [
  "#ffffff", "#f1f5f9", "#e2e8f0", "#cbd5e1", 
  "#000000", "#0f172a", "#1e293b", "#334155",
  "#ef4444", "#f97316", "#eab308", "#22c55e", 
  "#3b82f6", "#a855f7", "#ec4899", "#f43f5e",
  "#fcd34d", "#fca5a5", "#bef264", "#5eead4",
  "#7dd3fc", "#d8b4fe", "#fda4af", "#ffedd5"
]

const MOCK_GALLERY = [
  { id: 1, url: "https://images.unsplash.com/photo-1616423640778-28d1b53229bd?auto=format&fit=crop&q=80&w=300&h=300", name: "Estúdio Minimalista" },
  { id: 2, url: "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&q=80&w=300&h=300", name: "Madeira Premium" },
  { id: 3, url: "https://images.unsplash.com/photo-1600607688969-a5bfcd64bd2b?auto=format&fit=crop&q=80&w=300&h=300", name: "Mármore Branco" },
  { id: 4, url: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=300&h=300", name: "Tecnologia" },
  { id: 5, url: "https://images.unsplash.com/photo-1560706834-eea8c7d6b38c?auto=format&fit=crop&q=80&w=300&h=300", name: "Loja Iluminada" },
  { id: 6, url: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=300&h=300", name: "Ambiente Quente" },
]

function BackgroundSidebar() {
  const engine = useStudioStore((state) => state.engine)
  const [activeColor, setActiveColor] = useState<string>("#ffffff")
  const [aiPrompt, setAiPrompt] = useState<string>("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isAutoGenerating, setIsAutoGenerating] = useState(false)

  const handleSetColor = (color: string) => {
    setActiveColor(color)
    if (!engine) return
    const prevBg = engine.canvas?.backgroundColor as string || null;
    const command = new SetBackgroundCommand(color, null, prevBg, null);
    globalCommandManager.executeCommand(command);
  }

  const handleSetImage = (url: string) => {
    if (!engine) return
    const prevBgColor = engine.canvas?.backgroundColor as string || null;
    const command = new SetBackgroundCommand(null, url, prevBgColor, null);
    globalCommandManager.executeCommand(command);
    const { toast } = require("sonner");
    toast.success("Fundo atualizado!");
  }

  const handleGenerateAI = async () => {
    if (!aiPrompt.trim()) {
      const { toast } = require("sonner");
      return toast.error("Digite um prompt para gerar o fundo.");
    }
    
    setIsGenerating(true);
    const { toast } = require("sonner");
    toast.info("Gerando fundo com IA... Isso pode levar alguns segundos.");
    
    try {
      const result = await BackgroundAIProvider.generateBackground(aiPrompt);
      if (result.success && result.url) {
        handleSetImage(result.url);
        toast.success("Cenário gerado com sucesso!");
      }
    } catch (error) {
      toast.error("Falha ao gerar cenário.");
    } finally {
      setIsGenerating(false);
    }
  }

  const handleAutoGenerate = async () => {
    setIsAutoGenerating(true);
    const { toast } = require("sonner");
    toast.info("Analisando produto e criando fundo...");
    
    try {
      const result = await BackgroundAIProvider.autoGenerateBackgroundForObject("object_id_mock");
      if (result.success && result.url) {
        handleSetImage(result.url);
        toast.success("Auto-Fundo gerado com sucesso!");
      }
    } catch (error) {
      toast.error("Falha ao analisar produto.");
    } finally {
      setIsAutoGenerating(false);
    }
  }

  return (
    <div className="w-80 border-r bg-background flex flex-col p-4 overflow-y-auto">
      <h3 className="font-semibold mb-4 flex items-center gap-2 text-sm uppercase tracking-wider text-muted-foreground">
        <Layers className="h-4 w-4" /> Background Studio
      </h3>
      
      <Tabs defaultValue="colors" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-4">
          <TabsTrigger value="colors" className="text-[10px] px-1">Cores</TabsTrigger>
          <TabsTrigger value="gallery" className="text-[10px] px-1">Galeria</TabsTrigger>
          <TabsTrigger value="ai" className="text-[10px] px-1">IA</TabsTrigger>
          <TabsTrigger value="adjust" className="text-[10px] px-1">Ajuste</TabsTrigger>
        </TabsList>

        <TabsContent value="colors" className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold mb-2 block">Cores Sólidas</label>
            <div className="grid grid-cols-6 gap-2">
              {SOLID_COLORS.map(color => (
                <button 
                  key={color} 
                  onClick={() => handleSetColor(color)}
                  className={`w-full aspect-square rounded-md border transition cursor-pointer ${activeColor === color ? 'ring-2 ring-primary ring-offset-2' : 'hover:scale-110'}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold mb-2 block">Color Picker</label>
            <div className="flex items-center gap-2">
              <input type="color" className="w-10 h-10 rounded border" onChange={(e) => handleSetColor(e.target.value)} value={activeColor} />
              <input type="text" className="flex-1 border rounded px-2 h-10 text-sm font-mono" value={activeColor} readOnly />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="gallery" className="flex flex-col gap-4">
          <Button variant="outline" className="w-full h-12 border-dashed">
            <Upload className="mr-2 h-4 w-4" />
            Enviar Fundo Próprio
          </Button>
          <div>
            <label className="text-xs font-semibold mb-2 block">Cenários Premium</label>
            <div className="grid grid-cols-2 gap-2">
              {MOCK_GALLERY.map((bg) => (
                <div 
                  key={bg.id} 
                  className="relative group rounded-md overflow-hidden cursor-pointer border aspect-square"
                  onClick={() => handleSetImage(bg.url)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={bg.url} alt={bg.name} className="object-cover w-full h-full group-hover:scale-105 transition duration-300" />
                  <div className="absolute inset-x-0 bottom-0 bg-black/60 p-1 backdrop-blur-sm">
                    <p className="text-[9px] text-white text-center font-medium truncate">{bg.name}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="ai" className="flex flex-col gap-4">
          <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg text-center flex flex-col items-center">
            <Sparkles className="h-8 w-8 text-primary mb-2" />
            <h4 className="font-semibold text-sm text-primary mb-1">AI Background Builder</h4>
            <p className="text-xs text-muted-foreground mb-4">Gere qualquer cenário imaginável usando Inteligência Artificial e coloque seus produtos nele.</p>
            
            <textarea 
              className="w-full text-xs p-2 rounded border mb-2 min-h-[60px]"
              placeholder='Ex: "Oficina automotiva moderna, chão de concreto escuro, luzes neon azuis, textura premium..."'
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
            ></textarea>
            
            <Button className="w-full text-xs h-8" onClick={handleGenerateAI} disabled={isGenerating}>
              {isGenerating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Gerando...</> : "Gerar Cenário"}
            </Button>
          </div>

          <div className="p-4 border rounded-lg">
            <h4 className="font-semibold text-xs mb-1">Auto Background</h4>
            <p className="text-[10px] text-muted-foreground mb-3">A IA analisa seu produto no Canvas e cria um fundo perfeito.</p>
            <Button variant="secondary" className="w-full text-xs h-8" onClick={handleAutoGenerate} disabled={isAutoGenerating}>
              {isAutoGenerating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analisando...</> : "Detectar & Gerar"}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="adjust" className="flex flex-col gap-4">
          <div className="flex flex-col gap-5 p-2">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-semibold">Opacidade</label>
                <span className="text-[10px] text-muted-foreground">100%</span>
              </div>
              <Slider defaultValue={[100]} max={100} step={1} />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-semibold">Desfoque (Blur)</label>
                <span className="text-[10px] text-muted-foreground">0px</span>
              </div>
              <Slider defaultValue={[0]} max={20} step={1} />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-semibold">Temperatura</label>
                <span className="text-[10px] text-muted-foreground">0</span>
              </div>
              <Slider defaultValue={[0]} min={-50} max={50} step={1} />
            </div>
          </div>
        </TabsContent>

      </Tabs>
    </div>
  )
}

export const BackgroundPlugin: StudioPlugin = {
  id: "background",
  name: "Fundo",
  icon: Palette,
  SidebarComponent: BackgroundSidebar,
}
