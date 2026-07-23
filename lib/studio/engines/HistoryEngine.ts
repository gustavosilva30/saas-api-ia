import { EventBus, StudioEvent } from '../events/EventBus';
import { ICommand } from '../commands/ICommand';
import { useDocumentStore } from '@/store/useDocumentStore';

export class HistoryEngine {
  private undoStack: ICommand[] = [];
  private redoStack: ICommand[] = [];
  private readonly maxHistory: number = 50;
  
  private isExecuting: boolean = false;

  constructor() {
    // Escuta o descarregamento da página para forçar um AutoSave
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => this.autoSave());
    }
  }

  /**
   * Executa um novo comando e o adiciona à pilha de Undo.
   */
  public executeCommand(command: ICommand) {
    if (this.isExecuting) return;
    
    this.isExecuting = true;
    try {
      command.execute();
      this.undoStack.push(command);
      
      // Ao executar nova ação, a pilha de refazer é invalidada.
      this.redoStack = [];

      if (this.undoStack.length > this.maxHistory) {
        this.undoStack.shift();
      }
      
      this.notifyHistoryChanged();
      EventBus.emit(StudioEvent.COMMAND_EXECUTED, { commandName: command.name });
      
      // Auto Save local a cada X comandos ou a cada comando importante
      this.autoSave();
    } catch (e) {
      console.error("Failed to execute command:", e);
      EventBus.emit(StudioEvent.ERROR_OCCURRED, { message: "Failed to execute command", error: e });
    } finally {
      this.isExecuting = false;
    }
  }

  public undo() {
    if (this.undoStack.length === 0 || this.isExecuting) return;
    
    this.isExecuting = true;
    try {
      const command = this.undoStack.pop()!;
      command.undo();
      this.redoStack.push(command);

      this.notifyHistoryChanged();
      this.autoSave();
    } catch (e) {
      console.error("Failed to undo command:", e);
    } finally {
      this.isExecuting = false;
    }
  }

  public redo() {
    if (this.redoStack.length === 0 || this.isExecuting) return;
    
    this.isExecuting = true;
    try {
      const command = this.redoStack.pop()!;
      command.execute();
      this.undoStack.push(command);

      this.notifyHistoryChanged();
      this.autoSave();
    } catch (e) {
      console.error("Failed to redo command:", e);
    } finally {
      this.isExecuting = false;
    }
  }

  public canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  public canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  public clear() {
    this.undoStack = [];
    this.redoStack = [];
    this.notifyHistoryChanged();
  }

  private notifyHistoryChanged() {
    EventBus.emit(StudioEvent.HISTORY_CHANGED, {
      canUndo: this.canUndo(),
      canRedo: this.canRedo()
    });
  }

  /**
   * Salva um snapshot do projeto atual no IndexedDB/LocalStorage.
   */
  public autoSave() {
    const document = useDocumentStore.getState().document;
    if (!document) return;

    // TODO: Mover para um StorageAdapter genérico (IndexedDB)
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(`studio_autosave_${document.id}`, JSON.stringify(document));
        EventBus.emit(StudioEvent.PROJECT_SAVED, undefined);
      }
    } catch (e) {
      console.warn("AutoSave failed (possible quota exceeded):", e);
    }
  }

  /**
   * Recupera o último Auto Save.
   */
  public restoreLatest(documentId: string): any {
    if (typeof window === 'undefined') return null;
    const data = localStorage.getItem(`studio_autosave_${documentId}`);
    if (data) {
      try {
        return JSON.parse(data);
      } catch (e) {
        return null;
      }
    }
    return null;
  }
}

export const globalHistoryEngine = new HistoryEngine();
