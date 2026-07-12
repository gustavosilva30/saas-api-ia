"use client"

import { useState } from "react"
import { PageHeader } from "@/components/dashboard/page-header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { UserPlus } from "lucide-react"

// Types that might be useful later when hooking up to an API
type TeamMember = {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  avatar: string;
};

export default function TeamPage() {
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  
  // Estado vazio de membros (na vida real viria do banco de dados)
  const teamMembers: TeamMember[] = [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <PageHeader
          title="Equipe"
          description="Gerencie os membros da sua organização e seus níveis de acesso."
        />
        
        <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="w-4 h-4 mr-2" /> Convidar Membro
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Convidar Membro</DialogTitle>
              <DialogDescription>
                Envie um convite para adicionar um novo membro à sua equipe. Eles receberão um e-mail.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" placeholder="nome@exemplo.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Nível de Acesso</Label>
                <Select defaultValue="developer">
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um cargo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador (Acesso total)</SelectItem>
                    <SelectItem value="developer">Desenvolvedor (Acesso à API e Logs)</SelectItem>
                    <SelectItem value="viewer">Visualizador (Apenas leitura)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsInviteOpen(false)}>Cancelar</Button>
              <Button onClick={() => setIsInviteOpen(false)}>Enviar Convite</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      <Card>
        {teamMembers.length > 0 ? (
          <div className="divide-y divide-border">
            {/* O conteúdo da tabela mapeando teamMembers ficaria aqui */}
          </div>
        ) : (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <UserPlus className="w-12 h-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium">Nenhum membro na equipe</h3>
            <p className="text-muted-foreground max-w-sm mt-2 mb-6">
              Você ainda não adicionou ninguém. Convide seu primeiro membro para colaborar no projeto.
            </p>
            <Button onClick={() => setIsInviteOpen(true)} variant="outline">
              Convidar o primeiro membro
            </Button>
          </div>
        )}
      </Card>
      
      <div className="text-xs text-muted-foreground text-center pt-4">
        Você atingiu 0 de 10 membros permitidos no seu plano atual.
      </div>
    </div>
  )
}
