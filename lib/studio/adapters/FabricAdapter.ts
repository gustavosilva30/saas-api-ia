import { fabric } from "fabric";
import { v4 as uuidv4 } from "uuid";
import { IRenderEngine, LayerInfo } from "./IRenderEngine";
import { EventBus, StudioEvent } from "../events/EventBus";

export class FabricAdapter implements IRenderEngine {
  private canvas: fabric.Canvas | null = null;
  private isDragging = false;
  private lastPosX = 0;
  private lastPosY = 0;

  init(canvasElement: HTMLCanvasElement, width: number, height: number): void {
    // Configurações base do Canvas
    this.canvas = new fabric.Canvas(canvasElement, {
      width,
      height,
      preserveObjectStacking: true, // Objetos selecionados não pulam para cima sozinhos
      selection: true, // Permite selecionar múltiplos objetos arrastando
      backgroundColor: "#1e1e1e" // Cor base (dark mode)
    });

    this.setupEvents();
    
    // Dispara evento global avisando que o motor está pronto
    EventBus.emit(StudioEvent.CANVAS_READY, { width, height });
  }

  private setupEvents() {
    if (!this.canvas) return;

    // Pan (Arrastar tela com Alt + Drag, ou botão do meio)
    this.canvas.on('mouse:down', (opt) => {
      const evt = opt.e;
      // Arrastar se segurar ALT ou botão do meio do mouse
      if (evt.altKey || evt.button === 1) {
        this.isDragging = true;
        this.canvas!.selection = false;
        this.lastPosX = evt.clientX;
        this.lastPosY = evt.clientY;
      }
    });

    this.canvas.on('mouse:move', (opt) => {
      if (this.isDragging) {
        const e = opt.e;
        const vpt = this.canvas!.viewportTransform!;
        vpt[4] += e.clientX - this.lastPosX;
        vpt[5] += e.clientY - this.lastPosY;
        this.canvas!.requestRenderAll();
        this.lastPosX = e.clientX;
        this.lastPosY = e.clientY;
      }
    });

    this.canvas.on('mouse:up', () => {
      this.canvas!.setViewportTransform(this.canvas!.viewportTransform!);
      this.isDragging = false;
      this.canvas!.selection = true;
      
      const vpt = this.canvas!.viewportTransform!;
      EventBus.emit(StudioEvent.PAN_CHANGED, { x: vpt[4], y: vpt[5] });
    });

    // Zoom (Mouse Wheel)
    this.canvas.on('mouse:wheel', (opt) => {
      const delta = opt.e.deltaY;
      let zoom = this.canvas!.getZoom();
      zoom *= 0.999 ** delta;
      
      if (zoom > 20) zoom = 20;
      if (zoom < 0.01) zoom = 0.01;
      
      this.canvas!.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoom);
      opt.e.preventDefault();
      opt.e.stopPropagation();

      EventBus.emit(StudioEvent.ZOOM_CHANGED, zoom);
    });

    // Object Events
    this.canvas.on('object:added', (e) => EventBus.emit(StudioEvent.OBJECT_ADDED, e.target));
    this.canvas.on('object:removed', (e) => EventBus.emit(StudioEvent.OBJECT_REMOVED, e.target));
    this.canvas.on('object:modified', (e) => EventBus.emit(StudioEvent.OBJECT_MODIFIED, e.target));
    this.canvas.on('selection:created', (e) => EventBus.emit(StudioEvent.OBJECT_SELECTED, e.selected));
    this.canvas.on('selection:updated', (e) => EventBus.emit(StudioEvent.OBJECT_SELECTED, e.selected));
    this.canvas.on('selection:cleared', () => EventBus.emit(StudioEvent.SELECTION_CLEARED));
  }

  resize(width: number, height: number): void {
    if (this.canvas) {
      this.canvas.setWidth(width);
      this.canvas.setHeight(height);
      this.canvas.requestRenderAll();
    }
  }

  clear(): void {
    if (this.canvas) {
      this.canvas.clear();
      this.canvas.backgroundColor = "#1e1e1e";
    }
  }

  destroy(): void {
    if (this.canvas) {
      this.canvas.dispose();
      this.canvas = null;
    }
  }

  setZoom(zoom: number): void {
    if (this.canvas) {
      const center = this.canvas.getCenter();
      this.canvas.zoomToPoint({ x: center.left, y: center.top }, zoom);
    }
  }

  setPan(x: number, y: number): void {
    if (this.canvas && this.canvas.viewportTransform) {
      this.canvas.viewportTransform[4] = x;
      this.canvas.viewportTransform[5] = y;
      this.canvas.requestRenderAll();
    }
  }

  getViewport(): { zoom: number; pan: { x: number; y: number; }; } {
    if (!this.canvas) return { zoom: 1, pan: { x: 0, y: 0 } };
    const vpt = this.canvas.viewportTransform;
    return {
      zoom: this.canvas.getZoom(),
      pan: { x: vpt ? vpt[4] : 0, y: vpt ? vpt[5] : 0 }
    };
  }

  requestRender(): void {
    if (this.canvas) {
      this.canvas.requestRenderAll();
    }
  }

  setBackgroundColor(color: string): void {
    if (this.canvas) {
      this.canvas.backgroundColor = color;
      this.canvas.requestRenderAll();
    }
  }

  addImageFromUrl(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.canvas) return reject("Canvas not initialized");

      fabric.Image.fromURL(url, (img) => {
        if (!img) return reject("Failed to load image");
        
        const id = uuidv4();
        // Extendendo as propriedades customizadas
        img.set({
          id, // id string
          left: this.canvas!.width! / 2,
          top: this.canvas!.height! / 2,
          originX: 'center',
          originY: 'center',
          cornerColor: '#3b82f6',
          cornerStyle: 'circle',
          borderColor: '#3b82f6',
          transparentCorners: false
        } as any);

        // Escala básica para caber na tela caso a imagem seja gigante
        const scaleX = (this.canvas!.width! * 0.8) / img.width!;
        const scaleY = (this.canvas!.height! * 0.8) / img.height!;
        const scale = Math.min(scaleX, scaleY, 1);
        img.scale(scale);

        this.canvas!.add(img);
        this.canvas!.setActiveObject(img);
        this.canvas!.requestRenderAll();
        
        resolve(id);
      }, { crossOrigin: 'anonymous' });
    });
  }

  removeObject(id: string): void {
    if (!this.canvas) return;
    const objects = this.canvas.getObjects() as any[];
    const target = objects.find(o => o.id === id);
    if (target) {
      this.canvas.remove(target);
      this.canvas.requestRenderAll();
    }
  }

  getSelectedObjectShadow(): any {
    if (!this.canvas) return null;
    const activeObject = this.canvas.getActiveObject();
    if (activeObject && activeObject.shadow) {
      return activeObject.shadow;
    }
    return null;
  }

  applyShadowToSelected(shadowOptions: any): void {
    if (!this.canvas) return;
    const activeObject = this.canvas.getActiveObject();
    if (activeObject) {
      if (!shadowOptions) {
        activeObject.set('shadow', null);
      } else {
        activeObject.set('shadow', new fabric.Shadow(shadowOptions));
      }
      this.canvas.requestRenderAll();
      EventBus.emit(StudioEvent.OBJECT_MODIFIED, activeObject);
    }
  }

  // --- Layers Management ---

  getLayers(): LayerInfo[] {
    if (!this.canvas) return [];
    // O array de objetos do Fabric.js está ordenado do mais ao fundo (índice 0) para o mais ao topo
    // Vamos retornar invertido para a UI listar o mais acima primeiro
    const objects = this.canvas.getObjects();
    return objects.map((obj, index) => ({
      id: (obj as any).id || "unknown",
      type: obj.type || "object",
      zIndex: index
    })).reverse();
  }

  bringForward(id: string): void {
    if (!this.canvas) return;
    const obj = this.canvas.getObjects().find((o: any) => o.id === id);
    if (obj) {
      this.canvas.bringForward(obj);
      this.canvas.requestRenderAll();
      EventBus.emit(StudioEvent.OBJECT_MODIFIED, obj);
    }
  }

  sendBackwards(id: string): void {
    if (!this.canvas) return;
    const obj = this.canvas.getObjects().find((o: any) => o.id === id);
    if (obj) {
      this.canvas.sendBackwards(obj);
      this.canvas.requestRenderAll();
      EventBus.emit(StudioEvent.OBJECT_MODIFIED, obj);
    }
  }

  // --- Export ---

  exportImage(options?: { format?: "png" | "jpeg"; quality?: number; multiplier?: number }): string {
    if (!this.canvas) return "";
    
    // Remover seleção antes de exportar
    this.canvas.discardActiveObject();
    this.canvas.requestRenderAll();

    return this.canvas.toDataURL({
      format: options?.format || "png",
      quality: options?.quality || 1,
      multiplier: options?.multiplier || 2 // Alta resolução (800x600 -> 1600x1200)
    });
  }
}
