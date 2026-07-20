"use client"
import React, { useState } from "react"
import { Type, Search, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { FONT_CATEGORIES, loadFont } from "./TypographyFonts"
import { AddTextCommand } from "@/lib/studio/commands/AddTextCommand"
import { globalCommandManager } from "@/lib/studio/commands/GlobalCommandManager"

export function TypographySidebar() {
  const [text, setText] = useState("Novo Texto")
  const [search, setSearch] = useState("")
  const [selectedFont, setSelectedFont] = useState("Inter")
  const [fontSize, setFontSize] = useState(60)
  const [fill, setFill] = useState("#ffffff")
  const [isLoadingFont, setIsLoadingFont] = useState(false)

  const handleAddText = async () => {
    setIsLoadingFont(true)
    try {
      // Carrega a fonte dinâmica antes de adicionar ao canvas
      await loadFont(selectedFont)
      
      const cmd = new AddTextCommand(text, {
        fontFamily: selectedFont,
        fontSize,
        fill,
        textAlign: "center"
      })
      globalCommandManager.executeCommand(cmd)
    } catch (error) {
      alert("Erro ao carregar a fonte: " + selectedFont)
    } finally {
      setIsLoadingFont(false)
    }
  }

  return (
    <div className="w-80 border-r bg-background flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b space-y-4 shrink-0">
        <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Type className="h-4 w-4" /> Tipografia Premium
        </h3>
        <p className="text-xs text-muted-foreground">
          Adicione textos ao seu design com fontes otimizadas e renderização de alta qualidade.
        </p>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium">Texto Inicial</label>
          <Input 
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Digite o texto..."
            className="text-sm"
          />
        </div>

        <div className="flex gap-2">
          <div className="flex flex-col gap-2 flex-1">
            <label className="text-xs font-medium">Tamanho</label>
            <Input 
              type="number" 
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="text-sm"
            />
          </div>
          <div className="flex flex-col gap-2 flex-1">
            <label className="text-xs font-medium">Cor</label>
            <div className="flex items-center gap-2 h-9 border rounded-md px-2 bg-background">
              <input 
                type="color" 
                value={fill}
                onChange={(e) => setFill(e.target.value)}
                className="w-6 h-6 rounded cursor-pointer border-0 p-0"
              />
              <span className="text-xs uppercase">{fill}</span>
            </div>
          </div>
        </div>

        <Button 
          className="w-full" 
          onClick={handleAddText}
          disabled={isLoadingFont}
        >
          {isLoadingFont ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Carregando Fonte...
            </>
          ) : (
            "Adicionar Texto"
          )}
        </Button>
      </div>

      {/* Font Library */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar fontes..." 
            className="pl-9 h-9 text-xs" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {FONT_CATEGORIES.map((category) => {
          const filteredFonts = category.fonts.filter(f => f.toLowerCase().includes(search.toLowerCase()))
          
          if (filteredFonts.length === 0) return null;

          return (
            <div key={category.name} className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground">{category.name}</h4>
              <div className="grid grid-cols-2 gap-2">
                {filteredFonts.map(font => (
                  <button
                    key={font}
                    onClick={() => setSelectedFont(font)}
                    className={`text-xs p-2 rounded border text-left truncate transition-colors ${
                      selectedFont === font 
                        ? "bg-primary/10 border-primary text-primary font-medium" 
                        : "hover:bg-muted"
                    }`}
                    style={{ fontFamily: font === selectedFont ? font : "inherit" }}
                    title={font}
                  >
                    {font}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
