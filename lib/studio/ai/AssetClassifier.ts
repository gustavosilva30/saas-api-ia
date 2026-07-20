import { EventBus, StudioEvent } from "@/lib/studio/events/EventBus";
import { AssetItem, AssetCategory } from "@/lib/studio/assets/AssetTypes";
import { useAssetStore } from "@/store/useAssetStore";

export class AssetClassifier {
  private static instance: AssetClassifier;
  private isListening = false;

  private constructor() {}

  public static getInstance(): AssetClassifier {
    if (!AssetClassifier.instance) {
      AssetClassifier.instance = new AssetClassifier();
    }
    return AssetClassifier.instance;
  }

  public startListening() {
    if (this.isListening) return;
    
    EventBus.on(StudioEvent.ASSET_UPLOADED, this.handleAssetUploaded.bind(this));
    this.isListening = true;
    console.log("[AssetClassifier] Listening for ASSET_UPLOADED events.");
  }

  private async handleAssetUploaded(asset: AssetItem) {
    console.log(`[AssetClassifier] Analyzing newly uploaded asset: ${asset.name}`);
    
    // Simula a chamada para um backend de IA (Vision API, ResNet, etc.)
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Lógica Mockada: "Se o nome tem 'carro', é produto automotivo, etc"
    const nameLower = asset.name.toLowerCase();
    
    let newCategories: AssetCategory[] = [...asset.categories];
    let newTags: string[] = ["ia_analyzed"];
    let mainColor = "#FFFFFF";

    if (nameLower.includes("carro") || nameLower.includes("pneu") || nameLower.includes("auto")) {
      newCategories.push("products");
      newTags.push("automotivo", "veículo");
      mainColor = "#222222";
    } else if (nameLower.includes("fundo") || nameLower.includes("bg") || nameLower.includes("background")) {
      newCategories.push("backgrounds");
      newTags.push("fundo", "cenário");
      mainColor = "#5588FF";
    } else if (nameLower.includes("logo") || nameLower.includes("marca")) {
      newCategories.push("logos");
      newTags.push("marca", "identidade visual");
    } else {
      newTags.push("geral");
    }

    const updatedAsset: AssetItem = {
      ...asset,
      categories: Array.from(new Set(newCategories)), // Garante unicidade
      tags: newTags,
      color: mainColor,
      status: "active"
    };

    // Atualiza a Zustand Store
    useAssetStore.getState().updateAsset(updatedAsset);
    
    // Dispara evento de Asset atualizado para outros módulos reagirem
    EventBus.emit(StudioEvent.ASSET_UPDATED, updatedAsset);
    console.log(`[AssetClassifier] Classification complete for: ${asset.id}`);
  }
}
