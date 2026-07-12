from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import io
from rembg import remove, new_session
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

# Cache de sessões para não recarregar os modelos a cada requisição
sessions = {}

def get_session(model_name: str):
    if model_name not in sessions:
        sessions[model_name] = new_session(model_name)
    return sessions[model_name]

@app.get("/")
def read_root():
    return {"status": "online", "message": "API de Remoção de Fundo funcionando com sucesso."}

@app.post("/remove-bg")
async def remove_background(file: UploadFile = File(...), tier: str = Form("basic")):
    # Validação do tipo de arquivo
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="O arquivo enviado precisa ser uma imagem válida.")
    
    try:
        # Ler imagem enviada
        input_image_bytes = await file.read()
        
        # Configurações de acordo com o tier escolhido
        alpha_matting = False
        model_name = "u2netp" # Padrão: mais leve e rápido
        
        if tier == "pro":
            model_name = "u2net"
            alpha_matting = True
        elif tier == "premium":
            model_name = "isnet-general-use"
            alpha_matting = True
            
        session = get_session(model_name)
        
        # Processar a remoção de fundo com rembg
        if alpha_matting:
            output_image_bytes = remove(
                input_image_bytes,
                session=session,
                alpha_matting=True,
                alpha_matting_foreground_threshold=240,
                alpha_matting_background_threshold=10,
                alpha_matting_erode_size=10
            )
        else:
            output_image_bytes = remove(
                input_image_bytes, 
                session=session
            )
        
        # Retornar como streaming de imagem PNG
        return StreamingResponse(io.BytesIO(output_image_bytes), media_type="image/png")
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao processar imagem: {str(e)}")
