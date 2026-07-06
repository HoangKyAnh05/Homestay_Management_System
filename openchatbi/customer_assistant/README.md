# Homestay Customer Assistant

This FastAPI service reuses the OpenChatBI Python environment and LangChain
dependencies, but deliberately does not expose the OpenChatBI text-to-SQL graph
to customers.

## Run locally

Set `OPENAI_API_KEY`, `OPENAI_MODEL`, and `AI_INTERNAL_TOKEN`, then run:

```powershell
uv run uvicorn customer_assistant.app:app --host 127.0.0.1 --port 8001
```

Health check:

```powershell
Invoke-RestMethod http://127.0.0.1:8001/health
```

Only the Spring Boot gateway should call `POST /customer/chat`.
