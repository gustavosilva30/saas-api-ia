type EventCallback<T = any> = (payload: T) => void;

export enum StudioEvent {
  CANVAS_INITIALIZED = "CANVAS_INITIALIZED",
  CANVAS_READY = "CANVAS_READY",
  OBJECT_ADDED = "OBJECT_ADDED",
  OBJECT_REMOVED = "OBJECT_REMOVED",
  OBJECT_MODIFIED = "OBJECT_MODIFIED",
  OBJECT_SELECTED = "OBJECT_SELECTED",
  SELECTION_CLEARED = "SELECTION_CLEARED",
  ZOOM_CHANGED = "ZOOM_CHANGED",
  PAN_CHANGED = "PAN_CHANGED",
  PROJECT_LOADED = "PROJECT_LOADED",
  PROJECT_SAVED = "PROJECT_SAVED",
  ERROR_OCCURRED = "ERROR_OCCURRED",
  HISTORY_CHANGED = "HISTORY_CHANGED",
  
  // Asset Manager Enterprise Events
  ASSET_UPLOADED = "ASSET_UPLOADED",
  ASSET_DELETED = "ASSET_DELETED",
  ASSET_UPDATED = "ASSET_UPDATED",
  ASSET_FAVORITED = "ASSET_FAVORITED",
  ASSET_ADDED_TO_CANVAS = "ASSET_ADDED_TO_CANVAS",
  ASSET_GENERATED_BY_AI = "ASSET_GENERATED_BY_AI",
}

class EventBusCore {
  private listeners: Map<string, Set<EventCallback>> = new Map();

  on<T>(event: StudioEvent | string, callback: EventCallback<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Retorna a função de unsubscribe
    return () => {
      this.off(event, callback);
    };
  }

  off<T>(event: StudioEvent | string, callback: EventCallback<T>) {
    if (this.listeners.has(event)) {
      this.listeners.get(event)!.delete(callback);
    }
  }

  emit<T>(event: StudioEvent | string, payload?: T) {
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
