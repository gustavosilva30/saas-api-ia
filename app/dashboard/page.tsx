"use client"

import Link from "next/link"
import * as React from "react"
import { ImageIcon, Layers, FileImage, Cpu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/dashboard/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Coins, Clock, TrendingUp } from "lucide-react"
import { useAnalyticsStore } from "@/store/useAnalyticsStore"
import { useBillingStore } from "@/store/useBillingStore"

export default function DashboardPage() {
  const [userName, setUserName] = React.useState("Usuário")
  const [companyName, setCompanyName] = React.useState("sua empresa")

  const { imagesToday, imagesThisMonth, getAverageTime } = useAnalyticsStore()
  const { getAvailableCredits } = useBillingStore()

  React.useEffect(() => {
    const email = localStorage.getItem("user_email")
    if (email) {
      if (email === "gsntech.suporte@gmail.com") {
        setUserName("GSN Tech")
        setCompanyName("GSN Tech")
      } else {
        setUserName(email.split("@")[0])
        setCompanyName("sua empresa")
      }
    }
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Bem-vindo, ${userName}`}
        description={`Aqui está o resumo da atividade de ${companyName}.`}
      >
        <Button variant="outline" render={<Link href="/dashboard/batch" />} disabled>
          <Layers data-icon="inline-start" />
          Lote
        </Button>
        <Button render={<Link href="/dashboard/process" />}>
          <ImageIcon data-icon="inline-start" />
          Processar imagem
        </Button>
      </PageHeader>

      {/* Cards de Métricas Reais Zerados */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Imagens hoje</CardTitle>
            <div className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <ImageIcon className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-semibold tabular-nums tracking-tight">{imagesToday}</span>
            <p className="text-xs text-muted-foreground mt-1">Imagens processadas hoje</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Imagens este mês</CardTitle>
            <div className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <TrendingUp className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-semibold tabular-nums tracking-tight">{imagesThisMonth}</span>
            <p className="text-xs text-muted-foreground mt-1">Imagens processadas no mês</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Créditos restantes</CardTitle>
            <div className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <Coins className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-semibold tabular-nums tracking-tight">{getAvailableCredits()}</span>
            <p className="text-xs text-muted-foreground mt-1">Saldo atual da conta</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tempo médio</CardTitle>
            <div className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <Clock className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-semibold tabular-nums tracking-tight">{(getAverageTime() / 1000).toFixed(1)}s</span>
            <p className="text-xs text-muted-foreground mt-1">Tempo médio de resposta</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Últimas Imagens Vazio */}
        <Card>
          <CardHeader>
            <CardTitle>Últimas imagens</CardTitle>
          </CardHeader>
          <CardContent className="p-8 text-center text-muted-foreground">
            <FileImage className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p>Nenhuma imagem processada ainda.</p>
          </CardContent>
        </Card>

        {/* Últimas Requisições Vazio */}
        <Card>
          <CardHeader>
            <CardTitle>Últimas requisições</CardTitle>
          </CardHeader>
          <CardContent className="p-8 text-center text-muted-foreground">
            <Cpu className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p>Nenhuma requisição de API registrada.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
