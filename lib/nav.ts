import {
  LayoutDashboard,
  ImageIcon,
  Layers,
  History,
  Code2,
  KeyRound,
  Webhook,
  Coins,
  CreditCard,
  Users,
  Settings,
  UserCircle,
  ScrollText,
  BookOpen,
  LifeBuoy,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react"

export interface NavItem {
  title: string
  href: string
  icon: LucideIcon
  badge?: string
}

export interface NavSection {
  label: string
  items: NavItem[]
}

export const navSections: NavSection[] = [
  {
    label: "Visão geral",
    items: [
      { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { title: "Processar imagens", href: "/dashboard/process", icon: ImageIcon },
      { title: "Processamento em lote", href: "/dashboard/batch", icon: Layers },
      { title: "Histórico", href: "/dashboard/history", icon: History },
    ],
  },
  {
    label: "Desenvolvedores",
    items: [
      { title: "API", href: "/dashboard/api", icon: Code2 },
      { title: "API Keys", href: "/dashboard/api-keys", icon: KeyRound },
      { title: "Webhooks", href: "/dashboard/webhooks", icon: Webhook },
    ],
  },
  {
    label: "Conta",
    items: [
      { title: "Créditos", href: "/dashboard/credits", icon: Coins },
      { title: "Faturamento", href: "/dashboard/billing", icon: CreditCard },
      { title: "Equipe", href: "/dashboard/team", icon: Users },
      { title: "Configurações", href: "/dashboard/settings", icon: Settings },
      { title: "Perfil", href: "/dashboard/profile", icon: UserCircle },
      { title: "Logs", href: "/dashboard/logs", icon: ScrollText },
    ],
  },
  {
    label: "Administração",
    items: [
      { title: "Painel Admin", href: "/dashboard/admin", icon: ShieldCheck },
    ],
  },
  {
    label: "Recursos",
    items: [
      { title: "Documentação", href: "/dashboard/docs", icon: BookOpen },
      { title: "Suporte", href: "/dashboard/support", icon: LifeBuoy },
    ],
  },
]

export const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/process": "Processar imagens",
  "/dashboard/batch": "Processamento em lote",
  "/dashboard/history": "Histórico",
  "/dashboard/api": "API",
  "/dashboard/api-keys": "API Keys",
  "/dashboard/webhooks": "Webhooks",
  "/dashboard/credits": "Créditos",
  "/dashboard/billing": "Faturamento",
  "/dashboard/team": "Equipe",
  "/dashboard/settings": "Configurações",
  "/dashboard/profile": "Perfil",
  "/dashboard/logs": "Logs",
  "/dashboard/admin": "Painel Admin",
  "/dashboard/docs": "Documentação",
  "/dashboard/support": "Suporte",
}
