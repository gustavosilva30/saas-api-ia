import { v4 as uuidv4 } from 'uuid';
import { EventBus, StudioEvent } from '../events/EventBus';
import { useNotificationStore } from '@/store/useNotificationStore';

export type JobStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface BackgroundJob {
  id: string;
  name: string;
  execute: () => Promise<any>;
  status: JobStatus;
  progress: number; // 0 a 100
  error?: string;
}

export class BackgroundTaskManager {
  private queue: BackgroundJob[] = [];
  private maxConcurrent: number = 3;
  private runningCount: number = 0;

  public addJob(name: string, execute: () => Promise<any>): string {
    const id = uuidv4();
    const job: BackgroundJob = {
      id,
      name,
      execute,
      status: 'pending',
      progress: 0
    };
    
    this.queue.push(job);
    this.processQueue();
    
    // Opcional: Emitir notificação de inicio de job se for importante
    useNotificationStore.getState().addNotification({
      type: 'loading',
      title: 'Tarefa em Background',
      message: `${name}...`,
      duration: 0 // não apaga automático
    });
    
    return id;
  }

  private async processQueue() {
    if (this.runningCount >= this.maxConcurrent) return;

    const nextJob = this.queue.find(j => j.status === 'pending');
    if (!nextJob) return;

    nextJob.status = 'running';
    this.runningCount++;
    EventBus.emit(StudioEvent.BACKGROUND_JOB_STARTED, nextJob);

    try {
      await nextJob.execute();
      nextJob.status = 'completed';
      nextJob.progress = 100;
      
      // Notifica sucesso
      useNotificationStore.getState().addNotification({
        type: 'success',
        title: 'Concluído',
        message: nextJob.name,
        duration: 3000
      });
      
      EventBus.emit(StudioEvent.BACKGROUND_JOB_COMPLETED, nextJob);
    } catch (error: any) {
      nextJob.status = 'failed';
      nextJob.error = error.message;
      
      // Notifica erro
      useNotificationStore.getState().addNotification({
        type: 'error',
        title: 'Falha',
        message: `Erro ao processar: ${nextJob.name}`,
        duration: 5000
      });
      
      EventBus.emit(StudioEvent.BACKGROUND_JOB_FAILED, nextJob);
    } finally {
      this.runningCount--;
      // Remove da fila após concluído
      this.queue = this.queue.filter(j => j.id !== nextJob.id);
      
      // Limpa notificações de loading relacionadas (idealmente precisaríamos guardar os IDs das notificações)
      // Para simplificar, o store de notificação poderia ter uma ação dismissAllLoading()
      
      this.processQueue();
    }
  }

  public getQueueStatus() {
    return this.queue;
  }
}

export const globalBackgroundTaskManager = new BackgroundTaskManager();
