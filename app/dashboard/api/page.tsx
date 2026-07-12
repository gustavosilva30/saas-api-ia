"use client"

import { PageHeader } from "@/components/dashboard/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Copy, Check } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function ApiDocsPage() {
  const [copiedCurl, setCopiedCurl] = useState(false)
  const [copiedNode, setCopiedNode] = useState(false)
  const [copiedPython, setCopiedPython] = useState(false)

  const handleCopy = (text: string, setter: (val: boolean) => void) => {
    navigator.clipboard.writeText(text)
    setter(true)
    setTimeout(() => setter(false), 2000)
  }

  const curlCode = `curl -X POST https://sua-api.com.br/remove-bg \\
  -H "Authorization: Bearer sk_live_suachaveaqui" \\
  -F "file=@/caminho/para/sua/imagem.jpg" \\
  -F "tier=pro" \\
  --output imagem_sem_fundo.png`

  const nodeCode = `const FormData = require('form-data');
const fs = require('fs');
const axios = require('axios');

const form = new FormData();
form.append('file', fs.createReadStream('/caminho/imagem.jpg'));
form.append('tier', 'pro');

axios.post('https://sua-api.com.br/remove-bg', form, {
  headers: {
    ...form.getHeaders(),
    'Authorization': 'Bearer sk_live_suachaveaqui'
  },
  responseType: 'arraybuffer'
})
.then(response => {
  fs.writeFileSync('resultado.png', response.data);
  console.log("Sucesso!");
})
.catch(err => console.error(err));`

  const pythonCode = `import requests

url = "https://sua-api.com.br/remove-bg"
headers = {
    "Authorization": "Bearer sk_live_suachaveaqui"
}

with open("imagem.jpg", "rb") as image_file:
    files = {"file": image_file}
    data = {"tier": "pro"}
    
    response = requests.post(url, headers=headers, files=files, data=data)

if response.status_code == 200:
    with open("resultado.png", "wb") as out:
        out.write(response.content)
    print("Sucesso!")
else:
    print("Erro:", response.text)`

  return (
    <div className="flex flex-col gap-8 max-w-5xl">
      <PageHeader
        title="Documentação da API"
        description="Integre a remoção de fundo perfeitamente no seu próprio aplicativo ou fluxo de trabalho."
      />

      <div className="grid gap-8">
        <section>
          <h2 className="text-2xl font-semibold mb-4 tracking-tight">Autenticação</h2>
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground mb-4">
                Todas as requisições à API devem ser autenticadas enviando o Header <code>Authorization</code> com o valor <code>Bearer SUA_API_KEY</code>.
                Você pode gerar novas chaves no menu <strong>API Keys</strong>.
              </p>
              <Alert variant="default" className="bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400">
                <AlertTitle className="font-semibold">Importante</AlertTitle>
                <AlertDescription>
                  Nunca compartilhe sua Secret Key em ambientes públicos (como GitHub ou código frontend exposto). Faça as chamadas de API sempre pelo seu backend.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 tracking-tight">Endpoint: Remover Fundo</h2>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <span className="bg-green-500 text-white font-mono font-bold px-3 py-1 rounded-md text-sm">POST</span>
                <code className="text-lg font-mono">/remove-bg</code>
              </div>
              <CardDescription className="mt-2">
                Remove o fundo de uma imagem enviada via <code>multipart/form-data</code> e retorna a imagem processada (em formato PNG com fundo transparente) diretamente no body da resposta.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <h3 className="text-lg font-medium mb-3">Parâmetros (Form Data)</h3>
              <div className="border rounded-md divide-y mb-8">
                <div className="grid grid-cols-1 md:grid-cols-3 p-4 gap-4">
                  <div>
                    <code className="font-bold">file</code>
                    <span className="text-red-500 ml-2 text-xs font-bold uppercase">Obrigatório</span>
                  </div>
                  <div className="md:col-span-2 text-sm text-muted-foreground">
                    O arquivo de imagem (JPEG, PNG, WEBP).
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 p-4 gap-4">
                  <div>
                    <code className="font-bold">tier</code>
                    <span className="text-muted-foreground ml-2 text-xs font-bold uppercase">Opcional</span>
                  </div>
                  <div className="md:col-span-2 text-sm text-muted-foreground">
                    O nível de qualidade do modelo. Opções: <code>basic</code>, <code>pro</code>, <code>premium</code>. Padrão: <code>basic</code>.
                  </div>
                </div>
              </div>

              <h3 className="text-lg font-medium mb-3">Exemplos de Código</h3>
              <Tabs defaultValue="curl" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="curl">cURL</TabsTrigger>
                  <TabsTrigger value="node">Node.js</TabsTrigger>
                  <TabsTrigger value="python">Python</TabsTrigger>
                </TabsList>
                
                <TabsContent value="curl" className="relative">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute right-2 top-2 text-slate-400 hover:text-white"
                    onClick={() => handleCopy(curlCode, setCopiedCurl)}
                  >
                    {copiedCurl ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                  </Button>
                  <pre className="bg-slate-950 text-slate-50 p-4 rounded-lg overflow-x-auto text-sm font-mono">
                    {curlCode}
                  </pre>
                </TabsContent>
                
                <TabsContent value="node" className="relative">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute right-2 top-2 text-slate-400 hover:text-white"
                    onClick={() => handleCopy(nodeCode, setCopiedNode)}
                  >
                    {copiedNode ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                  </Button>
                  <pre className="bg-slate-950 text-slate-50 p-4 rounded-lg overflow-x-auto text-sm font-mono">
                    {nodeCode}
                  </pre>
                </TabsContent>

                <TabsContent value="python" className="relative">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute right-2 top-2 text-slate-400 hover:text-white"
                    onClick={() => handleCopy(pythonCode, setCopiedPython)}
                  >
                    {copiedPython ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                  </Button>
                  <pre className="bg-slate-950 text-slate-50 p-4 rounded-lg overflow-x-auto text-sm font-mono">
                    {pythonCode}
                  </pre>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </section>
        
        <section>
          <h2 className="text-2xl font-semibold mb-4 tracking-tight">Webhooks (Callbacks)</h2>
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground mb-4">
                Em vez de ficar verificando (polling) o status de imagens, você pode cadastrar Webhooks na tela de <strong>Webhooks</strong>. 
                Sempre que uma imagem terminar de ser processada, enviaremos um <code>POST</code> para sua URL contendo as informações da conclusão.
              </p>
              <pre className="bg-slate-950 text-slate-50 p-4 rounded-lg overflow-x-auto text-sm font-mono mt-4">
{`// Exemplo do Payload enviado para o seu Webhook:
{
  "event": "image.processed",
  "status": "success",
  "tier": "pro"
}`}
              </pre>
            </CardContent>
          </Card>
        </section>

      </div>
    </div>
  )
}
