"use client";

import { useJobStore } from "@/store/useJobStore";
import { RefreshCw, CheckCircle2, ChevronUp, Layers } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useState } from "react";

export function GlobalJobMonitor() {
  const { getJobsArray } = useJobStore();
  const [expanded, setExpanded] = useState(false);
  
  const jobs = getJobsArray();
  const activeJobs = jobs.filter(j => j.status === "pending" || j.status === "running");
  
  if (activeJobs.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end">
      <div 
        className={cn(
          "bg-card border shadow-lg rounded-t-xl overflow-hidden transition-all duration-300 w-64",
          expanded ? "max-h-64 opacity-100 mb-1" : "max-h-0 opacity-0 border-none"
        )}
      >
        <div className="p-3 bg-muted/30 border-b flex justify-between items-center text-xs font-semibold">
          <span>Fila de Processamento</span>
          <span className="text-muted-foreground">{activeJobs.length} ativos</span>
        </div>
        <div className="max-h-48 overflow-y-auto p-2 space-y-1">
          {activeJobs.map(job => (
            <div key={job.id} className="flex items-center gap-2 p-1.5 text-xs rounded hover:bg-muted/50">
              {job.status === "running" ? (
                <RefreshCw className="size-3.5 animate-spin text-primary shrink-0" />
              ) : (
                <div className="size-3.5 rounded-full border border-muted-foreground/30 shrink-0" />
              )}
              <span className="truncate flex-1">{job.file.name}</span>
            </div>
          ))}
        </div>
      </div>

      <button 
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-3 bg-primary text-primary-foreground px-4 py-2.5 rounded-full shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 active:translate-y-0"
      >
        <div className="relative">
          <Layers className="size-5" />
          <span className="absolute -top-1.5 -right-1.5 bg-destructive text-white text-[10px] font-bold size-4 flex items-center justify-center rounded-full">
            {activeJobs.length}
          </span>
        </div>
        <div className="flex flex-col items-start text-left">
          <span className="text-sm font-semibold leading-none">Job System</span>
          <span className="text-[10px] opacity-80 mt-0.5">Processando offscreen...</span>
        </div>
        <ChevronUp className={cn("size-4 transition-transform ml-1", expanded ? "rotate-180" : "")} />
      </button>
    </div>
  );
}
