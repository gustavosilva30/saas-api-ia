import { EventBus, StudioEvent } from '../events/EventBus';
import { useDocumentStore } from '@/store/useDocumentStore';

export interface Point {
  x: number;
  y: number;
}

export interface BoundingBox {
  left: number;
  top: number;
  width: number;
  height: number;
  right: number;
  bottom: number;
  centerX: number;
  centerY: number;
}

export interface SnapLine {
  type: 'vertical' | 'horizontal';
  position: number;
}

export class SnapEngine {
  private threshold: number = 10;
  private isEnabled: boolean = true;
  private snapToGrid: boolean = false;
  private gridSize: number = 20;
  private snapToObjects: boolean = true;

  constructor() {
    // Escuta mudanças de objetos via evento, ou pode ser chamado via IRenderEngine
  }

  public setSnapThreshold(value: number) {
    this.threshold = value;
  }

  public toggleSnap(enabled: boolean) {
    this.isEnabled = enabled;
  }

  /**
   * Avalia a nova posição de um objeto arrastado e retorna a posição "snappada" 
   * e as guias visuais a serem desenhadas na tela.
   */
  public calculateSnap(
    movingObjectBox: BoundingBox, 
    otherObjectsBoxes: BoundingBox[],
    canvasWidth: number,
    canvasHeight: number
  ): { snappedX: number, snappedY: number, guideLines: SnapLine[] } {
    
    let snappedX = movingObjectBox.left;
    let snappedY = movingObjectBox.top;
    let guideLines: SnapLine[] = [];

    if (!this.isEnabled) {
      return { snappedX, snappedY, guideLines };
    }

    // 1. Snap to Center of Canvas
    const canvasCenterX = canvasWidth / 2;
    const canvasCenterY = canvasHeight / 2;

    if (Math.abs(movingObjectBox.centerX - canvasCenterX) < this.threshold) {
      snappedX = canvasCenterX - (movingObjectBox.width / 2);
      guideLines.push({ type: 'vertical', position: canvasCenterX });
    }

    if (Math.abs(movingObjectBox.centerY - canvasCenterY) < this.threshold) {
      snappedY = canvasCenterY - (movingObjectBox.height / 2);
      guideLines.push({ type: 'horizontal', position: canvasCenterY });
    }

    // 2. Snap to Grid
    if (this.snapToGrid) {
      const remainderX = snappedX % this.gridSize;
      const remainderY = snappedY % this.gridSize;

      if (remainderX < this.threshold) {
        snappedX -= remainderX;
      } else if (this.gridSize - remainderX < this.threshold) {
        snappedX += (this.gridSize - remainderX);
      }

      if (remainderY < this.threshold) {
        snappedY -= remainderY;
      } else if (this.gridSize - remainderY < this.threshold) {
        snappedY += (this.gridSize - remainderY);
      }
    }

    // 3. Snap to other Objects (Figma-style smart guides)
    if (this.snapToObjects) {
      for (const obj of otherObjectsBoxes) {
        // Vertical Snapping (X-axis)
        if (Math.abs(movingObjectBox.left - obj.left) < this.threshold) {
          snappedX = obj.left;
          guideLines.push({ type: 'vertical', position: obj.left });
        } else if (Math.abs(movingObjectBox.right - obj.right) < this.threshold) {
          snappedX = obj.right - movingObjectBox.width;
          guideLines.push({ type: 'vertical', position: obj.right });
        } else if (Math.abs(movingObjectBox.centerX - obj.centerX) < this.threshold) {
          snappedX = obj.centerX - (movingObjectBox.width / 2);
          guideLines.push({ type: 'vertical', position: obj.centerX });
        }

        // Horizontal Snapping (Y-axis)
        if (Math.abs(movingObjectBox.top - obj.top) < this.threshold) {
          snappedY = obj.top;
          guideLines.push({ type: 'horizontal', position: obj.top });
        } else if (Math.abs(movingObjectBox.bottom - obj.bottom) < this.threshold) {
          snappedY = obj.bottom - movingObjectBox.height;
          guideLines.push({ type: 'horizontal', position: obj.bottom });
        } else if (Math.abs(movingObjectBox.centerY - obj.centerY) < this.threshold) {
          snappedY = obj.centerY - (movingObjectBox.height / 2);
          guideLines.push({ type: 'horizontal', position: obj.centerY });
        }
      }
    }

    return { snappedX, snappedY, guideLines };
  }
}

export const globalSnapEngine = new SnapEngine();
