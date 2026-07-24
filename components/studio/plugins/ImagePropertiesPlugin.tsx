"use client"

import React, { useEffect, useState } from "react"
import { useSelectionStore } from "@/store/useSelectionStore"
import { useStudioStore } from "@/store/useStudioStore"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { ImageIcon, Sun, Contrast, Droplets, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ImagePropertiesPlugin() {
  const { selectedIds } = useSelectionStore();
  const engine = useStudioStore(state => state.engine);
  const selectedObjectType = useStudioStore(state => state.selectedObjectType);
  
  // Local state for sliders (to avoid lag while dragging)
  const [adjustments, setAdjustments] = useState({
    brightness: 0,
    contrast: 0,
    saturation: 0,
    blur: 0
  });

  // Somente renderiza se for imagem
  if (selectedIds.length !== 1 || selectedObjectType !== 'image') {
    return null;
  }

  const objectId = selectedIds[0];

  // Carregar estado inicial
  useEffect(() => {
    if (engine) {
      const currentAdj = engine.getAdjustments(objectId) || {};
      setAdjustments({
        brightness: currentAdj.brightness || 0,
        contrast: currentAdj.contrast || 0,
        saturation: currentAdj.saturation || 0,
        blur: currentAdj.blur || 0,
      });
    }
  }, [objectId, engine]);

  const handleAdjustmentChange = (type: string, value: number) => {
    setAdjustments(prev => ({ ...prev, [type]: value }));
    if (engine) {
      engine.applyAdjustment(objectId, type as any, value);
    }
  };

  const handleReset = () => {
    setAdjustments({ brightness: 0, contrast: 0, saturation: 0, blur: 0 });
    if (engine) {
      engine.applyAdjustment(objectId, 'brightness', null);
      engine.applyAdjustment(objectId, 'contrast', null);
      engine.applyAdjustment(objectId, 'saturation', null);
    }
  };

  return (
    <div className="flex flex-col gap-4 text-sm p-4 animate-in fade-in slide-in-from-right-4">
      
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <ImageIcon className="h-4 w-4" /> Imagem
        </h3>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleReset} title="Resetar Ajustes">
          <RotateCcw className="h-3 w-3 text-muted-foreground" />
        </Button>
      </div>

      <Separator />

      <div className="space-y-4">
        {/* Brightness */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <Sun className="h-3 w-3" /> Brilho
            </Label>
            <span className="text-xs font-mono">{adjustments.brightness.toFixed(2)}</span>
          </div>
          <Slider 
            value={[adjustments.brightness]} 
            min={-1} 
            max={1} 
            step={0.01} 
            onValueChange={([val]) => handleAdjustmentChange('brightness', val)}
          />
        </div>

        {/* Contrast */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <Contrast className="h-3 w-3" /> Contraste
            </Label>
            <span className="text-xs font-mono">{adjustments.contrast.toFixed(2)}</span>
          </div>
          <Slider 
            value={[adjustments.contrast]} 
            min={-1} 
            max={1} 
            step={0.01} 
            onValueChange={([val]) => handleAdjustmentChange('contrast', val)}
          />
        </div>

        {/* Saturation */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <Droplets className="h-3 w-3" /> Saturação
            </Label>
            <span className="text-xs font-mono">{adjustments.saturation.toFixed(2)}</span>
          </div>
          <Slider 
            value={[adjustments.saturation]} 
            min={-1} 
            max={1} 
            step={0.01} 
            onValueChange={([val]) => handleAdjustmentChange('saturation', val)}
          />
        </div>
        
      </div>
      
    </div>
  )
}
