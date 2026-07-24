import { v4 as uuidv4 } from 'uuid';
import { EventBus, StudioEvent } from '../events/EventBus';
import { useStudioStore } from '@/store/useStudioStore';

export class SelectionEngine {
  /**
   * Prepara o Canvas para desenho livre (Laço).
   */
  static startLassoDrawing(canvas: any, brushSize: number = 2) {
    if (!canvas) return;
    canvas.isDrawingMode = true;
    canvas.freeDrawingBrush.color = "rgba(0, 255, 255, 0.5)"; // Um cyan translúcido para a máscara
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
   * Basicamente, clona a imagem ativa, aplica o path como clipPath e joga pro canvas.
   */
  static async cropImageToSelection(canvas: any, targetImage: any, pathObject: any): Promise<void> {
    if (!canvas || !targetImage || !pathObject) return;

    // Ajustamos as coordenadas do path em relação à imagem
    // Como clipPath usa as coordenadas relativas ao centro do objeto, precisamos calcular os offsets
    const imgLeft = targetImage.left || 0;
    const imgTop = targetImage.top || 0;
    const imgScaleX = targetImage.scaleX || 1;
    const imgScaleY = targetImage.scaleY || 1;

    // Clonamos o path para servir como clipPath
    pathObject.clone((clonedPath: any) => {
      // Ajuste de offset para clipPath
      clonedPath.left = (clonedPath.left - imgLeft) / imgScaleX;
      clonedPath.top = (clonedPath.top - imgTop) / imgScaleY;
      clonedPath.scaleX = clonedPath.scaleX / imgScaleX;
      clonedPath.scaleY = clonedPath.scaleY / imgScaleY;

      // Clonamos a imagem
      targetImage.clone((clonedImg: any) => {
        clonedImg.clipPath = clonedPath;
        clonedImg.id = uuidv4(); // ID único para a nova camada
        
        // Removemos o path desenhado da tela
        canvas.remove(pathObject);
        
        // Adicionamos a imagem recortada
        canvas.add(clonedImg);
        canvas.setActiveObject(clonedImg);
        canvas.requestRenderAll();
        
        EventBus.emit(StudioEvent.OBJECT_ADDED, clonedImg);
      });
    });
  }

  /**
   * Apaga a imagem (deleta ela) e também remove o path (simulando "Apagar Interno").
   * Ou podemos "recortar o miolo", mas clipping reverso requer `globalCompositeOperation = 'destination-out'` ou truques.
   * Para v1, apagar fundo externo é apenas setar clipPath na PRÓPRIA imagem (não um clone).
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

      // Modifica a própria imagem (Remove o fundo de fora)
      targetImage.set({ clipPath: clonedPath });
      
      canvas.remove(pathObject);
      canvas.requestRenderAll();
      EventBus.emit(StudioEvent.OBJECT_MODIFIED, targetImage);
    });
  }
}
