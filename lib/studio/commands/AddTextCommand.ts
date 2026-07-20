import { ICommand } from "./ICommand";
import { useStudioStore } from "@/store/useStudioStore";

export interface AddTextOptions {
  fontFamily?: string;
  fontSize?: number;
  fill?: string;
  fontWeight?: string | number;
  textAlign?: string;
}

export class AddTextCommand implements ICommand {
  name = "Adicionar Texto";
  private objectId: string | null = null;

  constructor(private text: string, private options?: AddTextOptions) {}

  execute(): void {
    const engine = useStudioStore.getState().engine;
    if (!engine) return;

    // A primeira vez gera um novo ID, no Redo ele também gera um novo id
    // A engine já retorna o ID gerado (síncrono para texto, diferente da imagem que carrega async)
    this.objectId = engine.addText(this.text, this.options);
  }

  undo(): void {
    const engine = useStudioStore.getState().engine;
    if (engine && this.objectId) {
      engine.removeObject(this.objectId);
      this.objectId = null;
    }
  }
}
