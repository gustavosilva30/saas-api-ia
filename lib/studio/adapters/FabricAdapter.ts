import { fabric } from "fabric";
import { IRenderEngine } from "./IRenderEngine";
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
}
