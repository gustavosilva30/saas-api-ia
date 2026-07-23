import { useDocumentStore } from '@/store/useDocumentStore';
import { StudioVariable } from '../core/models/DocumentModels';

export class VariablesEngine {
  
  /**
   * Pega um texto bruto contendo váriaveis como "Olá {{cliente}}"
   * e retorna o texto compilado com os valores atuais do documento.
   */
  public compileText(rawText: string): string {
    if (!rawText || !rawText.includes('{{')) return rawText;

    const state = useDocumentStore.getState();
    const variables = state.document?.variables || [];
    
    // Cria um mapa rápido de lookup
    const varMap = new Map<string, string>();
    variables.forEach(v => varMap.set(v.name, v.value));

    // Regex para achar padrões {{nome_da_variavel}}
    const regex = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;
    
    return rawText.replace(regex, (match, varName) => {
      if (varMap.has(varName)) {
        return varMap.get(varName)!;
      }
      return match; // Mantém a string original se não encontrar a variável
    });
  }

  /**
   * Injeta os valores atuais do banco de dados/API na árvore do documento
   * Muito utilizado para geração de imagens em massa (Bulk Creation).
   */
  public applyDataset(dataset: Record<string, string>) {
    const state = useDocumentStore.getState();
    
    // Cria uma cópia das variáveis com os novos valores
    const updatedVariables = state.document?.variables?.map(v => {
      if (dataset[v.name] !== undefined) {
        return { ...v, value: dataset[v.name] };
      }
      return v;
    }) || [];

    // Atualiza o documento e força re-render (através do zustand)
    if (state.document) {
      state.updateDocument({
        ...state.document,
        variables: updatedVariables
      });
    }
  }

  /**
   * Extrai do texto todas as variáveis não declaradas no documento
   * para que a UI sugira a criação automática.
   */
  public extractUndeclaredVariables(rawText: string): string[] {
    if (!rawText || !rawText.includes('{{')) return [];

    const state = useDocumentStore.getState();
    const declaredNames = new Set(state.document?.variables?.map(v => v.name) || []);
    
    const regex = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;
    const undeclared = new Set<string>();
    
    let match;
    while ((match = regex.exec(rawText)) !== null) {
      const varName = match[1];
      if (!declaredNames.has(varName)) {
        undeclared.add(varName);
      }
    }
    
    return Array.from(undeclared);
  }
}

export const globalVariablesEngine = new VariablesEngine();
