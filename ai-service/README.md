# PlayerPro AI service (Ollama)

This FastAPI service uses a locally running Ollama model. It does not require an OpenAI API key.

## 1. Install and prepare Ollama

Install Ollama for Windows from https://ollama.com/download, open a new terminal, then run:

```powershell
ollama pull llama3.2:3b
ollama list
```

For a lower-memory computer, use `llama3.2:1b` and set the same name in `.env`.

## 2. Configure the service

Keep the existing `AI_SERVICE_TOKEN` and add these values to `.env`:

```env
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2:3b
OLLAMA_TIMEOUT_SECONDS=120
OLLAMA_MAX_OUTPUT_TOKENS=500
```

The old `OPENAI_API_KEY` and `OPENAI_MODEL` values are no longer used and can be removed.

## 3. Install and run

```powershell
cd ai-service
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Check `http://localhost:8000/health`. The provider status should be `ok`. `model_missing` means Ollama is running but the configured model must be pulled. `unavailable` means Ollama is not running or is not installed.

The `/chat` endpoint requires the `X-AI-Service-Token` header. The token value must match `AI_SERVICE_TOKEN` in `.env`.
