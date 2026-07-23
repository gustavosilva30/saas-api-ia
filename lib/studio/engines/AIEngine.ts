import { v4 as uuidv4 } from 'uuid';
import { globalBackgroundTaskManager } from './BackgroundTaskManager';

export interface AITelemetry {
  jobId: string;
  provider: string;
  action: 'remove_bg' | 'upscale' | 'generate_image' | 'magic_erase' | 'generate_text';
  durationMs: number;
  creditsCost: number;
  status: 'success' | 'failed';
  errorMessage?: string;
  timestamp: number;
}

export interface AIProvider {
  id: string;
  name: string;
  executeRemoveBg?: (imageUrl: string) => Promise<{ resultUrl: string; creditsCost: number }>;
  executeUpscale?: (imageUrl: string, scale: number) => Promise<{ resultUrl: string; creditsCost: number }>;
  executeGeneration?: (prompt: string) => Promise<{ resultUrl: string; creditsCost: number }>;
}

export class AIEngine {
  private providers: Map<string, AIProvider> = new Map();
  private telemetryLogs: AITelemetry[] = [];

  public registerProvider(provider: AIProvider) {
    this.providers.set(provider.id, provider);
  }

  public getProvider(id: string): AIProvider | undefined {
    return this.providers.get(id);
  }

  public getTelemetryLogs(): AITelemetry[] {
    return this.telemetryLogs;
  }

  private logTelemetry(data: Omit<AITelemetry, 'timestamp'>) {
    const logEntry: AITelemetry = {
      ...data,
      timestamp: Date.now()
    };
    this.telemetryLogs.push(logEntry);
    console.log('[AIEngine Telemetry]', logEntry);
    
    // Numa aplicação real, emitiria para um servidor remoto (Datadog, PostHog, etc)
  }

  /**
   * Executa a remoção de fundo encapsulando em um Background Task
   * e rastreando a telemetria do provedor utilizado.
   */
  public executeRemoveBg(providerId: string, imageUrl: string): Promise<string> {
    const provider = this.getProvider(providerId);
    if (!provider || !provider.executeRemoveBg) {
      return Promise.reject(new Error(`Provider ${providerId} not found or doesn't support background removal.`));
    }

    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const jobId = globalBackgroundTaskManager.addJob(`Remoção de Fundo (${provider.name})`, async () => {
        try {
          const result = await provider.executeRemoveBg!(imageUrl);
          this.logTelemetry({
            jobId,
            provider: providerId,
            action: 'remove_bg',
            durationMs: Date.now() - startTime,
            creditsCost: result.creditsCost,
            status: 'success'
          });
          resolve(result.resultUrl);
        } catch (error: any) {
          this.logTelemetry({
            jobId,
            provider: providerId,
            action: 'remove_bg',
            durationMs: Date.now() - startTime,
            creditsCost: 0,
            status: 'failed',
            errorMessage: error.message
          });
          reject(error);
          throw error; // Re-throw to fail the BackgroundJob
        }
      });
    });
  }

  // Mesma lógica se aplicaria para Upscale e Generate...
}

export const globalAIEngine = new AIEngine();
