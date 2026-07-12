"use client"

import { useState } from "react"
import { PageHeader } from "@/components/dashboard/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { UserPlus, MoreHorizontal, Mail, ShieldAlert } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export default function TeamPage() {
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  
  const teamMembers = [
    { id: 1, name: "Gustavo Silva", email: "gustavo@example.com", role: "Owner", status: "Active", avatar: "https://github.com/shadcn.png" },
    { id: 2, name: "Ana Beatriz", email: "ana@example.com", role: "Admin", status: "Active", avatar: "" },
    { id: 3, name: "Carlos Dev", email: "carlos@example.com", role: "Developer", status: "Active", avatar: "" },
    { id: 4, name: "Julia Designer", email: "julia@example.com", role: "Viewer", status: "Pending", avatar: "" },
  ];

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
        <div className="divide-y divide-border">
          {teamMembers.map((member) => (
            <div key={member.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-4">
                <Avatar>
                  <AvatarImage src={member.avatar} />
                  <AvatarFallback>{member.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{member.name}</p>
                    {member.status === "Pending" && (
                      <Badge variant="outline" className="text-xs py-0 h-5 bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                        Pendente
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{member.email}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
                  {member.role === 'Owner' && <ShieldAlert className="w-4 h-4 text-primary" />}
                  {member.role}
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Ações</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {member.status === "Pending" && (
                      <DropdownMenuItem>
                        <Mail className="w-4 h-4 mr-2" /> Reenviar Convite
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem>Editar Cargo</DropdownMenuItem>
                    {member.role !== "Owner" && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                          Remover da Equipe
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      </Card>
      
      <div className="text-xs text-muted-foreground text-center pt-4">
        Você atingiu 4 de 10 membros permitidos no seu plano atual.
      </div>
    </div>
  )
}
