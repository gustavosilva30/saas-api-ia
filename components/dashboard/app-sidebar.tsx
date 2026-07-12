"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronsUpDown, Check, Plus } from "lucide-react"
import { navSections } from "@/lib/nav"
import { currentTenant } from "@/lib/mock-data"
import { Logo } from "@/components/logo"
import { Badge } from "@/components/ui/badge"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const workspaces = [
  { name: "Studio Aurora", plan: "Pro" },
  { name: "PixelForge", plan: "Enterprise" },
  { name: "Loja Verde", plan: "Starter" },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center justify-between px-1 py-1.5">
          <Logo />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button className="flex w-full items-center gap-2 rounded-lg border bg-card p-2 text-left transition-colors hover:bg-accent" />
            }
          >
            <div className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-sm font-semibold text-primary">
              SA
            </div>
            <div className="grid flex-1 leading-tight">
              <span className="truncate text-sm font-medium">
                {currentTenant.name}
              </span>
              <span className="truncate text-xs text-muted-foreground capitalize">
                Plano {currentTenant.plan}
              </span>
            </div>
            <ChevronsUpDown className="size-4 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-(--anchor-width) min-w-56">
            <DropdownMenuLabel>Empresas</DropdownMenuLabel>
            <DropdownMenuGroup>
              {workspaces.map((w, i) => (
                <DropdownMenuItem key={w.name} className="gap-2">
                  <div className="flex size-6 items-center justify-center rounded bg-muted text-xs font-medium">
                    {w.name.slice(0, 2)}
                  </div>
                  <span className="flex-1">{w.name}</span>
                  {i === 0 && <Check className="size-4 text-primary" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 text-muted-foreground">
              <Plus className="size-4" />
              Nova empresa
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarHeader>

      <SidebarContent className="gap-0 px-1">
        {navSections.map((section) => (
          <SidebarGroup key={section.label}>
            <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
            <SidebarMenu>
              {section.items.map((item) => {
                const active =
                  item.href === "/dashboard"
                    ? pathname === "/dashboard"
                    : pathname.startsWith(item.href)
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={active}
                      tooltip={item.title}
                      render={<Link href={item.href} />}
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                    {item.badge && (
                      <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>
                    )}
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <div className="rounded-lg border bg-gradient-to-b from-accent/50 to-transparent p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium">Créditos</span>
            <Badge variant="secondary" className="text-[10px]">
              61%
            </Badge>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full w-[61%] rounded-full bg-primary" />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            61.098 de 100.000 restantes
          </p>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
