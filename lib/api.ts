/**
 * Cliente de API mockado.
 *
 * Toda a UI consome estes metodos. Para integrar com o backend REST real,
 * basta substituir os retornos mockados por chamadas `fetch` ao endpoint
 * correspondente, mantendo as mesmas assinaturas.
 *
 * Exemplo de integracao futura:
 *   const res = await fetch(`${API_BASE}/v1/images`, {
 *     headers: { Authorization: `Bearer ${token}` },
 *   })
 *   return res.json()
 */
import * as mock from "./mock-data"
import type { ApiKey, ProcessedImage } from "./types"
import { useBillingStore } from "../store/useBillingStore"
import { useAnalyticsStore } from "../store/useAnalyticsStore"

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

// Comprime a imagem no client-side se for maior que 4MB (limite Vercel)
const compressImage = async (file: File, maxSizeMB = 4): Promise<File> => {
  if (file.size <= maxSizeMB * 1024 * 1024) return file;
  
  return new Promise((resolve) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let { width, height } = img;
      const MAX_SIZE = 2000; // Reduz a resolução máxima
      if (width > height && width > MAX_SIZE) {
        height *= MAX_SIZE / width;
        width = MAX_SIZE;
      } else if (height > MAX_SIZE) {
        width *= MAX_SIZE / height;
        height = MAX_SIZE;
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(file);
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => {
        if (!blob) return resolve(file);
        resolve(new File([blob], file.name, { type: "image/jpeg" }));
      }, "image/jpeg", 0.85);
    };
    img.onerror = () => resolve(file);
  });
};

export const api = {
  // Auth
  async login(email: string, password: string) {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || "Usuário ou senha incorretos.")
    }
    const data = await response.json()
    localStorage.setItem("auth_token", data.token)
    return data
  },
  async register(payload: any) {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || "Erro ao realizar o cadastro.")
    }
    return response.json()
  },
  async verifyEmail(token: string) {
    const response = await fetch(`${API_BASE}/auth/verify-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || "Link inválido ou expirado.")
    }
    return response.json()
  },

  // Dashboard
  async getMetrics() {
    await delay(400)
    return mock.metrics
  },

  // Admin
  async getAdminOrganizations() {
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    const response = await fetch(`${API_BASE}/admin/organizations`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    if (!response.ok) return [];
    return response.json();
  },
  async addAdminCredits(orgId: string, amount: number) {
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    const response = await fetch(`${API_BASE}/admin/organizations/${orgId}/credits`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" },
      body: JSON.stringify({ amount })
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Falha ao adicionar créditos");
    }
    return response.json();
  },

  async getTimeSeries() {
    await delay(400)
    return mock.timeSeries
  },
  async getUsageByHour() {
    await delay(400)
    return mock.usageByHour
  },

  // Images
  async getRecentImages() {
    await delay(400)
    return mock.recentImages
  },
  async removeBackground(file: File): Promise<ProcessedImage> {
    const billingStore = useBillingStore.getState();
    const analyticsStore = useAnalyticsStore.getState();
    
    // Não verificamos mais créditos no frontend. A responsabilidade total é do Backend.

    const startTime = Date.now();
    
    // Compress file if it's too large for Vercel (4.5MB limit)
    const processedFile = await compressImage(file);
    
    const formData = new FormData()
    formData.append("file", processedFile)

    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null
    const headers: Record<string, string> = {}
    if (token) {
      headers["Authorization"] = `Bearer ${token}`
    }

    const response = await fetch(`${API_BASE}/remove-bg`, {
      method: "POST",
      headers,
      body: formData,
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Erro desconhecido")
      if (response.status === 402) {
        throw new Error(`Saldo insuficiente: ${errorText}`)
      }
      if (response.status === 403) {
        throw new Error(`Plano incompatível com o Tier solicitado: ${errorText}`)
      }
      throw new Error(`Falha ao remover o fundo: ${errorText}`)
    }

    const data = await response.json()
    const resultUrl = data.imageUrl || data.image_url
    
    const durationMs = Date.now() - startTime;
    const jobId = `job_${Date.now()}`;
    
    // O backend já debitou. Apenas chamamos refresh no store para atualizar a UI
    billingStore.refreshBalance();
    
    // Log Cost Engine and Analytics
    analyticsStore.logProcessing(durationMs);

    return {
      id: `img_${Date.now()}`,
      name: file.name,
      originalUrl: URL.createObjectURL(file),
      resultUrl: resultUrl,
      status: "done",
      format: "PNG",
      resolution: "Auto",
      sizeKb: 150,
      durationMs: durationMs,
      createdAt: new Date().toISOString(),
    }
  },

  // Jobs System (Assíncrono)
  async createJob(file: File, tier: string = "basic"): Promise<{ job_id: string; status: string }> {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("tier", tier)

    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null
    const headers: Record<string, string> = {}
    if (token) {
      headers["Authorization"] = `Bearer ${token}`
    }

    const res = await fetch(`${API_BASE}/jobs`, {
      method: "POST",
      headers,
      body: formData,
    })

    if (!res.ok) {
      const errorText = await res.text().catch(() => "Erro desconhecido")
      throw new Error(`Falha ao criar job: ${errorText}`)
    }
    return res.json()
  },

  async getJobStatus(jobId: string): Promise<any> {
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null
    const res = await fetch(`${API_BASE}/jobs/${jobId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (!res.ok) {
      throw new Error("Erro ao buscar status do Job")
    }
    return res.json()
  },

  // Campaign AI (Assíncrono via Job)
  async createCampaignAnalyzeJob(file: File): Promise<{ job_id: string; status: string }> {
    const formData = new FormData()
    formData.append("file", file)

    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null
    const res = await fetch(`${API_BASE}/campaigns/analyze`, {
      method: "POST",
      headers: token ? { "Authorization": `Bearer ${token}` } : {},
      body: formData,
    })
    if (!res.ok) throw new Error("Falha ao iniciar análise de imagem")
    return res.json()
  },

  async createCampaignCopyJob(category: string): Promise<{ job_id: string; status: string }> {
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null
    const res = await fetch(`${API_BASE}/campaigns/generate-copy`, {
      method: "POST",
      headers: token ? { 
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      } : { "Content-Type": "application/json" },
      body: JSON.stringify({ category }),
    })
    if (!res.ok) throw new Error("Falha ao iniciar geração de copy")
    return res.json()
  },

  // API Keys
  async getApiRequests() {
    await delay(400)
    return mock.apiRequests
  },
  async getApiKeys() {
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null
    try {
      const res = await fetch(`${API_BASE}/api-keys`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) return []
      return await res.json()
    } catch (e) {
      return []
    }
  },
  async createApiKey(name: string): Promise<any> {
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null
    const res = await fetch(`${API_BASE}/api-keys`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify({ name })
    })
    return res.json()
  },
  async revokeApiKey(id: string) {
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null
    const res = await fetch(`${API_BASE}/api-keys/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    })
    return res.json()
  },
  
  // Webhooks
  async getWebhooks() {
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null
    try {
      const res = await fetch(`${API_BASE}/webhooks`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) return []
      return await res.json()
    } catch (e) {
      return []
    }
  },
  async createWebhook(url: string): Promise<any> {
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null
    const res = await fetch(`${API_BASE}/webhooks`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify({ url })
    })
    return res.json()
  },
  async deleteWebhook(id: string) {
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null
    const res = await fetch(`${API_BASE}/webhooks/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    })
    return res.json()
  },

  // Billing & credits
  async getBillingBalance() {
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null
    const res = await fetch(`${API_BASE}/billing/balance`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (!res.ok) throw new Error("Erro ao carregar saldo")
    return res.json()
  },
  async getBillingTransactions() {
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null
    const res = await fetch(`${API_BASE}/billing/transactions`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (!res.ok) throw new Error("Erro ao carregar histórico")
    return res.json()
  },
  async getCreditSummary() {
    await delay(300)
    return mock.creditSummary
  },
  async getInvoices() {
    await delay(400)
    return mock.invoices
  },

  // Team
  async getTeam() {
    await delay(400)
    return mock.teamMembers
  },

  // Admin
  async getAdminTenants() {
    await delay(400)
    return mock.adminTenants
  },
  async getSystemStat() {
    await delay(300)
    return mock.systemStat
  },
}
