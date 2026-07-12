"use client"

import { PageHeader } from "@/components/dashboard/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CreditCard, CheckCircle2, Download, FileText } from "lucide-react"

export default function BillingPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Faturamento"
        description="Gerencie suas assinaturas, histórico de pagamentos e dados fiscais."
      />
      
      <div className="grid gap-6 md:grid-cols-2">
        {/* Plano Atual */}
        <Card className="relative overflow-hidden border-primary/50 bg-primary/5">
          <div className="absolute top-0 right-0 p-6 opacity-20 pointer-events-none">
            <CheckCircle2 size={80} className="text-primary" />
          </div>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Plano Atual</CardTitle>
              <Badge variant="default" className="bg-primary text-primary-foreground">Ativo</Badge>
            </div>
            <CardDescription>O seu plano de faturamento atual.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-3xl font-bold">Premium SaaS</p>
              <p className="text-sm text-muted-foreground mt-1">R$ 149,90 / mês</p>
            </div>
            
            <ul className="space-y-2 text-sm text-muted-foreground mt-4">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary" /> Acesso ao modelo ISNet (Maior precisão)
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary" /> Alpha Matting para cabelos/pelos
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary" /> 5000 Créditos mensais inclusos
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary" /> Suporte prioritário via Discord
              </li>
            </ul>
          </CardContent>
          <CardFooter className="flex gap-4 border-t border-border/50 pt-6">
            <Button variant="default">Fazer Upgrade</Button>
            <Button variant="outline">Cancelar Assinatura</Button>
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
              <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-card">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-primary/10 rounded-md">
                    <CreditCard className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Mastercard terminando em 4242</p>
                    <p className="text-xs text-muted-foreground">Expira em 12/2028</p>
                  </div>
                </div>
                <Badge variant="secondary">Padrão</Badge>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">Atualizar Método de Pagamento</Button>
            </CardFooter>
          </Card>
          
          {/* Dados Fiscais */}
          <Card>
             <CardHeader>
              <CardTitle className="text-lg">Dados Fiscais</CardTitle>
              <CardDescription>Informações que aparecerão nas suas notas fiscais.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><span className="text-muted-foreground">Empresa:</span> Tech Solutions LTDA</p>
              <p><span className="text-muted-foreground">CNPJ:</span> 00.000.000/0001-00</p>
              <p><span className="text-muted-foreground">Endereço:</span> Av. Paulista, 1000 - São Paulo, SP</p>
            </CardContent>
             <CardFooter>
              <Button variant="ghost" className="w-full text-sm">Editar Informações</Button>
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
        <div className="divide-y divide-border">
          {[
            { date: '10 de Julho de 2026', amount: 'R$ 149,90', id: 'INV-2026-07', status: 'Pago' },
            { date: '10 de Junho de 2026', amount: 'R$ 149,90', id: 'INV-2026-06', status: 'Pago' },
            { date: '10 de Maio de 2026', amount: 'R$ 149,90', id: 'INV-2026-05', status: 'Pago' },
          ].map((invoice, i) => (
            <div key={i} className="flex justify-between items-center p-4 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-muted rounded-full">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium text-sm">{invoice.date}</p>
                  <p className="text-xs text-muted-foreground">{invoice.id}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                  <p className="font-semibold">{invoice.amount}</p>
                  <p className="text-xs text-green-500">{invoice.status}</p>
                </div>
                <Button size="icon" variant="ghost">
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
