# AI Studio - Princípios Invioláveis de Arquitetura

Os seguintes princípios NUNCA poderão ser violados durante a evolução, manutenção e codificação do projeto AI Studio:

1. **Desacoplamento do Core:** O Core nunca conhecerá Plugins.
2. **Isolamento de Plugins:** Plugins nunca conversarão diretamente entre si.
3. **Comunicação Baseada em Eventos:** Toda comunicação ocorrerá exclusivamente pelo Event Bus.
4. **Governança de IA:** Toda IA será acessada exclusivamente pelo módulo AI Provider Manager.
5. **Abstração de Armazenamento:** Nenhum módulo poderá acessar o Storage diretamente. Deve-se sempre utilizar a abstração `IStorageProvider`.
6. **Abstração Gráfica:** Nenhum componente React poderá manipular o Fabric (ou qualquer motor gráfico) diretamente. Toda interação ocorrerá estritamente por meio do Render Engine.
7. **Processamento Assíncrono:** Toda operação pesada (IA, manipulação de imagem, exportação) deverá virar um Job no Job System.
8. **Modularidade:** Toda funcionalidade nova deverá ser implementada como um Plugin independente sempre que possível.
9. **Segurança SaaS (Multi-Tenant):** Todo recurso, chamada de banco de dados ou estado em memória deverá respeitar obrigatoriamente o isolamento Multi-Tenant.
10. **Compatibilidade de Histórico:** Toda alteração de estado deverá manter compatibilidade absoluta com o sistema de Versionamento e com a arquitetura de Comandos (Command System).
