import { IRenderEngine } from '../engine/IRenderEngine';
import { v4 as uuidv4 } from 'uuid';

export interface ClipboardData {
  type: 'object' | 'style' | 'motion';
  data: any; // O payload que será colado
}

export class ClipboardEngine {
  private renderEngine: IRenderEngine;
  private internalClipboard: ClipboardData | null = null;

  constructor(renderEngine: IRenderEngine) {
    this.renderEngine = renderEngine;
  }

  /**
   * Copia o objeto inteiro para o clipboard interno.
   * Em uma v2, poderia sincronizar com o navigator.clipboard
   */
  public copyObject(objectId: string) {
    const props = this.renderEngine.getObjectProperties(objectId);
    if (!props) return;
    
    // Pegamos a imagem URL caso seja uma imagem (isso depende da interface do motor atual)
    const type = props.type || 'unknown';

    this.internalClipboard = {
      type: 'object',
      data: {
        ...props,
        type,
        // Remover o ID para não duplicar IDs idênticos na colagem
        id: undefined
      }
    };
  }

  /**
   * Copia apenas as propriedades visuais de um objeto (Preenchimento, Borda, Sombra, Filtros)
   */
  public copyStyle(objectId: string) {
    const props = this.renderEngine.getObjectProperties(objectId);
    const shadow = this.renderEngine.getSelectedObjectShadow(); // Precisa de refatoração para aceitar ID no futuro
    
    if (!props) return;

    this.internalClipboard = {
      type: 'style',
      data: {
        opacity: props.opacity,
        fill: props.fill,
        stroke: props.stroke,
        strokeWidth: props.strokeWidth,
        shadow: shadow
      }
    };
  }

  /**
   * Copia a keyframe timeline ou preset de motion de um objeto
   */
  public copyMotion(objectId: string, motionData: any) {
    this.internalClipboard = {
      type: 'motion',
      data: motionData
    };
  }

  /**
   * Cola o conteúdo do clipboard interno no Canvas
   */
  public paste(targetObjectId?: string) {
    if (!this.internalClipboard) return;

    const { type, data } = this.internalClipboard;

    if (type === 'object') {
      // Duplicar o objeto
      const newId = uuidv4();
      
      // Simulação simples: O ideal é que o renderEngine possua algo como cloneObject()
      // Aqui criamos um pequeno desvio lateral (offset) para não colar exatamente em cima
      if (data.type === 'text') {
         this.renderEngine.addText(data.text || 'Texto Copiado', {
            fill: data.fill,
            fontSize: data.fontSize,
            fontFamily: data.fontFamily,
            fontWeight: data.fontWeight,
            textAlign: data.textAlign
         });
         // Depois chamaria updateObjectProperties para aplicar position + offset...
      } else if (data.type === 'image') {
         // Precisa da URL original
      }
    } 
    else if (type === 'style' && targetObjectId) {
      // Cola apenas estilo
      this.renderEngine.updateObjectProperties(targetObjectId, {
        opacity: data.opacity,
        fill: data.fill,
        stroke: data.stroke,
        strokeWidth: data.strokeWidth
      });
      // (Sombras precisariam de um método applyShadow(targetId, shadow) no IRenderEngine)
    }
    else if (type === 'motion' && targetObjectId) {
      // Cola os metadados de animação no store ou motor de motion
      console.log(`Colando motion no objeto ${targetObjectId}`, data);
    }
  }

  public getClipboardType(): 'object' | 'style' | 'motion' | null {
    return this.internalClipboard ? this.internalClipboard.type : null;
  }
}
