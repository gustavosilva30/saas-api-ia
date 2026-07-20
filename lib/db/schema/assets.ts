// Representação do Drizzle ORM Schema para o Assets Manager Enterprise
import { pgTable, text, timestamp, integer, boolean, jsonb, primaryKey } from 'drizzle-orm/pg-core';

export const assetCategories = pgTable('asset_categories', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull(),
  name: text('name').notNull(),
  parentId: text('parent_id'), // Para subcategorias
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const assets = pgTable('assets', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull(),
  authorId: text('author_id').notNull(), // Usuário que fez upload
  url: text('url').notNull(),
  thumbnailUrl: text('thumbnail_url'),
  name: text('name').notNull(),
  type: text('type').notNull(), // 'image', 'video', 'font', etc
  
  sizeBytes: integer('size_bytes'),
  format: text('format'),
  dimensions: jsonb('dimensions'), // { width, height }
  color: text('color'), // Cor predominante (extraída pela IA)
  hasTransparentBackground: boolean('has_transparent_background').default(false),
  
  status: text('status').default('active').notNull(), // active, archived, deleted
  permission: text('permission').default('tenant').notNull(), // public, tenant, private
  
  usageCount: integer('usage_count').default(0).notNull(),
  lastUsedAt: timestamp('last_used_at'),
  
  // AI Metadata
  aiGenerated: boolean('ai_generated').default(false),
  aiPrompt: text('ai_prompt'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const assetTags = pgTable('asset_tags', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull(),
  name: text('name').notNull(), // ex: "carro", "vermelho", "roda"
});

// Relacionamento N:N entre Asset e Tags
export const assetsToTags = pgTable('assets_to_tags', {
  assetId: text('asset_id').references(() => assets.id).notNull(),
  tagId: text('tag_id').references(() => assetTags.id).notNull(),
}, (t) => ({
  pk: primaryKey({ columns: [t.assetId, t.tagId] }),
}));

export const assetUsageLogs = pgTable('asset_usage_logs', {
  id: text('id').primaryKey(),
  assetId: text('asset_id').references(() => assets.id).notNull(),
  userId: text('user_id').notNull(),
  projectId: text('project_id'), // Em qual projeto do SaaS foi usado
  actionType: text('action_type').notNull(), // "added_to_canvas", "downloaded"
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
