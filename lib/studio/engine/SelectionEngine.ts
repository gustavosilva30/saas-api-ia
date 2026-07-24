import { v4 as uuidv4 } from 'uuid';
import { EventBus, StudioEvent } from '../events/EventBus';

export class SelectionEngine {
  /**
   * Prepara o Canvas para desenho livre (Laço).
   */
  static startLassoDrawing(canvas: any, brushSize: number = 2) {
    if (!canvas) return;
    canvas.isDrawingMode = true;
    canvas.freeDrawingBrush.color = "rgba(59, 130, 246, 0.6)"; // Azul translúcido
    canvas.freeDrawingBrush.width = brushSize;
    canvas.defaultCursor = 'crosshair';
    canvas.selection = false;
  }

  /**
   * Interrompe o desenho de laço.
   */
  static stopLassoDrawing(canvas: any) {
    if (!canvas) return;
    canvas.isDrawingMode = false;
    canvas.defaultCursor = 'default';
    canvas.selection = true;
  }

  /**
   * Pega o Path gerado e recorta uma nova figura da imagem.
   * Clona a imagem ativa, aplica o path como clipPath e coloca no canvas.
   */
  static async cropImageToSelection(canvas: any, targetImage: any, pathObject: any): Promise<void> {
    if (!canvas || !targetImage || !pathObject) return;

    const imgLeft = targetImage.left || 0;
    const imgTop = targetImage.top || 0;
    const imgScaleX = targetImage.scaleX || 1;
    const imgScaleY = targetImage.scaleY || 1;

    pathObject.clone((clonedPath: any) => {
      clonedPath.left = (clonedPath.left - imgLeft) / imgScaleX;
      clonedPath.top = (clonedPath.top - imgTop) / imgScaleY;
      clonedPath.scaleX = clonedPath.scaleX / imgScaleX;
      clonedPath.scaleY = clonedPath.scaleY / imgScaleY;

      targetImage.clone((clonedImg: any) => {
        clonedImg.clipPath = clonedPath;
        clonedImg.id = uuidv4();
        
        canvas.remove(pathObject);
        canvas.add(clonedImg);
        canvas.setActiveObject(clonedImg);
        canvas.requestRenderAll();
        
        EventBus.emit(StudioEvent.OBJECT_ADDED, clonedImg);
      });
    });
  }

  /**
   * Apaga o fundo EXTERNO ao contorno — aplica clipPath na imagem.
   */
  static eraseExternalBackground(canvas: any, targetImage: any, pathObject: any) {
    if (!canvas || !targetImage || !pathObject) return;

    const imgLeft = targetImage.left || 0;
    const imgTop = targetImage.top || 0;
    const imgScaleX = targetImage.scaleX || 1;
    const imgScaleY = targetImage.scaleY || 1;

    pathObject.clone((clonedPath: any) => {
      clonedPath.left = (clonedPath.left - imgLeft) / imgScaleX;
      clonedPath.top = (clonedPath.top - imgTop) / imgScaleY;
      clonedPath.scaleX = clonedPath.scaleX / imgScaleX;
      clonedPath.scaleY = clonedPath.scaleY / imgScaleY;

      targetImage.set({ clipPath: clonedPath });
      
      canvas.remove(pathObject);
      canvas.requestRenderAll();
      EventBus.emit(StudioEvent.OBJECT_MODIFIED, targetImage);
    });
  }

  /**
   * Extrai a área selecionada como um novo objeto independente no Canvas.
   * O objeto original permanece intacto — a seleção vira uma nova "figura" editável.
   */
  static async extractAsNewObject(canvas: any, targetImage: any, pathObject: any): Promise<void> {
    if (!canvas || !targetImage || !pathObject) return;

    const imgLeft = targetImage.left || 0;
    const imgTop = targetImage.top || 0;
    const imgScaleX = targetImage.scaleX || 1;
    const imgScaleY = targetImage.scaleY || 1;

    pathObject.clone((clonedPath: any) => {
      // Ajuste de coordenadas para clipPath relativo
      clonedPath.left = (clonedPath.left - imgLeft) / imgScaleX;
      clonedPath.top = (clonedPath.top - imgTop) / imgScaleY;
      clonedPath.scaleX = clonedPath.scaleX / imgScaleX;
      clonedPath.scaleY = clonedPath.scaleY / imgScaleY;

      targetImage.clone((clonedImg: any) => {
        clonedImg.clipPath = clonedPath;
        clonedImg.id = uuidv4();
        // Deslocar um pouquinho para sinalizar que é um novo objeto
        clonedImg.left = (clonedImg.left || 0) + 20;
        clonedImg.top = (clonedImg.top || 0) + 20;

        canvas.remove(pathObject);
        canvas.add(clonedImg);
        canvas.setActiveObject(clonedImg);
        canvas.requestRenderAll();
        
        EventBus.emit(StudioEvent.OBJECT_ADDED, clonedImg);
      });
    });
  }

  /**
   * Remove o fundo dentro da seleção usando IA (SmartSelection/Background Removal).
   * Envia a imagem recortada pela seleção para a IA e aplica o resultado de volta.
   */
  static async removeBackgroundFromSelection(
    canvas: any,
    targetImage: any,
    pathObject: any,
    onProgress?: (msg: string) => void
  ): Promise<void> {
    if (!canvas || !targetImage || !pathObject) return;

    onProgress?.("Recortando seleção...");

    // Passo 1: Cria uma cópia temporária com clipPath
    return new Promise((resolve, reject) => {
      const imgLeft = targetImage.left || 0;
      const imgTop = targetImage.top || 0;
      const imgScaleX = targetImage.scaleX || 1;
      const imgScaleY = targetImage.scaleY || 1;

      pathObject.clone((clonedPath: any) => {
        clonedPath.left = (clonedPath.left - imgLeft) / imgScaleX;
        clonedPath.top = (clonedPath.top - imgTop) / imgScaleY;
        clonedPath.scaleX = clonedPath.scaleX / imgScaleX;
        clonedPath.scaleY = clonedPath.scaleY / imgScaleY;

        targetImage.clone(async (clonedImg: any) => {
          try {
            // Passo 2: Renderiza o fragmento em um canvas temporário
            clonedImg.clipPath = clonedPath;
            const { fabric } = require('fabric');
            const tempCanvas = new fabric.Canvas(null, {
              width: clonedImg.width! * clonedImg.scaleX!,
              height: clonedImg.height! * clonedImg.scaleY!
            });
            tempCanvas.add(clonedImg);
            const dataUrl = tempCanvas.toDataURL({ format: 'png' });
            tempCanvas.dispose();

            // Passo 3: Converter dataURL → File e enviar para o AIProviderManager
            onProgress?.("Enviando para remoção de fundo com IA...");
            const res = await fetch(dataUrl);
            const blob = await res.blob();
            const file = new File([blob], 'selection.png', { type: 'image/png' });

            const { AIProviderManager } = require('@/lib/studio/ai/AIProviderManager');
            const result = await AIProviderManager.removeBackground(file);

            if (result.success && result.data) {
              // Passo 4: Substituir imagem original pelo resultado sem fundo
              onProgress?.("Aplicando resultado...");
              const originalSrc = result.data;

              // Adiciona o resultado como uma nova camada posicionada sobre a seleção
              const { fabric: f } = require('fabric');
              f.Image.fromURL(originalSrc, (newImg: any) => {
                if (!newImg) return reject("Falha ao carregar imagem resultante");
                newImg.set({
                  id: uuidv4(),
                  left: targetImage.left,
                  top: targetImage.top,
                  scaleX: targetImage.scaleX,
                  scaleY: targetImage.scaleY,
                  originX: 'center',
                  originY: 'center',
                });

                canvas.remove(pathObject);
                canvas.add(newImg);
                canvas.setActiveObject(newImg);
                canvas.requestRenderAll();

                EventBus.emit(StudioEvent.OBJECT_ADDED, newImg);
                resolve();
              }, { crossOrigin: 'anonymous' });
            } else {
              canvas.remove(pathObject);
              canvas.requestRenderAll();
              reject(result.error || "Falha na remoção de fundo.");
            }
          } catch (err) {
            canvas.remove(pathObject);
            canvas.requestRenderAll();
            reject(err);
          }
        });
      });
    });
  }
}
