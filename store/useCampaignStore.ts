import { create } from "zustand";
import { api } from "@/lib/api";
import { campaignAI, ProductAnalysis, CampaignCopy } from "@/lib/ai/campaign-ai";

export type CampaignStatus = "idle" | "uploading" | "analyzing" | "generating_copy" | "assembling_assets" | "done" | "error";

export interface GeneratedAsset {
  id: string;
  format: "instagram_feed" | "instagram_story" | "mercadolivre" | "banner";
  url: string;
}

export interface CampaignState {
  status: CampaignStatus;
  originalFile: File | null;
  cutoutUrl: string | null;
  analysis: ProductAnalysis | null;
  copywriting: CampaignCopy | null;
  generatedAssets: GeneratedAsset[];
  error: string | null;
  
  startCampaign: (file: File) => Promise<void>;
  resetCampaign: () => void;
}

export const useCampaignStore = create<CampaignState>((set, get) => ({
  status: "idle",
  originalFile: null,
  cutoutUrl: null,
  analysis: null,
  copywriting: null,
  generatedAssets: [],
  error: null,

  resetCampaign: () => set({
    status: "idle",
    originalFile: null,
    cutoutUrl: null,
    analysis: null,
    copywriting: null,
    generatedAssets: [],
    error: null
  }),

  startCampaign: async (file: File) => {
    set({ 
      status: "uploading", 
      originalFile: file, 
      error: null,
      cutoutUrl: null,
      analysis: null,
      copywriting: null,
      generatedAssets: []
    });

    try {
      // 1. Upload e Remoção de Fundo
      const bgResult = await api.removeBackground(file);
      if (!bgResult.resultUrl) throw new Error("Falha ao remover o fundo");
      
      set({ cutoutUrl: bgResult.resultUrl, status: "analyzing" });

      // 2. Análise Visual da Categoria
      const analysis = await campaignAI.analyzeProduct(file);
      set({ analysis, status: "generating_copy" });

      // 3. Geração de Copywriting
      const copy = await campaignAI.generateCopywriting(analysis.category);
      set({ copywriting: copy, status: "assembling_assets" });

      // 4. Montagem das Peças (Mockando a renderização omnicanal por enquanto)
      // Aqui o Template Engine seria chamado para gerar as imagens finais
      // Vamos simular um pequeno delay de "renderização" e usar o recorte com cores de fundo sólidas
      await new Promise(r => setTimeout(r, 1500));
      
      const assets: GeneratedAsset[] = [
        { id: "feed", format: "instagram_feed", url: bgResult.resultUrl }, // Na vida real teria fundo aplicado
        { id: "story", format: "instagram_story", url: bgResult.resultUrl },
        { id: "ml", format: "mercadolivre", url: bgResult.resultUrl }
      ];

      set({ generatedAssets: assets, status: "done" });

    } catch (err: any) {
      console.error(err);
      set({ status: "error", error: err.message || "Erro desconhecido na geração da campanha." });
    }
  }
}));
