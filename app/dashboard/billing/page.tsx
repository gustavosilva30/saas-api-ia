"use client"

import { PageHeader } from "@/components/dashboard/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CreditCard, CheckCircle2, FileText, AlertCircle } from "lucide-react"
import { useBillingStore, PLANS } from "@/store/useBillingStore"

export default function BillingPage() {
  const { currentPlanId } = useBillingStore()
  const plan = PLANS[currentPlanId] || PLANS.free

  return (
    <div className="space-y-6">
      <PageHeader
        title="Faturamento"
        description="Gerencie suas assinaturas, histórico de pagamentos e dados fiscais."
      />
      
      <div className="grid gap-6 md:grid-cols-2">
        {/* Plano Atual */}
        <Card className="relative overflow-hidden border-border bg-card">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Plano Atual</CardTitle>
              <Badge variant="secondary">{plan.name}</Badge>
            </div>
            <CardDescription>Você está atualmente no {plan.name.toLowerCase()}.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-3xl font-bold">{plan.name}</p>
              <p className="text-sm text-muted-foreground mt-1">R$ {plan.price.toFixed(2)} / mês</p>
            </div>
            
            <ul className="space-y-2 text-sm text-muted-foreground mt-4">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-muted-foreground" /> {feature}
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter className="flex gap-4 border-t border-border/50 pt-6">
            <Button variant="default">Fazer Upgrade</Button>
          </CardFooter>
        </Card>

        <div className="space-y-6">
          {/* Método de Pagamento */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Método de Pagamento</CardTitle>
              <CardDescription>O cartão usado para renovações e recargas.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center p-6 border border-dashed border-border rounded-lg bg-card text-muted-foreground text-sm flex-col gap-2">
                <AlertCircle className="w-6 h-6" />
                <p>Nenhum método de pagamento cadastrado.</p>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">Adicionar Método de Pagamento</Button>
            </CardFooter>
          </Card>
          
          {/* Dados Fiscais */}
          <Card>
             <CardHeader>
              <CardTitle className="text-lg">Dados Fiscais</CardTitle>
              <CardDescription>Informações que aparecerão nas suas notas fiscais.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground text-center py-4">
              <p>Nenhum dado fiscal cadastrado ainda.</p>
            </CardContent>
             <CardFooter>
              <Button variant="ghost" className="w-full text-sm">Adicionar Informações</Button>
            </CardFooter>
          </Card>
        </div>
      </div>
      
      {/* Histórico de Faturas */}
      <h3 className="text-lg font-medium mt-10 mb-4 flex items-center gap-2">
        <FileText className="w-5 h-5 text-muted-foreground" /> 
        Histórico de Faturas
      </h3>
      
      <Card>
        <div className="p-8 text-center text-muted-foreground">
          <p>Nenhuma fatura encontrada.</p>
        </div>
      </Card>
    </div>
  )
}
