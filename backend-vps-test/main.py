import os
import io
import jwt
import bcrypt
import psycopg2
from psycopg2 import pool
import requests
import secrets
import hashlib
import socket
import ipaddress
import hmac
import re
from psycopg2.extras import RealDictCursor
from datetime import datetime, timedelta
from pydantic import BaseModel, EmailStr, field_validator
from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Request, Depends, BackgroundTasks
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
import uuid
import base64
import json
import requests
import asyncio
import io
import torch
from transformers import CLIPProcessor, CLIPModel
from PIL import Image
from rembg import remove, new_session
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="Motion Studio & AI API",
    description="""
API Oficial de Inteligência Artificial para Remoção de Fundo, Análise Visual e Copywriting.

## Autenticação
As requisições devem ser autenticadas enviando um token no cabeçalho `Authorization: Bearer <SEU_TOKEN>`.
Para integrações externas, utilize a API Key gerada no painel (`sk_live_...`).

## Custos por Tier
- **Remoção Basic**: 1 crédito
- **Remoção Pro**: 3 créditos (Exige plano Pro/Premium)
- **Remoção Premium**: 5 créditos (Exige plano Premium)
- **Análise de Campanha (Visual)**: 2 créditos
- **Geração de Copy**: 1 crédito
    """,
    version="1.0.0"
)

# Servir imagens estáticas locais (Storage Fake)
os.makedirs("storage", exist_ok=True)
app.mount("/storage", StaticFiles(directory="storage"), name="storage")

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "")
origins_list = [o.strip() for o in ALLOWED_ORIGINS.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins_list if origins_list else ["http://localhost:3000", "https://editor.gsntech.com.br"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATABASE_URL = os.getenv("DATABASE_URL")
JWT_SECRET = os.getenv("JWT_SECRET")
JWT_ALGORITHM = "HS256"
if not JWT_SECRET:
    raise RuntimeError("JWT_SECRET não configurado")

RESEND_API_KEY = os.getenv("RESEND_API_KEY")
VISION_MODEL_READY = os.getenv("VISION_MODEL_READY", "false").lower() == "true"
RESEND_FROM_EMAIL = os.getenv("EMAIL_FROM") or os.getenv("RESEND_FROM_EMAIL") or "onboarding@resend.dev"

# Database Connection Pool
db_pool = None

class DBConnectionWrapper:
    def __init__(self, conn):
        self.conn = conn
    def cursor(self, *args, **kwargs):
        return self.conn.cursor(*args, **kwargs)
    def commit(self):
        self.conn.commit()
    def rollback(self):
        self.conn.rollback()
    def close(self):
        global db_pool
        if db_pool:
            db_pool.putconn(self.conn)

def get_db_connection():
    if not db_pool:
        raise HTTPException(status_code=500, detail="Database pool not initialized")
    return DBConnectionWrapper(db_pool.getconn())

def send_confirmation_email(to_email: str, user_name: str, token: str):
    if not RESEND_API_KEY:
        print("Aviso: RESEND_API_KEY não configurada. E-mail de confirmação não enviado.")
        return
    
    url = "https://api.resend.com/emails"
    headers = {
        "Authorization": f"Bearer {RESEND_API_KEY}",
        "Content-Type": "application/json"
    }
    
    verification_link = f"https://saas-api-ia.gustavosilva.com.br/verify-email?token={token}"
    
    html_content = f"""
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;">
        <h2 style="color: #0f172a; margin-top: 0; font-size: 22px;">Confirme seu e-mail para ativar sua conta!</h2>
        <p style="color: #475569; font-size: 16px; line-height: 1.6;">Olá, <strong>{user_name}</strong>!</p>
        <p style="color: #475569; font-size: 16px; line-height: 1.6;">
            Obrigado por se cadastrar na nossa plataforma de Remoção de Fundo de Imagem IA. Para liberar seu acesso ao sistema, confirme seu endereço de e-mail clicando no botão abaixo:
        </p>
        <div style="margin: 30px 0; text-align: center;">
            <a href="{verification_link}" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
                Confirmar E-mail & Ativar Conta
            </a>
        </div>
    </div>
    """
    
    data = {
        "from": RESEND_FROM_EMAIL,
        "to": [to_email],
        "subject": "Confirme seu e-mail - Remoção de Fundo IA",
        "html": html_content
    }
    
    try:
        response = requests.post(url, json=data, headers=headers)
        if response.status_code in [200, 201]:
            print(f"E-mail de confirmação enviado com sucesso para {to_email}")
        else:
            print(f"Erro ao enviar e-mail via Resend: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"Erro de conexão ao enviar e-mail: {e}")

sessions = {}

def get_session(model_name: str):
    if model_name not in sessions:
        sessions[model_name] = new_session(model_name)
    return sessions[model_name]

@app.on_event("startup")
def startup_db_setup():
    global db_pool
    if not DATABASE_URL:
        print("DATABASE_URL não configurada. Pulando setup do banco.")
        return
    try:
        db_pool = psycopg2.pool.ThreadedConnectionPool(1, 20, DATABASE_URL)
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("""
            ALTER TABLE organizations ADD COLUMN IF NOT EXISTS credits_balance INT DEFAULT 50;
        """)

        cur.execute("""
            CREATE TABLE IF NOT EXISTS credit_transactions (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
                amount INT NOT NULL,
                reason VARCHAR(255) NOT NULL,
                job_id VARCHAR(255),
                balance_after INT NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        """)

        cur.execute("""
            CREATE TABLE IF NOT EXISTS jobs (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
                status VARCHAR(50) DEFAULT 'pending',
                job_type VARCHAR(50) DEFAULT 'bg-removal',
                tier VARCHAR(50) NOT NULL,
                result_url TEXT,
                result_data JSONB,
                error_message TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        """)

        cur.execute("""
            CREATE TABLE IF NOT EXISTS webhooks (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
                url TEXT NOT NULL,
                secret VARCHAR(255) NOT NULL,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        """)
        conn.commit()

        cur.execute("SELECT id FROM organizations WHERE name = 'GSN Tech' LIMIT 1;")
        org = cur.fetchone()
        if not org:
            cur.execute(
                "INSERT INTO organizations (name, plan, status) VALUES ('GSN Tech', 'premium', 'active') RETURNING id;"
            )
            org_id = cur.fetchone()[0]
            conn.commit()
        else:
            org_id = org[0]
            
        cur.execute("SELECT id FROM users WHERE email = 'gsntech.suporte@gmail.com' LIMIT 1;")
        user = cur.fetchone()
        if not user:
            password = os.getenv("SUPERADMIN_SEED_PASSWORD")
            
            if not password:
                password = secrets.token_urlsafe(20)
                print("================================================================")
                print("⚠ ATENÇÃO: A variável SUPERADMIN_SEED_PASSWORD não foi definida.")
                print(f"Uma senha segura foi gerada automaticamente: {password}")
                print("================================================================")
                
            hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            
            cur.execute(
                "INSERT INTO users (organization_id, name, email, password_hash, role, status) VALUES (%s, %s, %s, %s, %s, %s);",
                (org_id, "GSN Tech Support", "gsntech.suporte@gmail.com", hashed_password, "superadmin", "active")
            )
            conn.commit()
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Erro ao inicializar banco de dados / seeding: {e}")

@app.on_event("shutdown")
def shutdown_db():
    global db_pool
    if db_pool:
        db_pool.closeall()

security = HTTPBearer()

def get_current_org_id(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    if token.startswith("sk_live_"):
        key_hash = hashlib.sha256(token.encode('utf-8')).hexdigest()
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT organization_id, id FROM api_keys WHERE key_hash = %s LIMIT 1;", (key_hash,))
        res = cur.fetchone()
        if not res:
            cur.close()
            conn.close()
            raise HTTPException(status_code=401, detail="API Key inválida.")
        
        cur.execute("UPDATE api_keys SET last_used_at = CURRENT_TIMESTAMP WHERE id = %s;", (res[1],))
        conn.commit()
        cur.close()
        conn.close()
        return str(res[0])
    
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") == "verify_email":
            raise HTTPException(status_code=401, detail="Token inválido para esta operação.")
        return payload.get("org_id")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado.")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido.")

def get_current_role(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    if token.startswith("sk_live_"):
        return "api_key"
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload.get("role", "user")
    except:
        return "user"

def get_current_admin(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("role") != "superadmin":
            raise HTTPException(status_code=403, detail="Acesso negado (apenas superadmin).")
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado.")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido.")

@app.get("/admin/organizations", tags=["Admin"], summary="Listar Todas as Empresas")
def admin_list_organizations(admin_payload: dict = Depends(get_current_admin)):
    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("""
            SELECT o.id, o.name, o.plan, o.credits_balance as credits, o.status, 
                   0 as usage, COUNT(u.id) as users_count
            FROM organizations o
            LEFT JOIN users u ON o.id = u.organization_id
            GROUP BY o.id
            ORDER BY o.name ASC;
        """)
        orgs = cur.fetchall()
        
        # Transformar UUID para string pra não quebrar o JSON serializer
        for org in orgs:
            org['id'] = str(org['id'])
            if org['status'] == 'active':
                org['status'] = 'Ativo'
            if org['credits'] is None:
                org['credits'] = 0
            
        return orgs
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

class AddCreditsPayload(BaseModel):
    amount: int

@app.post("/admin/organizations/{org_id}/credits", tags=["Admin"], summary="Adicionar Créditos")
def admin_add_credits(org_id: str, payload: AddCreditsPayload, admin_payload: dict = Depends(get_current_admin)):
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT credits_balance FROM organizations WHERE id = %s FOR UPDATE;", (org_id,))
        org = cur.fetchone()
        if not org:
            raise HTTPException(status_code=404, detail="Empresa não encontrada.")
            
        new_balance = org[0] + payload.amount
        cur.execute("UPDATE organizations SET credits_balance = %s WHERE id = %s;", (new_balance, org_id))
        
        cur.execute(
            "INSERT INTO credit_transactions (organization_id, amount, reason, balance_after) VALUES (%s, %s, %s, %s);",
            (org_id, payload.amount, "Adição manual (SuperAdmin)", new_balance)
        )
        
        conn.commit()
        return {"message": "Créditos adicionados com sucesso!", "new_balance": new_balance}
    except HTTPException:
        conn.rollback()
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

class RegisterPayload(BaseModel):
    name: str
    email: EmailStr
    password: str
    company: str

    @field_validator('password')
    @classmethod
    def validate_password(cls, v):
        if len(v) < 12:
            raise ValueError('A senha deve ter no mínimo 12 caracteres.')
        if not re.search(r"[A-Z]", v):
            raise ValueError('A senha deve ter pelo menos uma letra maiúscula.')
        if not re.search(r"[a-z]", v):
            raise ValueError('A senha deve ter pelo menos uma letra minúscula.')
        if not re.search(r"[0-9]", v):
            raise ValueError('A senha deve ter pelo menos um número.')
        if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", v):
            raise ValueError('A senha deve ter pelo menos um caractere especial.')
        return v

class LoginPayload(BaseModel):
    email: EmailStr
    password: str

@app.post("/auth/register", tags=["Autenticação"], summary="Registrar nova organização")
@limiter.limit("3/minute")
def register_user(request: Request, payload: RegisterPayload):
    if not DATABASE_URL:
        raise HTTPException(status_code=500, detail="Banco de dados não configurado.")
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("SELECT id FROM users WHERE email = %s LIMIT 1;", (payload.email,))
        if cur.fetchone():
            cur.close()
            conn.close()
            raise HTTPException(status_code=400, detail="E-mail já cadastrado.")
            
        cur.execute(
            "INSERT INTO organizations (name, plan, status) VALUES (%s, 'basic', 'active') RETURNING id;",
            (payload.company,)
        )
        org_id = cur.fetchone()[0]
        
        hashed_password = bcrypt.hashpw(payload.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        cur.execute(
            "INSERT INTO users (organization_id, name, email, password_hash, role, status) VALUES (%s, %s, %s, %s, 'owner', 'pending') RETURNING id;",
            (org_id, payload.name, payload.email, hashed_password)
        )
        user_id = cur.fetchone()[0]
        
        conn.commit()
        cur.close()
        conn.close()
        
        verify_token = jwt.encode({
            "sub": str(user_id),
            "type": "verify_email",
            "exp": datetime.utcnow() + timedelta(hours=24)
        }, JWT_SECRET, algorithm=JWT_ALGORITHM)

        send_confirmation_email(payload.email, payload.name, verify_token)
        
        return {
            "message": "Cadastro realizado com sucesso! Verifique seu e-mail para ativar a conta.",
            "status": "pending"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro no cadastro: {str(e)}")

@app.post("/auth/login", tags=["Autenticação"], summary="Realizar Login")
@limiter.limit("5/minute")
def login_user(request: Request, payload: LoginPayload):
    if not DATABASE_URL:
        raise HTTPException(status_code=500, detail="Banco de dados não configurado.")
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        cur.execute(
            """
            SELECT u.id, u.name, u.email, u.password_hash, u.role, u.status, u.organization_id, o.name as company_name 
            FROM users u
            JOIN organizations o ON u.organization_id = o.id
            WHERE u.email = %s LIMIT 1;
            """,
            (payload.email,)
        )
        user = cur.fetchone()
        
        if not user:
            cur.close()
            conn.close()
            raise HTTPException(status_code=401, detail="E-mail ou senha incorretos.")
            
        if user['status'] == 'pending':
            cur.close()
            conn.close()
            raise HTTPException(status_code=403, detail="Por favor, confirme seu e-mail para ativar sua conta.")
            
        if not bcrypt.checkpw(payload.password.encode('utf-8'), user['password_hash'].encode('utf-8')):
            cur.close()
            conn.close()
            raise HTTPException(status_code=401, detail="E-mail ou senha incorretos.")
            
        cur.close()
        conn.close()
        
        token = jwt.encode({
            "sub": str(user['id']),
            "email": user['email'],
            "role": user['role'],
            "org_id": str(user['organization_id']),
            "exp": datetime.utcnow() + timedelta(days=7)
        }, JWT_SECRET, algorithm=JWT_ALGORITHM)
        
        return {
            "token": token,
            "user": {
                "name": user['name'],
                "email": user['email'],
                "role": user['role'],
                "company": user['company_name']
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro no login: {str(e)}")

class VerifyPayload(BaseModel):
    token: str

@app.post("/auth/verify-email")
def verify_email(payload: VerifyPayload):
    try:
        data = jwt.decode(payload.token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if data.get("type") != "verify_email":
            raise HTTPException(status_code=400, detail="Token inválido.")
        user_id = data.get("sub")
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("SELECT status FROM users WHERE id = %s LIMIT 1;", (user_id,))
        user = cur.fetchone()
        if not user:
            cur.close()
            conn.close()
            raise HTTPException(status_code=404, detail="Usuário não encontrado.")
            
        if user[0] == 'active':
            cur.close()
            conn.close()
            return {"message": "E-mail já verificado anteriormente!"}
            
        cur.execute("UPDATE users SET status = 'active' WHERE id = %s;", (user_id,))
        conn.commit()
        cur.close()
        conn.close()
        
        return {"message": "Conta ativada com sucesso!"}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=400, detail="O link de confirmação expirou.")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=400, detail="Link de confirmação inválido.")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao verificar e-mail: {str(e)}")

@app.get("/health")
def healthcheck():
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT 1;")
        cur.close()
        conn.close()
        return {"status": "ok", "database": "connected"}
    except Exception as e:
        return {"status": "error", "database": str(e)}

@app.get("/")
def read_root():
    return {"status": "online", "message": "API de Remoção de Fundo funcionando com sucesso."}

def dispatch_webhooks(org_id: str, tier: str):
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT url, secret FROM webhooks WHERE organization_id = %s AND is_active = TRUE;", (org_id,))
        hooks = cur.fetchall()
        cur.close()
        conn.close()
        
        import json
        payload = {"event": "image.processed", "status": "success", "tier": tier}
        payload_json = json.dumps(payload).encode('utf-8')
        
        for h in hooks:
            url = h[0]
            secret = h[1]
            signature = hmac.new(secret.encode('utf-8'), payload_json, hashlib.sha256).hexdigest()
            headers = {
                "Content-Type": "application/json",
                "X-Webhook-Signature": signature
            }
            try:
                requests.post(url, data=payload_json, headers=headers, timeout=5)
            except Exception:
                pass
    except Exception:
        pass

@app.post("/remove-bg", tags=["IA Síncrona"], summary="Remover Fundo (Uso Interno Dashboard)")
@limiter.limit("20/minute")
async def remove_background(
    request: Request,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...), 
    tier: str = Form("basic"), 
    org_id: str = Depends(get_current_org_id),
    role: str = Depends(get_current_role)
):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="O arquivo enviado precisa ser uma imagem válida.")
    
    input_image_bytes = await file.read()
    
    # Limite de Upload de 20MB
    if len(input_image_bytes) > 20 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="O arquivo excede o limite de 20MB.")
        
    # 1. Definir custo
    costs = {"basic": 1, "pro": 3, "premium": 5}
    cost = costs.get(tier, 1)
    
    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # 2. Verificar Saldo e Plano
        cur.execute("SELECT plan, credits_balance FROM organizations WHERE id = %s FOR UPDATE;", (org_id,))
        org_data = cur.fetchone()
        
        if not org_data:
            raise HTTPException(status_code=404, detail="Organização não encontrada.")
            
        plan = org_data['plan']
        balance = org_data['credits_balance']
        
        if tier == "pro" and plan not in ["pro", "premium"]:
            raise HTTPException(status_code=403, detail="O Tier Pro exige plano Pro ou Premium.")
        if tier == "premium" and plan != "premium":
            raise HTTPException(status_code=403, detail="O Tier Premium exige plano Premium.")
            
        if role != "superadmin":
            if balance < cost:
                raise HTTPException(status_code=402, detail="Saldo de créditos insuficiente.")
            
        # 3. Processar Imagem
        alpha_matting = False
        model_name = "u2netp"
        
        if tier == "pro":
            model_name = "u2net"
            alpha_matting = True
        elif tier == "premium":
            model_name = "isnet-general-use"
            alpha_matting = True
            
        session = get_session(model_name)
        
        if alpha_matting:
            output_image_bytes = await asyncio.to_thread(
                remove,
                input_image_bytes,
                session=session,
                alpha_matting=True,
                alpha_matting_foreground_threshold=240,
                alpha_matting_background_threshold=10,
                alpha_matting_erode_size=10
            )
        else:
            output_image_bytes = await asyncio.to_thread(
                remove, 
                input_image_bytes, 
                session=session
            )
        
        # 4. Debitar Saldo
        if role != "superadmin":
            new_balance = balance - cost
            cur.execute("UPDATE organizations SET credits_balance = %s WHERE id = %s;", (new_balance, org_id))
            
            cur.execute(
                "INSERT INTO credit_transactions (organization_id, amount, reason, balance_after) VALUES (%s, %s, %s, %s);",
                (org_id, -cost, f"remove-bg ({tier})", new_balance)
            )
        
        conn.commit()
        cur.close()
        
        background_tasks.add_task(dispatch_webhooks, org_id, tier)

        return StreamingResponse(io.BytesIO(output_image_bytes), media_type="image/png")
        
    except HTTPException:
        conn.rollback()
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Erro ao processar imagem: {str(e)}")
    finally:
        conn.close()

# --- AI Integration Helpers ---
clip_model = None
clip_processor = None

def get_clip():
    global clip_model, clip_processor
    if clip_model is None:
        clip_model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
        clip_processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
    return clip_model, clip_processor

CATEGORIES = ["tênis e calçados", "perfume e cosmético", "peça automotiva",
              "bolsa e acessório de moda", "relógio e joia", "produto genérico"]
BG_STYLES = ["studio_white", "dark_dramatic", "lifestyle_outdoor", "industrial"]

def vision_analyze_real(input_image_bytes: bytes) -> dict:
    model, processor = get_clip()
    image = Image.open(io.BytesIO(input_image_bytes)).convert("RGB")

    # Classificação zero-shot da categoria
    inputs = processor(text=CATEGORIES, images=image, return_tensors="pt", padding=True)
    with torch.no_grad():
        outputs = model(**inputs)
    probs = outputs.logits_per_image.softmax(dim=1)[0]
    best_idx = int(probs.argmax())
    category = CATEGORIES[best_idx]
    confidence = float(probs[best_idx])

    # Classificação zero-shot do estilo de fundo recomendado
    bg_prompts = [f"a product photo suited for a {s.replace('_', ' ')} background" for s in BG_STYLES]
    bg_inputs = processor(text=bg_prompts, images=image, return_tensors="pt", padding=True)
    with torch.no_grad():
        bg_outputs = model(**bg_inputs)
    bg_probs = bg_outputs.logits_per_image.softmax(dim=1)[0]
    bg_style = BG_STYLES[int(bg_probs.argmax())]

    return {
        "category": category,
        "recommendedBgStyle": bg_style,
        "confidence": round(confidence, 4)
    }

def vision_analyze_mock(input_image_bytes):
    # Fallback seguro para testes unitários antes de VISION_MODEL_READY=true
    return {
        "category": "Genérico (Análise Simulação)",
        "recommendedBgStyle": "studio_white",
        "confidence": 0.85
    }

def ollama_generate_copy(category: str):
    prompt = f"Gere uma cópia comercial em JSON para um produto da categoria: {category}. Inclua as chaves: title, subtitle, description, benefits (array), cta, hashtags, platformSpecific (objeto com instagram, mercadolivre, facebook) e seoKeywords (array)."
    try:
        # Tenta conectar no Ollama local (se a VPS ou Dev machine tiver)
        res = requests.post("http://localhost:11434/api/generate", json={
            "model": "llama3.1",
            "prompt": prompt,
            "stream": False,
            "format": "json"
        }, timeout=25)
        if res.ok:
            return json.loads(res.json().get("response", "{}"))
    except Exception as e:
        print("Ollama indisponível. Usando fallback de desenvolvimento.")
        pass

    # Fallback caso falhe conexão ou parse
    return {
      "title": f"Lançamento: {category}",
      "subtitle": "Qualidade e design.",
      "description": "Excelente produto (Gerado por Fallback porque o Ollama não respondeu).",
      "benefits": ["Garantia", "Durabilidade"],
      "cta": "Compre já!",
      "hashtags": "#oferta",
      "platformSpecific": {
        "instagram": "Confira! Link na bio.",
        "facebook": "Aproveite a promoção no nosso site.",
        "mercadolivre": "Envio Full."
      },
      "seoKeywords": ["comprar", category.lower()]
    }

# Job System Endpoints e Worker
def process_job_task(job_id: str, org_id: str, tier: str, job_type: str, input_path: str = None, category_arg: str = None):
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        cur.execute("UPDATE jobs SET status = 'processing' WHERE id = %s;", (job_id,))
        conn.commit()
        
        result_url = None
        result_data_str = None
        
        if job_type == 'bg-removal':
            with open(input_path, "rb") as f:
                input_image_bytes = f.read()
                
            alpha_matting = False
            model_name = "u2netp"
            if tier == "pro":
                model_name = "u2net"
                alpha_matting = True
            elif tier == "premium":
                model_name = "isnet-general-use"
                alpha_matting = True
                
            session = get_session(model_name)
            
            if alpha_matting:
                output_image_bytes = remove(
                    input_image_bytes, session=session, alpha_matting=True,
                    alpha_matting_foreground_threshold=240, alpha_matting_background_threshold=10,
                    alpha_matting_erode_size=10
                )
            else:
                output_image_bytes = remove(input_image_bytes, session=session)
                
            output_filename = f"{job_id}_out.png"
            output_path = os.path.join("storage", output_filename)
            with open(output_path, "wb") as f:
                f.write(output_image_bytes)
                
            result_url = f"{API_BASE if 'API_BASE' in globals() else 'http://localhost:8000'}/storage/{output_filename}"

        elif job_type == 'campaign-analyze':
            with open(input_path, "rb") as f:
                input_image_bytes = f.read()
            # Chama o modelo real de inferência que irá subir na VPS!
            data = vision_analyze_real(input_image_bytes)
            result_data_str = json.dumps(data)

        elif job_type == 'campaign-copy':
            data = ollama_generate_copy(category_arg or "Genérico")
            result_data_str = json.dumps(data)
        
        cur.execute("UPDATE jobs SET status = 'completed', result_url = %s, result_data = %s WHERE id = %s;", (result_url, result_data_str, job_id))
        conn.commit()
        
        dispatch_webhooks(org_id, tier)
    except Exception as e:
        conn.rollback()
        cur = conn.cursor()
        cur.execute("UPDATE jobs SET status = 'failed', error_message = %s WHERE id = %s;", (str(e), job_id))
        conn.commit()
    finally:
        cur.close()
        conn.close()
        try:
            if input_path and os.path.exists(input_path):
                os.remove(input_path)
        except:
            pass

@app.post("/jobs", status_code=202, tags=["IA Assíncrona"], summary="Criar Job Assíncrono", description="Cria um processamento pesado na fila. Use GET /jobs/{id} para checar o status e receber a URL via Webhook.")
@limiter.limit("20/minute")
async def create_job(
    request: Request,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...), 
    tier: str = Form("basic"), 
    org_id: str = Depends(get_current_org_id),
    role: str = Depends(get_current_role)
):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="O arquivo enviado precisa ser uma imagem válida.")
        
    costs = {"basic": 1, "pro": 3, "premium": 5}
    cost = costs.get(tier, 1)
    
    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("SELECT plan, credits_balance FROM organizations WHERE id = %s FOR UPDATE;", (org_id,))
        org_data = cur.fetchone()
        
        if not org_data:
            raise HTTPException(status_code=404, detail="Organização não encontrada.")
            
        plan = org_data['plan']
        balance = org_data['credits_balance']
        
        if tier == "pro" and plan not in ["pro", "premium"]:
            raise HTTPException(status_code=403, detail="O Tier Pro exige plano Pro ou Premium.")
        if tier == "premium" and plan != "premium":
            raise HTTPException(status_code=403, detail="O Tier Premium exige plano Premium.")
            
        if role != "superadmin":
            if balance < cost:
                raise HTTPException(status_code=402, detail="Saldo de créditos insuficiente.")
            
        input_image_bytes = await file.read()
        
        # Limite de Upload de 20MB
        if len(input_image_bytes) > 20 * 1024 * 1024:
            raise HTTPException(status_code=413, detail="O arquivo excede o limite de 20MB.")
        
        if role != "superadmin":
            new_balance = balance - cost
            cur.execute("UPDATE organizations SET credits_balance = %s WHERE id = %s;", (new_balance, org_id))
        else:
            new_balance = balance
        
        # Insert Job
        cur.execute("INSERT INTO jobs (organization_id, tier, status, job_type) VALUES (%s, %s, 'pending', 'bg-removal') RETURNING id;", (org_id, tier))
        job_id = str(cur.fetchone()['id'])
        
        if role != "superadmin":
            cur.execute(
                "INSERT INTO credit_transactions (organization_id, amount, reason, job_id, balance_after) VALUES (%s, %s, %s, %s, %s);",
                (org_id, -cost, f"job bg-removal ({tier})", job_id, new_balance)
            )
        
        conn.commit()
        cur.close()
        
        # Save temp file
        input_path = os.path.join("storage", f"{job_id}_in.png")
        with open(input_path, "wb") as f:
            f.write(input_image_bytes)
            
        background_tasks.add_task(process_job_task, job_id, org_id, tier, 'bg-removal', input_path)
        
        return {"job_id": job_id, "status": "pending", "message": "Job de remoção de fundo aceito."}
    except HTTPException:
        conn.conn.rollback()
        raise
    except Exception as e:
        conn.conn.rollback()
        raise HTTPException(status_code=500, detail=f"Erro ao criar job: {str(e)}")
    finally:
        conn.close()

class CampaignCopyPayload(BaseModel):
    category: str

@app.post("/campaigns/analyze", status_code=202, tags=["Campanhas AI"], summary="Analisar Imagem (Visão)", description="Utiliza VLM para descobrir a categoria de um produto. Processamento em Background.")
@limiter.limit("20/minute")
async def create_campaign_analyze_job(
    request: Request,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...), 
    org_id: str = Depends(get_current_org_id),
    role: str = Depends(get_current_role)
):
    if not VISION_MODEL_READY:
        raise HTTPException(status_code=503, detail="A análise visual ainda não está disponível em produção. (Feature Flag desligada)")

    # Custo Fixo de Análise Visual
    cost = 2
    
    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("SELECT plan, credits_balance FROM organizations WHERE id = %s FOR UPDATE;", (org_id,))
        org_data = cur.fetchone()
        if not org_data: raise HTTPException(status_code=404, detail="Organização não encontrada.")
            
        if role != "superadmin":
            if org_data['credits_balance'] < cost:
                raise HTTPException(status_code=402, detail="Saldo de créditos insuficiente para análise visual.")
            
        input_image_bytes = await file.read()
        
        # Limite de Upload de 20MB
        if len(input_image_bytes) > 20 * 1024 * 1024:
            raise HTTPException(status_code=413, detail="O arquivo excede o limite de 20MB.")
        
        if role != "superadmin":
            new_balance = org_data['credits_balance'] - cost
            cur.execute("UPDATE organizations SET credits_balance = %s WHERE id = %s;", (new_balance, org_id))
        else:
            new_balance = org_data['credits_balance']
        
        cur.execute("INSERT INTO jobs (organization_id, tier, status, job_type) VALUES (%s, %s, 'pending', 'campaign-analyze') RETURNING id;", (org_id, 'basic'))
        job_id = str(cur.fetchone()['id'])
        
        if role != "superadmin":
            cur.execute(
                "INSERT INTO credit_transactions (organization_id, amount, reason, job_id, balance_after) VALUES (%s, %s, %s, %s, %s);",
                (org_id, -cost, "job campaign-analyze", job_id, new_balance)
            )
        conn.commit()
        cur.close()
        
        input_path = os.path.join("storage", f"{job_id}_in.png")
        with open(input_path, "wb") as f: f.write(input_image_bytes)
            
        background_tasks.add_task(process_job_task, job_id, org_id, 'basic', 'campaign-analyze', input_path)
        return {"job_id": job_id, "status": "pending"}
    except Exception as e:
        conn.conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.post("/campaigns/generate-copy", status_code=202, tags=["Campanhas AI"], summary="Gerar Copywriting (LLM)", description="Utiliza um LLM para gerar títulos, benefícios e legendas para redes sociais.")
@limiter.limit("20/minute")
async def create_campaign_copy_job(
    request: Request,
    payload: CampaignCopyPayload,
    background_tasks: BackgroundTasks,
    org_id: str = Depends(get_current_org_id),
    role: str = Depends(get_current_role)
):
    cost = 1
    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("SELECT plan, credits_balance FROM organizations WHERE id = %s FOR UPDATE;", (org_id,))
        org_data = cur.fetchone()
        
        if role != "superadmin":
            if org_data['credits_balance'] < cost:
                raise HTTPException(status_code=402, detail="Saldo insuficiente.")
                
            new_balance = org_data['credits_balance'] - cost
            cur.execute("UPDATE organizations SET credits_balance = %s WHERE id = %s;", (new_balance, org_id))
        else:
            new_balance = org_data['credits_balance']
        
        cur.execute("INSERT INTO jobs (organization_id, tier, status, job_type) VALUES (%s, %s, 'pending', 'campaign-copy') RETURNING id;", (org_id, 'basic'))
        job_id = str(cur.fetchone()['id'])
        
        if role != "superadmin":
            cur.execute(
                "INSERT INTO credit_transactions (organization_id, amount, reason, job_id, balance_after) VALUES (%s, %s, %s, %s, %s);",
                (org_id, -cost, "job campaign-copy", job_id, new_balance)
            )
        conn.commit()
        cur.close()
            
        background_tasks.add_task(process_job_task, job_id, org_id, 'basic', 'campaign-copy', input_path=None, category_arg=payload.category)
        return {"job_id": job_id, "status": "pending"}
    except Exception as e:
        conn.conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.get("/jobs/{job_id}", tags=["IA Assíncrona"], summary="Verificar status do Job")
def get_job_status(job_id: str, org_id: str = Depends(get_current_org_id)):
    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("SELECT id, status, job_type, tier, result_url, result_data, error_message, created_at FROM jobs WHERE id = %s AND organization_id = %s LIMIT 1;", (job_id, org_id))
        job = cur.fetchone()
        cur.close()
        
        if not job:
            raise HTTPException(status_code=404, detail="Job não encontrado.")
            
        return job
    finally:
        conn.close()

# Billing Endpoints
@app.get("/billing/balance")
def get_billing_balance(org_id: str = Depends(get_current_org_id)):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("SELECT plan, credits_balance FROM organizations WHERE id = %s LIMIT 1;", (org_id,))
    data = cur.fetchone()
    cur.close()
    conn.close()
    if not data:
        raise HTTPException(status_code=404, detail="Not found")
    return {"plan": data['plan'], "credits": data['credits_balance']}

@app.get("/billing/transactions")
def get_billing_transactions(org_id: str = Depends(get_current_org_id)):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("SELECT amount, reason, created_at, balance_after FROM credit_transactions WHERE organization_id = %s ORDER BY created_at DESC LIMIT 50;", (org_id,))
    transactions = cur.fetchall()
    cur.close()
    conn.close()
    return transactions

class CreateApiKeyPayload(BaseModel):
    name: str

@app.get("/api-keys")
def get_api_keys(org_id: str = Depends(get_current_org_id)):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("SELECT id, name, prefix, last_used_at, created_at FROM api_keys WHERE organization_id = %s ORDER BY created_at DESC;", (org_id,))
    keys = cur.fetchall()
    cur.close()
    conn.close()
    return keys

@app.post("/api-keys")
def create_api_key(payload: CreateApiKeyPayload, org_id: str = Depends(get_current_org_id)):
    raw_key = "sk_live_" + secrets.token_hex(24)
    key_hash = hashlib.sha256(raw_key.encode('utf-8')).hexdigest()
    prefix = raw_key[:12] + "..."
    
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO api_keys (organization_id, name, key_hash, prefix) VALUES (%s, %s, %s, %s) RETURNING id, created_at;",
        (org_id, payload.name, key_hash, prefix)
    )
    res = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()
    
    return {
        "id": res[0],
        "name": payload.name,
        "prefix": prefix,
        "secret": raw_key,
        "created_at": res[1]
    }

@app.delete("/api-keys/{key_id}")
def delete_api_key(key_id: str, org_id: str = Depends(get_current_org_id)):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM api_keys WHERE id = %s AND organization_id = %s;", (key_id, org_id))
    conn.commit()
    cur.close()
    conn.close()
    return {"message": "API Key revogada."}

def is_valid_webhook_url(url: str) -> bool:
    if not url.startswith("https://"):
        return False
    try:
        from urllib.parse import urlparse
        parsed = urlparse(url)
        hostname = parsed.hostname
        if not hostname:
            return False
        ip = socket.gethostbyname(hostname)
        ip_obj = ipaddress.ip_address(ip)
        if ip_obj.is_private or ip_obj.is_loopback or ip_obj.is_link_local:
            return False
        return True
    except Exception:
        return False

class CreateWebhookPayload(BaseModel):
    url: str

@app.get("/webhooks")
def get_webhooks(org_id: str = Depends(get_current_org_id)):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("SELECT id, url, is_active, created_at FROM webhooks WHERE organization_id = %s ORDER BY created_at DESC;", (org_id,))
    hooks = cur.fetchall()
    cur.close()
    conn.close()
    return hooks

@app.post("/webhooks", tags=["Webhooks"], summary="Registrar Webhook (Anti-SSRF)")
def create_webhook(payload: CreateWebhookPayload, org_id: str = Depends(get_current_org_id)):
    # TODO: Futuro (escalabilidade alta) - Para prevenir DNS Rebinding avançado na AWS,
    # seria ideal resolver o IP novamente no momento do disparo do webhook, não apenas no cadastro.
    if not is_valid_webhook_url(payload.url):
        raise HTTPException(status_code=400, detail="URL inválida ou não permitida (SSRF protection).")
        
    secret = "whsec_" + secrets.token_hex(16)
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO webhooks (organization_id, url, secret) VALUES (%s, %s, %s) RETURNING id, created_at;",
        (org_id, payload.url, secret)
    )
    res = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()
    
    return {
        "id": res[0],
        "url": payload.url,
        "is_active": True,
        "created_at": res[1]
    }

@app.delete("/webhooks/{webhook_id}")
def delete_webhook(webhook_id: str, org_id: str = Depends(get_current_org_id)):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM webhooks WHERE id = %s AND organization_id = %s;", (webhook_id, org_id))
    conn.commit()
    cur.close()
    conn.close()
    return {"message": "Webhook deletado."}
