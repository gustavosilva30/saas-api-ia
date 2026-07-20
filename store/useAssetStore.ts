import { create } from "zustand";
import { AssetItem, AssetCategory } from "@/lib/studio/assets/AssetTypes";

// Usando datas fixas para evitar Erro de Hydration (Error 418) entre Servidor e Cliente
const FIXED_DATE = "2024-01-01T00:00:00.000Z";

const PREMIUM_MOCK_ASSETS: AssetItem[] = [
  { 
    id: "m1", url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=600&auto=format&fit=crop", 
    category: "mockups", categories: ["mockups", "all"], name: "Tênis Esportivo Nike", type: "image",
    createdAt: FIXED_DATE, updatedAt: FIXED_DATE, usageCount: 0, status: "active", permission: "public"
  },
  { 
    id: "m2", url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=600&auto=format&fit=crop", 
    category: "mockups", categories: ["mockups", "all"], name: "Headphone Premium", type: "image",
    createdAt: FIXED_DATE, updatedAt: FIXED_DATE, usageCount: 0, status: "active", permission: "public"
  },
  { 
    id: "t1", url: "https://images.unsplash.com/photo-1603533867307-b354255e3c32?q=80&w=600&auto=format&fit=crop", 
    category: "textures", categories: ["textures", "all"], name: "Papel Amassado Dark", type: "image",
    createdAt: FIXED_DATE, updatedAt: FIXED_DATE, usageCount: 0, status: "active", permission: "public"
  },
  { 
    id: "l1", url: "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?q=80&w=400&auto=format&fit=crop", 
    category: "logos", categories: ["logos", "all"], name: "Logo Minimalista", type: "image",
    createdAt: FIXED_DATE, updatedAt: FIXED_DATE, usageCount: 0, status: "active", permission: "public"
  },
];

interface AssetStoreState {
  assets: AssetItem[];
  
  addAsset: (file: File, category: AssetCategory) => void;
  removeAsset: (id: string) => void;
  updateAsset: (updatedAsset: AssetItem) => void;
  getAssetsByCategory: (category: AssetCategory, searchQuery?: string) => AssetItem[];
}

export const useAssetStore = create<AssetStoreState>((set, get) => ({
  assets: PREMIUM_MOCK_ASSETS,

  addAsset: (file, category) => {
    const newAsset: AssetItem = {
      id: `asset_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      url: URL.createObjectURL(file), // Upload em memória temporário
      name: file.name,
      category,
      categories: [category, "all"],
      type: "image",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: 0,
      status: "active",
      permission: "tenant"
    };
    
    // Princípio 3: Emitir evento no EventBus para que o AssetClassifier (IA) possa atuar de forma desacoplada
    import("@/lib/studio/events/EventBus").then(({ EventBus, StudioEvent }) => {
      EventBus.emit(StudioEvent.ASSET_UPLOADED, newAsset);
    });
    
    set((state) => ({
      assets: [newAsset, ...state.assets]
    }));
  },

  updateAsset: (updatedAsset) => {
    set((state) => ({
      assets: state.assets.map(a => a.id === updatedAsset.id ? updatedAsset : a)
    }));
  },

  removeAsset: (id) => {
    set((state) => ({
      assets: state.assets.filter(a => a.id !== id)
    }));
  },

  getAssetsByCategory: (category, searchQuery = "") => {
    const state = get();
    return state.assets.filter(a => {
      // "all" matches any asset that hasn't been explicitly hidden
      const matchCategory = category === "all" ? true : a.categories.includes(category);
      const matchSearch = a.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }
}));
