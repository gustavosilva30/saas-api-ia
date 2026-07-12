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

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://api.claro.ai"

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

export const api = {
  // Auth
  async login(email: string, _password: string) {
    await delay(700)
    return { token: "mock.jwt.token", user: { ...mock.currentUser, email } }
  },
  async register(payload: { company: string; email: string }) {
    await delay(900)
    return { token: "mock.jwt.token", tenant: payload.company }
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
  async removeBackground(_file: File): Promise<ProcessedImage> {
    await delay(1800)
    return mock.recentImages[1]
  },

  // API
  async getApiRequests() {
    await delay(400)
    return mock.apiRequests
  },
  async getApiKeys() {
    await delay(400)
    return mock.apiKeys
  },
  async createApiKey(name: string): Promise<ApiKey> {
    await delay(600)
    return {
      id: `key_${Math.random().toString(36).slice(2, 6)}`,
      name,
      prefix: "sk_live_" + Math.random().toString(36).slice(2, 6),
      secret: "sk_live_" + Math.random().toString(36).slice(2).padEnd(32, "0"),
      scopes: ["images:write", "images:read"],
      createdAt: new Date().toISOString(),
      lastUsedAt: null,
      revoked: false,
    }
  },
  async revokeApiKey(_id: string) {
    await delay(400)
    return { ok: true }
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
