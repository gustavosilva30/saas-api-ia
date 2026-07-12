import { create } from "zustand";
import { api } from "@/lib/api";

export type JobStatus = "pending" | "processing" | "completed" | "failed" | "cancelled";
export type JobType = "bg-removal" | "upscale" | "export";

export interface Job {
  id: string;
  type: JobType;
  status: JobStatus;
  file?: File;
  originalUrl: string;
  resultUrl: string | null;
  error?: string;
  createdAt: number;
  completedAt?: number;
}

interface JobState {
  jobs: Record<string, Job>;
  
  // Actions
  addJob: (file: File, type: JobType, tier?: string) => Promise<string>;
  cancelJob: (id: string) => void;
  clearCompleted: () => void;
  removeJob: (id: string) => void;
  getJobsArray: () => Job[];
  
  // Internal Polling
  _startPolling: (jobId: string) => void;
}

export const useJobStore = create<JobState>((set, get) => ({
  jobs: {},

  addJob: async (file: File, type: JobType, tier: string = "basic") => {
    // 1. Otimisticamente cria o local object
    const tempId = `temp_${Date.now()}`;
    const newJob: Job = {
      id: tempId,
      type,
      status: "pending",
      file,
      originalUrl: URL.createObjectURL(file),
      resultUrl: null,
      createdAt: Date.now(),
    };

    set((state) => ({
      jobs: { ...state.jobs, [tempId]: newJob }
    }));

    try {
      // 2. Dispara pro Backend
      const result = await api.createJob(file, tier);
      const realId = result.job_id;
      
      // 3. Substitui o temp ID pelo Real ID no Store
      set((state) => {
        const updatedJobs = { ...state.jobs };
        delete updatedJobs[tempId];
        updatedJobs[realId] = { ...newJob, id: realId, status: result.status as JobStatus };
        return { jobs: updatedJobs };
      });

      // 4. Inicia Polling
      get()._startPolling(realId);
      
      return realId;
    } catch (err: any) {
      set((state) => ({
        jobs: {
          ...state.jobs,
          [tempId]: { ...newJob, status: "failed", error: err.message, completedAt: Date.now() }
        }
      }));
      throw err;
    }
  },

  cancelJob: (id: string) => {
    // Para simplificar no MVP, apenas marcamos no client. Backend precisaria de uma rota DELETE /jobs/{id}
    set((state) => {
      const job = state.jobs[id];
      if (!job || job.status === "completed" || job.status === "failed") return state;
      return {
        jobs: {
          ...state.jobs,
          [id]: { ...job, status: "cancelled" }
        }
      };
    });
  },

  clearCompleted: () => {
    set((state) => {
      const newJobs = { ...state.jobs };
      Object.keys(newJobs).forEach(id => {
        if (newJobs[id].status === "completed" || newJobs[id].status === "failed" || newJobs[id].status === "cancelled") {
          delete newJobs[id];
        }
      });
      return { jobs: newJobs };
    });
  },

  removeJob: (id: string) => {
    set((state) => {
      const newJobs = { ...state.jobs };
      delete newJobs[id];
      return { jobs: newJobs };
    });
  },

  getJobsArray: () => {
    const state = get();
    return Object.values(state.jobs).sort((a, b) => b.createdAt - a.createdAt);
  },

  _startPolling: (jobId: string) => {
    const pollInterval = setInterval(async () => {
      const state = get();
      const job = state.jobs[jobId];
      
      // Se não existe ou se já parou, limpa o interval
      if (!job || job.status === "completed" || job.status === "failed" || job.status === "cancelled") {
        clearInterval(pollInterval);
        return;
      }

      try {
        const jobData = await api.getJobStatus(jobId);
        
        set((s) => {
          const currentJob = s.jobs[jobId];
          if (!currentJob) return s;
          
          return {
            jobs: {
              ...s.jobs,
              [jobId]: {
                ...currentJob,
                status: jobData.status,
                resultUrl: jobData.result_url,
                error: jobData.error_message,
                completedAt: (jobData.status === "completed" || jobData.status === "failed") ? Date.now() : undefined
              }
            }
          };
        });
      } catch (err) {
        console.error(`Erro ao fazer polling do job ${jobId}`, err);
        // Não falha imediatamente em 1 erro de rede, apenas tenta na próxima iteracao
      }
    }, 2000); // Poll a cada 2 segundos
  }
}));
