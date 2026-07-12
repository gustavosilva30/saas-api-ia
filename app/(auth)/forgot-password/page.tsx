import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"

export default function ForgotPasswordPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Recuperar senha
        </h1>
        <p className="text-sm text-muted-foreground">
          Enviaremos um link de redefinição para o seu e-mail.
        </p>
      </div>
      <form>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="email">E-mail</FieldLabel>
            <Input id="email" type="email" placeholder="voce@empresa.com" required />
          </Field>
          <Field>
            <Button type="submit" size="lg">
              Enviar link de redefinição
            </Button>
          </Field>
        </FieldGroup>
      </form>
      <Link
        href="/login"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Voltar para o login
      </Link>
    </div>
  )
}
