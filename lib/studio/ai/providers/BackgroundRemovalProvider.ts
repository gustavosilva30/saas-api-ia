import { IBackgroundRemovalProvider, AIProviderResponse } from "../AIProviderManager";

export class NextApiBackgroundRemovalProvider implements IBackgroundRemovalProvider {
  async removeBackground(file: File): Promise<AIProviderResponse<string>> {
    try {
      const formData = new FormData();
      formData.append("image", file);

      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
      
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      // Bate na rota intermediária do Next.js (protege as credenciais)
      const res = await fetch("/api/studio/remove-bg", {
        method: "POST",
        headers,
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Falha ao remover fundo: " + res.statusText);
      }

      const data = await res.json();
      
      if (!data.imageUrl) {
        throw new Error("API não retornou a URL da imagem processada.");
      }

      return { success: true, data: data.imageUrl };
    } catch (error: any) {
      console.error("[NextApiBackgroundRemovalProvider]", error);
      return { success: false, error: error.message };
    }
  }
}
