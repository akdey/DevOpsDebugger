# HackathonLabRAGApp

Basic FastAPI scaffold.

## Setup

### 1. Clone and install dependencies

Using a virtual environment (recommended):

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Or with `pyproject.toml` / `pip`:

```powershell
pip install -e .
```

### 2. Configure environment variables

Copy `.env.example` to `.env` and fill in your API keys:

```powershell
cp .env.example .env
```

Update the following in `.env`:
- `GOOGLE_API_KEY` — Google API key for web search (optional)
- `SERPAPI_API_KEY` — SerpAPI key for web search (optional)
- `JWT_SECRET` — Change to a secure random string in production

Generate a secure JWT secret:
```powershell
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

## Run (Windows PowerShell)

```powershell
.\run.ps1
```

The app will be available at `http://127.0.0.1:8000/` and the sample endpoints under `/api`:

- `GET /api/health` — health check
- `POST /api/echo` — echo endpoint, JSON body `{ "text": "..." }`

New endpoints for RAG chatbot and documents:

- `POST /api/docs` — add a document for embeddings (admin only)
  - JSON: `{ "title": "...", "content": "..." }`
  - Requires `Authorization: Bearer <admin_token>`
- `GET /api/docs` — list all documents (authenticated users)
- `GET /api/docs/search?q=term` — search documents (authenticated users)
- `POST /api/users` — create a new user (admin only)
  - JSON: `{ "username": "...", "token": "...", "roles": ["user"] or ["admin"] }`
- WebSocket `/chat` — connect with `Authorization: Bearer <token>` header and send DevOps queries

## Role-Based Access Control

Two roles are available:

| Role | Permissions |
|------|-------------|
| **admin** | Can upload/manage documents, create users, query the chatbot |
| **user** | Can query the chatbot only, cannot manage documents |

### Default Tokens

On first run, two default users are created:

- **Admin**: username `admin_dev`, token `admin_devtoken`, role `admin`
- **User**: username `user_dev`, token `user_devtoken`, role `user`

### Creating New Users (Admin Only)

```bash
curl -X POST http://127.0.0.1:8000/api/users \
  -H "Authorization: Bearer admin_devtoken" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john",
    "token": "john_token",
    "roles": ["user"]
  }'
```

### Uploading Documents (Admin Only)

```bash
curl -X POST http://127.0.0.1:8000/api/docs \
  -H "Authorization: Bearer admin_devtoken" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Docker Best Practices",
    "content": "..."
  }'
```

### Querying Documents (All Users)

```bash
curl http://127.0.0.1:8000/api/docs/search?q=docker \
  -H "Authorization: Bearer user_devtoken"
```

## Agentic Flow (Langgraph-based)

The `/chat` WebSocket endpoint orchestrates a multi-agent workflow using Langgraph:

1. **Validator Agent** — Validates query against guardrails and determines if it's DevOps-related (using LLM).
   - If blocked: responds "Query is blocked due to guardrail violation"
   - If non-DevOps: routes to NonDevOpsAgent

2. **NonDevOpsAgent** — Handles non-DevOps queries.
   - Responds: "I can only answer DevOps-related queries."

3. **Evaluator Agent** — For DevOps queries, classifies as "general" or "debug" using LLM.
   - Performs reasoning and reframes the query if needed using LLM.
   - Routes to appropriate next step.

4. **For General Queries** (non-debug):
   - **SearchAgent** — Searches Google using SerpAPI MCP.
   - **SynthesizerAgent** — Synthesizes final answer using search results.

5. **For Debug Queries**:
   - **RetrieverAgent** — Retrieves relevant docs from knowledge base.
   - **SearchAgent** — Searches Google using SerpAPI MCP.
   - **SynthesizerAgent** — Synthesizes answer combining retrieval and search results.

WebSocket messages are streamed showing which agent is running and the final answer.

## Configuration

- Copy `.env` and add your API keys:
  - `GOOGLE_API_KEY` — for LangChain Google LLM
  - `SERPAPI_API_KEY` — for Google search MCP

## Storage & Auth

- TinyDB stores users, documents, and chat state at `app/data/db.json`.
- Two default users are created on first run:
  - Admin: token `admin_devtoken` (can manage documents and users)
  - User: token `user_devtoken` (can query only)

## Quick Test

1. Set up environment:
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

2. Run the app:
```powershell
.\run.ps1
```

3. **As Admin** — Upload a document:
```powershell
$body = @{
    title = "Kubernetes Guide"
    content = "How to manage Kubernetes clusters..."
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://127.0.0.1:8000/api/docs" `
  -Method POST `
  -Headers @{"Authorization" = "Bearer admin_devtoken"} `
  -Body $body `
  -ContentType "application/json"
```

4. **As User** — Query via WebSocket:
```javascript
// Browser console
const ws = new WebSocket("ws://127.0.0.1:8000/chat");
ws.onopen = () => {
  ws.send(JSON.stringify({
    "Authorization": "Bearer user_devtoken"
  }));
  ws.send("How do I configure persistent volumes in Kubernetes?");
};
ws.onmessage = (e) => console.log(JSON.parse(e.data));
```

Notes:
- All API endpoints require authentication via `Authorization: Bearer <token>` header.
- Document management is restricted to admin users only.
- Both admin and regular users can query documents and use the chatbot.



