import { fabric } from "fabric";
import { v4 as uuidv4 } from "uuid";
import { IRenderEngine, LayerInfo } from "./IRenderEngine";
import { EventBus, StudioEvent } from "../events/EventBus";
import "./CurvesFilter"; // Registra o filtro customizado

// Tipos auxiliares de Seleção e Ajustes
type SelectionType = 'rect' | 'ellipse' | 'lasso' | 'crop';
type AdjustmentType = 'brightness' | 'contrast' | 'saturation' | 'hue' | 'curves' | 'blur' | 'noise' | 'pixelate';

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
    
    // Lasso Tool / Free drawing interception
    this.canvas.on('path:created', (e: any) => {
      if ((this as any)._selectionMode === 'lasso') {
        EventBus.emit('LASSO_PATH_CREATED', e.path);
      }
    });
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

  setBackgroundGradient(config: { type: 'linear'|'radial', colorStops: {offset: number, color: string}[], coords?: any }): void {
    if (this.canvas) {
      // Default coordinates if not provided
      let coords = config.coords;
      if (!coords) {
        if (config.type === 'linear') {
          coords = { x1: 0, y1: 0, x2: this.canvas.width || 800, y2: this.canvas.height || 800 };
        } else {
          const w = this.canvas.width || 800;
          const h = this.canvas.height || 800;
          const r = Math.max(w, h) / 2;
          coords = { x1: w/2, y1: h/2, r1: 0, x2: w/2, y2: h/2, r2: r };
        }
      }

      const gradient = new fabric.Gradient({
        type: config.type,
        coords: coords,
        colorStops: config.colorStops
      });

      this.canvas.backgroundColor = gradient as any;
      this.canvas.requestRenderAll();
    }
  }

  setBackgroundImage(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.canvas) return reject();
      
      fabric.Image.fromURL(url, (img) => {
        if (!img || !this.canvas) return reject();
        
        // Scale to cover or fit
        const canvasWidth = this.canvas.width || 800;
        const canvasHeight = this.canvas.height || 600;
        
        const scaleX = canvasWidth / (img.width || 1);
        const scaleY = canvasHeight / (img.height || 1);
        const scale = Math.max(scaleX, scaleY);
        
        img.set({
          scaleX: scale,
          scaleY: scale,
          originX: 'center',
          originY: 'center',
          left: canvasWidth / 2,
          top: canvasHeight / 2
        });

        this.canvas.setBackgroundImage(img, this.canvas.renderAll.bind(this.canvas));
        resolve();
      }, { crossOrigin: 'anonymous' });
    });
  }

  clearBackgroundImage(): void {
    if (this.canvas) {
      this.canvas.backgroundImage = null;
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

  duplicateObject(id: string): string {
    if (!this.canvas) return "";
    const objects = this.canvas.getObjects() as any[];
    const target = objects.find(o => o.id === id);
    if (!target) return "";

    const newId = uuidv4();
    target.clone((cloned: any) => {
      cloned.set({
        id: newId,
        left: cloned.left + 20,
        top: cloned.top + 20,
      });
      this.canvas!.add(cloned);
      this.canvas!.setActiveObject(cloned);
      this.canvas!.requestRenderAll();
      EventBus.emit(StudioEvent.OBJECT_ADDED, cloned);
    });
    return newId;
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
      const propsToSet = { ...properties };
      // Handle Gradients dynamically
      ['fill', 'stroke'].forEach(key => {
        if (propsToSet[key] && typeof propsToSet[key] === 'object' && propsToSet[key].colorStops) {
          const config = propsToSet[key];
          let coords = config.coords;
          if (!coords) {
            const w = target.width * target.scaleX || 100;
            const h = target.height * target.scaleY || 100;
            if (config.type === 'linear') {
              coords = { x1: 0, y1: 0, x2: w, y2: h };
            } else {
              const r = Math.max(w, h) / 2;
              coords = { x1: w/2, y1: h/2, r1: 0, x2: w/2, y2: h/2, r2: r };
            }
          }
          propsToSet[key] = new fabric.Gradient({
            type: config.type,
            coords: coords,
            colorStops: config.colorStops
          });
        }
      });
      target.set(propsToSet);
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
      type: (obj as any).isAdjustmentLayer ? `Ajuste: ${ (obj as any).adjustmentType }` : (obj.type || "object"),
      zIndex: index,
      isAdjustmentLayer: (obj as any).isAdjustmentLayer,
      adjustmentType: (obj as any).adjustmentType,
      adjustmentValue: (obj as any).adjustmentValue
    })).reverse();
  }

  addAdjustmentLayer(type: 'brightness' | 'contrast' | 'saturation' | 'hue', value: number): string {
    if (!this.canvas) return "";
    const id = uuidv4();
    
    // Objeto Fabric transparente que servirá como placeholder visual e âncora da camada de ajuste
    const adjLayer = new fabric.Rect({
      left: 40,
      top: 40,
      width: 120,
      height: 40,
      fill: "rgba(139, 92, 246, 0.15)", // Lilás translúcido
      stroke: "#8b5cf6",
      strokeWidth: 1.5,
      rx: 6,
      ry: 6,
      cornerColor: '#8b5cf6',
      cornerStyle: 'circle',
      borderColor: '#8b5cf6',
      transparentCorners: false,
    } as any);

    // Guardar os metadados da camada de ajuste
    (adjLayer as any).id = id;
    (adjLayer as any).isAdjustmentLayer = true;
    (adjLayer as any).adjustmentType = type;
    (adjLayer as any).adjustmentValue = value;

    this.canvas.add(adjLayer);
    this.canvas.setActiveObject(adjLayer);
    this.propagateAdjustmentLayers();
    this.canvas.requestRenderAll();
    
    EventBus.emit(StudioEvent.OBJECT_ADDED, adjLayer);
    return id;
  }

  updateAdjustmentLayer(id: string, value: number): void {
    if (!this.canvas) return;
    const obj = this.canvas.getObjects().find((o: any) => o.id === id);
    if (obj && (obj as any).isAdjustmentLayer) {
      (obj as any).adjustmentValue = value;
      this.propagateAdjustmentLayers();
      this.canvas.requestRenderAll();
      EventBus.emit(StudioEvent.OBJECT_MODIFIED, obj);
    }
  }

  /**
   * Varre a pilha de camadas do canvas de baixo para cima, aplicando as camadas de ajuste
   * aos objetos posicionados abaixo delas de forma não-destrutiva.
   */
  private propagateAdjustmentLayers(): void {
    if (!this.canvas) return;
    const objects = this.canvas.getObjects();

    // 1. Resetar temporariamente os filtros de todos os objetos normais para seus valores base ou cacheados
    objects.forEach(obj => {
      if (!(obj as any).isAdjustmentLayer && obj.type === 'image' && (obj as any).filters) {
        // Se houver ajustes manuais diretos do objeto no adjustmentsCache, mantemos eles, caso contrário limpa
        const baseAdjustments = (obj as any)._adjustmentsCache || {};
        const filterTypes = ['brightness', 'contrast', 'saturation', 'hue', 'blur', 'noise', 'pixelate'];
        
        // Remove todos os filtros de imagem que foram criados por camadas de ajuste
        obj.filters = obj.filters.filter(f => f && !(f as any).fromAdjustmentLayer);
      }
    });

    // 2. Aplicar os ajustes de cada AdjustmentLayer aos objetos que estão abaixo dela
    for (let i = 0; i < objects.length; i++) {
      const currentObj = objects[i];
      if ((currentObj as any).isAdjustmentLayer) {
        const type = (currentObj as any).adjustmentType;
        const val = (currentObj as any).adjustmentValue;

        // Itera por todos os objetos abaixo desta camada (índice menor)
        for (let j = 0; j < i; j++) {
          const targetObj = objects[j];
          if (!(targetObj as any).isAdjustmentLayer && targetObj.type === 'image') {
            const img = targetObj as fabric.Image;
            if (!img.filters) img.filters = [];

            let newFilter = null;
            if (type === 'brightness') {
              newFilter = new fabric.Image.filters.Brightness({ brightness: val });
            } else if (type === 'contrast') {
              newFilter = new fabric.Image.filters.Contrast({ contrast: val });
            } else if (type === 'saturation') {
              newFilter = new fabric.Image.filters.Saturation({ saturation: val });
            } else if (type === 'hue') {
              newFilter = new fabric.Image.filters.HueRotation({ rotation: val });
            }

            if (newFilter) {
              (newFilter as any).fromAdjustmentLayer = true; // Flag para podermos remover/recalcular
              img.filters.push(newFilter);
              img.applyFilters();
            }
          }
        }
      }
    }
  }

  bringForward(id: string): void {
    if (!this.canvas) return;
    const obj = this.canvas.getObjects().find((o: any) => o.id === id);
    if (obj) {
      this.canvas.bringForward(obj);
      this.propagateAdjustmentLayers();
      this.canvas.requestRenderAll();
      EventBus.emit(StudioEvent.OBJECT_MODIFIED, obj);
    }
  }

  sendBackwards(id: string): void {
    if (!this.canvas) return;
    const obj = this.canvas.getObjects().find((o: any) => o.id === id);
    if (obj) {
      this.canvas.sendBackwards(obj);
      this.propagateAdjustmentLayers();
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
      'curves': 'Curves',
      'blur': 'Blur',
      'noise': 'Noise',
      'pixelate': 'Pixelate'
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
        case 'blur':
          newFilter = new fabric.Image.filters.Blur({ blur: params });
          break;
        case 'noise':
          newFilter = new (fabric.Image.filters as any).Noise({ noise: params });
          break;
        case 'pixelate':
          newFilter = new (fabric.Image.filters as any).Pixelate({ blocksize: params });
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

  applyAdjustments(id: string, adjustments: Record<string, any>): void {
    const supportedTypes = ['brightness', 'contrast', 'saturation', 'hue', 'blur', 'noise', 'pixelate'] as const;
    supportedTypes.forEach(type => {
      if (adjustments[type] !== undefined) {
        this.applyAdjustment(id, type as AdjustmentType, adjustments[type]);
      }
    });
  }


  // --- Selection Tools ---

  startSelection(type: SelectionType, options?: any): void {
    if (!this.canvas) return;
    (this as any)._selectionMode = type;

    if (type === 'lasso') {
      const { SelectionEngine } = require('../engine/SelectionEngine');
      SelectionEngine.startLassoDrawing(this.canvas, options?.brushSize || 2);
    } else {
      this.canvas.defaultCursor = 'crosshair';
      this.canvas.selection = false;
    }
  }

  stopSelection(): void {
    if (!this.canvas) return;
    
    if ((this as any)._selectionMode === 'lasso') {
      const { SelectionEngine } = require('../engine/SelectionEngine');
      SelectionEngine.stopLassoDrawing(this.canvas);
    } else {
      this.canvas.defaultCursor = 'default';
      this.canvas.selection = true;
    }
    
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

  exportImage(options?: { format?: "png" | "jpeg" | "webp"; quality?: number; multiplier?: number }): string {
    if (!this.canvas) return "";
    
    // Remover seleção antes de exportar
    this.canvas.discardActiveObject();
    this.canvas.requestRenderAll();
    
    const format = options?.format || "png";
    const multiplier = options?.multiplier || 2;
    const quality = options?.quality || 0.92;

    if (format === "webp") {
      // Para WebP, exportamos como PNG do fabric (já na resolução com multiplier) e convertemos usando um canvas HTML temporário
      const tempCanvas = document.createElement("canvas");
      const fabricCanvasEl = this.canvas.getElement();
      
      const width = (this.canvas.width || 800) * multiplier;
      const height = (this.canvas.height || 600) * multiplier;
      
      tempCanvas.width = width;
      tempCanvas.height = height;
      
      const ctx = tempCanvas.getContext("2d");
      if (ctx) {
        // Renderiza o canvas do Fabric na escala correta
        ctx.drawImage(fabricCanvasEl, 0, 0, width, height);
      }
      return tempCanvas.toDataURL("image/webp", quality);
    }

    return this.canvas.toDataURL({
      format: format,
      quality: quality,
      multiplier: multiplier
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

  // --- Vector & Bezier Pen Tools ---
  private _bezierPoints: any[] = [];
  private _bezierLines: any[] = [];
  private _isBezierActive = false;

  startBezierPen(): void {
    if (!this.canvas) return;
    this._isBezierActive = true;
    this._bezierPoints = [];
    this._bezierLines = [];
    this.canvas.selection = false;
    this.canvas.defaultCursor = 'pen';
    this.canvas.discardActiveObject();
    this.canvas.requestRenderAll();

    // Evento de clique para adicionar nós
    this.canvas.on('mouse:down', this.handleBezierClick.bind(this));
  }

  stopBezierPen(): void {
    if (!this.canvas) return;
    this._isBezierActive = false;
    this.canvas.off('mouse:down', this.handleBezierClick.bind(this));
    this.canvas.selection = true;
    this.canvas.defaultCursor = 'default';

    // Limpar nós e linhas temporárias
    this._bezierPoints.forEach(p => this.canvas?.remove(p));
    this._bezierLines.forEach(l => this.canvas?.remove(l));
    this._bezierPoints = [];
    this._bezierLines = [];
    this.canvas.requestRenderAll();
  }

  private handleBezierClick(opt: any): void {
    if (!this._isBezierActive || !this.canvas) return;
    const pointer = this.canvas.getPointer(opt.e);
    const x = pointer.x;
    const y = pointer.y;

    // Se o usuário clicar próximo ao ponto inicial e tivermos pelo menos 3 pontos, fecha a forma!
    if (this._bezierPoints.length >= 3) {
      const firstPt = this._bezierPoints[0];
      const distance = Math.sqrt(Math.pow(x - firstPt.left, 2) + Math.pow(y - firstPt.top, 2));
      if (distance < 15) {
        this.closeBezierPath();
        return;
      }
    }

    // Criar ponto visual (âncora)
    const anchor = new fabric.Circle({
      left: x,
      top: y,
      radius: 4,
      fill: '#8b5cf6',
      stroke: '#ffffff',
      strokeWidth: 1.5,
      originX: 'center',
      originY: 'center',
      hasControls: false,
      hasBorders: false,
      selectable: false
    });

    this._bezierPoints.push(anchor);
    this.canvas.add(anchor);

    // Se houver ponto anterior, conecta com uma linha
    if (this._bezierPoints.length > 1) {
      const prevPt = this._bezierPoints[this._bezierPoints.length - 2];
      const line = new fabric.Line([prevPt.left, prevPt.top, x, y], {
        stroke: '#8b5cf6',
        strokeWidth: 2,
        selectable: false,
        evented: false
      });
      this._bezierLines.push(line);
      this.canvas.add(line);
      // Garante que a linha fica abaixo dos pontos
      line.sendToBack();
    }
    
    this.canvas.requestRenderAll();
  }

  private closeBezierPath(): void {
    if (!this.canvas || this._bezierPoints.length < 3) return;

    // Gerar string do Path SVG
    let pathData = `M ${this._bezierPoints[0].left} ${this._bezierPoints[0].top}`;
    for (let i = 1; i < this._bezierPoints.length; i++) {
      pathData += ` L ${this._bezierPoints[i].left} ${this._bezierPoints[i].top}`;
    }
    pathData += ' Z'; // Fecha o Path

    const path = new fabric.Path(pathData, {
      fill: 'rgba(139, 92, 246, 0.4)',
      stroke: '#8b5cf6',
      strokeWidth: 2,
      id: uuidv4()
    } as any);

    // Adicionar o Path final ao canvas
    this.canvas.add(path);
    this.canvas.setActiveObject(path);

    // Finalizar desenho e limpar temporários
    this.stopBezierPen();
    EventBus.emit(StudioEvent.OBJECT_ADDED, path);
  }

  applyBooleanOperation(type: 'union' | 'difference' | 'intersection'): void {
    if (!this.canvas) return;
    const activeObjects = this.canvas.getActiveObjects();
    if (activeObjects.length < 2) {
      const { toast } = require("sonner");
      toast.error("Selecione pelo menos 2 formas geométricas para a operação booleana.");
      return;
    }

    const baseObj = activeObjects[0];
    const targetObj = activeObjects[1];

    if (type === 'union') {
      // União via agrupamento visual ou globalCompositeOperation
      baseObj.globalCompositeOperation = 'source-over';
      const group = new fabric.Group(activeObjects.map(o => {
        // Clonamos para segurança
        let clone: any;
        o.clone(c => clone = c);
        return clone;
      }), {
        id: uuidv4()
      } as any);
      
      activeObjects.forEach(o => this.canvas?.remove(o));
      this.canvas.add(group);
      this.canvas.setActiveObject(group);
    } else if (type === 'difference') {
      // Subtração (source-out / destination-out)
      targetObj.set({ globalCompositeOperation: 'destination-out' });
      const group = new fabric.Group([baseObj, targetObj].map(o => {
        let clone: any;
        o.clone(c => clone = c);
        return clone;
      }), {
        id: uuidv4()
      } as any);

      activeObjects.forEach(o => this.canvas?.remove(o));
      this.canvas.add(group);
      this.canvas.setActiveObject(group);
    } else if (type === 'intersection') {
      // Interseção (source-in)
      targetObj.set({ globalCompositeOperation: 'source-in' });
      const group = new fabric.Group([baseObj, targetObj].map(o => {
        let clone: any;
        o.clone(c => clone = c);
        return clone;
      }), {
        id: uuidv4()
      } as any);

      activeObjects.forEach(o => this.canvas?.remove(o));
      this.canvas.add(group);
      this.canvas.setActiveObject(group);
    }

    this.canvas.requestRenderAll();
    EventBus.emit(StudioEvent.HISTORY_CHANGED);
  }

  // --- Inpainting & Generative Fill Brush ---
  private _inpaintPaths: any[] = [];
  private _isInpaintBrushActive = false;

  startInpaintBrush(): void {
    if (!this.canvas) return;
    this._isInpaintBrushActive = true;
    this._inpaintPaths = [];
    this.canvas.isDrawingMode = true;
    this.canvas.freeDrawingBrush.color = "rgba(239, 68, 68, 0.5)"; // Vermelho translúcido para a máscara
    this.canvas.freeDrawingBrush.width = 24;
    this.canvas.defaultCursor = 'crosshair';
    
    // Interceptar a criação de traços para guardá-los
    this.canvas.on('path:created', this.handleInpaintPathCreated.bind(this));
  }

  stopInpaintBrush(): void {
    if (!this.canvas) return;
    this._isInpaintBrushActive = false;
    this.canvas.isDrawingMode = false;
    this.canvas.defaultCursor = 'default';
    this.canvas.off('path:created', this.handleInpaintPathCreated.bind(this));
    
    // Remove os traços de máscara vermelhos do canvas
    this._inpaintPaths.forEach(p => this.canvas?.remove(p));
    this._inpaintPaths = [];
    this.canvas.requestRenderAll();
  }

  private handleInpaintPathCreated(e: any): void {
    if (this._isInpaintBrushActive && e.path) {
      // Guardamos na lista temporária de máscara
      this._inpaintPaths.push(e.path);
    }
  }

  async getInpaintMaskAndImage(): Promise<{ imageFile: File, maskFile: File } | null> {
    if (!this.canvas || this._inpaintPaths.length === 0) return null;
    const activeObject = this.canvas.getActiveObject();
    if (!activeObject || activeObject.type !== 'image') return null;

    const img = activeObject as fabric.Image;

    // 1. Exportar Imagem Base
    const imgDataUrl = img.toDataURL({ format: 'png' });
    const imgRes = await fetch(imgDataUrl);
    const imgBlob = await imgRes.blob();
    const imageFile = new File([imgBlob], 'input_image.png', { type: 'image/png' });

    // 2. Renderizar Máscara (Preto e Branco)
    // Criamos um canvas temporário do mesmo tamanho da imagem base
    const width = img.width! * img.scaleX!;
    const height = img.height! * img.scaleY!;
    
    const tempMaskCanvas = document.createElement('canvas');
    tempMaskCanvas.width = width;
    tempMaskCanvas.height = height;
    
    const ctx = tempMaskCanvas.getContext('2d');
    if (!ctx) return null;

    // Pintar fundo de preto (área sem modificação)
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, width, height);

    // Ajustar escala e desenhar cada traço em branco (área a modificar)
    // Como os paths estão nas coordenadas globais do canvas, precisamos calcular a posição relativa ao objeto de imagem
    const imgLeft = img.left || 0;
    const imgTop = img.top || 0;

    this._inpaintPaths.forEach(path => {
      // Desenhar o path transladado para o canvas local
      // Criamos um clone do path temporariamente nas coordenadas locais da imagem
      let clone: any;
      path.clone(c => clone = c);
      if (clone) {
        // Renderizamos o path no contexto do canvas temporário pintando de branco
        // Para simplificar e garantir 100% de precisão de pixels:
        // Usamos globalCompositeOperation = 'source-over' e desenhamos em branco
        const pathCanvas = document.createElement('canvas');
        pathCanvas.width = this.canvas!.width!;
        pathCanvas.height = this.canvas!.height!;
        const pCtx = pathCanvas.getContext('2d');
        if (pCtx) {
          pCtx.fillStyle = '#000000';
          pCtx.fillRect(0, 0, pathCanvas.width, pathCanvas.height);
          // Adicionamos o path no canvas temporário com fill/stroke branco
          const tempFabricCanvas = new fabric.Canvas(pathCanvas);
          clone.set({ fill: '#ffffff', stroke: '#ffffff' });
          tempFabricCanvas.add(clone);
          tempFabricCanvas.renderAll();
          
          // Agora desenhamos este fragmento no canvas de destino recortado
          ctx.drawImage(pathCanvas, imgLeft - (width/2), imgTop - (height/2), width, height, 0, 0, width, height);
          tempFabricCanvas.dispose();
        }
      }
    });

    const maskDataUrl = tempMaskCanvas.toDataURL('image/png');
    const maskRes = await fetch(maskDataUrl);
    const maskBlob = await maskRes.blob();
    const maskFile = new File([maskBlob], 'mask.png', { type: 'image/png' });

    return { imageFile, maskFile };
  }

  magicResize(targetWidth: number, targetHeight: number): void {
    if (!this.canvas) return;

    const oldWidth = this.canvas.width || 800;
    const oldHeight = this.canvas.height || 600;

    // Fatores de proporção
    const scaleX = targetWidth / oldWidth;
    const scaleY = targetHeight / oldHeight;

    // Define novo tamanho do Canvas
    this.canvas.setWidth(targetWidth);
    this.canvas.setHeight(targetHeight);

    const objects = this.canvas.getObjects();

    objects.forEach(obj => {
      // 1. Caso seja imagem de fundo (background image esticada) ou elemento posicionado como background cover
      const isBackground = obj.get('name') === 'background' || (obj as any).isBackground;
      
      if (isBackground) {
        // Redimensionamento estilo cover
        const currentScaleX = obj.scaleX || 1;
        const currentScaleY = obj.scaleY || 1;
        
        // Coeficiente de cobertura
        const fitScale = Math.max(scaleX, scaleY);
        obj.set({
          scaleX: currentScaleX * fitScale,
          scaleY: currentScaleY * fitScale,
          left: targetWidth / 2,
          top: targetHeight / 2,
          originX: 'center',
          originY: 'center'
        });
      } else {
        // 2. Elementos flutuantes (textos, logos, figuras)
        // Reposicionamento inteligente proporcional baseado nas coordenadas relativas ao centro
        const objLeft = obj.left || 0;
        const objTop = obj.top || 0;
        
        // Mantém a proporção do centro do objeto em relação ao centro do Canvas
        const relativeX = objLeft - (oldWidth / 2);
        const relativeY = objTop - (oldHeight / 2);
        
        // Escala o tamanho do objeto proporcionalmente ao menor fator de escala do canvas (evitando distorção)
        const elementScale = Math.min(scaleX, scaleY);
        const currentScaleX = obj.scaleX || 1;
        const currentScaleY = obj.scaleY || 1;

        obj.set({
          left: (targetWidth / 2) + (relativeX * scaleX),
          top: (targetHeight / 2) + (relativeY * scaleY),
          scaleX: currentScaleX * elementScale,
          scaleY: currentScaleY * elementScale
        });
      }

      obj.setCoords(); // Atualiza os limites de bounding box
    });

    this.canvas.requestRenderAll();
    EventBus.emit(StudioEvent.HISTORY_CHANGED);
  }
}
