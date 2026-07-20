import { IRenderEngine } from "./IRenderEngine";
import { useTimelineStore, AnimationPreset } from "@/store/useTimelineStore";
import { EventBus, StudioEvent } from "../events/EventBus";

interface BaseState {
  startY: number;
  startX: number;
  startOpacity: number;
  startScaleX: number;
  startScaleY: number;
}

export class MotionEngine {
  private static instance: MotionEngine;
  private renderEngine: IRenderEngine | null = null;
  private unsubscribeTimeline: (() => void) | null = null;
  
  private animatedLayers: Map<string, BaseState> = new Map();

  private constructor() {
    this.setupEvents();
  }

  public static getInstance(): MotionEngine {
    if (!MotionEngine.instance) {
      MotionEngine.instance = new MotionEngine();
    }
    return MotionEngine.instance;
  }

  public attachRenderEngine(engine: IRenderEngine) {
    this.renderEngine = engine;
    
    // Sync existing layers (ex: Auto-Save / Init)
    const layers = engine.getLayers();
    layers.forEach(layer => {
      const props = engine.getObjectProperties(layer.id);
      if (props) {
        this.animatedLayers.set(layer.id, {
          startY: props.top ?? 0,
          startX: props.left ?? 0,
          startOpacity: props.opacity ?? 1,
          startScaleX: props.scaleX ?? 1,
          startScaleY: props.scaleY ?? 1,
        });
      }
    });
    
    // Zustand plain subscribe
    this.unsubscribeTimeline = useTimelineStore.subscribe(
      (state, prevState) => {
        if (state.currentTime !== prevState.currentTime) {
          this.updateFrame(state.currentTime);
        }
      }
    );
  }

  public detachRenderEngine() {
    this.renderEngine = null;
    if (this.unsubscribeTimeline) {
      this.unsubscribeTimeline();
      this.unsubscribeTimeline = null;
    }
  }

  private setupEvents() {
    EventBus.on(StudioEvent.OBJECT_ADDED, (obj: any) => {
      if (obj && obj.id && this.renderEngine) {
        const props = this.renderEngine.getObjectProperties(obj.id);
        if (props) {
          this.animatedLayers.set(obj.id, {
            startY: props.top ?? 0,
            startX: props.left ?? 0,
            startOpacity: props.opacity ?? 1,
            startScaleX: props.scaleX ?? 1,
            startScaleY: props.scaleY ?? 1,
          });
        }
      }
    });

    EventBus.on(StudioEvent.OBJECT_MODIFIED, (obj: any) => {
      if (useTimelineStore.getState().isPlaying) return; // Não substitui estado base se estiver animando
      
      if (obj && obj.id && this.renderEngine) {
        const props = this.renderEngine.getObjectProperties(obj.id);
        if (props) {
          this.animatedLayers.set(obj.id, {
            startY: props.top ?? 0,
            startX: props.left ?? 0,
            startOpacity: props.opacity ?? 1,
            startScaleX: props.scaleX ?? 1,
            startScaleY: props.scaleY ?? 1,
          });
        }
      }
    });

    EventBus.on(StudioEvent.OBJECT_REMOVED, (obj: any) => {
      if (obj && obj.id) {
        this.animatedLayers.delete(obj.id);
      }
    });
  }

  private updateFrame(currentTime: number) {
    if (!this.renderEngine || this.animatedLayers.size === 0) return;

    const tracks = useTimelineStore.getState().tracks;
    let hasUpdates = false;

    this.animatedLayers.forEach((baseState, layerId) => {
      const track = tracks[layerId];
      
      // Se não houver track ou clips, reseta para o base state
      if (!track || track.clips.length === 0) {
        this.renderEngine!.updateObjectProperties(layerId, {
          top: baseState.startY,
          left: baseState.startX,
          opacity: baseState.startOpacity,
          scaleX: baseState.startScaleX,
          scaleY: baseState.startScaleY,
        });
        hasUpdates = true;
        return;
      }

      // Encontra o clip ativo ou o mais recente
      let activeClip = track.clips.find(c => currentTime >= c.startTime && currentTime <= c.startTime + c.duration);
      let isAfter = false;
      let isBefore = false;

      if (!activeClip) {
        // Verifica se passou de todos os clips
        const lastClip = track.clips[track.clips.length - 1];
        if (currentTime > lastClip.startTime + lastClip.duration) {
          activeClip = lastClip;
          isAfter = true;
        } else {
          // Antes do primeiro clip
          activeClip = track.clips[0];
          isBefore = true;
        }
      }

      const { preset, startTime, duration } = activeClip;
      
      let progress = 0;
      if (isAfter) progress = 1;
      else if (!isBefore) {
        progress = (currentTime - startTime) / duration;
        progress = Math.max(0, Math.min(progress, 1));
      }

      // Calculando easing simples (Ease Out)
      const easeOut = 1 - (1 - progress) * (1 - progress);

      // Valores atuais aplicados ao Canvas
      let currentY = baseState.startY;
      let currentX = baseState.startX;
      let currentOpacity = baseState.startOpacity;
      let currentScaleX = baseState.startScaleX;
      let currentScaleY = baseState.startScaleY;

      switch (preset) {
        case "fade-in":
          currentOpacity = baseState.startOpacity * easeOut;
          break;
        case "slide-in":
          const offset = 100;
          currentY = baseState.startY + offset - (offset * easeOut);
          currentOpacity = baseState.startOpacity * easeOut;
          break;
        case "float":
          // Animação contínua durante o clip
          if (!isBefore && !isAfter) {
             const osc = Math.sin((currentTime - startTime) / 300) * 15;
             currentY = baseState.startY + osc;
          }
          break;
        case "pulse":
          if (!isBefore && !isAfter) {
             const scaleOsc = 1 + Math.sin((currentTime - startTime) / 150) * 0.05;
             currentScaleX = baseState.startScaleX * scaleOsc;
             currentScaleY = baseState.startScaleY * scaleOsc;
          }
          break;
      }

      this.renderEngine!.updateObjectProperties(layerId, {
        top: currentY,
        left: currentX,
        opacity: currentOpacity,
        scaleX: currentScaleX,
        scaleY: currentScaleY,
      });

      hasUpdates = true;
    });

    if (hasUpdates) {
      this.renderEngine.requestRender();
    }
  }
}
