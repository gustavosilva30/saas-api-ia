import { StudioDocument } from '../core/models/DocumentModels';

export interface LayerInfo {
  id: string;
  type: string;
  zIndex: number;
}

export interface IRenderEngine {
  /**
   * Inicializa o motor gráfico em um elemento HTML.
   */
  init(canvasElement: HTMLCanvasElement, containerWidth: number, containerHeight: number): void;
  
  /**
   * Redimensiona o canvas.
   */
  resize(width: number, height: number): void;
  
  /**
   * Limpa todo o canvas.
   */
  clear(): void;
  
  /**
   * Destrói a instância para evitar vazamento de memória.
   */
  destroy(): void;

  /**
   * Altera o fator de zoom.
   */
  setZoom(zoom: number): void;

  /**
   * Move (Pan) o canvas.
   */
  setPan(x: number, y: number): void;
  
  /**
   * Retorna os dados atuais do pan e zoom.
   */
  getViewport(): { zoom: number; pan: { x: number; y: number } };

  /**
   * Força uma re-renderização (utilizado em RequestAnimationFrame).
   */
  requestRender(): void;

  /**
   * Define a cor sólida de fundo.
   */
  setBackgroundColor(color: string): void;

  /**
   * Define um gradiente como fundo.
   */
  setBackgroundGradient(config: { type: 'linear'|'radial', colorStops: {offset: number, color: string}[], coords?: any }): void;

  /**
   * Aplica múltiplos ajustes (filtros) a um objeto de uma vez.
   */
  applyAdjustments(id: string, adjustments: Record<string, any>): void;

  /**
   * Define uma imagem de fundo, ajustando para cobrir/preencher o canvas.
   */
  setBackgroundImage(url: string): Promise<void>;

  /**
   * Remove a imagem de fundo.
   */
  clearBackgroundImage(): void;

  /**
   * Adiciona uma imagem passando a URL (retorna o ID).
   */
  addImageFromUrl(url: string, idPrefix?: string): Promise<string>;

  /**
   * Atualiza a URL da imagem de um objeto existente (útil para IA).
   */
  updateObjectImageUrl(id: string, newUrl: string): Promise<void>;

  /**
   * Retorna a URL da imagem base do objeto selecionado.
   */
  getSelectedObjectImageUrl(): string | null;

  /**
   * Atualiza a URL da imagem de um objeto existente (mantendo posição, escala, etc).
   */
  updateObjectImageUrl(id: string, url: string): Promise<void>;

  /**
   * Remove um objeto pelo ID.
   */
  removeObject(id: string): void;

  /**
   * Duplica um objeto pelo ID, retornando o ID do novo objeto.
   */
  duplicateObject(id: string): string;

  /**
   * Adiciona um texto ao centro do canvas.
   * Retorna o ID gerado do objeto inserido.
   */
  addText(text: string, options?: {
    fontFamily?: string;
    fontSize?: number;
    fill?: string;
    fontWeight?: string | number;
    textAlign?: string;
  }): string;

  /**
   * Adiciona uma forma primitiva geométrica.
   */
  addShape(type: 'rect' | 'circle' | 'polygon' | 'line' | 'arrow', options?: any): string;

  /**
   * Ativa um modo de desenho livre (pincel, borracha, caneta).
   */
  setDrawingMode(mode: 'pencil' | 'eraser' | 'pen' | 'none', options?: { color?: string; width?: number }): void;

  /**
   * Atualiza propriedades numéricas/visuais de um objeto (usado pelo Motion Engine).
   */
  updateObjectProperties(id: string, properties: any): void;

  /**
   * Retorna as propriedades atuais de um objeto para calcular deltas.
   */
  getObjectProperties(id: string): any;

  /**
   * Retorna um objeto JSON contendo os parâmetros de sombra aplicados ao objeto selecionado.
   */
  getSelectedObjectShadow(): any;

  /**
   * Aplica uma sombra ao objeto selecionado.
   */
  applyShadowToSelected(shadowOptions: any): void;

  // Gerenciamento de Camadas
  getLayers(): LayerInfo[];
  bringForward(id: string): void;
  sendBackwards(id: string): void;

  // Ajustes de Imagem Não Destrutivos
  applyAdjustment(id: string, type: 'brightness' | 'contrast' | 'saturation' | 'hue' | 'curves', params: any): void;
  getAdjustments(id: string): any;

  // Seleções (Crop / Masking)
  startSelection(type: 'rect' | 'ellipse' | 'lasso' | 'crop', options?: any): void;
  stopSelection(): void;

  // Blend Modes
  setBlendMode(id: string, mode: string): void;

  // Exportação
  exportImage(options?: { format?: "png" | "jpeg" | "webp"; quality?: number; multiplier?: number }): string;

  // Camadas de Ajuste
  addAdjustmentLayer(type: 'brightness' | 'contrast' | 'saturation' | 'hue', value: number): string;
  updateAdjustmentLayer(id: string, value: number): void;

  // Ferramentas Vetoriais e Caneta Bezier
  startBezierPen(): void;
  stopBezierPen(): void;
  applyBooleanOperation(type: 'union' | 'difference' | 'intersection'): void;

  // Inpainting / Generative Fill
  startInpaintBrush(): void;
  stopInpaintBrush(): void;
  getInpaintMaskAndImage(): Promise<{ imageFile: File, maskFile: File } | null>;

  // Persistência de Estado (Document Model)
  exportDocument(): StudioDocument;
  loadDocument(document: StudioDocument): Promise<void>;
}
