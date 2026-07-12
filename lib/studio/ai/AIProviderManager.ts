export interface AIProviderResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface IBackgroundRemovalProvider {
  removeBackground(file: File): Promise<AIProviderResponse<string>>;
}

class AIProviderManagerCore {
  private bgRemovalProvider: IBackgroundRemovalProvider | null = null;

  registerBgRemovalProvider(provider: IBackgroundRemovalProvider) {
    this.bgRemovalProvider = provider;
  }

  async removeBackground(file: File): Promise<AIProviderResponse<string>> {
    if (!this.bgRemovalProvider) {
      return { success: false, error: "No Background Removal Provider registered." };
    }
    return this.bgRemovalProvider.removeBackground(file);
  }
}

export const AIProviderManager = new AIProviderManagerCore();
