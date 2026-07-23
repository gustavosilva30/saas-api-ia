import { StudioDocument, StudioPage, StudioAsset, StudioStyle, StudioVariable } from '../core/models/DocumentModels';

export enum StudioEvent {
  // Engine
  CANVAS_INITIALIZED = "CANVAS_INITIALIZED",
  CANVAS_READY = "CANVAS_READY",
  
  // Objects
  OBJECT_ADDED = "OBJECT_ADDED",
  OBJECT_REMOVED = "OBJECT_REMOVED",
  OBJECT_MODIFIED = "OBJECT_MODIFIED",
  
  // Selection Engine
  SELECTION_CHANGED = "SELECTION_CHANGED", // Substitui OBJECT_SELECTED e SELECTION_CLEARED
  HOVER_CHANGED = "HOVER_CHANGED",
  
  // Viewport
  ZOOM_CHANGED = "ZOOM_CHANGED",
  PAN_CHANGED = "PAN_CHANGED",
  
  // Document
  PROJECT_LOADED = "PROJECT_LOADED",
  PROJECT_SAVED = "PROJECT_SAVED",
  PAGE_CHANGED = "PAGE_CHANGED",
  
  // History & Commands
  COMMAND_EXECUTED = "COMMAND_EXECUTED",
  HISTORY_CHANGED = "HISTORY_CHANGED",
  
  // Assets & Library
  ASSET_UPLOADED = "ASSET_UPLOADED",
  ASSET_DELETED = "ASSET_DELETED",
  
  // Background Tasks
  BACKGROUND_JOB_STARTED = "job:started",
  BACKGROUND_JOB_COMPLETED = "job:completed",
  BACKGROUND_JOB_FAILED = "job:failed",
  
  // System
  ERROR_OCCURRED = "ERROR_OCCURRED",
}

export interface StudioEventMap {
  [StudioEvent.CANVAS_INITIALIZED]: void;
  [StudioEvent.CANVAS_READY]: { width: number; height: number };
  
  [StudioEvent.OBJECT_ADDED]: { id: string; type: string; [key: string]: any };
  [StudioEvent.OBJECT_REMOVED]: { id: string };
  [StudioEvent.OBJECT_MODIFIED]: { id: string; properties: any };
  [StudioEvent.OBJECT_SELECTED]: any[];
  [StudioEvent.SELECTION_CLEARED]: void;
  
  [StudioEvent.SELECTION_CHANGED]: { selectedIds: string[] };
  [StudioEvent.HOVER_CHANGED]: { objectId: string | null };
  
  [StudioEvent.ZOOM_CHANGED]: number;
  [StudioEvent.PAN_CHANGED]: { x: number; y: number };
  
  [StudioEvent.PROJECT_LOADED]: { document: StudioDocument };
  [StudioEvent.PROJECT_SAVED]: void; // Pode enviar o JSON se necessário
  [StudioEvent.PAGE_CHANGED]: { pageId: string };
  
  [StudioEvent.COMMAND_EXECUTED]: { commandName: string };
  [StudioEvent.HISTORY_CHANGED]: { canUndo: boolean; canRedo: boolean };
  
  [StudioEvent.ASSET_UPLOADED]: { asset: StudioAsset };
  [StudioEvent.ASSET_DELETED]: { assetId: string };
  
  [StudioEvent.BACKGROUND_JOB_STARTED]: any;
  [StudioEvent.BACKGROUND_JOB_COMPLETED]: any;
  [StudioEvent.BACKGROUND_JOB_FAILED]: any;

  [StudioEvent.ERROR_OCCURRED]: { message: string; error?: any };
}


type EventCallback<K extends keyof StudioEventMap> = (payload: StudioEventMap[K]) => void;

class EventBusCore {
  private listeners: Map<keyof StudioEventMap, Set<Function>> = new Map();

  on<K extends keyof StudioEventMap>(event: K, callback: EventCallback<K>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Retorna a função de unsubscribe
    return () => {
      this.off(event, callback);
    };
  }

  off<K extends keyof StudioEventMap>(event: K, callback: EventCallback<K>) {
    if (this.listeners.has(event)) {
      this.listeners.get(event)!.delete(callback);
    }
  }

  emit<K extends keyof StudioEventMap>(event: K, payload: StudioEventMap[K]) {
    if (this.listeners.has(event)) {
      this.listeners.get(event)!.forEach((callback) => {
        try {
          callback(payload);
        } catch (error) {
          console.error(`Error executing callback for event ${event}:`, error);
        }
      });
    }
  }

  clearAll() {
    this.listeners.clear();
  }
}

export const EventBus = new EventBusCore();
