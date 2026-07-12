"use client"

import { PageHeader } from "@/components/dashboard/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Coins, History, Zap } from "lucide-react"

export default function CreditsPage() {
  // Dados simulados
  const totalCredits = 5000;
  const usedCredits = 3450;
  const percentage = (usedCredits / totalCredits) * 100;
  
  return (
    <div className="space-y-6">
      <PageHeader
        title="Créditos"
        description="Acompanhe o consumo da sua conta e adicione saldo."
      />
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Card Principal de Saldo */}
        <Card className="col-span-2 lg:col-span-2 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <Coins size={120} />
          </div>
          <CardHeader>
            <CardTitle>Saldo Disponível</CardTitle>
            <CardDescription>Resumo do seu pacote atual</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-end gap-2">
              <span className="text-5xl font-bold tracking-tight">{totalCredits - usedCredits}</span>
              <span className="text-muted-foreground mb-1">créditos restantes</span>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{usedCredits.toLocaleString()} usados</span>
                <span>{totalCredits.toLocaleString()} totais</span>
              </div>
              <Progress value={percentage} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                Os créditos expiram em 30 de Novembro de 2026.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex gap-4">
            <Button className="w-full sm:w-auto" variant="default">
              <Zap className="w-4 h-4 mr-2" /> Comprar Mais Créditos
            </Button>
            <Button className="w-full sm:w-auto" variant="outline">
              Ativar Recarga Automática
            </Button>
          </CardFooter>
        </Card>

        {/* Card Informativo */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Como funcionam?</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-4">
            <p>1 imagem em qualidade <strong>Basic</strong> = 1 crédito.</p>
            <p>1 imagem em qualidade <strong>Pro</strong> = 2 créditos.</p>
            <p>1 imagem em qualidade <strong>Premium</strong> = 5 créditos.</p>
            
            <div className="pt-4 mt-4 border-t border-border/50">
              <Badge variant="secondary" className="mb-2">Dica</Badge>
              <p>Habilite a recarga automática para evitar falhas nas requisições da sua API caso o saldo zere.</p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Histórico recente */}
      <h3 className="text-lg font-medium mt-10 mb-4 flex items-center gap-2">
        <History className="w-5 h-5 text-muted-foreground" /> 
        Histórico Recente de Consumo
      </h3>
      
      <Card>
        <div className="divide-y divide-border">
          {[
            { date: 'Hoje, 14:32', action: 'API /remove-bg (Premium)', credits: '-25', status: 'Processado' },
            { date: 'Ontem, 09:15', action: 'Processamento em Lote', credits: '-120', status: 'Processado' },
            { date: '10 de Julho', action: 'Recarga via Cartão final 4242', credits: '+5000', status: 'Pago', isPositive: true },
            { date: '08 de Julho', action: 'API /remove-bg (Basic)', credits: '-5', status: 'Processado' },
          ].map((item, i) => (
            <div key={i} className="flex justify-between items-center p-4">
              <div>
                <p className="font-medium text-sm">{item.action}</p>
                <p className="text-xs text-muted-foreground">{item.date} • {item.status}</p>
              </div>
              <div className={`font-semibold ${item.isPositive ? 'text-green-500' : 'text-foreground'}`}>
                {item.credits}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
