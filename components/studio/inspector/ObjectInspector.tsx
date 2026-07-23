import React from "react"
import { useSelectionStore } from "@/store/useSelectionStore"
import { useStudioStore } from "@/store/useStudioStore"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, Tag, Hash, Box, User, Clock } from "lucide-react"

export function ObjectInspector() {
  const { selectedIds } = useSelectionStore();
  const getObjectProperties = useStudioStore(state => state.getObjectProperties);
  
  if (selectedIds.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-muted-foreground p-4 text-center">
        <Box className="h-8 w-8 mb-2 opacity-20" />
        <p className="text-sm">Nenhum objeto selecionado para inspeção.</p>
      </div>
    );
  }

  if (selectedIds.length > 1) {
    return (
      <div className="p-4 flex flex-col gap-2 text-sm text-muted-foreground">
        <AlertCircle className="h-5 w-5 mb-1" />
        <p>Múltiplos objetos selecionados ({selectedIds.length}).</p>
        <p>A inspeção avançada de metadados funciona em apenas um objeto por vez.</p>
      </div>
    );
  }

  const objectId = selectedIds[0];
  const props = getObjectProperties(objectId);
  
  if (!props) return null;

  // Em uma implementação real, esses metadados virão do DocumentStore / Object Metadata
  const metadata = {
    id: objectId,
    type: props.type || 'Object',
    name: props.name || 'Sem nome',
    createdBy: 'Usuário Local',
    createdAt: new Date().toLocaleDateString(),
    plugin: 'Core',
    tags: ['design', 'v1']
  };

  return (
    <div className="flex flex-col gap-4 text-sm p-4">
      
      <div className="space-y-3">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground flex items-center gap-1"><Hash className="h-3 w-3"/> ID do Objeto</Label>
          <code className="bg-muted px-2 py-1 rounded text-xs font-mono break-all">{metadata.id}</code>
        </div>
        
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground flex items-center gap-1"><Box className="h-3 w-3"/> Tipo e Origem</Label>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{metadata.type}</Badge>
            <Badge variant="secondary">Plugin: {metadata.plugin}</Badge>
          </div>
        </div>
      </div>

      <Separator />

      <div className="space-y-3">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Nome da Camada (Layer Name)</Label>
          <Input 
            className="h-8 text-sm" 
            defaultValue={metadata.name} 
            placeholder="Nome para identificar na lista..."
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground flex items-center gap-1"><Tag className="h-3 w-3"/> Tags (Busca & Marketplace)</Label>
          <Input 
            className="h-8 text-sm" 
            defaultValue={metadata.tags.join(', ')} 
            placeholder="tag1, tag2..."
          />
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
        <div className="flex flex-col gap-1 border p-2 rounded-md bg-muted/30">
          <span className="flex items-center gap-1 font-semibold"><User className="h-3 w-3"/> Autor</span>
          <span className="truncate">{metadata.createdBy}</span>
        </div>
        <div className="flex flex-col gap-1 border p-2 rounded-md bg-muted/30">
          <span className="flex items-center gap-1 font-semibold"><Clock className="h-3 w-3"/> Criado em</span>
          <span>{metadata.createdAt}</span>
        </div>
      </div>
      
    </div>
  );
}
