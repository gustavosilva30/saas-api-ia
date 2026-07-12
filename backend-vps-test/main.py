from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import io
from rembg import remove
from PIL import Image

app = FastAPI(
    title="API de Remoção de Fundo de Imagem",
    description="Microserviço de IA para remover fundo de imagens e retornar em formato PNG transparente.",
    version="1.0.0"
)

# Permitir requisições do frontend Next.js ou de qualquer origem (SaaS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "online", "message": "API de Remoção de Fundo funcionando com sucesso."}

@app.post("/remove-bg")
async def remove_background(file: UploadFile = File(...)):
    # Validação do tipo de arquivo
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="O arquivo enviado precisa ser uma imagem válida.")
    
    try:
        # Ler imagem enviada
        input_image_bytes = await file.read()
        
        # Processar a remoção de fundo com rembg
        output_image_bytes = remove(input_image_bytes)
        
        # Retornar como streaming de imagem PNG
        return StreamingResponse(io.BytesIO(output_image_bytes), media_type="image/png")
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao processar imagem: {str(e)}")
