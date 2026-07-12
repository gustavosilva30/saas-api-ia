import { IRenderEngine } from "./IRenderEngine";
import { useTimelineStore } from "@/store/useTimelineStore";
import { EventBus, StudioEvent } from "../events/EventBus";

export class MotionEngine {
  private static instance: MotionEngine;
  private renderEngine: IRenderEngine | null = null;
  private unsubscribeTimeline: (() => void) | null = null;
  
  // Guardamos o estado inicial dos objetos animados para calcular o delta
  private animatedLayers: Map<string, { startY: number, startOpacity: number }> = new Map();

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
    
    // Inscreve no Zustand para rodar em sincronia com o rAF da Timeline
    this.unsubscribeTimeline = useTimelineStore.subscribe(
      (state) => state.currentTime,
      (currentTime) => {
        this.updateFrame(currentTime);
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
    // Escuta quando uma imagem é adicionada ao Canvas para injetar nossa animação de Teste
    EventBus.on(StudioEvent.OBJECT_ADDED, (obj: any) => {
      if (obj && obj.id && this.renderEngine) {
        // Pega as propriedades nativas
        const props = this.renderEngine.getObjectProperties(obj.id);
        if (props) {
          this.animatedLayers.set(obj.id, {
            startY: props.top,
            startOpacity: 1 // assumindo que a imagem original entra com 1
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

  // Roda a 60 FPS controlado pelo Zustand rAF
  private updateFrame(currentTime: number) {
    if (!this.renderEngine || this.animatedLayers.size === 0) return;

    // Hardcode PoC: "Fade In" e "Slide Up" de 0s a 1s (1000ms)
    const durationMs = 1000;
    
    // Progresso de 0 a 1
    let progress = currentTime / durationMs;
    if (progress > 1) progress = 1;

    // Easing simples (Ease Out Quad)
    const easeOut = 1 - (1 - progress) * (1 - progress);

    let hasUpdates = false;

    this.animatedLayers.forEach((initialState, layerId) => {
      // Começa 100px abaixo e sobe até a posição original
      const offset = 100;
      const currentY = initialState.startY + offset - (offset * easeOut);
      
      // Fade In
      const currentOpacity = easeOut;

      this.renderEngine!.updateObjectProperties(layerId, {
        top: currentY,
        opacity: currentOpacity
      });

      hasUpdates = true;
    });

    if (hasUpdates) {
      this.renderEngine.requestRender();
    }
  }
}
