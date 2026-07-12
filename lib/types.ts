// Tipos centrais do sistema. Espelham os contratos esperados da API REST futura.

export type Plan = "free" | "starter" | "pro" | "enterprise"

export interface Tenant {
  id: string
  name: string
  logoUrl?: string
  plan: Plan
  createdAt: string
}

export interface User {
  id: string
  name: string
  email: string
  avatarUrl?: string
  role: "owner" | "admin" | "member"
  tenantId: string
}

export type JobStatus = "queued" | "processing" | "done" | "failed" | "canceled"

export interface ProcessedImage {
  id: string
  name: string
  originalUrl: string
  resultUrl: string
  status: JobStatus
  format: "PNG" | "JPG" | "WEBP"
  resolution: string
  sizeKb: number
  durationMs: number
  createdAt: string
  progress?: number
}

export interface ApiRequestLog {
  id: string
  endpoint: string
  method: "GET" | "POST" | "DELETE"
  status: number
  latencyMs: number
  credits: number
  createdAt: string
}

export interface ApiKey {
  id: string
  name: string
  prefix: string
  secret: string
  scopes: string[]
  createdAt: string
  lastUsedAt: string | null
  revoked: boolean
}

export interface Webhook {
  id: string
  url: string
  events: string[]
  active: boolean
  createdAt: string
}

export interface CreditSummary {
  plan: Plan
  available: number
  used: number
  total: number
  renewsAt: string
}

export interface Invoice {
  id: string
  number: string
  plan: Plan
  amount: number
  currency: string
  status: "paid" | "open" | "failed"
  issuedAt: string
  periodStart: string
  periodEnd: string
}

export interface TeamMember {
  id: string
  name: string
  email: string
  role: "owner" | "admin" | "member"
  status: "active" | "invited"
  avatarUrl?: string
}

export interface Metric {
  label: string
  value: string
  delta: number
  hint: string
}

export interface TimeSeriesPoint {
  date: string
  processed: number
  credits: number
}

export interface AdminTenant {
  id: string
  name: string
  plan: Plan
  users: number
  creditsUsed: number
  mrr: number
  status: "active" | "trial" | "suspended"
}

export interface SystemStat {
  workersActive: number
  queueSize: number
  rpm: number
  cpu: number
  ram: number
  failures24h: number
}
