# AI Studio - Documentação do Sistema

Este documento explica como o sistema do AI Studio está estruturado e as regras de arquitetura que devem ser seguidas para qualquer modificação ou adição de novas funcionalidades.

## Princípios de Arquitetura (Invioláveis)

A arquitetura do AI Studio foi desenhada para ser altamente escalável, modular e pronta para um ambiente SaaS (Multi-Tenant). Os seguintes princípios norteiam o desenvolvimento:

1. **Desacoplamento do Core:** O Core (Engine) nunca conhecerá os Plugins. Ele fornece as interfaces e a fundação, mas não interage com lógica específica de plugins.
2. **Isolamento de Plugins:** Os Plugins nunca conversam diretamente entre si. Eles são completamente independentes.
3. **Comunicação Baseada em Eventos:** Toda a comunicação entre componentes (UI, Plugins, Engine) ocorre EXCLUSIVAMENTE pelo **Event Bus** (barramento de eventos).
4. **Governança de IA:** Toda chamada para inteligência artificial é acessada exclusivamente pelo módulo **AI Provider Manager** (`lib/studio/ai`). Nenhuma chamada direta à API (como OpenAI ou Replicate) deve ser feita nos componentes.
5. **Abstração de Armazenamento:** Nenhum módulo acessa o Storage diretamente. Utiliza-se a abstração `IStorageProvider`.
6. **Abstração Gráfica:** Nenhum componente React manipula a biblioteca gráfica (como Fabric.js) diretamente. A UI dispara eventos (Commands) ou lê estados globais. Toda a interação gráfica ocorre através do **Render Engine** (`lib/studio/engine`).
7. **Processamento Assíncrono:** Operações pesadas (IA, manipulação de imagens grandes, exportação de vídeo/imagem) devem ser transformadas em um **Job** no Job System.
8. **Modularidade:** Toda nova funcionalidade deve ser, preferencialmente, um **Plugin** independente.
9. **Segurança SaaS (Multi-Tenant):** Todos os recursos, acesso a banco de dados ou estado em memória devem respeitar o isolamento Multi-Tenant.
10. **Compatibilidade de Histórico:** Alterações de estado que afetam o canvas/projeto devem passar pelo sistema de **Commands** (`lib/studio/commands`) para garantir compatibilidade com Desfazer/Refazer (Undo/Redo).

## Por que as funções parecem "não corretas" ou não funcionam no momento?

Se você está clicando em botões na interface e a ação não reflete no Canvas, provavelmente é devido à regra número 6 e 3.

**O fluxo correto de uma ação na UI:**
1. O usuário clica em um botão na UI (ex: `components/studio/plugins/RemoveBgPlugin.tsx`).
2. O componente **não** tenta alterar o canvas diretamente.
3. Em vez disso, ele despacha um evento no **Event Bus** ou invoca um **Command**.
4. O **Render Engine** ou o Plugin correspondente (na camada lógica) escuta esse evento/comando, processa (gerando um Job, se necessário) e então interage com a camada gráfica (Adapters).
5. O estado é atualizado, o que reflete na UI de volta.

Muitas funções podem estar apenas na camada visual (React Components) aguardando a integração via **Event Bus** e **Commands** para se comunicarem com a Engine gráfica de forma correta e assíncrona.

## Estrutura de Diretórios (`lib/studio`)

- `adapters/`: Conectores para bibliotecas de terceiros (ex: Fabric.js). O único lugar que conversa com as bibliotecas diretamente.
- `ai/`: Gerenciador de provedores de IA (AI Provider Manager).
- `commands/`: Sistema de comandos para ações do usuário, permitindo registro de histórico (Undo/Redo).
- `engine/`: O núcleo de renderização e estado do canvas. Não conhece o React, apenas despacha e escuta eventos.
- `events/`: O Barramento de Eventos (Event Bus) por onde transitam as mensagens.
- `plugins/`: A lógica de cada ferramenta (Recorte, Sombra, Ajustes, etc).

## Como criar ou corrigir uma função no AI Studio

1. **Localize o componente UI:** (ex: `components/studio/plugins/...`)
2. **Crie ou utilize um Command / Evento:** Garanta que a UI apenas chame o Event Bus ou o Hook de estado.
3. **Implemente a Lógica no Plugin/Engine:** A camada `lib/studio/plugins/` recebe o evento, processa, e chama a Engine, que por sua vez chama o Adapter (Fabric.js).

Siga rigorosamente essas camadas para garantir que a aplicação continue robusta e testável.
