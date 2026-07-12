"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
} from "@/components/ui/field"
import { GoogleIcon } from "@/components/auth/google-icon"

export function RegisterForm() {
  const router = useRouter()
  const [loading, setLoading] = React.useState(false)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const data = new FormData(e.currentTarget)
    try {
      await api.register({
        company: String(data.get("company")),
        email: String(data.get("email")),
      })
      toast.success("Conta criada! Redirecionando para os planos…")
      router.push("/onboarding/plans")
    } catch {
      toast.error("Não foi possível criar a conta.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Criar conta</h1>
        <p className="text-sm text-muted-foreground">
          Comece grátis com 100 créditos. Sem cartão de crédito.
        </p>
      </div>

      <Button variant="outline" className="w-full" type="button" size="lg">
        <GoogleIcon data-icon="inline-start" />
        Cadastrar com Google
      </Button>

      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground">ou</span>
        <Separator className="flex-1" />
      </div>

      <form onSubmit={onSubmit}>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="company">Nome da empresa</FieldLabel>
            <Input id="company" name="company" placeholder="Studio Aurora" required />
          </Field>
          <Field>
            <FieldLabel htmlFor="name">Seu nome</FieldLabel>
            <Input id="name" name="name" placeholder="Marina Ferreira" required />
          </Field>
          <Field>
            <FieldLabel htmlFor="email">E-mail corporativo</FieldLabel>
            <Input id="email" name="email" type="email" placeholder="voce@empresa.com" required />
          </Field>
          <Field>
            <FieldLabel htmlFor="password">Senha</FieldLabel>
            <Input id="password" name="password" type="password" placeholder="Mínimo 8 caracteres" required />
          </Field>
          <Field>
            <Button type="submit" size="lg" disabled={loading}>
              {loading && <Spinner data-icon="inline-start" />}
              Criar conta grátis
            </Button>
            <FieldDescription className="text-center">
              Já tem conta?{" "}
              <Link href="/login" className="font-medium text-primary hover:underline">
                Entrar
              </Link>
            </FieldDescription>
          </Field>
        </FieldGroup>
      </form>
    </div>
  )
}
