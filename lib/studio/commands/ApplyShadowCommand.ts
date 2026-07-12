import { ICommand } from "./ICommand";
import { useStudioStore } from "@/store/useStudioStore";

export class ApplyShadowCommand implements ICommand {
  name = "Modificar Sombra";

  constructor(
    private previousShadow: any,
    private newShadow: any
  ) {}

  execute(): void {
    const engine = useStudioStore.getState().engine;
    if (engine) {
      engine.applyShadowToSelected(this.newShadow);
    }
  }

  undo(): void {
    const engine = useStudioStore.getState().engine;
    if (engine) {
      engine.applyShadowToSelected(this.previousShadow);
    }
  }
}
