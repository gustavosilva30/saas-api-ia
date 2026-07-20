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
  const updateClip = (key: string, value: any) => {
    useTimelineStore.getState().updateClip(layerId, clip.id, { [key]: value });
  };

  const animDef = MotionLibrary[clip.preset];

  return (
    <div className="flex flex-col p-4 gap-4 border-b">
      <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground border-b pb-2 flex items-center gap-2">
        <Play className="size-4" /> Motion Settings
      </h3>
      
      <div className="text-xs text-muted-foreground mb-1">
        Anim: <strong className="text-foreground">{animDef?.name || clip.preset}</strong>
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
            {Object.keys(EasingFunctions).map(ease => (
              <option key={ease} value={ease}>{ease}</option>
            ))}
          </select>
        </div>

        {/* Delay */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold flex justify-between">
            <span>Atraso Interno (ms)</span>
            <span>{clip.delay || 0}</span>
          </label>
          <input 
            type="range" min="0" max="2000" step="100"
            value={clip.delay || 0}
            onChange={(e) => updateClip("delay", parseInt(e.target.value))}
            className="w-full"
          />
        </div>

        {/* Loop / PingPong */}
        <div className="flex items-center gap-2 mt-2">
          <input 
            type="checkbox" id="loop-cb"
            checked={clip.loop || false}
            onChange={(e) => updateClip("loop", e.target.checked)}
          />
          <label htmlFor="loop-cb" className="text-xs cursor-pointer">Repetir (Loop)</label>
        </div>

        <div className="flex items-center gap-2">
          <input 
            type="checkbox" id="ping-cb"
            checked={clip.pingPong || false}
            onChange={(e) => updateClip("pingPong", e.target.checked)}
          />
          <label htmlFor="ping-cb" className="text-xs cursor-pointer">Ping Pong (Ida e Volta)</label>
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
