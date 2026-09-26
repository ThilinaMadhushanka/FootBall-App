import os

import httpx

from app.schemas import ChatRequest


ollama_url = os.getenv("OLLAMA_URL", "http://localhost:11434").rstrip("/")
ollama_model = os.getenv("OLLAMA_MODEL", "llama3.2:3b")
ollama_timeout = float(os.getenv("OLLAMA_TIMEOUT_SECONDS", "120"))
max_output_tokens = int(os.getenv("OLLAMA_MAX_OUTPUT_TOKENS", "500"))


class AIProviderError(RuntimeError):
    """Raised when the local Ollama provider cannot complete a request."""


def create_system_prompt(request: ChatRequest) -> str:
    context = request.context

    return f"""
You are PlayerPro AI, a football management assistant.

Current user:
- Username: {request.username}
- Role: {request.user_role}
- Competition: {context.competition_name or "Not selected"}
- Season ID: {context.season_id or "Not selected"}
- Team: {context.team_name or "No team"}
- Next match: {context.next_match or "Not available"}
- Remaining budget: {context.remaining_budget if context.remaining_budget is not None else "Not available"}

Rules:
1. Answer using the language used by the user.
2. Give clear and concise football-management advice.
3. Only use the context supplied in this request.
4. Never invent match, player, team, budget or contract information.
5. If required data is unavailable, clearly say that it is unavailable.
6. Do not claim that a transfer, contract, deletion or budget update was performed.
7. Managers may receive squad, formation, budget and recruitment guidance.
8. Players may receive performance, fixture and contract explanations.
9. Viewers receive read-only football information.
10. Organizers receive competition and fixture-management guidance.
""".strip()


async def generate_answer(request: ChatRequest) -> str:
    payload = {
        "model": ollama_model,
        "stream": False,
        "messages": [
            {"role": "system", "content": create_system_prompt(request)},
            {"role": "user", "content": request.message},
        ],
        "options": {"num_predict": max_output_tokens},
    }

    try:
        async with httpx.AsyncClient(timeout=ollama_timeout) as client:
            response = await client.post(f"{ollama_url}/api/chat", json=payload)
            response.raise_for_status()
    except (httpx.HTTPError, httpx.TimeoutException) as error:
        raise AIProviderError("Could not connect to the local Ollama service") from error

    answer = response.json().get("message", {}).get("content", "").strip()
    if not answer:
        raise AIProviderError("Ollama returned an empty response")
    return answer


async def provider_health() -> dict:
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            response = await client.get(f"{ollama_url}/api/tags")
            response.raise_for_status()
        installed = [item.get("name", "") for item in response.json().get("models", [])]
        model_ready = any(name == ollama_model or name.startswith(f"{ollama_model}:") for name in installed)
        return {"status": "ok" if model_ready else "model_missing", "model": ollama_model, "installed_models": installed}
    except httpx.HTTPError:
        return {"status": "unavailable", "model": ollama_model, "installed_models": []}
