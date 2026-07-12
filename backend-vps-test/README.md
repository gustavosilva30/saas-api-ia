# Guia de Deploy - Serviço de Teste (API Remoção de Fundo)

Este diretório contém os arquivos necessários para implantar o serviço de testes da API de remoção de fundo na sua VPS de forma independente.

## Como Implantar

1. **Copiar os arquivos para a VPS**:
   Envie os seguintes arquivos para uma pasta na sua VPS (por exemplo, `~/api-ia-fundo-test`):
   - `Dockerfile` (fornecido aqui)
   - `docker-compose.yml` (fornecido aqui)
   - O seu código `main.py`
   - O seu arquivo `requirements.txt`

2. **Iniciar o Container**:
   Conecte via SSH à sua VPS, navegue até a pasta onde colocou os arquivos e execute:
   ```bash
   docker compose up --build -d
   ```

3. **Verificar**:
   - Para ver se o container está rodando:
     ```bash
     docker ps
     ```
   - Para verificar os logs de inicialização e o download do modelo:
     ```bash
     docker logs -f api-ia-fundo-test
     ```

4. **Testar a API**:
   Acesse a documentação Swagger interativa no seu navegador para testar requisições:
   `http://<IP-DA-VPS>:8001/docs`
