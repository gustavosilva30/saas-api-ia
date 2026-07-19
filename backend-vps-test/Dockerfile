FROM python:3.10-slim

WORKDIR /app

# Instalar dependências necessárias para processamento de imagem
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

ENV MALLOC_ARENA_MAX=2
ENV TORCH_NUM_THREADS=2
ENV HF_HOME=/root/.cache/huggingface

# Não é mais necessário pré-carregar modelos localmente, atuando como proxy

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
