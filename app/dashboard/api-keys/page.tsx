"use client"

import { useState, useEffect } from "react"
import { PageHeader } from "@/components/dashboard/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Loader2, Plus, Copy, Trash, Key, Check } from "lucide-react"
import { api } from "@/lib/api"
import { toast } from "sonner"

const formatDate = (dateString: string) => {
  if (!dateString) return ""
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(dateString))
}

const formatDateTime = (dateString: string) => {
  if (!dateString) return ""
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(dateString))
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [newKeyName, setNewKeyName] = useState("")
  const [generatedKey, setGeneratedKey] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const loadKeys = async () => {
    setLoading(true)
    try {
      const data = await api.getApiKeys()
      setKeys(data || [])
    } catch (err) {
      toast.error("Erro ao carregar chaves de API")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadKeys()
  }, [])

  const handleCreate = async () => {
    if (!newKeyName.trim()) return
    setIsCreating(true)
    try {
      const data = await api.createApiKey(newKeyName)
      setGeneratedKey(data.secret) // Mostramos apenas uma vez!
      await loadKeys()
      setNewKeyName("")
    } catch (err) {
      toast.error("Erro ao criar chave")
    } finally {
      setIsCreating(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja revogar esta chave? Sistemas usando-a irão parar de funcionar.")) return
    try {
      await api.revokeApiKey(id)
      toast.success("Chave revogada com sucesso")
      await loadKeys()
    } catch (err) {
      toast.error("Erro ao revogar chave")
    }
  }

  const handleCopy = () => {
    if (generatedKey) {
      navigator.clipboard.writeText(generatedKey)
      setCopied(true)
      toast.success("Chave copiada!")
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleCloseDialog = (open: boolean) => {
    if (!open) {
      setGeneratedKey(null) // Esconde a chave para sempre quando fecha
    }
    setIsDialogOpen(open)
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <PageHeader
          title="API Keys"
          description="Gerencie suas chaves de acesso para integração via API."
        />
        <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nova Chave API
            </Button>
          </DialogTrigger>
          <DialogContent>
            {generatedKey ? (
              <>
                <DialogHeader>
                  <DialogTitle>Chave Gerada com Sucesso</DialogTitle>
                  <DialogDescription className="text-red-500 font-medium">
                    Copie sua chave agora. Por motivos de segurança, você não poderá vê-la novamente.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex items-center gap-2 mt-4 p-3 bg-muted rounded-md overflow-x-auto">
                  <Key className="h-5 w-5 text-muted-foreground shrink-0" />
                  <code className="text-sm font-mono flex-1">{generatedKey}</code>
                  <Button variant="ghost" size="icon" onClick={handleCopy}>
                    {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <DialogFooter className="mt-4">
                  <Button onClick={() => handleCloseDialog(false)}>Entendi, já copiei</Button>
                </DialogFooter>
              </>
            ) : (
              <>
                <DialogHeader>
                  <DialogTitle>Criar Nova Chave API</DialogTitle>
                  <DialogDescription>
                    Dê um nome para identificar o uso desta chave.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="flex flex-col gap-2">
                    <Input
                      placeholder="Ex: Integração App Mobile"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => handleCloseDialog(false)}>Cancelar</Button>
                  <Button onClick={handleCreate} disabled={!newKeyName.trim() || isCreating}>
                    {isCreating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Gerar Chave
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Chaves Ativas</CardTitle>
          <CardDescription>Apenas a equipe de desenvolvedores deve ter acesso a essas chaves.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : keys.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground border border-dashed rounded-lg">
              <Key className="h-8 w-8 mx-auto mb-4 opacity-50" />
              <p>Nenhuma chave de API encontrada.</p>
              <p className="text-sm">Clique em "Nova Chave API" para criar a primeira.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Chave</TableHead>
                    <TableHead>Criada em</TableHead>
                    <TableHead>Último uso</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {keys.map((key) => (
                    <TableRow key={key.id}>
                      <TableCell className="font-medium">{key.name}</TableCell>
                      <TableCell><code className="bg-muted px-1.5 py-0.5 rounded text-sm">{key.prefix}</code></TableCell>
                      <TableCell>{formatDate(key.created_at)}</TableCell>
                      <TableCell>
                        {key.last_used_at 
                          ? formatDateTime(key.last_used_at) 
                          : "Nunca usada"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(key.id)}>
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
