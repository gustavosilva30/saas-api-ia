import { ISmartSelectionProvider, AIProviderResponse } from "../AIProviderManager";
import { API_BASE } from "@/lib/api";

export class NextApiSmartSelectionProvider implements ISmartSelectionProvider {
  async select(image: File, points: {x: number, y: number}[]): Promise<AIProviderResponse<{box: number[], polygon: number[][]}>> {
    try {
      const formData = new FormData();
      formData.append("job_type", "ai/smart-select");
      formData.append("file", image);
      formData.append("extra_arg", JSON.stringify(points));

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
        throw new Error(`Falha ao iniciar smart selection: ${errorText}`);
      }

      const { job_id } = await res.json();
      return await this.pollJob(job_id, headers);
      
    } catch (error: any) {
      console.error("[NextApiSmartSelectionProvider]", error);
      return { success: false, error: error.message };
    }
  }

  private async pollJob(jobId: string, headers: Record<string, string>): Promise<AIProviderResponse<{box: number[], polygon: number[][]}>> {
    const maxRetries = 60;
    let retries = 0;
    while (retries < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      retries++;
      try {
        const res = await fetch(`${API_BASE}/jobs/${jobId}`, { headers });
        if (!res.ok) continue;
        const data = await res.json();
        if (data.status === 'completed' && data.result_data) {
          // O backend retorna um dict no result_data para este tipo de job
          const result = typeof data.result_data === "string" ? JSON.parse(data.result_data) : data.result_data;
          return { success: true, data: result };
        } else if (data.status === 'failed') {
          return { success: false, error: data.error_message || "Erro desconhecido na seleção." };
        }
      } catch (e) {
        console.error("Erro ao fazer polling do job:", e);
      }
    }
    return { success: false, error: "Tempo esgotado aguardando o job." };
  }
}
