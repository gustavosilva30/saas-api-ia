import { ICommand } from "./ICommand"
import { useStudioStore } from "@/store/useStudioStore"
import { EventBus, StudioEvent } from "../events/EventBus"

export class DuplicateObjectCommand implements ICommand {
  private originalId: string;
  private duplicatedId: string | null = null;

  constructor(originalId: string) {
    this.originalId = originalId;
  }

  execute(): void {
    const engine = useStudioStore.getState().engine;
    if (engine) {
      this.duplicatedId = engine.duplicateObject(this.originalId);
      EventBus.emit(StudioEvent.HISTORY_CHANGED);
    }
  }

  undo(): void {
    const engine = useStudioStore.getState().engine;
    if (engine && this.duplicatedId) {
      engine.removeObject(this.duplicatedId);
      EventBus.emit(StudioEvent.HISTORY_CHANGED);
    }
  }

  redo(): void {
    this.execute();
  }
}
