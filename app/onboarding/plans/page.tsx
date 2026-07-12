"use client"

import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Check, Sparkles, Building2, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CookieBanner } from "@/components/cookie-banner"

export default function PlansPage() {
  const router = useRouter()

  const handleSelectPlan = (planName: string) => {
    toast.success(`Plano ${planName} selecionado com sucesso!`)
    // Simula a ida para o dashboard depois de assinar
    setTimeout(() => {
      router.push("/dashboard")
    }, 1000)
  }

  const handleContactSales = () => {
    toast.info("Nossa equipe de vendas entrará em contato em breve!")
  }

  return (
    <div className="min-h-screen bg-muted/30 py-12 px-4 sm:px-6 lg:px-8 flex flex-col">
      <div className="max-w-7xl mx-auto space-y-12 flex-1">
        
        {/* Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            Escolha o plano ideal para a sua empresa
          </h1>
          <p className="text-xl text-muted-foreground">
            Remova o fundo de imagens com inteligência artificial, em alta resolução e qualidade perfeita. Faça um upgrade a qualquer momento.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid gap-8 lg:grid-cols-4 sm:grid-cols-2">
          
          {/* Plano 50 Imagens */}
          <Card className="flex flex-col relative overflow-hidden transition-all hover:shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl">Starter</CardTitle>
              <CardDescription>Para pequenos negócios</CardDescription>
              <div className="mt-4 flex items-baseline text-4xl font-extrabold">
                R$ 50<span className="ml-1 text-xl font-medium text-muted-foreground">/mês</span>
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-center gap-3">
                  <Check className="h-4 w-4 text-primary" />
                  Até 50 imagens por dia
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-4 w-4 text-primary" />
                  API em tempo real
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-4 w-4 text-primary" />
                  Suporte por e-mail
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button className="w-full" variant="outline" onClick={() => handleSelectPlan("Starter")}>
                Assinar Starter
              </Button>
            </CardFooter>
          </Card>

          {/* Plano 250 Imagens */}
          <Card className="flex flex-col relative overflow-hidden border-primary/50 shadow-md transition-all hover:shadow-lg">
            <div className="absolute top-0 right-0 -mr-8 mt-4 w-32 rotate-45 bg-primary py-1 text-center text-xs font-semibold text-primary-foreground uppercase tracking-wider">
              Popular
            </div>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle className="text-xl text-primary">Pro</CardTitle>
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <CardDescription>Para lojas virtuais crescentes</CardDescription>
              <div className="mt-4 flex items-baseline text-4xl font-extrabold">
                R$ 100<span className="ml-1 text-xl font-medium text-muted-foreground">/mês</span>
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-center gap-3">
                  <Check className="h-4 w-4 text-primary" />
                  <span className="font-medium text-foreground">Até 250 imagens por dia</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-4 w-4 text-primary" />
                  API em tempo real
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-4 w-4 text-primary" />
                  Suporte prioritário
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-4 w-4 text-primary" />
                  Webhooks
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={() => handleSelectPlan("Pro")}>
                Assinar Pro
              </Button>
            </CardFooter>
          </Card>

          {/* Plano 500 Imagens */}
          <Card className="flex flex-col relative overflow-hidden transition-all hover:shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl">Premium</CardTitle>
              <CardDescription>Para operações de alto volume</CardDescription>
              <div className="mt-4 flex items-baseline text-4xl font-extrabold">
                R$ 150<span className="ml-1 text-xl font-medium text-muted-foreground">/mês</span>
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-center gap-3">
                  <Check className="h-4 w-4 text-primary" />
                  <span className="font-medium text-foreground">Até 500 imagens por dia</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-4 w-4 text-primary" />
                  Todos os recursos do Pro
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-4 w-4 text-primary" />
                  Modelos de IA avançados
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-4 w-4 text-primary" />
                  SLA de 99.9%
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button className="w-full" variant="outline" onClick={() => handleSelectPlan("Premium")}>
                Assinar Premium
              </Button>
            </CardFooter>
          </Card>

          {/* Plano Flexível (Enterprise) */}
          <Card className="flex flex-col relative overflow-hidden bg-accent/50 transition-all hover:shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-xl">Flexível / Enterprise</CardTitle>
              </div>
              <CardDescription>Mais de 500 imagens diárias</CardDescription>
              <div className="mt-4 flex items-baseline text-3xl font-bold">
                Sob Medida
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <p className="text-sm text-muted-foreground mb-4">
                Precisa de uma infraestrutura dedicada ou tem um volume altíssimo? Nós desenhamos um plano de acordo com o seu uso exato.
              </p>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-center gap-3">
                  <Check className="h-4 w-4 text-primary" />
                  Volume flexível sob demanda
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-4 w-4 text-primary" />
                  Gerente de conta dedicado
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-4 w-4 text-primary" />
                  Contrato personalizado
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/80" onClick={handleContactSales}>
                <Phone className="w-4 h-4 mr-2" />
                Contatar Vendedor
              </Button>
            </CardFooter>
          </Card>

        </div>
      </div>

      {/* Banner de Cookies integrado à página de Planos */}
      <CookieBanner />
    </div>
  )
}
