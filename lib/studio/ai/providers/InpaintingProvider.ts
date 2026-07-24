import { IInpaintingProvider, AIProviderResponse } from "../AIProviderManager";
import { API_BASE } from "@/lib/api";

export class NextApiInpaintingProvider implements IInpaintingProvider {
  async inpaint(image: File, mask: File, prompt: string): Promise<AIProviderResponse<string>> {
    try {
      const formData = new FormData();
      formData.append("job_type", "inpaint");
      formData.append("file", image);
      formData.append("mask", mask);
      formData.append("extra_arg", prompt);

      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE}/jobs`, {
        method: "POST",
        headers,
        body: formData,
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => res.statusText);
        throw new Error(`Falha ao iniciar inpaint: ${errorText}`);
      }

      const { job_id } = await res.json();
      return await this.pollJob(job_id, headers);
      
    } catch (error: any) {
      console.error("[NextApiInpaintingProvider]", error);
      return { success: false, error: error.message };
    }
  }

  private async pollJob(jobId: string, headers: Record<string, string>): Promise<AIProviderResponse<string>> {
    const maxRetries = 60;
    let retries = 0;
    while (retries < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      retries++;
      try {
        const res = await fetch(`${API_BASE}/jobs/${jobId}`, { headers });
        if (!res.ok) continue;
        const data = await res.json();
        if (data.status === 'completed' && data.result_url) {
          return { success: true, data: data.result_url };
        } else if (data.status === 'failed') {
          return { success: false, error: data.error_message || "Erro desconhecido no inpaint." };
        }
      } catch (e) {
        console.error("Erro ao fazer polling do job:", e);
      }
    }
    return { success: false, error: "Tempo esgotado aguardando o job." };
  }
}
