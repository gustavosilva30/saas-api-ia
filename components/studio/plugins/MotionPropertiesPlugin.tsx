"use client"
import React, { useState, useEffect } from "react"
import { Play } from "lucide-react"
import { StudioPlugin } from "@/lib/studio/plugins/BasePlugin"
import { useTimelineStore } from "@/store/useTimelineStore"
import { MotionLibrary } from "@/lib/studio/engine/MotionLibrary"
import { EasingFunctions } from "@/lib/studio/engine/EasingFunctions"

function MotionPropertiesContextPanel() {
  const [clipData, setClipData] = useState<{ layerId: string, clip: any } | null>(null);

  // Inscreve-se apenas quando selecionado
  useEffect(() => {
    return useTimelineStore.subscribe(state => {
      const selectedId = state.selectedClipId;
      if (!selectedId) {
        setClipData(null);
        return;
      }
      
      let found = false;
      Object.entries(state.tracks).forEach(([layerId, track]) => {
        const clip = track.clips.find(c => c.id === selectedId);
        if (clip) {
          setClipData({ layerId, clip });
          found = true;
        }
      });
      if (!found) setClipData(null);
    });
  }, []);

  if (!clipData) return null;

  const { layerId, clip } = clipData;
  const [activeTab, setActiveTab] = useState<"Entrada" | "Saída" | "Ênfase">("Entrada");
  const updateClip = (key: string, value: any) => {
    useTimelineStore.getState().updateClip(layerId, clip.id, { [key]: value });
  };

  const animDef = MotionLibrary[clip.preset];
  const animations = Object.values(MotionLibrary);
  const filteredAnims = animations.filter(a => a.category === activeTab);

  return (
    <div className="flex flex-col p-4 gap-4 border-b">
      <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground border-b pb-2 flex items-center gap-2">
        <Play className="size-4" /> Motion Settings
      </h3>
      
      <div className="text-xs text-muted-foreground mb-1">
        Anim: <strong className="text-foreground">{animDef?.name || clip.preset}</strong>
      </div>

      {/* Tabs for Categories */}
      <div className="flex bg-muted p-1 rounded-md mb-2">
        {(["Entrada", "Saída", "Ênfase"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 text-[10px] font-medium py-1 rounded-sm ${activeTab === tab ? "bg-background shadow-sm" : "text-muted-foreground"}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Motion Browser Grid */}
      <div className="grid grid-cols-3 gap-2 mb-4 max-h-48 overflow-y-auto pr-1">
        {filteredAnims.map(anim => (
          <button
            key={anim.id}
            onClick={() => updateClip("preset", anim.id)}
            className={`p-2 border rounded-md flex flex-col items-center justify-center gap-1 transition-all
              ${clip.preset === anim.id ? "border-primary bg-primary/10" : "hover:border-primary/50 bg-card"}
            `}
          >
            <div className="w-8 h-6 bg-muted rounded border border-border flex items-center justify-center mb-1">
              <Play className="w-3 h-3 text-muted-foreground" />
            </div>
            <span className="text-[9px] font-medium text-center leading-tight">{anim.name}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {/* Easing */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold">Suavização (Easing)</label>
          <select 
            className="text-xs border rounded-md px-2 py-1.5 bg-background text-foreground"
            value={clip.easing || animDef?.defaultEasing || "linear"}
            onChange={(e) => updateClip("easing", e.target.value)}
          >
            {Object.keys(EasingFunctions).map(easing => (
              <option key={easing} value={easing}>{easing}</option>
            ))}
          </select>
        </div>

        {/* Duration */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold">Duração ({clip.duration}ms)</label>
          <input 
            type="range" 
            min="100" 
            max="3000" 
            step="100"
            value={clip.duration}
            onChange={(e) => updateClip("duration", parseInt(e.target.value))}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}

export const MotionPropertiesPlugin: StudioPlugin = {
  id: "motion-properties",
  name: "Motion",
  icon: Play, // Usado apenas para a interface do plugin caso seja necessário
  ContextComponent: MotionPropertiesContextPanel,
}
