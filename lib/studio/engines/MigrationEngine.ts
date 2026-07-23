import { StudioDocument } from '../core/models/DocumentModels';

const CURRENT_SCHEMA_VERSION = "v2.0.0";

export class MigrationEngine {
  /**
   * Recebe um JSON (potencialmente de versão legada como a v1 do editor original)
   * e normaliza a árvore de dados para garantir que tudo bata com a StudioDocument v2.
   */
  public migrateToCurrentSchema(rawJson: any): StudioDocument {
    if (!rawJson) {
      throw new Error("Cannot migrate empty document");
    }

    // Se já estiver na versão atual, apenas retorna (ou valida com Zod em um caso real)
    if (rawJson.schemaVersion === CURRENT_SCHEMA_VERSION) {
      return rawJson as StudioDocument;
    }

    console.log(`[MigrationEngine] Migrando documento da versão ${rawJson.schemaVersion || 'desconhecida'} para ${CURRENT_SCHEMA_VERSION}`);

    // Cria a casca básica V2
    const doc: StudioDocument = {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      id: rawJson.id || `doc-${Date.now()}`,
      name: rawJson.name || "Projeto Legado",
      createdAt: rawJson.createdAt || Date.now(),
      updatedAt: Date.now(),
      pages: [],
      assets: [],
      styles: [],
      variables: [],
      metadata: rawJson.metadata || {}
    };

    // Caso 1: O JSON legado era simplesmente o array de objetos do Fabric (o que tínhamos na V1)
    if (rawJson.objects && Array.isArray(rawJson.objects)) {
      doc.pages.push({
        id: 'page-1',
        name: 'Page 1',
        width: rawJson.width || 800,
        height: rawJson.height || 600,
        layers: rawJson.objects.map(this.migrateLayer)
      });
    } 
    // Caso 2: Já existia pages mas com esquema antigo
    else if (rawJson.pages && Array.isArray(rawJson.pages)) {
      doc.pages = rawJson.pages.map((p: any) => ({
        id: p.id || `page-${Date.now()}`,
        name: p.name || 'Page',
        width: p.width || 800,
        height: p.height || 600,
        layers: Array.isArray(p.layers) ? p.layers.map(this.migrateLayer) : []
      }));
    } else {
      // Cria uma página em branco caso não consiga parsear
      doc.pages.push({
        id: 'page-1',
        name: 'Page 1',
        width: 800,
        height: 600,
        layers: []
      });
    }

    return doc;
  }

  /**
   * Garante que toda layer possua os novos UUIDs, type strict, e campos padrões
   */
  private migrateLayer(legacyLayer: any): any {
    const layer = { ...legacyLayer };
    
    if (!layer.id) {
      layer.id = `layer-${Math.random().toString(36).substr(2, 9)}`;
    }
    
    // Na v1, o Fabric não exigia custom `name`. Na v2 (Enterprise), exigimos para UI das Layers
    if (!layer.name) {
      layer.name = layer.type ? `${layer.type.charAt(0).toUpperCase() + layer.type.slice(1)}` : 'Objeto';
    }

    // Se for texto legado sem fonte declarada
    if (layer.type === 'i-text' || layer.type === 'text' || layer.type === 'textbox') {
      if (!layer.fontFamily) layer.fontFamily = 'Inter, sans-serif';
    }

    return layer;
  }
}

export const globalMigrationEngine = new MigrationEngine();
