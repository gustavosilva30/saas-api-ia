"use client"

import { PageHeader } from "@/components/dashboard/page-header"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Filter, ShieldAlert } from "lucide-react"

export default function LogsPage() {
  const auditLogs = [
    { id: 1, action: "Usuário convidado para a equipe", user: "gustavo@example.com", target: "julia@example.com", date: "Hoje, 10:45", type: "Equipe" },
    { id: 2, action: "Plano atualizado para Premium", user: "gustavo@example.com", target: "Organização", date: "Ontem, 16:30", type: "Faturamento" },
    { id: 3, action: "API Key gerada", user: "ana@example.com", target: "Chave Prod-1", date: "Ontem, 11:20", type: "Segurança" },
    { id: 4, action: "Falha de pagamento recorrente", user: "Sistema", target: "Mastercard 4242", date: "09 de Julho, 08:00", type: "Faturamento", isError: true },
    { id: 5, action: "Login detectado de novo IP", user: "carlos@example.com", target: "IP 192.168.1.1", date: "08 de Julho, 14:15", type: "Segurança" },
    { id: 6, action: "Configuração padrão da API alterada (Tier: Basic)", user: "gustavo@example.com", target: "Configurações", date: "05 de Julho, 09:10", type: "API" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Logs de Auditoria"
        description="Rastreie todas as ações importantes realizadas por membros da sua equipe."
      />
      
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input type="search" placeholder="Buscar logs por usuário ou ação..." className="pl-8 w-full" />
        </div>
        <Button variant="outline" className="shrink-0">
          <Filter className="w-4 h-4 mr-2" /> Filtrar
        </Button>
      </div>

      <Card>
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
      </Card>
      
      <div className="flex justify-center mt-6">
        <Button variant="outline" size="sm">Carregar mais logs</Button>
      </div>
    </div>
  )
}
