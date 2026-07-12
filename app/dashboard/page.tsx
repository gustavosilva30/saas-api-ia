import Link from "next/link"
import { ImageIcon, Layers } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/dashboard/page-header"
import { StatCards } from "@/components/dashboard/stat-cards"
import { ProcessingChart, UsageChart } from "@/components/dashboard/dashboard-charts"
import { RecentImages, RecentRequests } from "@/components/dashboard/recent-panels"

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Bom dia, Marina"
        description="Aqui está o resumo da atividade da Studio Aurora."
      >
        <Button variant="outline" render={<Link href="/dashboard/batch" />}>
          <Layers data-icon="inline-start" />
          Lote
        </Button>
        <Button render={<Link href="/dashboard/process" />}>
          <ImageIcon data-icon="inline-start" />
          Processar imagem
        </Button>
      </PageHeader>

      <StatCards />

      <div className="grid gap-4 lg:grid-cols-3">
        <ProcessingChart />
        <UsageChart />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <RecentImages />
        <RecentRequests />
      </div>
    </>
  )
}
