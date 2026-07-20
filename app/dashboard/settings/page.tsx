"use client"

import { PageHeader } from "@/components/dashboard/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useTenantStore } from "@/store/useTenantStore"
import { useEffect, useState } from "react"

export default function SettingsPage() {
  const { openaiKey, googleKey, setOpenaiKey, setGoogleKey } = useTenantStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
                <SelectTrigger id="default-tier" className="w-full md:max-w-xs">
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
        
        {/* Provedores de IA (BYOK) */}
        <Card>
          <CardHeader>
            <CardTitle>Provedores de IA (BYOK)</CardTitle>
            <CardDescription>
              Traga sua própria chave (Bring Your Own Key) para utilizar recursos de Inteligência Artificial sem consumir créditos adicionais da plataforma. As chaves são salvas localmente no seu dispositivo por segurança.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="openai-key">OpenAI API Key (ChatGPT, DALL-E)</Label>
              <Input 
                id="openai-key" 
                type="password" 
                placeholder="sk-..." 
                value={mounted && openaiKey ? openaiKey : ""}
                onChange={(e) => setOpenaiKey(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Usado para geração de Copy e Motion Director.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="google-key">Google Gemini API Key</Label>
              <Input 
                id="google-key" 
                type="password" 
                placeholder="AIzaSy..." 
                value={mounted && googleKey ? googleKey : ""}
                onChange={(e) => setGoogleKey(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Usado para análise avançada de campanhas.
              </p>
            </div>
          </CardContent>
          <CardFooter className="border-t border-border/50 pt-6">
            <Button onClick={() => alert("Chaves salvas localmente com sucesso!")}>Salvar Chaves de IA</Button>
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
