import { create } from "zustand";
import { api } from "@/lib/api";

export interface Plan {
  id: string;
  name: string;
  price: number;
  credits: number;
  features: string[];
}

export interface CostLog {
  id: string;
  jobId?: string;
  model?: string;
  creditsUsed: number;
  costUsd: number;
  timestamp: string;
  reason?: string;
  balanceAfter?: number;
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
  premium: {
    id: "premium",
    name: "Plano Premium",
    price: 99,
    credits: 5000,
    features: ["Todos os modelos", "Suporte VIP", "Maior prioridade"],
  }
};

interface BillingState {
  currentPlanId: string;
  totalCredits: number;
  usedCredits: number;
  costLogs: CostLog[];
  loading: boolean;
  
  // Actions
  refreshBalance: () => Promise<void>;
  refreshTransactions: () => Promise<void>;
  
  // Deprecated mocks (mantidos apenas para compatibilidade visual temporária)
  setPlan: (planId: string) => void;
  consumeCredits: (credits: number, model: string, jobId: string) => boolean;
  addCredits: (amount: number) => void;
  getAvailableCredits: () => number;
}

export const useBillingStore = create<BillingState>()(
  (set, get) => ({
    currentPlanId: "free",
    totalCredits: 0,
    usedCredits: 0,
    costLogs: [],
    loading: false,

    refreshBalance: async () => {
      set({ loading: true })
      try {
        const data = await api.getBillingBalance();
        set({
          currentPlanId: data.plan,
          totalCredits: data.credits,
          usedCredits: 0 // Backend já retorna o saldo líquido (credits)
        });
      } catch (e) {
        console.error("Failed to refresh balance", e);
      } finally {
        set({ loading: false })
      }
    },

    refreshTransactions: async () => {
      set({ loading: true })
      try {
        const data = await api.getBillingTransactions();
        const logs: CostLog[] = data.map((t: any) => ({
          id: `tx_${t.created_at}`,
          creditsUsed: Math.abs(t.amount),
          costUsd: 0,
          timestamp: t.created_at,
          reason: t.reason,
          balanceAfter: t.balance_after
        }));
        set({ costLogs: logs });
      } catch (e) {
        console.error("Failed to refresh transactions", e);
      } finally {
        set({ loading: false })
      }
    },

    // DEPRECATED: Estes métodos eram do MVP. Eles não alteram o banco de dados.
    setPlan: (planId) => {
      console.warn("setPlan is deprecated. Plan changes must happen via API.");
    },

    consumeCredits: (credits, model, jobId) => {
      console.warn("consumeCredits is deprecated. API handles billing.");
      return false;
    },

    addCredits: (amount) => {
      console.warn("addCredits is deprecated. Use Stripe API.");
    },

    getAvailableCredits: () => {
      const state = get();
      return state.totalCredits; // Agora totalCredits É o saldo disponível real
    },
  })
);
