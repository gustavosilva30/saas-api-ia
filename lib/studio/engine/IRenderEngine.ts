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
   * Adiciona uma imagem ao centro do canvas a partir de uma URL.
   * Retorna o ID gerado do objeto inserido.
   */
  addImageFromUrl(url: string): Promise<string>;

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
  exportImage(options?: { format?: "png" | "jpeg"; quality?: number; multiplier?: number }): string;

  // Persistência de Estado (Document Model)
  exportDocument(): StudioDocument;
  loadDocument(document: StudioDocument): Promise<void>;
}
