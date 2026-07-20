import { ICommand } from "./ICommand";
import { useStudioStore } from "@/store/useStudioStore";

export class UpdateImageCommand implements ICommand {
  name = "Atualizar Imagem";

  constructor(private objectId: string, private oldUrl: string, private newUrl: string) {}

  execute(): void {
    const engine = useStudioStore.getState().engine;
    if (!engine) return;

    engine.updateObjectImageUrl(this.objectId, this.newUrl);
  }

  undo(): void {
    const engine = useStudioStore.getState().engine;
    if (!engine) return;

    engine.updateObjectImageUrl(this.objectId, this.oldUrl);
  }
}
