"use client"

import { PageHeader } from "@/components/dashboard/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Configurações"
        description="Gerencie as preferências da sua organização e configurações da API."
      />
      
      <div className="grid gap-6">
        {/* Detalhes da Organização */}
        <Card>
          <CardHeader>
            <CardTitle>Detalhes da Organização</CardTitle>
            <CardDescription>Informações básicas sobre a sua empresa.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="org-name">Nome da Organização</Label>
              <Input id="org-name" placeholder="Digite o nome da empresa" defaultValue="" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="org-email">E-mail de Contato (Para avisos de billing)</Label>
              <Input id="org-email" type="email" placeholder="financeiro@suaempresa.com" defaultValue="" />
            </div>
          </CardContent>
          <CardFooter className="border-t border-border/50 pt-6">
            <Button>Salvar Alterações</Button>
          </CardFooter>
        </Card>

        {/* Configurações da API */}
        <Card>
          <CardHeader>
            <CardTitle>Configurações Padrão da API</CardTitle>
            <CardDescription>
              Defina o comportamento padrão da API quando um parâmetro não for explicitamente enviado na requisição.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="default-tier">Plano de Qualidade Padrão (Tier)</Label>
              <Select defaultValue="basic">
                <SelectTrigger id="default-tier">
                  <SelectValue placeholder="Selecione um tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Basic (Mais rápido, 1 crédito)</SelectItem>
                  <SelectItem value="pro">Pro (Balanceado, 2 créditos)</SelectItem>
                  <SelectItem value="premium">Premium (Maior qualidade, 5 créditos)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Se o campo `tier` não for enviado no POST `/remove-bg`, este será utilizado.
              </p>
            </div>
            
            <div className="flex items-center justify-between border p-4 rounded-lg">
              <div className="space-y-0.5">
                <Label className="text-base">Notificações de Saldo Baixo</Label>
                <p className="text-sm text-muted-foreground">
                  Receba um e-mail quando seu saldo de créditos estiver acabando.
                </p>
              </div>
              <Switch defaultChecked={false} />
            </div>
            
             <div className="flex items-center justify-between border p-4 rounded-lg">
              <div className="space-y-0.5">
                <Label className="text-base">Registrar Imagens (Logs de Debug)</Label>
                <p className="text-sm text-muted-foreground">
                  Permite que a IA salve a imagem temporariamente caso ocorra um erro 500 para debug.
                </p>
              </div>
              <Switch defaultChecked={false} />
            </div>
          </CardContent>
          <CardFooter className="border-t border-border/50 pt-6">
            <Button>Salvar Configurações da API</Button>
          </CardFooter>
        </Card>
        
        {/* Zona de Perigo */}
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive">Zona de Perigo</CardTitle>
            <CardDescription>Ações irreversíveis relacionadas à sua organização.</CardDescription>
          </CardHeader>
          <CardContent>
             <p className="text-sm text-muted-foreground mb-4">
              Ao excluir a organização, todos os membros serão removidos, as chaves de API serão revogadas imediatamente e os dados de histórico serão apagados. Esta ação não pode ser desfeita.
             </p>
             <Button variant="destructive">Excluir Organização</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
