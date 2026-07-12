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

  getHistory(): { command: ICommand; label: string; id: string }[] {
    return this.undoStack.map((cmd, index) => ({
      command: cmd,
      label: (cmd as any).label || `Ação ${index + 1}`,
      id: `cmd-${index}`
    }));
  }

  goTo(index: number) {
    if (index < 0 || index >= this.undoStack.length) return;
    
    // Calcula quantos passos precisamos voltar
    const stepsToUndo = this.undoStack.length - 1 - index;
    for (let i = 0; i < stepsToUndo; i++) {
      this.undo();
    }
  }

  clear() {
    this.undoStack = [];
    this.redoStack = [];
  }
}

