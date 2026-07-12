"use client"

import { useRouter } from "next/navigation"
import * as React from "react"
import { PageHeader } from "@/components/dashboard/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Search, Building, DollarSign, Activity, MoreHorizontal, ShieldAlert, BarChart3, Receipt } from "lucide-react"

export default function AdminPage() {
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = React.useState<boolean | null>(null)

  React.useEffect(() => {
    const email = localStorage.getItem("user_email")
    if (email === "gsntech.suporte@gmail.com") {
      setIsAuthorized(true)
    } else {
      setIsAuthorized(false)
      router.push("/dashboard")
    }
  }, [router])

  const [tenants, setTenants] = React.useState<any[]>([])
  const [payments, setPayments] = React.useState<any[]>([])

  React.useEffect(() => {
    if (isAuthorized) {
      import("@/lib/api").then(({ api }) => {
        api.getAdminOrganizations().then((data) => setTenants(data))
      })
    }
  }, [isAuthorized])
  if (isAuthorized === null) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">Verificando autorização...</p>
      </div>
    )
  }

  if (!isAuthorized) {
    return null // Redirecionando...
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Painel de Administração (Mestre)"
        description="Visão global do sistema SaaS, clientes, faturamento e controle de preços."
      />

      {/* KPIs Globais Zerados */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Recorrente (MRR)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 0,00</div>
            <p className="text-xs text-muted-foreground">Sem assinaturas ativas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Empresas Ativas</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Aguardando primeiros cadastros</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Imagens Processadas</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Volume acumulado da API</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status do Sistema</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">Operacional</div>
            <p className="text-xs text-muted-foreground">Todos os serviços ativos</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="empresas" className="space-y-4">
        <TabsList>
          <TabsTrigger value="empresas">Empresas (Tenants)</TabsTrigger>
          <TabsTrigger value="precos">Preços e Planos</TabsTrigger>
          <TabsTrigger value="faturamento">Faturamento Global</TabsTrigger>
          <TabsTrigger value="logs">Logs do Sistema</TabsTrigger>
        </TabsList>

        {/* ABA: EMPRESAS */}
        <TabsContent value="empresas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Empresas Cadastradas</CardTitle>
              <CardDescription>Gerencie todos os clientes que utilizam a API de remoção de fundo.</CardDescription>
            </CardHeader>
            <CardContent>
              {tenants.length > 0 ? (
                <>
                  <div className="flex items-center gap-2 mb-4">
                    <Search className="w-4 h-4 text-muted-foreground absolute ml-3" />
                    <Input placeholder="Buscar empresa por nome ou ID..." className="pl-9 max-w-sm" />
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>Plano</TableHead>
                        <TableHead className="text-right">Créditos</TableHead>
                        <TableHead className="text-right">Uso (Mês)</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tenants.map((t: any) => (
                        <TableRow key={t.id}>
                          <TableCell className="font-mono text-xs text-muted-foreground">{t.id}</TableCell>
                          <TableCell className="font-medium">{t.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{t.plan}</Badge>
                          </TableCell>
                          <TableCell className="text-right tabular-nums">{t.credits.toLocaleString()}</TableCell>
                          <TableCell className="text-right tabular-nums text-muted-foreground">{t.usage.toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge variant={t.status === 'Ativo' ? 'default' : 'secondary'} className={t.status === 'Ativo' ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20' : ''}>
                              {t.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4" /></Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </>
              ) : (
                <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
                  <Building className="w-12 h-12 text-muted-foreground/30 mb-3" />
                  <p>Nenhuma empresa cadastrada no momento.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ABA: PREÇOS E PLANOS */}
        <TabsContent value="precos" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Custo por Requisição (Créditos)</CardTitle>
                <CardDescription>Defina quantos créditos cada modelo da IA consome.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label>Qualidade Basic (u2netp)</Label>
                  <Input type="number" defaultValue={1} />
                </div>
                <div className="grid gap-2">
                  <Label>Qualidade Pro (u2net)</Label>
                  <Input type="number" defaultValue={2} />
                </div>
                <div className="grid gap-2">
                  <Label>Qualidade Premium (isnet-general-use)</Label>
                  <Input type="number" defaultValue={5} />
                </div>
                <Button className="w-full mt-2">Salvar Custos</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Valores dos Planos</CardTitle>
                <CardDescription>Configure o preço em Reais (R$) cobrado mensalmente.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label>Plano Basic Mensal (R$)</Label>
                  <Input type="number" defaultValue={0.00} disabled />
                </div>
                <div className="grid gap-2">
                  <Label>Plano Pro Mensal (R$)</Label>
                  <Input type="number" defaultValue={49.90} />
                </div>
                <div className="grid gap-2">
                  <Label>Plano Premium Mensal (R$)</Label>
                  <Input type="number" defaultValue={149.90} />
                </div>
                <Button className="w-full mt-2">Atualizar Preços</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ABA: FATURAMENTO GLOBAL */}
        <TabsContent value="faturamento">
           <Card>
            <CardHeader>
              <CardTitle>Últimos Pagamentos Recebidos</CardTitle>
              <CardDescription>Lista em tempo real dos pagamentos compensados pelo gateway (Stripe/MercadoPago).</CardDescription>
            </CardHeader>
            <CardContent>
              {payments.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Empresa</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Descrição</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((p: any) => (
                      <TableRow key={p.id}>
                        <TableCell>{p.date}</TableCell>
                        <TableCell>{p.company}</TableCell>
                        <TableCell className="text-green-500 font-medium">+ R$ {p.amount}</TableCell>
                        <TableCell>{p.description}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
                  <DollarSign className="w-12 h-12 text-muted-foreground/30 mb-3" />
                  <p>Nenhum pagamento registrado no momento.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ABA: LOGS GLOBAIS */}
        <TabsContent value="logs">
           <Card>
            <CardHeader>
              <CardTitle>Eventos Críticos (Global)</CardTitle>
              <CardDescription>Auditoria de sistema. Monitore erros e falhas nas chamadas à sua API VPS.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-8 text-center flex flex-col items-center text-muted-foreground">
                <ShieldAlert className="w-12 h-12 text-muted-foreground/30 mb-4" />
                <p>Nenhum evento crítico detectado no servidor recentemente.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
