import { create } from "zustand";

export type AssetCategory = "uploads" | "mockups" | "textures" | "logos" | "ia";

export interface AssetItem {
  id: string;
  url: string;
  category: AssetCategory;
  name: string;
  thumbnailUrl?: string; // Para texturas pesadas, pode haver um thumbnail
}

const PREMIUM_MOCK_ASSETS: AssetItem[] = [
  // Mockups
  { id: "m1", url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=600&auto=format&fit=crop", category: "mockups", name: "Tênis Esportivo Nike" },
  { id: "m2", url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=600&auto=format&fit=crop", category: "mockups", name: "Headphone Premium" },
  { id: "m3", url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=600&auto=format&fit=crop", category: "mockups", name: "Relógio Smartwatch" },
  { id: "m4", url: "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?q=80&w=600&auto=format&fit=crop", category: "mockups", name: "MacBook Pro M2" },
  { id: "m5", url: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?q=80&w=600&auto=format&fit=crop", category: "mockups", name: "Câmera Vintage" },
  
  // Texturas
  { id: "t1", url: "https://images.unsplash.com/photo-1603533867307-b354255e3c32?q=80&w=600&auto=format&fit=crop", category: "textures", name: "Papel Amassado Dark" },
  { id: "t2", url: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=600&auto=format&fit=crop", category: "textures", name: "Metal Escovado" },
  { id: "t3", url: "https://images.unsplash.com/photo-1574169208507-84376144848b?q=80&w=600&auto=format&fit=crop", category: "textures", name: "Mármore Branco" },
  { id: "t4", url: "https://images.unsplash.com/photo-1563814884260-1e523f25c7cc?q=80&w=600&auto=format&fit=crop", category: "textures", name: "Madeira Rústica" },
  
  // Logos
  { id: "l1", url: "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?q=80&w=400&auto=format&fit=crop", category: "logos", name: "Logo Minimalista" },
];

interface AssetStoreState {
  assets: AssetItem[];
  
  addAsset: (file: File, category: AssetCategory) => void;
  removeAsset: (id: string) => void;
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
    };
    
    set((state) => ({
      assets: [newAsset, ...state.assets]
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
      const matchCategory = a.category === category;
      const matchSearch = a.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }
}));
