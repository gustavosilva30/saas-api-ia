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

const HUB_MOCK_DATA: HubItem[] = [
  {
    id: "hub_1",
    title: "AI Pack: Automotivo Dark",
    description: "Pacote cognitivo completo: Fundo escuro, reflexos no chão, copy focado em alta performance e textura de carbono.",
    type: "aipack",
    creator: "Studio Oficial",
    price: 2500,
    rating: 4.9,
    sales: 1240,
    thumbnail: "https://images.unsplash.com/photo-1599839619722-39751411ea63?q=80&w=400&auto=format&fit=crop",
    tags: ["automotivo", "dark", "ia"]
  },
  {
    id: "hub_2",
    title: "Template Black Friday",
    description: "Layout de alta conversão para Instagram Feed com selos de desconto, tarjas de urgência e fundo neon.",
    type: "template",
    creator: "Agência Croma",
    price: 1000,
    rating: 4.7,
    sales: 3400,
    thumbnail: "https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?q=80&w=400&auto=format&fit=crop",
    tags: ["varejo", "promocao", "social"]
  },
  {
    id: "hub_3",
    title: "Preset: Sombra de Contato Perfeita",
    description: "Algoritmo de oclusão de ambiente para calçados. Cria a sensação exata de peso do produto no chão.",
    type: "preset",
    creator: "ShoeDesign",
    price: 500,
    rating: 4.9,
    sales: 890,
    thumbnail: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=400&auto=format&fit=crop",
    tags: ["tenis", "sombra", "realismo"]
  },
  {
    id: "hub_4",
    title: "Mega Bundle Moda Verão",
    description: "Mais de 50 cenários de praia gerados por IA, 10 templates de story e paleta vibrante tropical.",
    type: "bundle",
    creator: "TropicalIA",
    price: 5000,
    rating: 4.8,
    sales: 210,
    thumbnail: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=400&auto=format&fit=crop",
    tags: ["moda", "verao", "texturas"]
  }
];

interface MarketplaceState {
  items: HubItem[];
  inventory: string[]; // IDs dos itens comprados
  
  purchaseItem: (id: string) => boolean;
  hasItem: (id: string) => boolean;
}

export const useMarketplaceStore = create<MarketplaceState>((set, get) => ({
  items: HUB_MOCK_DATA,
  inventory: ["hub_3"], // Vem com um já "comprado" de brinde para testes
  
  hasItem: (id) => get().inventory.includes(id),

  purchaseItem: (id) => {
    const state = get();
    if (state.hasItem(id)) {
      toast.info("Você já possui este recurso.");
      return false;
    }

    const item = state.items.find(i => i.id === id);
    if (!item) return false;

    const billing = useBillingStore.getState();
    const availableCredits = billing.totalCredits - billing.usedCredits;

    if (availableCredits < item.price) {
      toast.error(`Créditos insuficientes. O item custa ${item.price}, mas você só tem ${availableCredits}.`);
      return false;
    }

    // Debitar créditos (No mundo real, isso vai bater numa API de transação segura)
    billing.addUsage("Fundo", item.price); // Hack temporário usando o addUsage do Cost Engine
    
    // Adicionar ao inventário
    set({ inventory: [...state.inventory, id] });
    toast.success(`Recurso '${item.title}' adquirido com sucesso!`);
    return true;
  }
}));
