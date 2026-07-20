import { IBackgroundRemovalProvider, AIProviderResponse } from "../AIProviderManager";
import { API_BASE } from "@/lib/api";

export class NextApiBackgroundRemovalProvider implements IBackgroundRemovalProvider {
  async removeBackground(file: File): Promise<AIProviderResponse<string>> {
    try {
      const formData = new FormData();
      formData.append("file", file); // o backend espera "file", nao "image"

      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      // Injeta chaves BYOK
      if (typeof window !== "undefined") {
        try {
          const tenantStateStr = localStorage.getItem("tenant-ai-keys");
          if (tenantStateStr) {
            const tenantState = JSON.parse(tenantStateStr).state;
            if (tenantState.openaiKey) headers["x-tenant-openai-key"] = tenantState.openaiKey;
            if (tenantState.googleKey) headers["x-tenant-google-key"] = tenantState.googleKey;
          }
        } catch (e) {
          console.error("Failed to parse BYOK keys");
        }
      }

      const res = await fetch(`${API_BASE}/remove-bg`, {
        method: "POST",
        headers,
        body: formData,
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => res.statusText);
        throw new Error(`Falha ao remover fundo: ${errorText}`);
      }

      // /remove-bg retorna a imagem binaria (StreamingResponse), nao JSON
      const blob = await res.blob();
      const imageUrl = URL.createObjectURL(blob);

      return { success: true, data: imageUrl };
    } catch (error: any) {
      console.error("[NextApiBackgroundRemovalProvider]", error);
      return { success: false, error: error.message };
    }
  }
}
