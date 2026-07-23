/**
 * DocumentModels.ts
 * 
 * Define o modelo central abstrato de um Projeto (Document) no AI Studio Enterprise.
 * O Canvas não é o projeto; o projeto é esta estrutura de dados independente 
 * que pode ser renderizada por qualquer motor gráfico (Fabric, Pixi, etc).
 */

export interface StudioVariable {
  id: string;
  name: string;      // ex: "price"
  value: string;     // ex: "R$ 99,00"
  type: 'text' | 'image' | 'color' | 'number';
}

export interface StudioStyle {
  id: string;
  name: string;
  type: 'typography' | 'shadow' | 'gradient' | 'glass' | 'border' | 'neon' | 'metal';
  properties: Record<string, any>; // ex: { fontFamily: 'Inter', fontSize: 24, fill: '#fff' }
}

export interface StudioAsset {
  id: string;
  type: 'image' | 'svg' | 'video' | 'audio' | 'lottie';
  url: string;
  thumbnailUrl?: string;
  name: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface StudioPermission {
  role: string;      // ex: "designer", "viewer"
  canMove: boolean;
  canEdit: boolean;
  canExport: boolean;
  canDelete: boolean;
  canPublish: boolean;
}

export interface StudioPage {
  id: string;
  name: string;
  width: number;
  height: number;
  layers: any[]; // Camadas/Objetos JSON que o Adapter vai renderizar
  backgroundColor?: string;
  timeline?: any; // Dados da timeline de motion se a página for animada
}

export interface StudioDocument {
  schemaVersion: string; // ex: "v2.0.0"
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  
  pages: StudioPage[];
  assets: StudioAsset[];
  styles: StudioStyle[];
  variables: StudioVariable[];
  
  metadata: {
    authorId?: string;
    templateId?: string;
    brandKitId?: string;
    tags?: string[];
    [key: string]: any;
  };
  
  permissions?: StudioPermission[];
}
