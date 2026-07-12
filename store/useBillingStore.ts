import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Plan {
  id: string;
  name: string;
  price: number;
  credits: number;
  features: string[];
}

export interface CostLog {
  id: string;
  jobId: string;
  model: string;
  creditsUsed: number;
  costUsd: number;
  timestamp: string;
}

export const PLANS: Record<string, Plan> = {
  free: {
    id: "free",
    name: "Plano Basic",
    price: 0,
    credits: 50,
    features: ["Acesso ao modelo u2netp (Padrão)", "Suporte comunitário"],
  },
  pro: {
    id: "pro",
    name: "Plano Pro",
    price: 49,
    credits: 1000,
    features: ["Modelos avançados (isnet-general)", "Alta Resolução", "Prioridade na fila"],
  },
};

interface BillingState {
  currentPlanId: string;
  totalCredits: number;
  usedCredits: number;
  costLogs: CostLog[];
  
  // Actions
  setPlan: (planId: string) => void;
  consumeCredits: (credits: number, model: string, jobId: string) => boolean;
  addCredits: (amount: number) => void;
  getAvailableCredits: () => number;
}

export const useBillingStore = create<BillingState>()(
  persist(
    (set, get) => ({
      currentPlanId: "free",
      totalCredits: PLANS.free.credits,
      usedCredits: 0,
      costLogs: [],

      setPlan: (planId) => {
        const plan = PLANS[planId];
        if (plan) {
          set((state) => ({
            currentPlanId: planId,
            totalCredits: state.totalCredits + plan.credits,
          }));
        }
      },

      consumeCredits: (credits, model, jobId) => {
        const state = get();
        if (state.totalCredits - state.usedCredits >= credits) {
          const log: CostLog = {
            id: `cost_${Date.now()}`,
            jobId,
            model,
            creditsUsed: credits,
            costUsd: credits * 0.001, // Mock USD cost
            timestamp: new Date().toISOString(),
          };

          set((s) => ({
            usedCredits: s.usedCredits + credits,
            costLogs: [log, ...s.costLogs],
          }));
          return true; // Success
        }
        return false; // Insufficient credits
      },

      addCredits: (amount) => {
        set((state) => ({
          totalCredits: state.totalCredits + amount,
        }));
      },

      getAvailableCredits: () => {
        const state = get();
        return state.totalCredits - state.usedCredits;
      },
    }),
    {
      name: "billing-storage",
    }
  )
);
