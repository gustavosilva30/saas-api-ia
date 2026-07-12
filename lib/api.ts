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

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

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
    const formData = new FormData()
    formData.append("file", file)

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null

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
      throw new Error(`Falha ao remover o fundo: ${errorText}`)
    }

    const blob = await response.blob()
    const resultUrl = URL.createObjectURL(blob)

    return {
      id: `img_${Date.now()}`,
      name: file.name,
      originalUrl: URL.createObjectURL(file),
      resultUrl: resultUrl,
      status: "done",
      format: "PNG",
      resolution: "Auto",
      sizeKb: Math.round(blob.size / 1024),
      durationMs: 1500,
      createdAt: new Date().toISOString(),
    }
  },

  // API
  async getApiRequests() {
    await delay(400)
    return mock.apiRequests
  },
  async getApiKeys() {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
    const res = await fetch(`${API_BASE}/api-keys`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return res.json()
  },
  async createApiKey(name: string): Promise<any> {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
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
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
    const res = await fetch(`${API_BASE}/api-keys/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    })
    return res.json()
  },
  
  // Webhooks
  async getWebhooks() {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
    const res = await fetch(`${API_BASE}/webhooks`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return res.json()
  },
  async createWebhook(url: string): Promise<any> {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
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
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
    const res = await fetch(`${API_BASE}/webhooks/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    })
    return res.json()
  },

  // Billing & credits
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
