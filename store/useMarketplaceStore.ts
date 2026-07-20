import { create } from "zustand";
import { useBillingStore } from "./useBillingStore";
import { toast } from "sonner";

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

const DUMMY_ITEMS: HubItem[] = [
  { id: "1", title: "E-commerce Pro Preset", description: "Iluminação de estúdio perfeita para produtos.", type: "preset", creator: "AI Studio", price: 15, rating: 4.9, sales: 1520, thumbnail: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400", tags: ["ecommerce", "clean", "estudio"] },
  { id: "2", title: "Cyberpunk Neon Pack", description: "Fundos gerados por IA com temática Cyberpunk.", type: "aipack", creator: "NeonDream", price: 25, rating: 4.8, sales: 840, thumbnail: "https://images.unsplash.com/photo-1555680202-c86f0e12f086?w=400", tags: ["cyberpunk", "neon", "futurista"] },
  { id: "3", title: "Social Media Bundle", description: "Templates completos de animação para Reels e TikTok.", type: "bundle", creator: "SocialPro", price: 50, rating: 4.7, sales: 2300, thumbnail: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400", tags: ["social", "reels", "tiktok", "animado"] },
  { id: "4", title: "Minimalist Template", description: "Template para banners de promoção minimalistas.", type: "template", creator: "DesignCo", price: 10, rating: 4.5, sales: 400, thumbnail: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400", tags: ["minimalista", "promo", "clean"] },
];

export const useMarketplaceStore = create<MarketplaceState>((set, get) => ({
  items: [],
  inventory: [],
  isLoading: false,
  
  hasItem: (id) => get().inventory.includes(id),

  fetchItems: async () => {
    try {
      set({ isLoading: true });
      const res = await fetch(`${API_BASE}/marketplace/items`).catch(() => null);
      if (res && res.ok) {
        const data = await res.json();
        set({ items: data, isLoading: false });
      } else {
        // Fallback para mock local
        set({ items: DUMMY_ITEMS, isLoading: false });
      }
    } catch (e) {
      // Evita o throw de console.error na tela do Next.js
      set({ items: DUMMY_ITEMS, isLoading: false });
    }
  },

  fetchInventory: async () => {
    const token = "dummy-token"; // useAuthStore.getState().token;
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/marketplace/inventory`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      }).catch(() => null);
      if (res && res.ok) {
        const data = await res.json();
        set({ inventory: data });
      } else {
        // Fallback para inventário mockado
        set({ inventory: ["1"] }); // Ex: Já tem o item 1
      }
    } catch (e) {
      set({ inventory: ["1"] });
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

    // TODO: Adicionar lógica real de Auth
    const token = "dummy-token"; // useAuthStore.getState().token;
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
        // billing.fetchBilling(); 
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
