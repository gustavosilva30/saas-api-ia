import { ICommand } from "../engine/CommandManager";
import { IRenderEngine } from "../engine/IRenderEngine";
import { EventBus, StudioEvent } from "../events/EventBus";

export class MoveLayerCommand implements ICommand {
  private objectId: string;
  private direction: "forward" | "backward";

  constructor(objectId: string, direction: "forward" | "backward") {
    this.objectId = objectId;
    this.direction = direction;
  }

  async execute(engine: IRenderEngine): Promise<void> {
    if (this.direction === "forward") {
      engine.bringForward(this.objectId);
    } else {
      engine.sendBackwards(this.objectId);
    }
  }

  async undo(engine: IRenderEngine): Promise<void> {
    if (this.direction === "forward") {
      engine.sendBackwards(this.objectId);
    } else {
      engine.bringForward(this.objectId);
    }
  }
}
