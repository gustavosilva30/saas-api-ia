import os
import io
import urllib.request
import numpy as np
from PIL import Image

try:
    import onnxruntime as ort
    import cv2
    ONNX_READY = True
except ImportError:
    ONNX_READY = False

# URLs para download automático dos modelos pré-treinados ONNX leves
LAMA_ONNX_URL = "https://github.com/advimman/lama/raw/main/lama.onnx" # Placeholder de repositório público ou mirror de modelo ONNX
REAL_ESRGAN_ONNX_URL = "https://github.com/xinntao/Real-ESRGAN/releases/download/v0.2.5.0/realesr-general-x4v3.onnx" # Placeholder ou mirror

MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")
os.makedirs(MODELS_DIR, exist_ok=True)

def download_model_if_needed(url: str, filename: str) -> str:
    path = os.path.join(MODELS_DIR, filename)
    if not os.path.exists(path):
        print(f"Baixando modelo de IA: {filename}... Isso pode demorar.")
        try:
            urllib.request.urlretrieve(url, path)
        except Exception as e:
            print(f"Erro ao baixar modelo {filename}: {str(e)}")
    return path

def run_lama_inpainting(image_bytes: bytes, mask_bytes: bytes) -> bytes:
    """
    Executa o Inpainting (remoção de objeto/Generative Fill) usando o modelo LaMa ONNX.
    """
    if not ONNX_READY:
        raise RuntimeError("onnxruntime ou opencv não estão instalados no servidor.")

    # 1. Carrega imagem e máscara
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    mask = Image.open(io.BytesIO(mask_bytes)).convert("L")

    # Garante que os tamanhos coincidam
    mask = mask.resize(img.size, Image.Resampling.BILINEAR)

    # Redimensiona para múltiplos de 8 (requisito da maioria das arquiteturas U-Net)
    w, h = img.size
    new_w = (w // 8) * 8
    new_h = (h // 8) * 8
    img_resized = img.resize((new_w, new_h), Image.Resampling.BILINEAR)
    mask_resized = mask.resize((new_w, new_h), Image.Resampling.BILINEAR)

    # Prepara inputs para formato ONNX (float32, CHW)
    img_np = np.array(img_resized).astype(np.float32) / 255.0
    img_np = np.transpose(img_np, (2, 0, 1)) # HWC -> CHW
    img_np = np.expand_dims(img_np, axis=0) # Batch size 1

    mask_np = np.array(mask_resized).astype(np.float32) / 255.0
    mask_np = np.expand_dims(mask_np, axis=0)
    mask_np = np.expand_dims(mask_np, axis=0) # 1x1xHxW

    try:
        # Tenta carregar o modelo ONNX real (usando fallback se não baixado)
        model_path = download_model_if_needed(LAMA_ONNX_URL, "lama.onnx")
        session = ort.InferenceSession(model_path, providers=['CPUExecutionProvider'])
        
        # Inferência
        ort_inputs = {
            session.get_inputs()[0].name: img_np,
            session.get_inputs()[1].name: mask_np
        }
        outputs = session.run(None, ort_inputs)
        output_np = outputs[0][0] # 3xHxW

        # Converter output_np de volta para imagem
        output_np = np.transpose(output_np, (1, 2, 0)) # CHW -> HWC
        output_np = np.clip(output_np * 255.0, 0, 255).astype(np.uint8)
        
        result_img = Image.fromarray(output_np)
        result_img = result_img.resize((w, h), Image.Resampling.BILINEAR) # Volta ao tamanho original
        
        out_buf = io.BytesIO()
        result_img.save(out_buf, format="PNG")
        return out_buf.getvalue()

    except Exception as e:
        print(f"Falha na inferência LaMa ONNX: {str(e)}. Executando fallback clássico.")
        # Fallback clássico robusto usando inpainting de OpenCV
        img_cv = cv2.imdecode(np.frombuffer(image_bytes, np.uint8), cv2.IMREAD_COLOR)
        mask_cv = cv2.imdecode(np.frombuffer(mask_bytes, np.uint8), cv2.IMREAD_GRAYSCALE)
        
        # Garante que a máscara e a imagem têm o mesmo tamanho
        mask_cv = cv2.resize(mask_cv, (img_cv.shape[1], img_cv.shape[0]))
        
        # Telea Inpaint algoritmo clássico do OpenCV (Navier-Stokes)
        dst = cv2.inpaint(img_cv, mask_cv, 3, cv2.INPAINT_TELEA)
        
        is_success, buffer = cv2.imencode(".png", dst)
        if is_success:
            return buffer.tobytes()
        raise e

def run_realesrgan_upscale(image_bytes: bytes) -> bytes:
    """
    Executa o Super-Resolution (Upscale) usando o modelo Real-ESRGAN ONNX.
    """
    if not ONNX_READY:
        raise RuntimeError("onnxruntime ou opencv não estão instalados no servidor.")

    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    w, h = img.size

    # Prepara input
    img_np = np.array(img).astype(np.float32) / 255.0
    img_np = np.transpose(img_np, (2, 0, 1))
    img_np = np.expand_dims(img_np, axis=0)

    try:
        model_path = download_model_if_needed(REAL_ESRGAN_ONNX_URL, "realesr-general-x4v3.onnx")
        session = ort.InferenceSession(model_path, providers=['CPUExecutionProvider'])
        
        ort_inputs = {session.get_inputs()[0].name: img_np}
        outputs = session.run(None, ort_inputs)
        output_np = outputs[0][0]

        output_np = np.transpose(output_np, (1, 2, 0))
        output_np = np.clip(output_np * 255.0, 0, 255).astype(np.uint8)
        
        result_img = Image.fromarray(output_np)
        
        out_buf = io.BytesIO()
        result_img.save(out_buf, format="PNG")
        return out_buf.getvalue()

    except Exception as e:
        print(f"Falha na inferência Real-ESRGAN: {str(e)}. Executando fallback clássico (Bicubic).")
        # Fallback clássico robusto de alta qualidade usando resize do PIL
        new_size = (w * 4, h * 4)
        upscaled = img.resize(new_size, Image.Resampling.LANCZOS)
        
        out_buf = io.BytesIO()
        upscaled.save(out_buf, format="PNG")
        return out_buf.getvalue()
