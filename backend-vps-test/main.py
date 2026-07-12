import os
import io
import jwt
import bcrypt
import psycopg2
import requests
import secrets
import hashlib
from psycopg2.extras import RealDictCursor
from datetime import datetime, timedelta
from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Request, Depends
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
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

DATABASE_URL = os.getenv("DATABASE_URL")
JWT_SECRET = os.getenv("JWT_SECRET", "super-secret-jwt-key-92841")
JWT_ALGORITHM = "HS256"
RESEND_API_KEY = os.getenv("RESEND_API_KEY")
RESEND_FROM_EMAIL = os.getenv("EMAIL_FROM") or os.getenv("RESEND_FROM_EMAIL") or "onboarding@resend.dev"

def send_confirmation_email(to_email: str, user_name: str, token: str):
    if not RESEND_API_KEY:
        print("Aviso: RESEND_API_KEY não configurada. E-mail de confirmação não enviado.")
        return
    
    url = "https://api.resend.com/emails"
    headers = {
        "Authorization": f"Bearer {RESEND_API_KEY}",
        "Content-Type": "application/json"
    }
    
    # Link apontando para a rota de verificação no Next.js
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
        <p style="color: #64748b; font-size: 14px;">
            Ou copie e cole este link no seu navegador: <br/>
            <a href="{verification_link}" style="color: #10b981;">{verification_link}</a>
        </p>
        <p style="color: #64748b; font-size: 14px; margin-top: 15px;">
            Este link é válido por 24 horas.
        </p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-bottom: 0;">
            Se você não se cadastrou nesta plataforma, ignore este e-mail.
        </p>
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

# Cache de sessões para não recarregar os modelos a cada requisição
sessions = {}

def get_session(model_name: str):
    if model_name not in sessions:
        sessions[model_name] = new_session(model_name)
    return sessions[model_name]

def get_db_connection():
    return psycopg2.connect(DATABASE_URL)

@app.on_event("startup")
def startup_db_setup():
    if not DATABASE_URL:
        print("DATABASE_URL não configurada. Pulando setup do banco.")
        return
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # 0. Garantir a criação da tabela webhooks se não existir
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

        # 1. Garantir que a organização do Super Admin existe
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
            
        # 2. Garantir que o Super Admin existe
        cur.execute("SELECT id FROM users WHERE email = 'gsntech.suporte@gmail.com' LIMIT 1;")
        user = cur.fetchone()
        if not user:
            password = "Ddos810256@"
            hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            
            cur.execute(
                "INSERT INTO users (organization_id, name, email, password_hash, role, status) VALUES (%s, %s, %s, %s, %s, %s);",
                (org_id, "GSN Tech Support", "gsntech.suporte@gmail.com", hashed_password, "superadmin", "active")
            )
            conn.commit()
            print("Super Admin seed concluído com sucesso!")
        else:
            print("Super Admin já existe no banco.")
            
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Erro ao inicializar banco de dados / seeding: {e}")

# Autenticação dupla: JWT do Painel ou API Key
security = HTTPBearer()

def get_current_org_id(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    # Se for uma API Key
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
        
        # Atualizar last_used_at
        cur.execute("UPDATE api_keys SET last_used_at = CURRENT_TIMESTAMP WHERE id = %s;", (res[1],))
        conn.commit()
        cur.close()
        conn.close()
        return str(res[0])
    
    # Se for um JWT do Dashboard
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") == "verify_email":
            raise HTTPException(status_code=401, detail="Token inválido para esta operação.")
        return payload.get("org_id")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado.")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido.")


# Pydantic Schemas para Validação
class RegisterPayload(BaseModel):
    name: str
    email: EmailStr
    password: str
    company: str

class LoginPayload(BaseModel):
    email: EmailStr
    password: str

@app.post("/auth/register")
def register_user(payload: RegisterPayload):
    if not DATABASE_URL:
        raise HTTPException(status_code=500, detail="Banco de dados não configurado no backend.")
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Verificar se email já existe
        cur.execute("SELECT id FROM users WHERE email = %s LIMIT 1;", (payload.email,))
        if cur.fetchone():
            cur.close()
            conn.close()
            raise HTTPException(status_code=400, detail="E-mail já cadastrado.")
            
        # Criar a organização
        cur.execute(
            "INSERT INTO organizations (name, plan, status) VALUES (%s, 'basic', 'active') RETURNING id;",
            (payload.company,)
        )
        org_id = cur.fetchone()[0]
        
        # Criptografar a senha
        hashed_password = bcrypt.hashpw(payload.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        # Criar o usuário pendente (requer verificação de e-mail)
        cur.execute(
            "INSERT INTO users (organization_id, name, email, password_hash, role, status) VALUES (%s, %s, %s, %s, 'owner', 'pending') RETURNING id;",
            (org_id, payload.name, payload.email, hashed_password)
        )
        user_id = cur.fetchone()[0]
        
        conn.commit()
        cur.close()
        conn.close()
        
        # Gerar o token de verificação (expira em 24 horas)
        verify_token = jwt.encode({
            "sub": str(user_id),
            "type": "verify_email",
            "exp": datetime.utcnow() + timedelta(hours=24)
        }, JWT_SECRET, algorithm=JWT_ALGORITHM)

        # Enviar o e-mail de confirmação via Resend contendo o link do token
        send_confirmation_email(payload.email, payload.name, verify_token)
        
        return {
            "message": "Cadastro realizado com sucesso! Verifique seu e-mail para ativar a conta.",
            "status": "pending"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro no cadastro: {str(e)}")

@app.post("/auth/login")
def login_user(payload: LoginPayload):
    if not DATABASE_URL:
        raise HTTPException(status_code=500, detail="Banco de dados não configurado no backend.")
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
            
        # Verificar se e-mail está confirmado
        if user['status'] == 'pending':
            cur.close()
            conn.close()
            raise HTTPException(status_code=403, detail="Por favor, confirme seu e-mail para ativar sua conta e liberar o acesso.")
            
        # Comparar senha com bcrypt
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

# Novo Schema e Endpoint para confirmação de e-mail
class VerifyPayload(BaseModel):
    token: str

@app.post("/auth/verify-email")
def verify_email(payload: VerifyPayload):
    if not DATABASE_URL:
        raise HTTPException(status_code=500, detail="Banco de dados não configurado.")
    try:
        data = jwt.decode(payload.token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if data.get("type") != "verify_email":
            raise HTTPException(status_code=400, detail="Token inválido.")
        user_id = data.get("sub")
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Verificar se usuário existe e está pendente
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
            
        # Atualizar status para active
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

@app.get("/")
def read_root():
    return {"status": "online", "message": "API de Remoção de Fundo funcionando com sucesso."}

@app.post("/remove-bg")
async def remove_background(
    file: UploadFile = File(...), 
    tier: str = Form("basic"), 
    org_id: str = Depends(get_current_org_id)
):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="O arquivo enviado precisa ser uma imagem válida.")
    
    try:
        input_image_bytes = await file.read()
        
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
        
        # Disparar webhooks de sucesso de forma assíncrona (na prática deveria usar BackgroundTasks)
        # Aqui fazemos de forma simples e direta para o teste
        try:
            conn = get_db_connection()
            cur = conn.cursor()
            cur.execute("SELECT url FROM webhooks WHERE organization_id = %s AND is_active = TRUE;", (org_id,))
            hooks = cur.fetchall()
            cur.close()
            conn.close()
            for h in hooks:
                try:
                    requests.post(h[0], json={"event": "image.processed", "status": "success", "tier": tier}, timeout=2)
                except:
                    pass
        except:
            pass

        return StreamingResponse(io.BytesIO(output_image_bytes), media_type="image/png")
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao processar imagem: {str(e)}")

# API Keys Endpoints
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

# Webhooks Endpoints
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

@app.post("/webhooks")
def create_webhook(payload: CreateWebhookPayload, org_id: str = Depends(get_current_org_id)):
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
