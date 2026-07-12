"use client"
import React, { useEffect, useRef } from "react"
import { Play, Pause, SkipBack, Scissors, Clock, Settings2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { useTimelineStore } from "@/store/useTimelineStore"

export function TimelinePlugin() {
  const { currentTime, duration, isPlaying, play, pause, seek } = useTimelineStore();
  const timelineRef = useRef<HTMLDivElement>(null);

  // Formata ms em "00:00:00" (min:sec:frames/ms)
  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
    const seconds = (totalSeconds % 60).toString().padStart(2, "0");
    const frames = Math.floor((ms % 1000) / (1000/60)).toString().padStart(2, "0"); // Aproximação de 60fps
    return `${minutes}:${seconds}:${frames}`;
  };

  const handleSeek = (values: number[]) => {
    if (values[0] !== undefined) {
      seek(values[0]);
    }
  };

  // Mock de layers animáveis
  const layers = [
    { id: "L1", name: "Produto.png", type: "Image" },
    { id: "L2", name: "Selo Preço", type: "Group" },
    { id: "L3", name: "Fundo Preto", type: "Shape" },
  ];

  return (
    <div className="h-64 border-t bg-background flex flex-col shadow-inner z-50">
      
      {/* Controles (Transport) */}
      <div className="h-12 border-b flex items-center px-4 justify-between bg-muted/30">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="size-8" onClick={() => seek(0)}>
            <SkipBack className="size-4" />
          </Button>
          <Button 
            variant="default" 
            size="icon" 
            className="size-8 rounded-full shadow-sm" 
            onClick={isPlaying ? pause : play}
          >
            {isPlaying ? <Pause className="size-4" /> : <Play className="size-4 ml-0.5" />}
          </Button>
          
          <div className="ml-4 flex items-center gap-2 bg-background border px-3 py-1 rounded-md font-mono text-sm text-primary shadow-inner">
            <Clock className="size-3.5 text-muted-foreground" />
            {formatTime(currentTime)}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="size-8">
            <Scissors className="size-4 text-muted-foreground" />
          </Button>
          <Button variant="ghost" size="icon" className="size-8">
            <Settings2 className="size-4 text-muted-foreground" />
          </Button>
        </div>
      </div>

      {/* Régua e Layers */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Painel Esquerdo (Lista de Layers) */}
        <div className="w-64 border-r bg-muted/10 overflow-y-auto hidden md:block">
          <div className="h-8 border-b bg-muted/30 flex items-center px-3 text-xs font-semibold text-muted-foreground uppercase">
            Layers
          </div>
          <div className="flex flex-col">
            {layers.map(layer => (
              <div key={layer.id} className="h-10 border-b flex items-center px-3 text-sm hover:bg-muted/50 cursor-pointer">
                <span className="truncate">{layer.name}</span>
                <span className="ml-auto text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded uppercase">{layer.type}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Área da Timeline (Keyframes e Agulha) */}
        <div className="flex-1 relative flex flex-col bg-muted/5">
          {/* Régua de Tempo */}
          <div className="h-8 border-b bg-muted/30 flex items-center px-4 relative">
             <Slider 
                value={[currentTime]} 
                max={duration} 
                step={16.66} // ~60fps
                onValueChange={handleSeek}
                className="absolute inset-x-4 top-1/2 -translate-y-1/2 z-20 cursor-grab active:cursor-grabbing"
              />
          </div>

          {/* Faixas de Tempo (Tracks) */}
          <div className="flex-1 relative overflow-y-auto">
             {/* Agulha de Reprodução (Playhead visual) */}
             <div 
               className="absolute top-0 bottom-0 w-px bg-red-500 z-10 pointer-events-none"
               style={{ left: `calc(1rem + (100% - 2rem) * (${currentTime} / ${duration}))` }}
             >
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full w-3 h-3 bg-red-500 clip-playhead" style={{ clipPath: 'polygon(0 0, 100% 0, 50% 100%)' }} />
             </div>

             {layers.map((layer, i) => (
                <div key={layer.id} className="h-10 border-b relative group">
                  {/* Mock de um bloco de animação (Clip) */}
                  <div className="absolute top-1 bottom-1 bg-primary/20 border border-primary/50 rounded-sm" 
                       style={{ left: `${10 + i * 5}%`, right: `${10 + (2-i) * 5}%` }}>
                    <div className="text-[10px] font-medium text-primary p-1 truncate">Motion Block</div>
                  </div>
                </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  )
}
