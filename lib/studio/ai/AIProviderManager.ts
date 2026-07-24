export interface AIProviderResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface IBackgroundRemovalProvider {
  removeBackground(file: File): Promise<AIProviderResponse<string>>;
}

export interface IImageGenerationProvider {
  generateImage(prompt: string, negativePrompt?: string): Promise<AIProviderResponse<string>>;
}

export interface IInpaintingProvider {
  inpaint(image: File, mask: File, prompt: string): Promise<AIProviderResponse<string>>;
}

export interface IUpscaleProvider {
  upscale(image: File, scale?: number): Promise<AIProviderResponse<string>>;
}

export interface ISmartSelectionProvider {
  select(image: File, points: {x: number, y: number}[]): Promise<AIProviderResponse<{box: number[], polygon: number[][]}>>;
}

class AIProviderManagerCore {
  private bgRemovalProvider: IBackgroundRemovalProvider | null = null;
  private imageGenProvider: IImageGenerationProvider | null = null;
  private inpaintingProvider: IInpaintingProvider | null = null;
  private upscaleProvider: IUpscaleProvider | null = null;
  private smartSelectionProvider: ISmartSelectionProvider | null = null;

  registerBgRemovalProvider(provider: IBackgroundRemovalProvider) {
    this.bgRemovalProvider = provider;
  }
  
  registerImageGenerationProvider(provider: IImageGenerationProvider) {
    this.imageGenProvider = provider;
  }

  registerInpaintingProvider(provider: IInpaintingProvider) {
    this.inpaintingProvider = provider;
  }

  registerUpscaleProvider(provider: IUpscaleProvider) {
    this.upscaleProvider = provider;
  }

  registerSmartSelectionProvider(provider: ISmartSelectionProvider) {
    this.smartSelectionProvider = provider;
  }

  async removeBackground(file: File): Promise<AIProviderResponse<string>> {
    if (!this.bgRemovalProvider) return { success: false, error: "No Background Removal Provider registered." };
    return this.bgRemovalProvider.removeBackground(file);
  }

  async generateImage(prompt: string, negativePrompt?: string): Promise<AIProviderResponse<string>> {
    if (!this.imageGenProvider) return { success: false, error: "No Image Generation Provider registered." };
    return this.imageGenProvider.generateImage(prompt, negativePrompt);
  }

  async inpaint(image: File, mask: File, prompt: string): Promise<AIProviderResponse<string>> {
    if (!this.inpaintingProvider) return { success: false, error: "No Inpainting Provider registered." };
    return this.inpaintingProvider.inpaint(image, mask, prompt);
  }

  async upscale(image: File, scale?: number): Promise<AIProviderResponse<string>> {
    if (!this.upscaleProvider) return { success: false, error: "No Upscale Provider registered." };
    return this.upscaleProvider.upscale(image, scale);
  }

  async smartSelect(image: File, points: {x: number, y: number}[]): Promise<AIProviderResponse<{box: number[], polygon: number[][]}>> {
    if (!this.smartSelectionProvider) return { success: false, error: "No Smart Selection Provider registered." };
    return this.smartSelectionProvider.select(image, points);
  }
}

export const AIProviderManager = new AIProviderManagerCore();
