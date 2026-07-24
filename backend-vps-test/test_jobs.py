import pytest
import os
import io
from unittest.mock import patch, MagicMock, AsyncMock
from PIL import Image

# Configuração de variáveis de ambiente para testes
os.environ["VISION_MODEL_READY"] = "false"
os.environ["OLLAMA_ENDPOINT"] = "http://localhost:11434/api/generate"
os.environ["JWT_SECRET"] = "test_secret"
# Mock pesados para evitar download do PyTorch em CI se não for necessário
import sys
sys.modules['torch'] = MagicMock()
sys.modules['transformers'] = MagicMock()
sys.modules['slowapi'] = MagicMock()
sys.modules['slowapi.util'] = MagicMock()
sys.modules['slowapi.errors'] = MagicMock()
sys.modules['psycopg2'] = MagicMock()
sys.modules['psycopg2.extras'] = MagicMock()
sys.modules['psycopg2.pool'] = MagicMock()
sys.modules['bcrypt'] = MagicMock()
sys.modules['jwt'] = MagicMock()
sys.modules['psutil'] = MagicMock()
sys.modules['email_validator'] = MagicMock()
sys.modules['onnxruntime'] = MagicMock()
sys.modules['cv2'] = MagicMock()

from main import process_job_task, get_db_connection

# Fixtures para criar arquivos de teste
@pytest.fixture
def mock_image_path(tmp_path):
    img = Image.new('RGB', (100, 100), color = 'red')
    img_path = tmp_path / "test_image.png"
    img.save(img_path)
    return str(img_path)

@pytest.fixture
def mock_mask_path(tmp_path):
    img = Image.new('L', (100, 100), color = 255)
    img_path = tmp_path / "test_mask.png"
    img.save(img_path)
    return str(img_path)

@pytest.fixture
def mock_db():
    with patch("main.get_db_connection") as mock_conn_func:
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_cursor.fetchone.return_value = None
        mock_conn.cursor.return_value = mock_cursor
        mock_conn_func.return_value = mock_conn
        yield mock_conn_func

@pytest.fixture
def mock_webhooks():
    with patch("main.dispatch_webhooks") as mock_disp:
        yield mock_disp

@pytest.fixture
def mock_birefnet():
    with patch("main.processar_ia_birefnet_proxy") as mock_proxy:
        mock_proxy.return_value = b"fake_image_data"
        yield mock_proxy


@pytest.mark.asyncio
async def test_job_bg_removal(mock_db, mock_webhooks, mock_birefnet, mock_image_path):
    await process_job_task("test_job_1", "org_1", "basic", "bg-removal", input_path=mock_image_path, extra_arg="transparent")
    mock_cursor = mock_db.return_value.cursor.return_value
    print("EXECUTE CALLS:", mock_cursor.execute.call_args_list)
    mock_db.assert_called_once()
    mock_birefnet.assert_called_once()
    
@pytest.mark.asyncio
async def test_job_inpaint(mock_db, mock_webhooks, mock_image_path, mock_mask_path):
    await process_job_task("test_job_2", "org_1", "basic", "inpaint", input_path=mock_image_path, mask_path=mock_mask_path)
    mock_db.assert_called_once()

@pytest.mark.asyncio
async def test_job_upscale(mock_db, mock_webhooks, mock_image_path):
    await process_job_task("test_job_3", "org_1", "basic", "upscale", input_path=mock_image_path)
    mock_db.assert_called_once()

@pytest.mark.asyncio
async def test_job_preset_apply(mock_db, mock_webhooks, mock_image_path):
    await process_job_task("test_job_4", "org_1", "basic", "preset-apply", input_path=mock_image_path, extra_arg='{"steps": [{"type": "brightness", "value": 1.5}]}')
    mock_db.assert_called_once()

@pytest.mark.asyncio
async def test_job_campaign_analyze(mock_db, mock_webhooks, mock_image_path):
    await process_job_task("test_job_5", "org_1", "basic", "campaign-analyze", input_path=mock_image_path)
    mock_db.assert_called_once()

@pytest.mark.asyncio
async def test_job_campaign_copy(mock_db, mock_webhooks):
    await process_job_task("test_job_6", "org_1", "basic", "campaign-copy", category_arg="tênis")
    mock_db.assert_called_once()

@pytest.mark.asyncio
async def test_job_smart_select(mock_db, mock_webhooks):
    await process_job_task("test_job_7", "org_1", "basic", "ai/smart-select")
    mock_db.assert_called_once()

@pytest.mark.asyncio
async def test_job_failure_case(mock_db, mock_webhooks):
    # Simulando falha passando path inexistente para bg-removal
    await process_job_task("test_job_fail", "org_1", "basic", "bg-removal", input_path="nonexistent.png")
    # Verifica se o cursor executou a query de failed
    cursor = mock_db.return_value.cursor.return_value
    calls = cursor.execute.call_args_list
    assert any("failed" in str(call) for call in calls)
