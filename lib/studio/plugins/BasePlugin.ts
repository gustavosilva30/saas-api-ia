import React from "react"
import { LucideIcon } from "lucide-react"

export interface StudioPlugin {
  /**
   * Identificador único do plugin (ex: "shadow", "background")
   */
  id: string;
  
  /**
   * Nome legível do plugin
   */
  name: string;
  
  /**
   * Ícone a ser exibido na Sidebar
   */
  icon: LucideIcon;
  
  /**
   * Componente que será renderizado no painel esquerdo quando a ferramenta estiver ativa
   */
  SidebarComponent?: React.FC;

  /**
   * Componente contextual (painel direito) exibido quando um objeto associado ao plugin estiver selecionado
   */
  ContextComponent?: React.FC;
  
  /**
   * Hook opcional executado quando o plugin for ativado pelo usuário
   */
  onActivate?: () => void;
  
  /**
   * Hook opcional executado quando o plugin for desativado
   */
  onDeactivate?: () => void;
}
