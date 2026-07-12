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
}
