"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { api } from "@/lib/api"
import { Eye, EyeOff, Mail } from "lucide-react"
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
  const [showPassword, setShowPassword] = React.useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false)
  const [isSuccess, setIsSuccess] = React.useState(false)
  const [registeredEmail, setRegisteredEmail] = React.useState("")

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const data = new FormData(e.currentTarget)
    const company = String(data.get("company"))
    const name = String(data.get("name"))
    const email = String(data.get("email")).trim()
    const password = String(data.get("password"))
    const confirmPassword = String(data.get("confirmPassword"))

    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem.")
      setLoading(false)
      return
    }

    try {
      await api.register({
        name,
        email,
        password,
        company,
      })
      setRegisteredEmail(email)
      setIsSuccess(true)
      toast.success("Conta criada! Verifique seu e-mail.")
    } catch (err: any) {
      toast.error(err.message || "Não foi possível criar a conta.")
    } finally {
      setLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="flex flex-col gap-6 text-center py-6">
        <div className="flex size-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 mx-auto">
          <Mail className="size-6" />
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">Ative sua conta</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Enviamos um link de confirmação para o e-mail <strong className="text-foreground">{registeredEmail}</strong>.
            Acesse seu e-mail e clique no link para ativar sua conta e liberar o acesso.
          </p>
        </div>
        <Button variant="outline" className="w-full mt-4" onClick={() => router.push("/login")}>
          Voltar para o Login
        </Button>
      </div>
    )
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
            <div className="relative">
              <Input 
                id="password" 
                name="password" 
                type={showPassword ? "text" : "password"} 
                placeholder="Mínimo 8 caracteres" 
                required 
                className="pr-9"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
          </Field>
          <Field>
            <FieldLabel htmlFor="confirmPassword">Confirmar senha</FieldLabel>
            <div className="relative">
              <Input 
                id="confirmPassword" 
                name="confirmPassword" 
                type={showConfirmPassword ? "text" : "password"} 
                placeholder="Repita sua senha" 
                required 
                className="pr-9"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((v) => !v)}
                className="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-muted-foreground hover:text-foreground"
                aria-label={showConfirmPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showConfirmPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
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
