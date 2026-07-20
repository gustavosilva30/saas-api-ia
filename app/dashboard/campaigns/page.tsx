"use client"
import React, { useRef } from "react"
import { Upload, Sparkles, CheckCircle2, Image as ImageIcon, FileText, Download, Target, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/dashboard/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useCampaignStore } from "@/store/useCampaignStore"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export default function CampaignBuilderPage() {
  const { status, startCampaign, resetCampaign, cutoutUrl, analysis, copywriting, generatedAssets, originalFile, error, isGeneratingBanners, generateAIBanners } = useCampaignStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Por favor, envie uma imagem válida.");
        return;
      }
      startCampaign(file);
    }
  };

  const STEPS = [
    { key: "uploading", label: "Isolando Produto" },
    { key: "analyzing", label: "Analisando Geometria e Categoria" },
    { key: "generating_copy", label: "Escrevendo Textos (Copywriting)" },
    { key: "assembling_assets", label: "Montando Peças Omnichannel" },
    { key: "done", label: "Campanha Pronta" }
  ];

  const getCurrentStepIndex = () => {
    if (status === "idle" || status === "error") return -1;
    return STEPS.findIndex(s => s.key === status);
  };
  const currentIndex = getCurrentStepIndex();

  if (status === "idle") {
    return (
      <div className="flex flex-col h-full">
        <PageHeader 
          title="AI Campaign Builder" 
          description="A verdadeira experiência Zero Clicks. Arraste uma foto e saia com uma campanha." 
        />
        
        <div className="flex-1 flex items-center justify-center p-6">
          <div 
            className="w-full max-w-2xl border-2 border-dashed rounded-2xl p-16 flex flex-col items-center justify-center text-center bg-card hover:bg-muted/30 transition-colors cursor-pointer border-primary/20 hover:border-primary/50"
            onClick={() => fileInputRef.current?.click()}
          >
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleUpload} />
            <div className="size-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
              <Sparkles className="size-10 text-primary" />
            </div>
            <h3 className="text-2xl font-bold mb-2">Comece a Mágica</h3>
            <p className="text-muted-foreground mb-8 max-w-md">
              Arraste a foto bruta do seu produto aqui. A inteligência artificial fará todo o resto: recorte, composição, textos de venda e variações de formato.
            </p>
            <Button size="lg" className="rounded-full px-8">
              Selecionar Foto
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (status !== "done" && status !== "error") {
    return (
      <div className="flex flex-col h-full">
        <PageHeader title="Gerando Campanha..." description="Não feche esta janela. A IA está trabalhando." />
        
        <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-2xl mx-auto w-full">
          <div className="w-full bg-card rounded-2xl p-8 border shadow-sm">
            <div className="flex items-center gap-6 mb-12">
              <div className="size-24 rounded-xl border bg-muted flex items-center justify-center overflow-hidden shrink-0">
                {originalFile && (
                  <img src={URL.createObjectURL(originalFile)} className="w-full h-full object-cover opacity-50" alt="Original" />
                )}
              </div>
              <div>
                <h4 className="font-semibold text-lg">Processando: {originalFile?.name}</h4>
                <p className="text-muted-foreground">Isso pode levar de 5 a 10 segundos.</p>
              </div>
            </div>

            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-4 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-muted-foreground/20 before:to-transparent">
              {STEPS.map((step, idx) => {
                const isPast = idx < currentIndex;
                const isCurrent = idx === currentIndex;
                const isFuture = idx > currentIndex;

                return (
                  <div key={step.key} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className={cn("flex items-center justify-center w-8 h-8 rounded-full border-2 bg-background shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow transition-colors", 
                      isPast ? "border-primary text-primary" : isCurrent ? "border-primary bg-primary text-primary-foreground" : "border-muted text-muted-foreground"
                    )}>
                      {isPast ? <CheckCircle2 className="size-4" /> : isCurrent ? <RefreshCw className="size-4 animate-spin" /> : <div className="size-2 rounded-full bg-muted-foreground/30" />}
                    </div>
                    <div className={cn("w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded border shadow-sm transition-all",
                      isCurrent ? "bg-card border-primary/30" : "bg-muted/30 border-transparent opacity-60"
                    )}>
                      <p className="font-medium text-sm">{step.label}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex flex-col h-full">
        <PageHeader title="Erro na Geração" description="Algo deu errado." />
        <div className="flex-1 flex flex-col items-center justify-center">
          <p className="text-destructive font-medium mb-4">{error}</p>
          <Button onClick={resetCampaign}>Tentar Novamente</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <PageHeader 
        title="Campanha Finalizada!" 
        description="Todas as peças e textos foram gerados com sucesso."
      >
        <div className="flex gap-2">
          <Button variant="outline" onClick={resetCampaign}>Nova Campanha</Button>
          <Button><Download className="mr-2 size-4" /> Exportar Pacote (.ZIP)</Button>
        </div>
      </PageHeader>
      
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Coluna Esquerda: Peças Visuais */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg flex items-center gap-2"><ImageIcon className="size-5 text-primary" /> Peças Visuais</h3>
              
              {!generatedAssets.some(a => a.bgUrl) && (
                <Button 
                  onClick={generateAIBanners} 
                  disabled={isGeneratingBanners}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md gap-2 h-9 text-sm"
                >
                  {isGeneratingBanners ? <RefreshCw className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                  Gerar Cenários com IA
                </Button>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {(() => {
                const feedAsset = generatedAssets.find(a => a.format === 'instagram_feed');
                const mlAsset = generatedAssets.find(a => a.format === 'mercadolivre');
                const storyAsset = generatedAssets.find(a => a.format === 'instagram_story');
                
                return (
                  <>
                    <Card>
                      <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-sm flex justify-between">
                          Instagram Feed (1080x1080)
                          {feedAsset?.bgUrl && <span className="text-[10px] bg-indigo-500/10 text-indigo-500 px-2 py-0.5 rounded border border-indigo-500/20">AI Generated</span>}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <div className={cn("aspect-square rounded-lg border overflow-hidden relative flex items-center justify-center", feedAsset?.bgUrl ? "" : "bg-checkerboard")}>
                          {feedAsset?.bgUrl && (
                            <img src={feedAsset.bgUrl} className="absolute inset-0 w-full h-full object-cover opacity-90" alt="BG" />
                          )}
                          <img src={cutoutUrl!} className={cn("relative z-10 w-full h-full object-contain p-4 drop-shadow-2xl transition-all duration-700 mix-blend-multiply", feedAsset?.bgUrl ? "scale-90" : "scale-100")} alt="Feed" />
                          {feedAsset?.overlayText && (
                            <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-16 pb-6 px-4 z-20">
                              <h1 className="text-white font-bold text-lg md:text-xl leading-tight text-center tracking-wide drop-shadow-md">
                                {feedAsset.overlayText}
                              </h1>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-sm flex justify-between">
                          Mercado Livre (1200x1200)
                          {mlAsset?.bgUrl && <span className="text-[10px] bg-indigo-500/10 text-indigo-500 px-2 py-0.5 rounded border border-indigo-500/20">AI Generated</span>}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <div className={cn("aspect-square rounded-lg border overflow-hidden relative flex items-center justify-center", mlAsset?.bgUrl ? "" : "bg-white")}>
                          {mlAsset?.bgUrl && (
                            <img src={mlAsset.bgUrl} className="absolute inset-0 w-full h-full object-cover blur-sm opacity-60" alt="BG" />
                          )}
                          {mlAsset?.bgUrl && <div className="absolute inset-0 bg-white/50 backdrop-blur-md" />}
                          <img src={cutoutUrl!} className="relative z-10 w-[80%] h-[80%] object-contain drop-shadow-md mix-blend-multiply" alt="ML" />
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="col-span-2">
                      <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-sm flex justify-between">
                          Instagram Story (1080x1920)
                          {storyAsset?.bgUrl && <span className="text-[10px] bg-indigo-500/10 text-indigo-500 px-2 py-0.5 rounded border border-indigo-500/20">AI Generated</span>}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0 flex justify-center">
                        <div className={cn("aspect-[9/16] w-1/2 max-w-[200px] rounded-lg border overflow-hidden relative flex items-center justify-center", storyAsset?.bgUrl ? "" : "bg-checkerboard")}>
                          {storyAsset?.bgUrl && (
                            <img src={storyAsset.bgUrl} className="absolute inset-0 w-full h-full object-cover opacity-90" alt="BG" />
                          )}
                          <img src={cutoutUrl!} className={cn("relative z-10 w-full h-full object-contain p-2 drop-shadow-2xl transition-all duration-700 mix-blend-multiply", storyAsset?.bgUrl ? "scale-90 translate-y-12" : "scale-100")} alt="Story" />
                          {storyAsset?.overlayText && (
                            <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-20 pb-8 px-4 z-20 flex flex-col items-center">
                              <h1 className="text-white font-bold text-base leading-tight text-center tracking-wide mb-4 drop-shadow-md">
                                {storyAsset.overlayText}
                              </h1>
                              <div className="mt-2 text-white/95 text-[10px] font-bold bg-white/20 border border-white/30 inline-flex items-center justify-center px-4 py-2 rounded-full backdrop-blur-md uppercase tracking-widest shadow-lg">
                                Arraste para Cima 
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )
              })()}
            </div>
          </div>

          {/* Coluna Direita: Copywriting e Dados */}
          <div className="lg:col-span-5 space-y-6">
            <h3 className="font-semibold text-lg flex items-center gap-2"><FileText className="size-5 text-primary" /> Copywriting (IA)</h3>
            
            <Card>
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>Estrutura de Venda</span>
                  <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-1 rounded">Categoria: {analysis?.category}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">Título Sugerido</label>
                  <p className="font-medium text-lg leading-tight">{copywriting?.title}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">Benefícios</label>
                  <ul className="list-disc pl-4 text-sm space-y-1 text-muted-foreground">
                    {copywriting?.benefits.map((b, i) => <li key={i}>{b}</li>)}
                  </ul>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">Hashtags / SEO</label>
                  <p className="text-sm text-primary">{copywriting?.hashtags}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="size-4" /> Textos para Redes
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y text-sm">
                  <div className="p-4">
                    <label className="text-xs font-semibold text-pink-500 uppercase mb-2 block">Instagram</label>
                    <p className="text-muted-foreground whitespace-pre-wrap">{copywriting?.platformSpecific.instagram}</p>
                  </div>
                  <div className="p-4 bg-muted/20">
                    <label className="text-xs font-semibold text-yellow-500 uppercase mb-2 block">Mercado Livre</label>
                    <p className="text-muted-foreground whitespace-pre-wrap">{copywriting?.platformSpecific.mercadolivre}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
}
