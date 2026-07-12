"use client"

import { useState, useEffect } from "react"
import { PageHeader } from "@/components/dashboard/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Loader2, Plus, Trash, Globe } from "lucide-react"
import { api } from "@/lib/api"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { toast } from "sonner"

export default function WebhooksPage() {
  const [hooks, setHooks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [newUrl, setNewUrl] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const loadHooks = async () => {
    setLoading(true)
    try {
      const data = await api.getWebhooks()
      setHooks(data || [])
    } catch (err) {
      toast.error("Erro ao carregar webhooks")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadHooks()
  }, [])

  const handleCreate = async () => {
    if (!newUrl.trim()) return
    if (!newUrl.startsWith("http")) {
      toast.error("A URL deve começar com http:// ou https://")
      return
    }

    setIsCreating(true)
    try {
      await api.createWebhook(newUrl)
      toast.success("Webhook adicionado com sucesso")
      setIsDialogOpen(false)
      setNewUrl("")
      await loadHooks()
    } catch (err) {
      toast.error("Erro ao adicionar webhook")
    } finally {
      setIsCreating(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover este webhook? Seu sistema deixará de receber notificações nesta URL.")) return
    try {
      await api.deleteWebhook(id)
      toast.success("Webhook removido")
      await loadHooks()
    } catch (err) {
      toast.error("Erro ao remover webhook")
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <PageHeader
          title="Webhooks"
          description="Cadastre URLs do seu sistema para receber notificações em tempo real (ex: imagem processada)."
        />
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Webhook
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Endpoint de Webhook</DialogTitle>
              <DialogDescription>
                Nós enviaremos requisições HTTP POST para esta URL sempre que eventos importantes ocorrerem.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="flex flex-col gap-2">
                <Input
                  placeholder="https://sua-api.com.br/webhooks/remove-bg"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  type="url"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleCreate} disabled={!newUrl.trim() || isCreating}>
                {isCreating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Salvar Endpoint
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Endpoints Configurados</CardTitle>
          <CardDescription>Gerencie para onde os eventos são enviados.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : hooks.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground border border-dashed rounded-lg">
              <Globe className="h-8 w-8 mx-auto mb-4 opacity-50" />
              <p>Nenhum webhook configurado.</p>
              <p className="text-sm">Seu sistema não receberá callbacks automáticos ainda.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>URL de Destino</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Adicionado em</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {hooks.map((hook) => (
                    <TableRow key={hook.id}>
                      <TableCell className="font-medium text-blue-600 dark:text-blue-400 break-all">{hook.url}</TableCell>
                      <TableCell>
                        {hook.is_active ? (
                          <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20" variant="secondary">
                            Ativo
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Desativado</Badge>
                        )}
                      </TableCell>
                      <TableCell>{format(new Date(hook.created_at), "dd 'de' MMM, yyyy", { locale: ptBR })}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(hook.id)}>
                          <Trash className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
