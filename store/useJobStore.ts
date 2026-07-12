import { create } from "zustand";
import { api } from "@/lib/api";

export type JobStatus = "pending" | "running" | "completed" | "failed" | "cancelled";
export type JobType = "bg-removal" | "upscale" | "export";

export interface Job {
  id: string;
  type: JobType;
  status: JobStatus;
  file: File;
  originalUrl: string;
  resultUrl: string | null;
  error?: string;
  createdAt: number;
  completedAt?: number;
}

interface JobState {
  jobs: Record<string, Job>;
  isProcessing: boolean;
  concurrencyLimit: number;
  
  // Actions
  addJob: (file: File, type: JobType) => string;
  cancelJob: (id: string) => void;
  clearCompleted: () => void;
  removeJob: (id: string) => void;
  getJobsArray: () => Job[];
  
  // Internal Engine Actions
  _processQueue: () => Promise<void>;
}

export const useJobStore = create<JobState>((set, get) => ({
  jobs: {},
  isProcessing: false,
  concurrencyLimit: 2, // Process up to 2 jobs at the same time

  addJob: (file: File, type: JobType) => {
    const id = `job_${Math.random().toString(36).slice(2, 9)}_${Date.now()}`;
    const newJob: Job = {
      id,
      type,
      status: "pending",
      file,
      originalUrl: URL.createObjectURL(file),
      resultUrl: null,
      createdAt: Date.now(),
    };

    set((state) => ({
      jobs: { ...state.jobs, [id]: newJob }
    }));

    // Trigger queue processing asynchronously
    setTimeout(() => {
      get()._processQueue();
    }, 0);

    return id;
  },

  cancelJob: (id: string) => {
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

  _processQueue: async () => {
    const state = get();
    if (state.isProcessing) return; // Prevent multiple loop instances
    
    set({ isProcessing: true });
    
    const processNext = async () => {
      const currentState = get();
      const allJobs = Object.values(currentState.jobs);
      
      const runningJobs = allJobs.filter(j => j.status === "running");
      const pendingJobs = allJobs.filter(j => j.status === "pending").sort((a, b) => a.createdAt - b.createdAt);
      
      // If we are at concurrency limit or no pending jobs, stop this loop branch
      if (runningJobs.length >= currentState.concurrencyLimit || pendingJobs.length === 0) {
        if (runningJobs.length === 0 && pendingJobs.length === 0) {
           set({ isProcessing: false });
        }
        return;
      }

      const jobToRun = pendingJobs[0];
      
      // Mark as running
      set((s) => ({
        jobs: { ...s.jobs, [jobToRun.id]: { ...jobToRun, status: "running" } }
      }));

      // Fire another branch to try filling up concurrency limit
      processNext();

      try {
        if (jobToRun.type === "bg-removal") {
          const result = await api.removeBackground(jobToRun.file);
          set((s) => ({
            jobs: { 
              ...s.jobs, 
              [jobToRun.id]: { 
                ...s.jobs[jobToRun.id], 
                status: "completed", 
                resultUrl: result.resultUrl,
                completedAt: Date.now() 
              } 
            }
          }));
        } else {
          throw new Error("Job type not implemented");
        }
      } catch (err: any) {
        set((s) => ({
          jobs: { 
            ...s.jobs, 
            [jobToRun.id]: { 
              ...s.jobs[jobToRun.id], 
              status: "failed", 
              error: err.message,
              completedAt: Date.now() 
            } 
          }
        }));
      }

      // After finishing one, try to process next
      processNext();
    };

    // Kick off the processing loop
    processNext();
  }
}));
