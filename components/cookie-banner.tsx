"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Cookie } from "lucide-react"
import { cn } from "@/lib/utils"

export function CookieBanner() {
  const [isVisible, setIsVisible] = React.useState(false)

  React.useEffect(() => {
    // Verifica se já aceitou cookies antes.
    const consent = localStorage.getItem("cookie_consent")
    if (!consent) {
      // Delay pequeno para animação
      const timer = setTimeout(() => setIsVisible(true), 500)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleAccept = () => {
    localStorage.setItem("cookie_consent", "accepted")
    setIsVisible(false)
  }

  const handleDecline = () => {
    localStorage.setItem("cookie_consent", "declined")
    setIsVisible(false)
  }

  if (!isVisible) return null

  return (
    <div className={cn(
      "fixed bottom-0 left-0 right-0 z-50 p-4 transition-transform duration-500 ease-in-out sm:bottom-4 sm:left-4 sm:right-auto sm:max-w-md",
      isVisible ? "translate-y-0" : "translate-y-full"
    )}>
      <div className="flex flex-col gap-4 rounded-xl border bg-background p-6 shadow-xl dark:border-border/50">
        <div className="flex items-start gap-4">
          <div className="mt-0.5 rounded-full bg-primary/10 p-2">
            <Cookie className="h-5 w-5 text-primary" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-semibold leading-none tracking-tight">Nós valorizamos sua privacidade</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Utilizamos cookies para melhorar a sua experiência em nossa plataforma, analisar o tráfego e personalizar conteúdos. Ao continuar navegando, você concorda com o uso de cookies.
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" size="sm" onClick={handleDecline} className="w-full sm:w-auto">
            Recusar
          </Button>
          <Button size="sm" onClick={handleAccept} className="w-full sm:w-auto">
            Aceitar Todos
          </Button>
        </div>
      </div>
    </div>
  )
}
