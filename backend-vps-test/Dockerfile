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

# Pré-carrega o BiRefNet oficial (PyTorch) no build, não o ONNX do rembg
RUN echo "from transformers import AutoModelForImageSegmentation" > /tmp/preload_model.py && \
    echo "AutoModelForImageSegmentation.from_pretrained('ZhengPeng7/BiRefNet_lite', trust_remote_code=True)" >> /tmp/preload_model.py && \
    python /tmp/preload_model.py && rm /tmp/preload_model.py

# Pré-carrega CLIP
RUN python -c "from transformers import CLIPModel, CLIPProcessor; CLIPModel.from_pretrained('openai/clip-vit-base-patch32'); CLIPProcessor.from_pretrained('openai/clip-vit-base-patch32')"

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
