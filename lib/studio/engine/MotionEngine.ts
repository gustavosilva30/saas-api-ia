import { IRenderEngine } from "./IRenderEngine";
import { useTimelineStore } from "@/store/useTimelineStore";
import { EventBus, StudioEvent } from "../events/EventBus";
import { MotionLibrary } from "./MotionLibrary";
import { EasingFunctions } from "./EasingFunctions";

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
      
      // Se não houver track, mantém o estado base
      if (!track) {
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

      // 1. Verifica Visibilidade da Camada (Media Clip)
      // Se estiver fora do tempo de vida da imagem, esconde ela completamente
      if (currentTime < track.mediaStart || currentTime > track.mediaStart + track.mediaDuration) {
        this.renderEngine!.updateObjectProperties(layerId, {
          opacity: 0
        });
        hasUpdates = true;
        return;
      }

      // Se não houver animações na trilha, apenas mantém visível no estado base
      if (track.clips.length === 0) {
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

      // 2. Resolve Animações (Clips)
      let activeClip = track.clips.find(c => currentTime >= c.startTime && currentTime <= c.startTime + c.duration);
      let isAfter = false;
      let isBefore = false;

      if (!activeClip) {
        const lastClip = track.clips[track.clips.length - 1];
        if (currentTime > lastClip.startTime + lastClip.duration) {
          activeClip = lastClip;
          isAfter = true;
        } else {
          activeClip = track.clips[0];
          isBefore = true;
        }
      }

      // Base values
      let props: Record<string, number> = {
        top: baseState.startY,
        left: baseState.startX,
        opacity: baseState.startOpacity,
        scaleX: baseState.startScaleX,
        scaleY: baseState.startScaleY,
        angle: 0
      };

      const { preset, startTime, duration, easing, delay = 0, loop = false, pingPong = false } = activeClip;
      
      const animDef = MotionLibrary[preset];
      if (animDef) {
        const actualStartTime = startTime + delay;
        const actualDuration = duration;
        
        let progress = 0;
        
        if (currentTime < actualStartTime) {
          progress = 0;
        } else if (currentTime > actualStartTime + actualDuration) {
          progress = 1;
        } else {
          progress = (currentTime - actualStartTime) / actualDuration;
          progress = Math.max(0, Math.min(progress, 1));
        }

        if (loop && currentTime >= actualStartTime && currentTime <= actualStartTime + actualDuration) {
          progress = ((currentTime - actualStartTime) % actualDuration) / actualDuration;
          if (progress < 0) progress = 0;
        }

        if (pingPong) {
          progress = progress <= 0.5 ? progress * 2 : 2 - (progress * 2);
        }

        const easingName = easing || animDef.defaultEasing || "linear";
        const easingFn = EasingFunctions[easingName] || EasingFunctions.linear;
        const easedProgress = easingFn(progress);

        animDef.keyframes.forEach(kf => {
          const from = Number(kf.from) || 0;
          const to = Number(kf.to) || 0;
          const interpolated = from + (to - from) * easedProgress;

          if (kf.property === 'opacity') {
            props.opacity = baseState.startOpacity * interpolated;
          } else if (kf.property === 'left') {
            props.left = baseState.startX + interpolated;
          } else if (kf.property === 'top') {
            props.top = baseState.startY + interpolated;
          } else if (kf.property === 'scaleX') {
            props.scaleX = baseState.startScaleX * interpolated;
          } else if (kf.property === 'scaleY') {
            props.scaleY = baseState.startScaleY * interpolated;
          } else if (kf.property === 'angle') {
            props.angle = interpolated;
          }
        });
      }

      this.renderEngine!.updateObjectProperties(layerId, props);

      hasUpdates = true;
    });

    if (hasUpdates) {
      this.renderEngine.requestRender();
    }
  }
}
