"use client"
import React, { useEffect, useState } from "react"
import { Palette, Type, Image as ImageIcon, Volume2, Save, Plus, Trash2, Loader2, Sparkles } from "lucide-react"
import { StudioPlugin } from "@/lib/studio/plugins/BasePlugin"
import { useStudioStore } from "@/store/useStudioStore"
import { useSelectionStore } from "@/store/useSelectionStore"
import { useBrandKitStore } from "@/store/useBrandKitStore"
import { globalCommandManager } from "@/lib/studio/commands/GlobalCommandManager"
import { ApplyBrandKitCommand } from "@/lib/studio/commands/ApplyBrandKitCommand"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

function BrandKitSidebar() {
  const engine = useStudioStore((state) => state.engine)
  const { selectedIds } = useSelectionStore()
  const { brandKit, isLoading, error, fetchBrandKit, saveBrandKit } = useBrandKitStore()

  // Estados locais para edição
  const [brandName, setBrandName] = useState("Minha Marca")
  const [colors, setColors] = useState<string[]>([])
  const [newColor, setNewColor] = useState("#8b5cf6")
  const [primaryFont, setPrimaryFont] = useState("Inter")
  const [secondaryFont, setSecondaryFont] = useState("Roboto")
  const [logoLight, setLogoLight] = useState("")
  const [logoDark, setLogoDark] = useState("")
  const [logoIcon, setLogoIcon] = useState("")
  const [toneOfVoice, setToneOfVoice] = useState("professional")

  useEffect(() => {
    fetchBrandKit()
  }, [])

  // Atualiza estados locais quando a store for carregada
  useEffect(() => {
    if (brandKit) {
      setBrandName(brandKit.name || "Minha Marca")
      setColors(brandKit.colors || [])
      setPrimaryFont(brandKit.typography?.primary || "Inter")
      setSecondaryFont(brandKit.typography?.secondary || "Roboto")
      setLogoLight(brandKit.logos?.light || "")
      setLogoDark(brandKit.logos?.dark || "")
      setLogoIcon(brandKit.logos?.icon || "")
      setToneOfVoice(brandKit.tone_of_voice || "professional")
    }
  }, [brandKit])

  const handleSave = async () => {
    const data = {
      name: brandName,
      colors,
      typography: { primary: primaryFont, secondary: secondaryFont },
      logos: { light: logoLight, dark: logoDark, icon: logoIcon },
      tone_of_voice: toneOfVoice
    }
    const { toast } = require("sonner")
    try {
      await saveBrandKit(data)
      toast.success("Identidade de Marca salva com sucesso!")
    } catch (e) {
      toast.error("Erro ao salvar Brand Kit.")
    }
  }

  const addColor = () => {
    if (newColor && !colors.includes(newColor)) {
      setColors([...colors, newColor])
    }
  }

  const removeColor = (idx: number) => {
    setColors(colors.filter((_, i) => i !== idx))
  }

  const applyColor = (colorIndex: number) => {
    if (!engine || selectedIds.length === 0 || !brandKit) return
    const { toast } = require("sonner")
    
    selectedIds.forEach((id) => {
      globalCommandManager.executeCommand(
        new ApplyBrandKitCommand(id, brandKit, "color", { colorIndex })
      )
    })
    engine.requestRender()
    toast.success("Cor da marca aplicada ao elemento!")
  }

  const applyFont = (fontType: "primary" | "secondary") => {
    if (!engine || selectedIds.length === 0 || !brandKit) return
    const { toast } = require("sonner")

    selectedIds.forEach((id) => {
      globalCommandManager.executeCommand(
        new ApplyBrandKitCommand(id, brandKit, "font", { fontType })
      )
    })
    engine.requestRender()
    toast.success("Fonte da marca aplicada ao texto!")
  }

  const insertLogo = () => {
    if (!engine || !brandKit) return
    const { toast } = require("sonner")
    
    globalCommandManager.executeCommand(
      new ApplyBrandKitCommand("", brandKit, "logo")
    )
    toast.success("Logo inserida no canvas!")
  }

  return (
    <div className="w-80 border-r bg-background flex flex-col p-4 overflow-y-auto gap-4">
      <div className="flex items-center justify-between border-b pb-2">
        <h3 className="text-sm font-semibold flex items-center gap-2 uppercase tracking-wider text-muted-foreground">
          <Palette className="h-4 w-4 text-primary" />
          Brand Kit
        </h3>
        <Button size="xs" onClick={handleSave} disabled={isLoading} className="gap-1 text-xs">
          {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          Salvar Kit
        </Button>
      </div>

      {isLoading && !brandKit ? (
        <div className="flex flex-col items-center justify-center py-20 gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span>Carregando identidade de marca...</span>
        </div>
      ) : (
        <div className="flex flex-col gap-4 animate-in fade-in">
          {/* Nome da Marca */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase font-bold text-muted-foreground">Nome da Identidade</label>
            <Input 
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              className="h-8 text-xs"
              placeholder="Ex: Minha Empresa"
            />
          </div>

          {/* Paleta de Cores */}
          <div className="flex flex-col gap-2 border-t pt-3">
            <div className="flex items-center justify-between">
              <label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                <Palette className="h-3 w-3" /> Cores da Marca
              </label>
              <span className="text-[9px] text-muted-foreground">Clique para aplicar</span>
            </div>
            
            <div className="flex flex-wrap gap-1.5 p-2 bg-muted/40 rounded-lg min-h-[40px]">
              {colors.map((color, i) => (
                <div key={i} className="group relative">
                  <button
                    onClick={() => applyColor(i)}
                    className="w-7 h-7 rounded-full border border-border shadow-sm hover:scale-105 transition-transform"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                  <button
                    onClick={() => removeColor(i)}
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-2 w-2" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Input
                type="color"
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
                className="w-10 h-8 p-1 cursor-pointer"
              />
              <Input
                type="text"
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
                className="h-8 text-xs font-mono"
              />
              <Button size="icon" variant="outline" className="h-8 w-8 shrink-0" onClick={addColor}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Fontes */}
          <div className="flex flex-col gap-2 border-t pt-3">
            <label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
              <Type className="h-3 w-3" /> Tipografia
            </label>
            
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 flex flex-col gap-0.5">
                  <span className="text-[10px] text-muted-foreground">Fonte Primária</span>
                  <Input 
                    value={primaryFont} 
                    onChange={(e) => setPrimaryFont(e.target.value)} 
                    className="h-8 text-xs font-medium" 
                  />
                </div>
                <Button size="sm" variant="ghost" className="h-8 text-[11px] self-end" onClick={() => applyFont("primary")}>
                  Aplicar
                </Button>
              </div>

              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 flex flex-col gap-0.5">
                  <span className="text-[10px] text-muted-foreground">Fonte Secundária</span>
                  <Input 
                    value={secondaryFont} 
                    onChange={(e) => setSecondaryFont(e.target.value)} 
                    className="h-8 text-xs font-medium" 
                  />
                </div>
                <Button size="sm" variant="ghost" className="h-8 text-[11px] self-end" onClick={() => applyFont("secondary")}>
                  Aplicar
                </Button>
              </div>
            </div>
          </div>

          {/* Logos */}
          <div className="flex flex-col gap-2 border-t pt-3">
            <div className="flex items-center justify-between">
              <label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                <ImageIcon className="h-3 w-3" /> Logos & Ativos
              </label>
              <Button size="xs" variant="link" className="h-auto p-0 text-[10px] text-purple-500" onClick={insertLogo}>
                Inserir no Canvas
              </Button>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] text-muted-foreground">Logo Fundo Claro (Light URL)</span>
                <Input 
                  value={logoLight} 
                  onChange={(e) => setLogoLight(e.target.value)} 
                  className="h-8 text-xs" 
                  placeholder="https://exemplo.com/logo-light.png"
                />
              </div>

              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] text-muted-foreground">Logo Fundo Escuro (Dark URL)</span>
                <Input 
                  value={logoDark} 
                  onChange={(e) => setLogoDark(e.target.value)} 
                  className="h-8 text-xs" 
                  placeholder="https://exemplo.com/logo-dark.png"
                />
              </div>
            </div>
          </div>

          {/* Tom de Voz IA */}
          <div className="flex flex-col gap-2 border-t pt-3 p-3 bg-purple-500/5 border border-purple-500/20 rounded-lg">
            <label className="text-[10px] uppercase font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1">
              <Volume2 className="h-3.5 w-3.5" /> Tom de Voz IA
            </label>
            <select
              value={toneOfVoice}
              onChange={(e) => setToneOfVoice(e.target.value)}
              className="text-xs p-2 border rounded bg-background w-full"
            >
              <option value="professional">💼 Profissional & Sério</option>
              <option value="casual">💬 Amigável & Casual</option>
              <option value="bold">🔥 Ousado & Persuasivo</option>
              <option value="luxury">✨ Sofisticado & Premium</option>
              <option value="humorous">😄 Divertido & Descontraído</option>
            </select>
            <p className="text-[9px] text-muted-foreground leading-tight mt-1 flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-purple-500" />
              A IA geradora de textos do copywriting de campanhas usará este tom automaticamente.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export const BrandKitPlugin: StudioPlugin = {
  id: "brandkit",
  name: "Marca",
  icon: Palette,
  SidebarComponent: BrandKitSidebar,
}
