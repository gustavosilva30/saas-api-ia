"use client"

import { PageHeader } from "@/components/dashboard/page-header"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Filter, ShieldAlert } from "lucide-react"

// Types that might be useful later when hooking up to an API
type AuditLog = {
  id: number;
  action: string;
  user: string;
  target: string;
  date: string;
  type: string;
  isError?: boolean;
};

export default function LogsPage() {
  // Estado vazio para os logs (na vida real viria da API)
  const auditLogs: AuditLog[] = [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Logs de Auditoria"
        description="Rastreie todas as ações importantes realizadas por membros da sua equipe."
      />
      
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input type="search" placeholder="Buscar logs por usuário ou ação..." className="pl-8 w-full" disabled />
        </div>
        <Button variant="outline" className="shrink-0" disabled>
          <Filter className="w-4 h-4 mr-2" /> Filtrar
        </Button>
      </div>

      <Card>
        {auditLogs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                <tr>
                  <th scope="col" className="px-6 py-3 font-medium">Ação</th>
                  <th scope="col" className="px-6 py-3 font-medium">Usuário</th>
                  <th scope="col" className="px-6 py-3 font-medium">Alvo</th>
                  <th scope="col" className="px-6 py-3 font-medium">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {log.isError && <ShieldAlert className="w-4 h-4 text-destructive" />}
                        <span className={log.isError ? "text-destructive font-medium" : "font-medium"}>
                          {log.action}
                        </span>
                        <Badge variant="secondary" className="ml-2 text-[10px] uppercase tracking-wider hidden md:inline-flex">
                          {log.type}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{log.user}</td>
                    <td className="px-6 py-4">{log.target}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">{log.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-muted-foreground">
            <ShieldAlert className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground">Nenhum log registrado</h3>
            <p className="mt-2">Ações de segurança e auditoria aparecerão aqui.</p>
          </div>
        )}
      </Card>
      
      {auditLogs.length > 0 && (
        <div className="flex justify-center mt-6">
          <Button variant="outline" size="sm">Carregar mais logs</Button>
        </div>
      )}
    </div>
  )
}
