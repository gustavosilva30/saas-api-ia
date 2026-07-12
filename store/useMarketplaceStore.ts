import { create } from "zustand";
import { useBillingStore } from "./useBillingStore";
import { toast } from "sonner";
import { useAuthStore } from "./useAuthStore";

export type HubItemType = "template" | "preset" | "aipack" | "bundle";

export interface HubItem {
  id: string;
  title: string;
  description: string;
  type: HubItemType;
  creator: string;
  price: number;
  rating: number;
  sales: number;
  thumbnail: string;
  tags: string[];
}

interface MarketplaceState {
  items: HubItem[];
  inventory: string[];
  isLoading: boolean;
  
  fetchItems: () => Promise<void>;
  fetchInventory: () => Promise<void>;
  purchaseItem: (id: string) => Promise<boolean>;
  hasItem: (id: string) => boolean;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const useMarketplaceStore = create<MarketplaceState>((set, get) => ({
  items: [],
  inventory: [],
  isLoading: false,
  
  hasItem: (id) => get().inventory.includes(id),

  fetchItems: async () => {
    try {
      set({ isLoading: true });
      const res = await fetch(`${API_BASE}/marketplace/items`);
      if (res.ok) {
        const data = await res.json();
        set({ items: data, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (e) {
      console.error(e);
      set({ isLoading: false });
    }
  },

  fetchInventory: async () => {
    const token = useAuthStore.getState().token;
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/marketplace/inventory`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        set({ inventory: data });
      }
    } catch (e) {
      console.error(e);
    }
  },

  purchaseItem: async (id) => {
    const state = get();
    if (state.hasItem(id)) {
      toast.info("Você já possui este recurso.");
      return false;
    }

    const item = state.items.find(i => i.id === id);
    if (!item) return false;

    const token = useAuthStore.getState().token;
    if (!token) {
      toast.error("Você precisa estar logado para comprar itens.");
      return false;
    }

    try {
      const res = await fetch(`${API_BASE}/marketplace/purchase/${id}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      
      const data = await res.json();
      
      if (res.ok) {
        set({ inventory: [...state.inventory, id] });
        toast.success(`Recurso '${item.title}' adquirido com sucesso!`);
        
        // Atualiza billing client-side sync
        const billing = useBillingStore.getState();
        billing.fetchBilling(); // Assume that fetchBilling exists and pulls from server
        return true;
      } else {
        toast.error(data.detail || "Erro ao adquirir o item.");
        return false;
      }
    } catch (e) {
      console.error(e);
      toast.error("Erro de conexão ao processar compra.");
      return false;
    }
  }
}));
