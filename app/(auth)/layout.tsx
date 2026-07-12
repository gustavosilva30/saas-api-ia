import Image from "next/image"
import { Logo } from "@/components/logo"
import { ThemeToggle } from "@/components/theme-toggle"
import { Badge } from "@/components/ui/badge"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col">
        <header className="flex items-center justify-between p-6">
          <Logo />
          <ThemeToggle />
        </header>
        <main className="flex flex-1 items-center justify-center px-6 pb-12">
          <div className="w-full max-w-sm">{children}</div>
        </main>
      </div>

      <aside className="relative hidden overflow-hidden bg-sidebar p-10 lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1.5">
            <span className="size-1.5 rounded-full bg-primary" />
            Modelo v3.2
          </Badge>
        </div>

        <div className="flex flex-col gap-6">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border bg-checkerboard shadow-lg">
            <Image
              src="/demo-result.png"
              alt="Exemplo de imagem com fundo removido"
              fill
              className="object-contain p-6"
            />
          </div>
          <div className="max-w-md">
            <h2 className="text-balance text-2xl font-semibold tracking-tight">
              Remova fundos de imagens em segundos, com precisão de IA.
            </h2>
            <p className="mt-3 text-pretty text-sm leading-relaxed text-muted-foreground">
              A plataforma completa para equipes: API REST, processamento em
              lote, créditos e dashboard. Pronta para escalar com o seu negócio.
            </p>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <div>
              <p className="text-2xl font-semibold tabular-nums">99,9%</p>
              <p className="text-muted-foreground">Uptime SLA</p>
            </div>
            <div>
              <p className="text-2xl font-semibold tabular-nums">1,8s</p>
              <p className="text-muted-foreground">Por imagem</p>
            </div>
            <div>
              <p className="text-2xl font-semibold tabular-nums">+40M</p>
              <p className="text-muted-foreground">Imagens processadas</p>
            </div>
          </div>
        </div>
      </aside>
    </div>
  )
}
