"use client"

import { PageHeader } from "@/components/dashboard/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Perfil"
        description="Gerencie suas informações pessoais e configurações de segurança."
      />
      
      <div className="grid gap-6">
        {/* Informações Pessoais */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Pessoais</CardTitle>
            <CardDescription>Atualize sua foto e detalhes pessoais aqui.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-6">
              <Avatar className="w-24 h-24">
                <AvatarImage src="https://github.com/shadcn.png" />
                <AvatarFallback>GS</AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <Button variant="outline" size="sm">Trocar Foto</Button>
                <p className="text-xs text-muted-foreground">JPG, GIF ou PNG. Tamanho máximo de 2MB.</p>
              </div>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="first-name">Nome</Label>
                <Input id="first-name" defaultValue="Gustavo" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last-name">Sobrenome</Label>
                <Input id="last-name" defaultValue="Silva" />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" defaultValue="gustavo@example.com" disabled />
              <p className="text-xs text-muted-foreground">O e-mail não pode ser alterado por aqui. Entre em contato com o suporte.</p>
            </div>
          </CardContent>
          <CardFooter className="border-t border-border/50 pt-6">
            <Button>Salvar Perfil</Button>
          </CardFooter>
        </Card>

        {/* Segurança */}
        <Card>
          <CardHeader>
            <CardTitle>Segurança</CardTitle>
            <CardDescription>Mantenha sua conta segura atualizando sua senha.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Senha Atual</Label>
              <Input id="current-password" type="password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">Nova Senha</Label>
              <Input id="new-password" type="password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
              <Input id="confirm-password" type="password" />
            </div>
          </CardContent>
          <CardFooter className="border-t border-border/50 pt-6">
            <Button variant="outline">Atualizar Senha</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
