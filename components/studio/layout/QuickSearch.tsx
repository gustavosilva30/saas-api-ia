"use client"
import React, { useEffect, useState, useRef } from "react"
import { useKeyboardStore } from "@/store/useKeyboardStore"
import { PluginManager } from "@/lib/studio/plugins/PluginManager"
import { globalCommandManager } from "@/lib/studio/commands/GlobalCommandManager"
import { Search, Command, ArrowRight } from "lucide-react"

export function QuickSearch() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  
  const registerHotkey = useKeyboardStore(state => state.registerHotkey)
  const unregisterHotkey = useKeyboardStore(state => state.unregisterHotkey)

  useEffect(() => {
    // Registra Ctrl + K (ou Cmd + K)
    registerHotkey({
      id: 'quick-search',
      keys: ['Control', 'k'],
      preventDefault: true,
      callback: () => {
        setIsOpen(true)
      }
    })
    
    // Suporte a Cmd no Mac
    registerHotkey({
      id: 'quick-search-mac',
      keys: ['Meta', 'k'],
      preventDefault: true,
      callback: () => {
        setIsOpen(true)
      }
    })

    // Esc (fechar)
    registerHotkey({
      id: 'quick-search-close',
      keys: ['Escape'],
      callback: () => {
        setIsOpen(false)
      }
    })

    return () => {
      unregisterHotkey('quick-search')
      unregisterHotkey('quick-search-mac')
      unregisterHotkey('quick-search-close')
    }
  }, [registerHotkey, unregisterHotkey])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
    }
  }, [isOpen])

  if (!isOpen) return null;

  // Busca comandos de plugins
  const plugins = PluginManager.getAllPlugins();
  const allActions = plugins.flatMap(p => p.aiActions ? p.aiActions.map(a => ({ ...a, pluginName: p.name })) : []);
  
  // Filtra as ações baseado na busca
  const filteredActions = allActions.filter(a => a.label.toLowerCase().includes(query.toLowerCase()));

  const handleAction = async (action: any) => {
    setIsOpen(false);
    // Idealmente encapsular a action em um ICommand para entrar no Undo/Redo
    try {
      await action.execute({});
    } catch(err) {
      console.error("Action failed", err);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-background/50 backdrop-blur-sm">
      
      {/* Click fora para fechar */}
      <div className="absolute inset-0 z-0" onClick={() => setIsOpen(false)} />

      <div className="relative z-10 w-full max-w-lg bg-card rounded-xl shadow-2xl border flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        <div className="flex items-center px-4 py-3 border-b gap-3">
          <Search className="h-5 w-5 text-muted-foreground" />
          <input 
            ref={inputRef}
            className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground"
            placeholder="Buscar ferramentas ou perguntar à IA..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="flex gap-1">
            <kbd className="bg-muted px-1.5 py-0.5 rounded text-[10px] font-medium text-muted-foreground">ESC</kbd>
          </div>
        </div>

        <div className="flex-1 max-h-64 overflow-y-auto p-2">
          {filteredActions.length === 0 ? (
            <div className="text-center py-6 text-sm text-muted-foreground">
              Nenhuma ação encontrada.
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase font-bold text-muted-foreground px-2 py-1">Ações Disponíveis</span>
              {filteredActions.map(action => (
                <button 
                  key={action.actionId}
                  onClick={() => handleAction(action)}
                  className="flex items-center justify-between w-full px-3 py-2 text-sm text-left rounded-md hover:bg-primary/10 hover:text-primary transition-colors group"
                >
                  <div className="flex items-center gap-2">
                    <Command className="h-4 w-4 opacity-50" />
                    <span>{action.label}</span>
                  </div>
                  <span className="text-xs text-muted-foreground group-hover:text-primary/70">{action.pluginName}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        
        <div className="bg-muted/30 px-4 py-2 border-t flex justify-between items-center">
          <span className="text-xs text-muted-foreground">Use as setas para navegar</span>
          <span className="text-xs font-semibold flex items-center gap-1">DevTools <ArrowRight className="h-3 w-3"/></span>
        </div>
      </div>
    </div>
  )
}
