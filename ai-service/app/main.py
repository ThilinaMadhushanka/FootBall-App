import hmac
import os

from dotenv import load_dotenv
from fastapi import FastAPI, Header, HTTPException

load_dotenv()

from app.assistant import AIProviderError, generate_answer, provider_health
from app.schemas import ChatRequest, ChatResponse


app = FastAPI(
    title="PlayerPro AI Service",
    version="1.0.0",
)

service_token = os.getenv("AI_SERVICE_TOKEN", "")


@app.get("/health")
async def health():
    provider = await provider_health()
    return {"status": "ok", "provider": "ollama", **provider}


@app.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    x_ai_service_token: str = Header(default=""),
):
    if not service_token:
        raise HTTPException(
            status_code=500,
            detail="AI service token is not configured",
        )

    if not hmac.compare_digest(x_ai_service_token, service_token):
        raise HTTPException(
            status_code=401,
            detail="Invalid service token",
        )

    try:
        answer = await generate_answer(request)
        return ChatResponse(answer=answer)
    except AIProviderError as error:
        raise HTTPException(
            status_code=502,
            detail=str(error),
        ) from error
