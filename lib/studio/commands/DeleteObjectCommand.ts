import { ICommand } from "../engine/CommandManager";
import { IRenderEngine } from "../engine/IRenderEngine";
import { EventBus, StudioEvent } from "../events/EventBus";

export class DeleteObjectCommand implements ICommand {
  private objectId: string;
  private objectData: any = null; // Para guardar o estado e permitir o undo

  constructor(objectId: string) {
    this.objectId = objectId;
  }

  async execute(engine: IRenderEngine): Promise<void> {
    // Como a biblioteca Fabric.js exporta os objetos, precisaremos do JSON 
    // do objeto caso o usuário dê Undo. Mas para não acoplar o Fabric diretamente,
    // o método correto seria o engine exportar os dados do objeto.
    // Para fins de demonstração simples da Fase 4, focaremos no removeObject.
    engine.removeObject(this.objectId);
    EventBus.emit(StudioEvent.OBJECT_REMOVED, { id: this.objectId });
  }

  async undo(engine: IRenderEngine): Promise<void> {
    // TODO: Recriar o objeto a partir de objectData
    console.log(`[DeleteObjectCommand] Undo não implementado para recriar objeto ${this.objectId}`);
  }
}
