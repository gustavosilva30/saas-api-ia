import { ICommand } from "./ICommand";
import { EventBus, StudioEvent } from "../events/EventBus";

export class CommandManager {
  private undoStack: ICommand[] = [];
  private redoStack: ICommand[] = [];
  private maxHistory: number = 50;

  /**
   * Executa um novo comando e o adiciona à pilha de Undo.
   */
  executeCommand(command: ICommand) {
    command.execute();
    this.undoStack.push(command);
    
    // Quando executamos um novo comando, a pilha de refazer é invalidada.
    this.redoStack = [];

    if (this.undoStack.length > this.maxHistory) {
      this.undoStack.shift(); // Remove o comando mais antigo
    }
    
    // Disparar evento genérico de mudança de estado, útil para Auto Save
    EventBus.emit(StudioEvent.PROJECT_SAVED);
  }

  /**
   * Desfaz a última ação.
   */
  undo() {
    if (this.undoStack.length === 0) return;
    
    const command = this.undoStack.pop()!;
    command.undo();
    this.redoStack.push(command);

    EventBus.emit(StudioEvent.PROJECT_SAVED);
  }

  /**
   * Refaz a última ação desfeita.
   */
  redo() {
    if (this.redoStack.length === 0) return;
    
    const command = this.redoStack.pop()!;
    command.execute();
    this.undoStack.push(command);

    EventBus.emit(StudioEvent.PROJECT_SAVED);
  }

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  clear() {
    this.undoStack = [];
    this.redoStack = [];
  }
}
