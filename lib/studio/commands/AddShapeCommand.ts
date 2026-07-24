import { ICommand } from "./ICommand"
import { useStudioStore } from "@/store/useStudioStore"
import { EventBus, StudioEvent } from "../events/EventBus"

export class AddShapeCommand implements ICommand {
  private objectId: string | null = null;
  private shapeType: 'rect' | 'circle' | 'polygon' | 'line' | 'arrow' | 'ellipse';

  constructor(shapeType: 'rect' | 'circle' | 'polygon' | 'line' | 'arrow' | 'ellipse') {
    this.shapeType = shapeType;
  }

  execute(): void {
    const engine = useStudioStore.getState().engine;
    if (engine) {
      this.objectId = engine.addShape(this.shapeType);
      EventBus.emit(StudioEvent.HISTORY_CHANGED);
    }
  }

  undo(): void {
    const engine = useStudioStore.getState().engine;
    if (engine && this.objectId) {
      engine.removeObject(this.objectId);
      EventBus.emit(StudioEvent.HISTORY_CHANGED);
    }
  }

  redo(): void {
    // Para simplificar a recriação, precisamos exportar o estado no undo e importar no redo em um cenário avançado
    this.execute(); 
  }
}
