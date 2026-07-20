export type AssetCategory = 
  | "all"
  | "uploads"
  | "products"
  | "backgrounds"
  | "textures"
  | "mockups"
  | "logos"
  | "templates"
  | "presets"
  | "fonts"
  | "icons"
  | "shapes"
  | "stickers"
  | "gradients"
  | "motion_packs"
  | "videos"
  | "audios"
  | "ai_generated"
  | "favorites"
  | "recents"
  | "shared";

export type AssetStatus = "active" | "archived" | "deleted";
export type AssetPermission = "public" | "tenant" | "private" | "shared";
export type AssetType = "image" | "video" | "audio" | "font" | "json" | "zip" | "svg";

export interface AssetItem {
  id: string;
  url: string;
  category: AssetCategory;
  categories: AssetCategory[]; // Support multiple categories
  name: string;
  type: AssetType;
  
  // Metadata
  thumbnailUrl?: string;
  tags?: string[];
  color?: string;
  dimensions?: { width: number; height: number };
  sizeBytes?: number;
  format?: string;
  hasTransparentBackground?: boolean;
  
  // Enterprise features
  tenantId?: string;
  authorId?: string;
  createdAt: string;
  updatedAt: string;
  lastUsedAt?: string;
  usageCount: number;
  projectIds?: string[];
  
  status: AssetStatus;
  permission: AssetPermission;
  
  // AI specific
  aiGenerated?: boolean;
  aiPrompt?: string;
}
