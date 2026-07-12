"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Bell, LogOut, Search, Settings, UserCircle, Coins } from "lucide-react"
import { pageTitles } from "@/lib/nav"
import { currentUser } from "@/lib/mock-data"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { SidebarTrigger } from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function DashboardHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const title = pageTitles[pathname] ?? "Dashboard"
  const [userEmail, setUserEmail] = React.useState(currentUser.email)
  const [userName, setUserName] = React.useState(currentUser.name)

  React.useEffect(() => {
    const email = localStorage.getItem("user_email")
    if (email) {
      setUserEmail(email)
      if (email === "gsntech.suporte@gmail.com") {
        setUserName("GSN Tech (Super Admin)")
      } else {
        setUserName(email.split("@")[0])
      }
    }
  }, [])

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur-md">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-1 h-5" />

      <div className="flex items-center gap-2">
        <Link
          href="/dashboard"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Claro
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="text-sm font-medium">{title}</span>
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          className="hidden gap-2 text-muted-foreground md:flex"
        >
          <Search className="size-4" />
          <span>Buscar…</span>
          <kbd className="ml-2 rounded border bg-muted px-1.5 font-mono text-[10px]">
            ⌘K
          </kbd>
        </Button>

        <Badge variant="secondary" className="hidden gap-1.5 sm:flex">
          <Coins className="size-3.5 text-primary" />
          <span className="tabular-nums">61.098</span>
        </Badge>

        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="icon-sm" aria-label="Notificações" />
            }
          >
            <span className="relative">
              <Bell className="size-4" />
              <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-primary ring-2 ring-background" />
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notificações</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem className="flex-col items-start gap-0.5">
                <span className="text-sm font-medium">Lote concluído</span>
                <span className="text-xs text-muted-foreground">
                  240 imagens processadas com sucesso.
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex-col items-start gap-0.5">
                <span className="text-sm font-medium">Créditos em 61%</span>
                <span className="text-xs text-muted-foreground">
                  Considere adicionar mais créditos.
                </span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button className="ml-1 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring" />
            }
          >
            <Avatar className="size-8">
              <AvatarFallback className="bg-primary/10 text-primary">
                MF
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="flex flex-col gap-0.5">
              <span className="text-sm font-medium">{userName}</span>
              <span className="text-xs font-normal text-muted-foreground">
                {userEmail}
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => router.push("/dashboard/profile")}>
                <UserCircle data-icon="inline-start" />
                Perfil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/dashboard/settings")}>
                <Settings data-icon="inline-start" />
                Configurações
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => {
                localStorage.removeItem("user_email")
                router.push("/login")
              }}
            >
              <LogOut data-icon="inline-start" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
