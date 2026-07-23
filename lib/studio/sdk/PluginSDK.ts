import React from "react";
import { LucideIcon } from "lucide-react";

export interface PluginCapabilities {
  supportsImage?: boolean;
  supportsText?: boolean;
  supportsShape?: boolean;
  supportsMotion?: boolean;
  supportsTimeline?: boolean;
  supportsExport?: boolean;
  supportsAI?: boolean;
  supportsMarketplace?: boolean;
  supportsBrandKit?: boolean;
  supportsVector?: boolean;
}

export interface StudioPlugin {
  /** Identificador único do plugin (ex: "shadow", "background") */
  id: string;
  
  /** Nome legível do plugin */
  name: string;
  
  /** Ícone a ser exibido na Sidebar ou Toolbar */
  icon: LucideIcon;
  
  /** Categoria do plugin (Arquivo, Adicionar, Transformar, Estilo, Ferramentas) */
  category?: string;
  
  /** Capacidades anunciadas pelo plugin. Substitui IFs no core. */
  capabilities: PluginCapabilities;
  
  // ================= UI SDK =================
  
  /** Componente que será renderizado no painel esquerdo quando a ferramenta estiver ativa */
  SidebarComponent?: React.FC;

  /** Componente contextual (painel direito) exibido quando um objeto associado ao plugin estiver selecionado */
  ContextComponent?: React.FC;
  
  /** Componente para a barra superior de ferramentas rápidas */
  ToolbarComponent?: React.FC;

  // ================= Actions SDK =================

  /** Comandos rápidos ou ações de IA do plugin disponíveis no Command Palette (Ctrl+K) */
  aiActions?: Array<{
    actionId: string;
    label: string;
    execute: (context: any) => Promise<void>;
  }>;
  
  /** Teclas de atalho para ativar ferramentas do plugin */
  hotkeys?: Array<{
    keyCombo: string; // Ex: 'Ctrl+Shift+D'
    execute: () => void;
  }>;
  
  // ================= Lifecycle =================

  /** Hook executado quando o plugin é carregado pelo PluginManager no boot */
  onInstall?: () => void;

  /** Hook opcional executado quando o plugin for ativado pelo usuário */
  onActivate?: () => void;
  
  /** Hook opcional executado quando o plugin for desativado */
  onDeactivate?: () => void;
}
