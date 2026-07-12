"use client"
import React, { useState } from "react"
import { Search, ShoppingBag, Star, Download, Sparkles, Filter, ChevronRight, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useMarketplaceStore, HubItem, HubItemType } from "@/store/useMarketplaceStore"
import { useBillingStore } from "@/store/useBillingStore"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const TYPE_LABELS: Record<HubItemType, string> = {
  template: "Template",
  preset: "Preset",
  aipack: "AI Pack",
  bundle: "Bundle"
};

export default function AIStudioHubPage() {
  const { items, inventory, purchaseItem, hasItem } = useMarketplaceStore();
  const { totalCredits, usedCredits } = useBillingStore();
  const balance = totalCredits - usedCredits;

  const [activeTab, setActiveTab] = useState<"discover" | HubItemType | "inventory">("discover");
  const [search, setSearch] = useState("");

  const handlePurchase = (item: HubItem) => {
    // Na vida real, abriria um Dialog de confirmação
    if (confirm(`Deseja investir ${item.price.toLocaleString()} créditos em '${item.title}'?`)) {
      purchaseItem(item.id);
    }
  };

  const filteredItems = items.filter(item => {
    const matchSearch = item.title.toLowerCase().includes(search.toLowerCase()) || 
                        item.tags.some(t => t.includes(search.toLowerCase()));
    
    if (activeTab === "inventory") {
      return hasItem(item.id) && matchSearch;
    }
    
    if (activeTab === "discover") {
      // Se não for inventory, no discover mostra tudo
      return matchSearch;
    }
    
    return item.type === activeTab && matchSearch;
  });

  return (
    <div className="flex flex-col h-full bg-muted/10 -m-4 md:-m-6 p-4 md:p-6 overflow-hidden">
      
      {/* Hero Header */}
      <div className="bg-card border rounded-2xl p-8 mb-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm shrink-0 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        
        <div className="z-10">
          <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
            <Sparkles className="size-8 text-primary" />
            AI Studio Hub
          </h1>
          <p className="text-muted-foreground max-w-xl">
            Descubra, adquira e instale milhares de Templates, AI Packs e Presets criados pela comunidade e parceiros para escalar sua produção.
          </p>
        </div>
        
        <div className="bg-background border rounded-xl p-4 flex items-center gap-4 min-w-[240px] z-10 shadow-sm">
          <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <ShoppingBag className="size-6 text-primary" />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Seu Saldo</p>
            <p className="text-2xl font-bold font-mono text-primary">{balance.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Navegação & Busca */}
      <div className="flex flex-col md:flex-row gap-4 mb-6 shrink-0">
        <div className="flex overflow-x-auto gap-2 pb-2 md:pb-0 no-scrollbar">
          {(["discover", "aipack", "template", "preset", "bundle", "inventory"] as const).map((tab) => (
            <Button
              key={tab}
              variant={activeTab === tab ? "default" : "outline"}
              className={cn("rounded-full", activeTab === tab ? "shadow-md" : "bg-card")}
              onClick={() => setActiveTab(tab)}
            >
              {tab === "discover" && "Descobrir"}
              {tab === "inventory" && "Meus Recursos"}
              {tab !== "discover" && tab !== "inventory" && TYPE_LABELS[tab as HubItemType] + "s"}
            </Button>
          ))}
        </div>

        <div className="relative ml-auto w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por tags ou título..." 
            className="pl-9 rounded-full bg-card"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Vitrine (Grid) */}
      <div className="flex-1 overflow-y-auto pb-8">
        {filteredItems.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
            <Filter className="size-12 mb-4 opacity-20" />
            <h3 className="text-lg font-medium">Nenhum recurso encontrado</h3>
            <p className="text-sm">Tente ajustar seus filtros ou busca.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map(item => {
              const owned = hasItem(item.id);
              
              return (
                <Card key={item.id} className="overflow-hidden flex flex-col group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-muted/60">
                  <div className="relative h-48 overflow-hidden bg-muted">
                    <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute top-3 left-3">
                      <Badge variant="secondary" className="bg-background/90 backdrop-blur font-semibold shadow-sm text-[10px] uppercase">
                        {TYPE_LABELS[item.type]}
                      </Badge>
                    </div>
                    {owned && (
                      <div className="absolute inset-0 bg-primary/20 backdrop-blur-[2px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Badge className="bg-primary text-primary-foreground gap-1 py-1.5 px-3">
                          <Check className="size-4" /> Adquirido
                        </Badge>
                      </div>
                    )}
                  </div>
                  
                  <CardContent className="p-5 flex-1 flex flex-col">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-semibold text-base leading-tight line-clamp-2" title={item.title}>
                        {item.title}
                      </h3>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-4">
                      {item.description}
                    </p>
                    
                    <div className="mt-auto flex items-center justify-between text-xs text-muted-foreground font-medium">
                      <span className="flex items-center gap-1.5"><Star className="size-3.5 fill-yellow-500 text-yellow-500" /> {item.rating}</span>
                      <span className="flex items-center gap-1.5"><Download className="size-3.5" /> {item.sales.toLocaleString()}</span>
                      <span>By <span className="text-foreground">{item.creator}</span></span>
                    </div>
                  </CardContent>
                  
                  <CardFooter className="p-0 border-t bg-muted/10">
                    {owned ? (
                      <Button variant="ghost" className="w-full h-12 rounded-none text-muted-foreground font-medium" disabled>
                        Disponível no Studio
                      </Button>
                    ) : (
                      <Button 
                        variant="default" 
                        className="w-full h-12 rounded-none gap-2 font-bold"
                        onClick={() => handlePurchase(item)}
                      >
                        Adquirir por {item.price.toLocaleString()} Cr
                        <ChevronRight className="size-4 opacity-50" />
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              )
            })}
          </div>
        )}
      </div>
      
    </div>
  )
}
