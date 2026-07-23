import { useEffect, useState } from 'react';
import { useDocumentStore } from '@/store/useDocumentStore';
import { globalHistoryEngine } from '@/lib/studio/engines/HistoryEngine';

export function useSessionRecovery(defaultDocumentId: string) {
  const [isRecovered, setIsRecovered] = useState(false);
  const setDocument = useDocumentStore(state => state.setDocument);

  useEffect(() => {
    // Tenta restaurar do AutoSave local primeiro
    const recoveredDoc = globalHistoryEngine.restoreLatest(defaultDocumentId);
    
    if (recoveredDoc) {
      console.log('Sessão recuperada com sucesso do AutoSave local.');
      setDocument(recoveredDoc);
    } else {
      console.log('Nenhum AutoSave encontrado, iniciando documento limpo ou do backend.');
      // O backend cuidaria do fallback aqui
    }
    
    setIsRecovered(true);
  }, [defaultDocumentId, setDocument]);

  return { isRecovered };
}
