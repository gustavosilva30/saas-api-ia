import type {
  AdminTenant,
  ApiKey,
  ApiRequestLog,
  CreditSummary,
  Invoice,
  Metric,
  ProcessedImage,
  SystemStat,
  TeamMember,
  Tenant,
  TimeSeriesPoint,
  User,
  Webhook,
} from "./types"

export const currentTenant: Tenant = {
  id: "tnt_9f2a",
  name: "Studio Aurora",
  plan: "pro",
  createdAt: "2024-02-11T09:00:00Z",
}

export const currentUser: User = {
  id: "usr_1a2b",
  name: "Marina Ferreira",
  email: "marina@studioaurora.com",
  role: "owner",
  tenantId: "tnt_9f2a",
}

export const metrics: Metric[] = [
  { label: "Imagens hoje", value: "1.284", delta: 12.4, hint: "vs. ontem" },
  { label: "Imagens este mês", value: "38.902", delta: 8.1, hint: "vs. mês anterior" },
  { label: "Créditos restantes", value: "61.098", delta: -4.2, hint: "de 100.000" },
  { label: "Tempo médio", value: "1,8s", delta: -9.6, hint: "por imagem" },
]

export const timeSeries: TimeSeriesPoint[] = [
  { date: "01 Jul", processed: 820, credits: 780 },
  { date: "02 Jul", processed: 932, credits: 900 },
  { date: "03 Jul", processed: 901, credits: 870 },
  { date: "04 Jul", processed: 1290, credits: 1240 },
  { date: "05 Jul", processed: 1330, credits: 1300 },
  { date: "06 Jul", processed: 1120, credits: 1080 },
  { date: "07 Jul", processed: 1284, credits: 1210 },
  { date: "08 Jul", processed: 1410, credits: 1360 },
  { date: "09 Jul", processed: 1520, credits: 1480 },
  { date: "10 Jul", processed: 1380, credits: 1320 },
  { date: "11 Jul", processed: 1620, credits: 1560 },
  { date: "12 Jul", processed: 1490, credits: 1440 },
  { date: "13 Jul", processed: 1710, credits: 1650 },
  { date: "14 Jul", processed: 1284, credits: 1200 },
]

export const usageByHour = Array.from({ length: 24 }, (_, h) => ({
  hour: `${String(h).padStart(2, "0")}h`,
  requests: Math.round(200 + Math.sin(h / 3) * 140 + Math.random() * 120),
}))

const sampleImages = [
  "/product-sneaker-on-white.png",
  "/portrait-headshot-studio.png",
  "/perfume-bottle-product.png",
  "/handbag-fashion-product.png",
  "/coffee-cup-product-shot.png",
  "/wristwatch-product-shot.png",
]

export const recentImages: ProcessedImage[] = Array.from({ length: 8 }, (_, i) => ({
  id: `img_${1000 + i}`,
  name: `imagem-${1284 - i}.png`,
  originalUrl: sampleImages[i % sampleImages.length],
  resultUrl: sampleImages[i % sampleImages.length],
  status: (i === 0 ? "processing" : i === 5 ? "failed" : "done") as ProcessedImage["status"],
  format: (["PNG", "JPG", "WEBP"] as const)[i % 3],
  resolution: (["1024×1024", "2048×1536", "1920×1080", "800×800"] as const)[i % 4],
  sizeKb: 320 + i * 45,
  durationMs: 1200 + i * 180,
  createdAt: new Date(Date.now() - i * 1000 * 60 * 37).toISOString(),
  progress: i === 0 ? 62 : 100,
}))

export const apiRequests: ApiRequestLog[] = Array.from({ length: 12 }, (_, i) => ({
  id: `req_${5000 + i}`,
  endpoint: "/v1/remove-background",
  method: (["POST", "GET", "POST", "DELETE"] as const)[i % 4],
  status: i % 7 === 6 ? 429 : i % 5 === 4 ? 400 : 200,
  latencyMs: 640 + i * 55,
  credits: i % 4 === 0 ? 0 : 1,
  createdAt: new Date(Date.now() - i * 1000 * 60 * 12).toISOString(),
}))

export const apiKeys: ApiKey[] = [
  {
    id: "key_01",
    name: "Produção",
    prefix: "mock_sk_live_9f2a",
    secret: "mock_sk_live_9f2a4c8d1e6b7a90f3d2c1b8a7e6f5d4",
    scopes: ["images:write", "images:read"],
    createdAt: "2024-03-02T10:00:00Z",
    lastUsedAt: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
    revoked: false,
  },
  {
    id: "key_02",
    name: "Homologação",
    prefix: "mock_sk_test_3b1c",
    secret: "mock_sk_test_3b1c9d0e2f4a6b8c0d1e3f5a7b9c1d2e",
    scopes: ["images:write"],
    createdAt: "2024-05-18T14:30:00Z",
    lastUsedAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
    revoked: false,
  },
  {
    id: "key_03",
    name: "Integração antiga",
    prefix: "mock_sk_live_7d4e",
    secret: "mock_sk_live_7d4e1a2b3c4d5e6f7a8b9c0d1e2f3a4b",
    scopes: ["images:read"],
    createdAt: "2023-11-09T08:15:00Z",
    lastUsedAt: null,
    revoked: true,
  },
]

export const webhooks: Webhook[] = [
  {
    id: "wh_01",
    url: "https://api.studioaurora.com/hooks/bg",
    events: ["image.processed", "image.failed"],
    active: true,
    createdAt: "2024-04-01T09:00:00Z",
  },
  {
    id: "wh_02",
    url: "https://hooks.zapier.com/aurora/9f2a",
    events: ["batch.completed"],
    active: false,
    createdAt: "2024-06-21T16:40:00Z",
  },
]

export const creditSummary: CreditSummary = {
  plan: "pro",
  available: 61098,
  used: 38902,
  total: 100000,
  renewsAt: "2026-08-01T00:00:00Z",
}

export const monthlyCredits = [
  { month: "Fev", used: 21400 },
  { month: "Mar", used: 28900 },
  { month: "Abr", used: 33200 },
  { month: "Mai", used: 41000 },
  { month: "Jun", used: 37600 },
  { month: "Jul", used: 38902 },
]

export const invoices: Invoice[] = Array.from({ length: 6 }, (_, i) => ({
  id: `inv_${900 - i}`,
  number: `AUR-2026-${String(7 - i).padStart(4, "0")}`,
  plan: "pro",
  amount: 499,
  currency: "BRL",
  status: (i === 0 ? "open" : "paid") as Invoice["status"],
  issuedAt: new Date(2026, 6 - i, 1).toISOString(),
  periodStart: new Date(2026, 6 - i, 1).toISOString(),
  periodEnd: new Date(2026, 7 - i, 0).toISOString(),
}))

export const teamMembers: TeamMember[] = [
  { id: "tm_1", name: "Marina Ferreira", email: "marina@studioaurora.com", role: "owner", status: "active" },
  { id: "tm_2", name: "Rafael Souza", email: "rafael@studioaurora.com", role: "admin", status: "active" },
  { id: "tm_3", name: "Beatriz Lima", email: "bia@studioaurora.com", role: "member", status: "active" },
  { id: "tm_4", name: "Diego Martins", email: "diego@studioaurora.com", role: "member", status: "invited" },
]

export const plans = [
  {
    id: "starter" as const,
    name: "Starter",
    price: 99,
    credits: "10.000 créditos/mês",
    features: ["API REST", "Processamento em lote", "1 usuário", "Suporte por e-mail"],
  },
  {
    id: "pro" as const,
    name: "Pro",
    price: 499,
    credits: "100.000 créditos/mês",
    features: ["Tudo do Starter", "Webhooks", "5 usuários", "Suporte prioritário", "SLA 99,9%"],
    highlight: true,
  },
  {
    id: "enterprise" as const,
    name: "Enterprise",
    price: 0,
    credits: "Créditos ilimitados",
    features: ["Tudo do Pro", "Usuários ilimitados", "Infra dedicada", "Gerente de conta"],
  },
]

export const creditPacks = [
  { id: "pack_10", credits: 10000, price: 89 },
  { id: "pack_50", credits: 50000, price: 399, popular: true },
  { id: "pack_200", credits: 200000, price: 1290 },
]

// ------- Admin -------

export const adminTenants: AdminTenant[] = [
  { id: "tnt_9f2a", name: "Studio Aurora", plan: "pro", users: 4, creditsUsed: 38902, mrr: 499, status: "active" },
  { id: "tnt_2b7c", name: "PixelForge", plan: "enterprise", users: 28, creditsUsed: 412300, mrr: 2400, status: "active" },
  { id: "tnt_4d1e", name: "Loja Verde", plan: "starter", users: 2, creditsUsed: 7100, mrr: 99, status: "trial" },
  { id: "tnt_8a3f", name: "Moda Já", plan: "pro", users: 6, creditsUsed: 61200, mrr: 499, status: "active" },
  { id: "tnt_1c9d", name: "FotoRápida", plan: "starter", users: 1, creditsUsed: 2400, mrr: 0, status: "suspended" },
]

export const systemStat: SystemStat = {
  workersActive: 24,
  queueSize: 137,
  rpm: 4820,
  cpu: 63,
  ram: 71,
  failures24h: 18,
}

export const throughput = Array.from({ length: 20 }, (_, i) => ({
  t: `${i}`,
  rpm: Math.round(3800 + Math.sin(i / 2) * 900 + Math.random() * 400),
}))

export const adminLogs = [
  { id: "l1", level: "info", message: "worker-12 processou lote batch_7781 (240 imagens)", at: new Date(Date.now() - 1000 * 30).toISOString() },
  { id: "l2", level: "warn", message: "fila acima de 120 itens — escalando workers", at: new Date(Date.now() - 1000 * 95).toISOString() },
  { id: "l3", level: "error", message: "req_5011 falhou: imagem corrompida (tnt_1c9d)", at: new Date(Date.now() - 1000 * 180).toISOString() },
  { id: "l4", level: "info", message: "novo tenant registrado: Loja Verde", at: new Date(Date.now() - 1000 * 420).toISOString() },
  { id: "l5", level: "info", message: "deploy do modelo v3.2 concluído", at: new Date(Date.now() - 1000 * 900).toISOString() },
]
