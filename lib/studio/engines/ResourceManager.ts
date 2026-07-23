import { EventBus, StudioEvent } from '../events/EventBus';
import { v4 as uuidv4 } from 'uuid';

export interface ResourceItem {
  id: string;
  type: 'image' | 'video' | 'webgl_context' | 'large_canvas' | 'audio';
  estimatedBytes: number;
  referenceId: string; // ID do objeto no canvas que possui este recurso
  lastUsed: number;
}

export class ResourceManager {
  private resources: Map<string, ResourceItem> = new Map();
  private maxMemoryThresholdBytes: number = 500 * 1024 * 1024; // 500MB (estimado em VRAM/RAM para canvas pesado)
  
  constructor() {
    // Monitora a exclusão de objetos para liberar memória
    EventBus.on(StudioEvent.OBJECT_REMOVED, (payload: { id: string }) => {
      this.freeResourceByReference(payload.id);
    });
    
    // Limpa tudo ao carregar novo projeto
    EventBus.on(StudioEvent.PROJECT_LOADED, () => {
      this.freeAll();
    });
  }

  public registerResource(type: ResourceItem['type'], referenceId: string, estimatedBytes: number): string {
    const id = uuidv4();
    this.resources.set(id, {
      id,
      type,
      referenceId,
      estimatedBytes,
      lastUsed: Date.now()
    });

    this.checkMemoryPressure();
    return id;
  }

  public touchResource(id: string) {
    const res = this.resources.get(id);
    if (res) {
      res.lastUsed = Date.now();
    }
  }

  private freeResourceByReference(referenceId: string) {
    for (const [key, res] of this.resources.entries()) {
      if (res.referenceId === referenceId) {
        // Em um sistema real, aqui chamaríamos res.dispose(), URL.revokeObjectURL(), etc.
        console.log(`[ResourceManager] Liberando memória do recurso: ${key} (${res.type})`);
        this.resources.delete(key);
      }
    }
  }

  public freeAll() {
    console.log(`[ResourceManager] Limpando todos os recursos (${this.resources.size} itens)`);
    // Chamar revokeObjectURL para imagens blob se existissem
    this.resources.clear();
  }

  public getTotalEstimatedMemory(): number {
    let total = 0;
    this.resources.forEach(r => total += r.estimatedBytes);
    return total;
  }

  private checkMemoryPressure() {
    const total = this.getTotalEstimatedMemory();
    if (total > this.maxMemoryThresholdBytes) {
      console.warn(`[ResourceManager] ALERTA: Consumo de memória alto estimado em ${(total / 1024 / 1024).toFixed(2)} MB`);
      // Em uma v2, poderia disparar garbage collection forçada de resources não visíveis
    }
  }
}

export const globalResourceManager = new ResourceManager();
