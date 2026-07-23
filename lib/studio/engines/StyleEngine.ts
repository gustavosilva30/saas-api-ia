import { IRenderEngine } from '../engine/IRenderEngine';

export interface StylePreset {
  id: string;
  name: string;
  description: string;
  type: 'neon' | 'glass' | 'shadow' | 'border' | 'filter';
  apply: (renderEngine: IRenderEngine, objectId: string) => void;
  remove: (renderEngine: IRenderEngine, objectId: string) => void;
}

export class StyleEngine {
  private renderEngine: IRenderEngine;
  private registeredStyles: Map<string, StylePreset> = new Map();

  constructor(renderEngine: IRenderEngine) {
    this.renderEngine = renderEngine;
    this.registerDefaultStyles();
  }

  private registerDefaultStyles() {
    this.registerStyle({
      id: 'neon-glow-blue',
      name: 'Neon Glow (Blue)',
      description: 'Efeito neon brilhante azul.',
      type: 'neon',
      apply: (engine, id) => {
        engine.applyShadowToSelected({
          color: '#3b82f6',
          blur: 20,
          offsetX: 0,
          offsetY: 0
        });
        engine.updateObjectProperties(id, { stroke: '#60a5fa', strokeWidth: 2 });
      },
      remove: (engine, id) => {
        engine.applyShadowToSelected(null);
        engine.updateObjectProperties(id, { stroke: null, strokeWidth: 0 });
      }
    });

    this.registerStyle({
      id: 'glassmorphism-light',
      name: 'Glassmorphism (Light)',
      description: 'Efeito de vidro translúcido',
      type: 'glass',
      apply: (engine, id) => {
        // Pseudo-implementação. Em um motor avançado (WebGL ou CSS sobreposto), 
        // aplicaríamos blur de fundo real. No Fabric Canvas puro:
        engine.updateObjectProperties(id, { 
          opacity: 0.6, 
          fill: '#ffffff',
          stroke: 'rgba(255, 255, 255, 0.4)',
          strokeWidth: 1
        });
        engine.applyShadowToSelected({
          color: 'rgba(0,0,0,0.1)',
          blur: 10,
          offsetX: 0,
          offsetY: 4
        });
      },
      remove: (engine, id) => {
        engine.updateObjectProperties(id, { opacity: 1, fill: '#000000', stroke: null });
        engine.applyShadowToSelected(null);
      }
    });
  }

  public registerStyle(style: StylePreset) {
    this.registeredStyles.set(style.id, style);
  }

  public getAllStyles(): StylePreset[] {
    return Array.from(this.registeredStyles.values());
  }

  public getStylesByType(type: string): StylePreset[] {
    return Array.from(this.registeredStyles.values()).filter(s => s.type === type);
  }

  public applyStyle(styleId: string, objectId: string) {
    const style = this.registeredStyles.get(styleId);
    if (style) {
      style.apply(this.renderEngine, objectId);
      // Aqui poderíamos salvar o estilo no metadata do objeto para UI saber qual está ativo
    }
  }

  public removeStyle(styleId: string, objectId: string) {
    const style = this.registeredStyles.get(styleId);
    if (style) {
      style.remove(this.renderEngine, objectId);
    }
  }
}
