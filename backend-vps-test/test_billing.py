import requests
import os

API_URL = "http://127.0.0.1:8000"

def run_tests():
    print("Iniciando testes manuais de Billing...\n")
    
    # Simular que pegamos o token no login
    print("⚠️  AVISO: Este script assume que o JWT_SECRET é igual ao do backend e criará um token fake admin.")
    import jwt
    from datetime import datetime, timedelta
    
    jwt_secret = os.getenv("JWT_SECRET")
    if not jwt_secret:
        raise RuntimeError("JWT_SECRET não configurado no ambiente de teste.")
        
    token = jwt.encode({
        "sub": "00000000-0000-0000-0000-000000000000",
        "email": "teste@teste.com",
        "role": "owner",
        "org_id": "00000000-0000-0000-0000-000000000000",
        "exp": datetime.utcnow() + timedelta(days=1)
    }, jwt_secret, algorithm="HS256")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    print("\n[TESTE 1] - Tentar usar Tier Premium num plano Basic (Esperado 403 Forbidden)")
    with open("test_img.png", "wb") as f:
        f.write(b"fake_png_data")
        
    try:
        with open("test_img.png", "rb") as f:
            res = requests.post(f"{API_URL}/remove-bg", files={"file": ("test_img.png", f, "image/png")}, data={"tier": "premium"}, headers=headers)
            print(f"Status: {res.status_code} - {res.text}")
    except Exception as e:
        print(e)
        
    print("\n[TESTE 2] - Consultar Saldo Real")
    try:
        res = requests.get(f"{API_URL}/billing/balance", headers=headers)
        print(f"Status: {res.status_code} - {res.text}")
    except Exception as e:
        print(e)
        
    print("\nTestes concluídos. O comportamento final depende do estado real do banco.")

if __name__ == "__main__":
    run_tests()
