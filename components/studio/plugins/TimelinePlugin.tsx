"use client"
import React, { useRef, useState } from "react"
import { Play, Pause, SkipBack, Scissors, Clock, Settings2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { useTimelineStore, AnimationPreset } from "@/store/useTimelineStore"
import { useStudioStore } from "@/store/useStudioStore"

export function TimelinePlugin() {
  const { currentTime, duration, isPlaying, play, pause, seek, tracks, addClip, updateClip } = useTimelineStore();
  const { layers } = useStudioStore();
  const timelineRef = useRef<HTMLDivElement>(null);
  
  const [selectedLayer, setSelectedLayer] = useState<string | null>(null);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
    const seconds = (totalSeconds % 60).toString().padStart(2, "0");
    const frames = Math.floor((ms % 1000) / (1000/60)).toString().padStart(2, "0");
    return `${minutes}:${seconds}:${frames}`;
  };

  const handleSeek = (values: number[]) => {
    if (values[0] !== undefined) seek(values[0]);
  };

  const handleAddClip = (layerId: string) => {
    addClip(layerId, {
      id: Math.random().toString(36).substr(2, 9),
      preset: "float",
      startTime: currentTime,
      duration: 1000
    });
  };

  const handlePresetChange = (layerId: string, clipId: string, preset: AnimationPreset) => {
    updateClip(layerId, clipId, { preset });
  };

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

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-semibold text-muted-foreground">Velocidade</span>
            <select 
              className="text-xs bg-background border rounded px-1.5 py-1 text-foreground"
              value={useTimelineStore(s => s.playbackRate)}
              onChange={(e) => useTimelineStore.getState().setPlaybackRate(Number(e.target.value))}
            >
              <option value={0.5}>0.5x</option>
              <option value={1}>1.0x</option>
              <option value={1.5}>1.5x</option>
              <option value={2}>2.0x</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-semibold text-muted-foreground">Duração</span>
            <select 
              className="text-xs bg-background border rounded px-1.5 py-1 text-foreground"
              value={duration}
              onChange={(e) => useTimelineStore.getState().setDuration(Number(e.target.value))}
            >
              <option value={3000}>3s</option>
              <option value={5000}>5s</option>
              <option value={10000}>10s</option>
              <option value={15000}>15s</option>
              <option value={30000}>30s</option>
            </select>
          </div>

          <div className="h-4 w-px bg-border mx-1" />

          {selectedLayer && (
             <Button variant="outline" size="sm" onClick={() => handleAddClip(selectedLayer)} className="h-7 text-xs">
               <Plus className="size-3 mr-1" /> Anim Layer
             </Button>
          )}
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
            {layers.length === 0 && <div className="p-4 text-xs text-muted-foreground">Nenhuma camada adicionada no Canvas.</div>}
            {layers.map(layer => (
              <div 
                key={layer.id} 
                className={`h-10 border-b flex items-center px-3 text-sm cursor-pointer ${selectedLayer === layer.id ? 'bg-primary/10' : 'hover:bg-muted/50'}`}
                onClick={() => setSelectedLayer(layer.id)}
              >
                <span className="truncate">{layer.name}</span>
                <span className="ml-auto text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded uppercase">{layer.type}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Área da Timeline */}
        <div className="flex-1 relative flex flex-col bg-muted/5">
          <div className="h-8 border-b bg-muted/30 flex items-center px-4 relative">
             <Slider 
                value={[currentTime]} 
                max={duration} 
                step={16.66}
                onValueChange={handleSeek}
                className="absolute inset-x-4 top-1/2 -translate-y-1/2 z-20 cursor-grab active:cursor-grabbing"
              />
          </div>

          <div 
            className="flex-1 relative overflow-y-auto cursor-text"
            ref={timelineRef}
            onPointerDown={(e) => {
              if (!timelineRef.current) return;
              
              // Se clicou em um select ou clip, ignorar para não conflitar com drag de clip
              if ((e.target as HTMLElement).tagName === 'SELECT' || (e.target as HTMLElement).closest('.clip-draggable')) return;
              
              const rect = timelineRef.current.getBoundingClientRect();
              const padding = 16; // 1rem
              const width = rect.width - (padding * 2);
              
              const updateTime = (clientX: number) => {
                let x = clientX - rect.left - padding;
                x = Math.max(0, Math.min(x, width));
                useTimelineStore.getState().seek((x / width) * duration);
              };
              
              updateTime(e.clientX);
              
              const onMove = (moveEvt: PointerEvent) => updateTime(moveEvt.clientX);
              const onUp = () => {
                window.removeEventListener("pointermove", onMove);
                window.removeEventListener("pointerup", onUp);
              };
              
              window.addEventListener("pointermove", onMove);
              window.addEventListener("pointerup", onUp);
            }}
          >
             <div 
               className="absolute top-0 bottom-0 w-px bg-red-500 z-10 pointer-events-none"
               style={{ left: `calc(1rem + (100% - 2rem) * (${currentTime} / ${duration}))` }}
             >
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full w-3 h-3 bg-red-500 clip-playhead" style={{ clipPath: 'polygon(0 0, 100% 0, 50% 100%)' }} />
             </div>

             {layers.map((layer) => {
                const track = tracks[layer.id];
                return (
                  <div key={layer.id} className="h-10 border-b relative group">
                    {track && track.clips.map(clip => {
                       const leftPct = (clip.startTime / duration) * 100;
                       const widthPct = (clip.duration / duration) * 100;
                       
                       return (
                         <div key={clip.id} 
                              className="absolute top-1 bottom-1 bg-primary/20 border border-primary/50 rounded-sm flex items-center px-1 clip-draggable group/clip select-none" 
                              style={{ left: `calc(1rem + (100% - 2rem) * (${leftPct} / 100))`, width: `calc((100% - 2rem) * (${widthPct} / 100))` }}
                              onPointerDown={(e) => {
                                e.stopPropagation();
                                if (!timelineRef.current) return;
                                const rect = timelineRef.current.getBoundingClientRect();
                                const padding = 16;
                                const trackWidth = rect.width - (padding * 2);
                                const msPerPixel = duration / trackWidth;
                                
                                const isResizingRight = e.nativeEvent.offsetX > (e.currentTarget.offsetWidth - 10);
                                const isResizingLeft = e.nativeEvent.offsetX < 10;
                                
                                const startX = e.clientX;
                                const initialStartTime = clip.startTime;
                                const initialDuration = clip.duration;
                                
                                const onMove = (moveEvt: PointerEvent) => {
                                  const deltaX = moveEvt.clientX - startX;
                                  const deltaMs = deltaX * msPerPixel;
                                  
                                  if (isResizingRight) {
                                    updateClip(layer.id, clip.id, { duration: Math.max(100, initialDuration + deltaMs) });
                                  } else if (isResizingLeft) {
                                    const newStart = Math.max(0, initialStartTime + deltaMs);
                                    const newDuration = Math.max(100, initialDuration - (newStart - initialStartTime));
                                    updateClip(layer.id, clip.id, { startTime: newStart, duration: newDuration });
                                  } else {
                                    // Move
                                    updateClip(layer.id, clip.id, { startTime: Math.max(0, initialStartTime + deltaMs) });
                                  }
                                };
                                
                                const onUp = () => {
                                  window.removeEventListener("pointermove", onMove);
                                  window.removeEventListener("pointerup", onUp);
                                };
                                
                                window.addEventListener("pointermove", onMove);
                                window.addEventListener("pointerup", onUp);
                              }}
                          >
                           {/* Drag handle (esquerda e direita) visual */}
                           <div className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize opacity-0 group-hover/clip:opacity-100 hover:bg-primary/50" />
                           <div className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize opacity-0 group-hover/clip:opacity-100 hover:bg-primary/50" />
                           
                           <select 
                             className="text-[10px] bg-transparent font-medium text-primary outline-none cursor-pointer w-full text-center z-10"
                             value={clip.preset}
                             onChange={(e) => handlePresetChange(layer.id, clip.id, e.target.value as AnimationPreset)}
                             onPointerDown={(e) => e.stopPropagation()}
                           >
                             <option value="fade-in">Fade In</option>
                             <option value="slide-in">Slide In</option>
                             <option value="float">Float</option>
                             <option value="pulse">Pulse</option>
                           </select>
                         </div>
                       )
                    })}
                  </div>
                )
             })}
          </div>
        </div>
      </div>
    </div>
  )
}
