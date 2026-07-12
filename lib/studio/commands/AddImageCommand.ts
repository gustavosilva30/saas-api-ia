import { ICommand } from "./ICommand";
import { useStudioStore } from "@/store/useStudioStore";

export class AddImageCommand implements ICommand {
  name = "Adicionar Imagem";
  private objectId: string | null = null;

  constructor(private url: string) {}

  execute(): void {
    const engine = useStudioStore.getState().engine;
    if (!engine) return;

    if (!this.objectId) {
      // Primeira vez executando
      engine.addImageFromUrl(this.url).then(id => {
        this.objectId = id;
      });
    } else {
      // Re-executando no Redo
      engine.addImageFromUrl(this.url).then(id => {
        this.objectId = id; // O ID pode mudar no Fabric, mas registramos o novo
      });
    }
  }

  undo(): void {
    const engine = useStudioStore.getState().engine;
    if (engine && this.objectId) {
      engine.removeObject(this.objectId);
      this.objectId = null;
    }
  }
}
