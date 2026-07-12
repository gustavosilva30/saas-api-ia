"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { CheckCircle2, XCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { api } from "@/lib/api"

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get("token")
  
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    if (!token) {
      setStatus("error")
      setErrorMessage("Token de verificação ausente.")
      return
    }

    const verify = async () => {
      try {
        await api.verifyEmail(token)
        setStatus("success")
      } catch (err: any) {
        setStatus("error")
        setErrorMessage(err.message || "Ocorreu um erro ao verificar seu e-mail.")
      }
    }

    verify()
  }, [token])

  return (
    <Card className="w-full max-w-md shadow-lg border border-border/50">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Ativação de Conta</CardTitle>
        <CardDescription>Verificando o seu link de confirmação</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center py-6 text-center">
        
        {status === "loading" && (
          <div className="space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <p className="text-sm text-muted-foreground">Verificando token de acesso...</p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-4">
            <div className="flex size-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 mx-auto">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">E-mail verificado!</h3>
            <p className="text-sm text-muted-foreground px-4">
              Sua conta foi ativada com sucesso no sistema. Agora você pode entrar e liberar o uso das ferramentas.
            </p>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-4">
            <div className="flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive mx-auto">
              <XCircle className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Falha na ativação</h3>
            <p className="text-sm text-destructive px-4">
              {errorMessage}
            </p>
            <p className="text-xs text-muted-foreground px-4 mt-2">
              Verifique se o link não expirou (24 horas) ou se você já ativou sua conta anteriormente.
            </p>
          </div>
        )}

      </CardContent>
      <CardFooter className="flex justify-center border-t pt-4">
        <Button className="w-full" onClick={() => router.push("/login")} disabled={status === "loading"}>
          Fazer Login
        </Button>
      </CardFooter>
    </Card>
  )
}

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Suspense fallback={
        <Card className="w-full max-w-md shadow-lg border border-border/50">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Ativação de Conta</CardTitle>
            <CardDescription>Carregando...</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-6 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          </CardContent>
        </Card>
      }>
        <VerifyEmailContent />
      </Suspense>
    </div>
  )
}
