import { create } from "zustand";
import { api } from "@/lib/api";
import { ProductAnalysis, CampaignCopy, campaignAI } from "@/lib/ai/campaign-ai";

export type CampaignStatus = "idle" | "uploading" | "analyzing" | "generating_copy" | "assembling_assets" | "done" | "error";

export interface GeneratedAsset {
  id: string;
  format: "instagram_feed" | "instagram_story" | "mercadolivre" | "banner";
  url: string;
  bgUrl?: string; // Fundo gerado por IA
  overlayText?: string; // Texto promocional da IA
}

export interface CampaignState {
  status: CampaignStatus;
  originalFile: File | null;
  cutoutUrl: string | null;
  analysis: ProductAnalysis | null;
  copywriting: CampaignCopy | null;
  generatedAssets: GeneratedAsset[];
  error: string | null;
  isGeneratingBanners: boolean;
  
  startCampaign: (file: File) => Promise<void>;
  resetCampaign: () => void;
  generateAIBanners: () => Promise<void>;
}

// Helper para polling do Job
async function pollJobUntilDone(jobId: string, timeoutMs: number = 60000): Promise<any> {
  const startTime = Date.now();
  while (Date.now() - startTime < timeoutMs) {
    const statusData = await api.getJobStatus(jobId);
    if (statusData.status === "completed") {
      return statusData;
    }
    if (statusData.status === "failed") {
      throw new Error(statusData.error_message || "Erro no processamento do Job.");
    }
    // "pending" ou "processing", aguardar e tentar de novo
    await new Promise(r => setTimeout(r, 2000));
  }
  throw new Error("Timeout ao aguardar conclusão do Job.");
}

export const useCampaignStore = create<CampaignState>((set, get) => ({
  status: "idle",
  originalFile: null,
  cutoutUrl: null,
  analysis: null,
  copywriting: null,
  generatedAssets: [],
  error: null,
  isGeneratingBanners: false,

  resetCampaign: () => set({
    status: "idle",
    originalFile: null,
    cutoutUrl: null,
    analysis: null,
    copywriting: null,
    generatedAssets: [],
    error: null,
    isGeneratingBanners: false
  }),

  generateAIBanners: async () => {
    set({ isGeneratingBanners: true });
    
    // Simula tempo de geração de IA (ex: DALL-E 3 / Midjourney)
    await new Promise(r => setTimeout(r, 2500));
    
    const state = get();
    // Fundos premium curados do Unsplash para simular fundos de IA
    const bgMap: Record<string, string[]> = {
      "studio_white": ["https://picsum.photos/seed/studio1/1080/1080", "https://picsum.photos/seed/studio2/1080/1080"],
      "dark_dramatic": ["https://picsum.photos/seed/dark1/1080/1080", "https://picsum.photos/seed/dark2/1080/1080"],
      "lifestyle_outdoor": ["https://picsum.photos/seed/life1/1080/1080", "https://picsum.photos/seed/life2/1080/1080"],
      "industrial": ["https://picsum.photos/seed/ind1/1080/1080", "https://picsum.photos/seed/ind2/1080/1080"]
    };
    
    const style = state.analysis?.recommendedBgStyle || "studio_white";
    const bgs = bgMap[style] || bgMap["studio_white"];
    const title = state.copywriting?.title || "Oferta Especial";

    const updatedAssets = state.generatedAssets.map((asset, idx) => ({
      ...asset,
      bgUrl: bgs[idx % bgs.length],
      overlayText: asset.format === 'mercadolivre' ? "" : title // ML não costuma ter texto promocional grande
    }));

    set({ generatedAssets: updatedAssets, isGeneratingBanners: false });
  },

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
      // 1. Upload e Remoção de Fundo (Assíncrono via API Pública/Job ou fallback)
      let currentCutoutUrl: string;
      try {
        const bgJob = await api.createJob(file, "basic");
        const bgResult = await pollJobUntilDone(bgJob.job_id);
        currentCutoutUrl = bgResult.result_url;
      } catch (e) {
        // Fallback para não dar erro "Failed to fetch" na tela quando o backend está offline
        currentCutoutUrl = URL.createObjectURL(file);
        await new Promise(r => setTimeout(r, 1000));
      }
      set({ cutoutUrl: currentCutoutUrl, status: "analyzing" });

      // 2. Análise Visual da Categoria (Job)
      let analysisData: ProductAnalysis;
      try {
        const analyzeJob = await api.createCampaignAnalyzeJob(file);
        const analyzeResult = await pollJobUntilDone(analyzeJob.job_id);
        analysisData = typeof analyzeResult.result_data === 'string' ? JSON.parse(analyzeResult.result_data) : analyzeResult.result_data;
      } catch (e) {
         console.warn("Falha no Job de Análise visual, acionando Fallback DEV", e);
         analysisData = await campaignAI.analyzeProduct(file);
      }
      set({ analysis: analysisData, status: "generating_copy" });

      // 3. Geração de Copywriting (Job)
      let copyData: CampaignCopy;
      try {
        const copyJob = await api.createCampaignCopyJob(analysisData.category);
        const copyResult = await pollJobUntilDone(copyJob.job_id);
        copyData = typeof copyResult.result_data === 'string' ? JSON.parse(copyResult.result_data) : copyResult.result_data;
      } catch(e) {
        console.warn("Falha no Job de Copy, acionando Fallback DEV", e);
        copyData = await campaignAI.generateCopywriting(analysisData.category);
      }
      set({ copywriting: copyData, status: "assembling_assets" });

      // 4. Montagem das Peças (Mockando a renderização omnicanal por enquanto)
      await new Promise(r => setTimeout(r, 1500));
      
      const assets: GeneratedAsset[] = [
        { id: "feed", format: "instagram_feed", url: currentCutoutUrl },
        { id: "story", format: "instagram_story", url: currentCutoutUrl },
        { id: "ml", format: "mercadolivre", url: currentCutoutUrl }
      ];

      set({ generatedAssets: assets, status: "done" });

    } catch (err: any) {
      console.error(err);
      set({ status: "error", error: err.message || "Erro desconhecido na geração da campanha." });
    }
  }
}));
