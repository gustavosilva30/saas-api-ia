import { fabric } from "fabric";
import { v4 as uuidv4 } from "uuid";
import { IRenderEngine, LayerInfo } from "./IRenderEngine";
import { EventBus, StudioEvent } from "../events/EventBus";
import "./CurvesFilter"; // Registra o filtro customizado

// Tipos auxiliares de Seleção e Ajustes
type SelectionType = 'rect' | 'ellipse' | 'lasso' | 'crop';
type AdjustmentType = 'brightness' | 'contrast' | 'saturation' | 'hue' | 'curves';

export class FabricAdapter implements IRenderEngine {
  private canvas: fabric.Canvas | null = null;
  private isDragging = false;
  private lastPosX = 0;
  private lastPosY = 0;

  private isDestroyed = false;

  init(canvasElement: HTMLCanvasElement, width: number, height: number): void {
    this.isDestroyed = false;
    // Configurações base do Canvas
    this.canvas = new fabric.Canvas(canvasElement, {
      width,
      height,
      preserveObjectStacking: true, // Objetos selecionados não pulam para cima sozinhos
      selection: true, // Permite selecionar múltiplos objetos arrastando
      backgroundColor: "#1e1e1e" // Cor base (dark mode)
    });

    this.setupEvents();
    this.setupSnapping();
    
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

  private setupSnapping() {
    if (!this.canvas) return;
    const snapZone = 15;
    
    this.canvas.on('object:moving', (options) => {
      const obj = options.target;
      if (!obj || !this.canvas) return;

      const canvasWidth = this.canvas.width || 0;
      const canvasHeight = this.canvas.height || 0;
      
      const objCenter = obj.getCenterPoint();
      
      // Snap ao centro do canvas
      if (Math.abs(objCenter.x - canvasWidth / 2) < snapZone) {
        obj.set({ left: canvasWidth / 2, originX: 'center' });
      }
      if (Math.abs(objCenter.y - canvasHeight / 2) < snapZone) {
        obj.set({ top: canvasHeight / 2, originY: 'center' });
      }
    });
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
    this.isDestroyed = true;
    if (this.canvas) {
      this.canvas.dispose();
      this.canvas = null;
    }
  }

  setZoom(zoom: number): void {
    if (this.canvas && !this.isDestroyed) {
      const center = this.canvas.getCenter();
      this.canvas.zoomToPoint({ x: center.left, y: center.top }, zoom);
    }
  }

  setPan(x: number, y: number): void {
    if (this.canvas && this.canvas.viewportTransform && !this.isDestroyed) {
      this.canvas.viewportTransform[4] = x;
      this.canvas.viewportTransform[5] = y;
      this.canvas.requestRenderAll();
    }
  }

  getViewport(): { zoom: number; pan: { x: number; y: number; }; } {
    if (!this.canvas || this.isDestroyed) return { zoom: 1, pan: { x: 0, y: 0 } };
    const vpt = this.canvas.viewportTransform;
    return {
      zoom: this.canvas.getZoom(),
      pan: { x: vpt ? vpt[4] : 0, y: vpt ? vpt[5] : 0 }
    };
  }

  requestRender(): void {
    if (this.canvas && !this.isDestroyed) {
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
      if (!this.canvas || this.isDestroyed) return reject("Canvas not initialized");

      fabric.Image.fromURL(url, (img) => {
        if (this.isDestroyed || !this.canvas) return reject("Canvas disposed before image loaded");
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

  getSelectedObjectImageUrl(): string | null {
    if (!this.canvas || this.isDestroyed) return null;
    const activeObject = this.canvas.getActiveObject();
    if (activeObject && activeObject.type === 'image') {
      return (activeObject as fabric.Image).getSrc() || null;
    }
    return null;
  }

  updateObjectImageUrl(id: string, url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.canvas || this.isDestroyed) return reject("Canvas not initialized");
      const objects = this.canvas.getObjects() as any[];
      const target = objects.find(o => o.id === id) as fabric.Image;
      
      if (!target || target.type !== 'image') {
        return reject("Object not found or not an image");
      }

      // Salva o tamanho antigo para recalcular escala se necessário
      const oldWidth = target.width || 1;
      const oldHeight = target.height || 1;
      const oldScaleX = target.scaleX || 1;
      const oldScaleY = target.scaleY || 1;
      const visualWidth = oldWidth * oldScaleX;
      const visualHeight = oldHeight * oldScaleY;

      target.setSrc(url, (img) => {
        if (this.isDestroyed || !this.canvas) return reject("Canvas disposed before new image loaded");
        if (!img) return reject("Failed to load new image");
        
        // Mantém a proporção e o tamanho visual antigo
        if (img.width && img.height) {
          // Precisamos ajustar o scale para que a nova imagem ocupe o mesmo espaço visual (aproximadamente)
          // Isso ajuda caso a imagem sem fundo venha com um crop diferente, mas geralmente tem o mesmo tamanho.
          const newScaleX = visualWidth / img.width;
          const newScaleY = visualHeight / img.height;
          img.set({ scaleX: newScaleX, scaleY: newScaleY });
        }
        
        this.canvas!.requestRenderAll();
        EventBus.emit(StudioEvent.OBJECT_MODIFIED, img);
        resolve();
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

  addText(text: string, options?: {
    fontFamily?: string;
    fontSize?: number;
    fill?: string;
    fontWeight?: string | number;
    textAlign?: string;
  }): string {
    if (!this.canvas) return "";

    const id = uuidv4();
    const textObject = new fabric.IText(text, {
      id, // custom id property
      left: this.canvas.width! / 2,
      top: this.canvas.height! / 2,
      originX: 'center',
      originY: 'center',
      fontFamily: options?.fontFamily || 'Inter, sans-serif',
      fontSize: options?.fontSize || 40,
      fill: options?.fill || '#ffffff',
      fontWeight: options?.fontWeight || 'normal',
      textAlign: options?.textAlign || 'left',
      cornerColor: '#3b82f6',
      cornerStyle: 'circle',
      borderColor: '#3b82f6',
      transparentCorners: false,
    } as any);

    this.canvas.add(textObject);
    this.canvas.setActiveObject(textObject);
    this.canvas.requestRenderAll();
    
    return id;
  }

  addShape(type: 'rect' | 'circle' | 'polygon' | 'line' | 'arrow' | 'ellipse', options?: any): string {
    if (!this.canvas) return "";
    const id = uuidv4();
    const center = this.canvas.getCenter();
    
    let shape: fabric.Object | null = null;
    
    const commonOpts = {
      id,
      left: center.left,
      top: center.top,
      originX: 'center',
      originY: 'center',
      fill: options?.fill || '#3b82f6',
      stroke: options?.stroke || null,
      strokeWidth: options?.strokeWidth || 0,
      cornerColor: '#3b82f6',
      cornerStyle: 'circle',
      borderColor: '#3b82f6',
      transparentCorners: false,
    } as any;

    if (type === 'rect') {
      shape = new fabric.Rect({
        ...commonOpts,
        width: options?.width || 200,
        height: options?.height || 200,
        rx: options?.rx || 0,
        ry: options?.ry || 0,
      });
    } else if (type === 'circle' || type === 'ellipse') {
      shape = new fabric.Ellipse({
        ...commonOpts,
        rx: options?.width ? options.width/2 : 100,
        ry: options?.height ? options.height/2 : 100,
      });
    } else if (type === 'line') {
      shape = new fabric.Line([0, 0, 200, 0], {
        ...commonOpts,
        stroke: options?.stroke || '#ffffff',
        strokeWidth: options?.strokeWidth || 4,
        fill: null
      });
    }

    if (shape) {
      this.canvas.add(shape);
      this.canvas.setActiveObject(shape);
      this.canvas.requestRenderAll();
    }
    
    return id;
  }

  setDrawingMode(mode: 'pencil' | 'eraser' | 'pen' | 'none', options?: { color?: string; width?: number }): void {
    if (!this.canvas) return;
    if (mode === 'none') {
      this.canvas.isDrawingMode = false;
    } else {
      this.canvas.isDrawingMode = true;
      // TODO: Configurar o brush (PencilBrush, EraserBrush) baseado no mode
      if (options?.color) this.canvas.freeDrawingBrush.color = options.color;
      if (options?.width) this.canvas.freeDrawingBrush.width = options.width;
    }
  }

  updateObjectProperties(id: string, properties: any): void {
    if (!this.canvas) return;
    const objects = this.canvas.getObjects() as any[];
    const target = objects.find(o => o.id === id);
    if (target) {
      target.set(properties);
      // Não chamamos requestRenderAll aqui para otimização, 
      // o MotionEngine chama em lote após atualizar todos.
    }
  }

  getObjectProperties(id: string): any {
    if (!this.canvas) return null;
    const objects = this.canvas.getObjects() as any[];
    const target = objects.find(o => o.id === id);
    if (target) {
      return {
        opacity: target.opacity ?? 1,
        left: target.left ?? 0,
        top: target.top ?? 0,
        scaleX: target.scaleX ?? 1,
        scaleY: target.scaleY ?? 1,
        angle: target.angle ?? 0,
        fill: target.fill,
        stroke: target.stroke,
        strokeWidth: target.strokeWidth
      };
    }
    return null;
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

  // --- Adjustments ---

  applyAdjustment(id: string, type: AdjustmentType, params: any): void {
    if (!this.canvas) return;
    let obj = this.canvas.getObjects().find((o: any) => o.id === id) as fabric.Image;
    if (!obj && id === '') {
      obj = this.canvas.getActiveObject() as fabric.Image;
    }
    if (!obj || !obj.filters) return;

    // Remove existing filter of this type
    const filterTypes: Record<string, string> = {
      'brightness': 'Brightness',
      'contrast': 'Contrast',
      'saturation': 'Saturation',
      'hue': 'HueRotation',
      'curves': 'Curves'
    };

    const targetType = filterTypes[type];
    
    // Filtramos os que não são do tipo atual
    obj.filters = obj.filters.filter(f => f && (f as any).type !== targetType);

    if (params !== null && params !== undefined) {
      let newFilter = null;
      switch (type) {
        case 'brightness':
          newFilter = new fabric.Image.filters.Brightness({ brightness: params });
          break;
        case 'contrast':
          newFilter = new fabric.Image.filters.Contrast({ contrast: params });
          break;
        case 'saturation':
          newFilter = new fabric.Image.filters.Saturation({ saturation: params });
          break;
        case 'hue':
          newFilter = new fabric.Image.filters.HueRotation({ rotation: params });
          break;
        case 'curves':
          newFilter = new (fabric.Image.filters as any).Curves({ lut: params });
          break;
      }
      if (newFilter) {
        obj.filters.push(newFilter);
        // Atualizamos um map de cache nosso no objeto para facilitar leitura
        if (!(obj as any)._adjustmentsCache) (obj as any)._adjustmentsCache = {};
        (obj as any)._adjustmentsCache[type] = params;
      }
    } else {
      if ((obj as any)._adjustmentsCache) {
        delete (obj as any)._adjustmentsCache[type];
      }
    }

    obj.applyFilters();
    this.canvas.requestRenderAll();
    EventBus.emit(StudioEvent.OBJECT_MODIFIED, obj);
  }

  getAdjustments(id: string): any {
    if (!this.canvas) return {};
    let obj = this.canvas.getObjects().find((o: any) => o.id === id);
    if (!obj && id === '') {
      obj = this.canvas.getActiveObject();
    }
    if (!obj) return {};
    return (obj as any)._adjustmentsCache || {};
  }

  // --- Selection Tools ---

  startSelection(type: SelectionType, options?: any): void {
    if (!this.canvas) return;
    // Em uma implementação real do Laço/Crop, nós setamos o isDrawingMode = true 
    // ou lidamos com on('mouse:down') customizado desenhando polígonos.
    // Para simplificar a v1:
    this.canvas.defaultCursor = 'crosshair';
    this.canvas.selection = false;
    
    // Guardaremos o estado em variáveis privadas da classe
    (this as any)._selectionMode = type;
  }

  stopSelection(): void {
    if (!this.canvas) return;
    this.canvas.defaultCursor = 'default';
    this.canvas.selection = true;
    (this as any)._selectionMode = null;
  }

  setBlendMode(id: string, mode: string): void {
    if (!this.canvas) return;
    let obj = this.canvas.getObjects().find((o: any) => o.id === id);
    if (!obj && id === '') {
      obj = this.canvas.getActiveObject();
    }
    if (obj) {
      obj.globalCompositeOperation = mode as any;
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

  // --- Persistência de Estado (Document Model) ---

  exportDocument(): any {
    if (!this.canvas) return null;
    // Em uma implementação madura, nós iteramos o JSON gerado pelo Fabric e 
    // montamos um objeto conforme StudioDocument.Pages[0].layers
    const json = this.canvas.toJSON(['id']);
    return {
      schemaVersion: "v2.0.0",
      id: "doc-exported",
      name: "Documento Exportado",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      pages: [
        {
          id: "page-1",
          name: "Page 1",
          width: this.canvas.width || 800,
          height: this.canvas.height || 600,
          layers: json.objects
        }
      ],
      assets: [],
      styles: [],
      variables: [],
      metadata: {}
    };
  }

  loadDocument(document: any): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.canvas || this.isDestroyed) return reject("Canvas not initialized");
      if (!document || !document.pages || document.pages.length === 0) return resolve();
      
      const page = document.pages[0];
      try {
        const fabricJson = {
          version: "5.3.0",
          objects: page.layers
        };
        this.canvas.loadFromJSON(fabricJson, () => {
          if (this.isDestroyed || !this.canvas) return reject("Canvas disposed during load");
          this.canvas.requestRenderAll();
          resolve();
        });
      } catch (err) {
        console.error("Failed to load document", err);
        reject(err);
      }
    });
  }
}
