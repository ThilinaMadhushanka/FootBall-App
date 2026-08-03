# PlayerPro Football Manager

PlayerPro is a full-stack football competition and team-management platform. It provides role-specific workspaces for managers, players, viewers, and competition organizers, together with a local AI assistant powered by Ollama.

## Project structure

```text
FootBall-App/
├── frontend/      React + TypeScript + Tailwind CSS
├── backend/       Go + Gin + GORM + PostgreSQL
├── ai-service/    Python + FastAPI + Ollama
└── README.md
```

## Main features

- Manager, player, viewer, and organizer accounts
- JWT authentication and role-based permissions
- Multiple competitions and seasons
- Competition-specific teams, budgets, fixtures, and standings
- Organizer competition, team, budget, fixture, and season management
- Manager squad management with up to 25 players
- Editable formations and starting lineups
- Player profiles, availability, and performance statistics
- Team performance and recent-match results
- Live, scheduled, and completed match views
- Transfer requests and contract negotiation
- Transfer and salary budget management
- Contract offers, counteroffers, approval, rejection, and expiry
- Notifications and mutation audit logs
- Responsive PlayerPro AI chatbox
- Role-aware football assistance using a local Ollama model

## Architecture

```text
Browser
   │
   ▼
React frontend :3000
   │ JWT-authenticated requests
   ▼
Go backend :8080 ───────► PostgreSQL :5432
   │ trusted internal request
   ▼
Python AI service :8000
   │ local inference request
   ▼
Ollama :11434
```

The frontend never receives the database credentials, JWT secret, or AI service token. The Go backend verifies the signed-in user and builds trusted football context before contacting the Python service.

## Prerequisites

Install the following software:

- Node.js and npm
- Go 1.24 or a compatible version
- Python 3.10 or newer
- PostgreSQL
- Ollama

## 1. Database setup

Create a PostgreSQL database:

```sql
CREATE DATABASE "football-app";
```

The backend runs GORM migrations and development seed operations during startup.

## 2. Backend setup

Create `backend/.env` using `backend/.env.example` as a guide:

```env
APP_NAME=PlayerPro
APP_ENV=development
APP_PORT=8080
APP_URL=http://localhost:8080

DB_DRIVER=postgres
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your-postgres-password
DB_NAME=football-app

JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRATION=24h
CORS_ALLOWED_ORIGINS=http://localhost:3000
UPLOAD_PATH=./uploads

AI_SERVICE_URL=http://localhost:8000
AI_SERVICE_TOKEN=replace-with-the-shared-ai-service-token
```

Generate a random token in Windows PowerShell:

```powershell
$tokenBytes = New-Object byte[] 32
$rng = [Security.Cryptography.RandomNumberGenerator]::Create()
$rng.GetBytes($tokenBytes)
$token = [Convert]::ToBase64String($tokenBytes)
$rng.Dispose()
$token
```

Use a separate generated value for `JWT_SECRET`. The `AI_SERVICE_TOKEN` value must match the value in `ai-service/.env`.

Install dependencies and start the backend:

```powershell
cd backend
go mod download
go run ./cmd/server
```

The API will be available at `http://localhost:8080/api`.

## 3. Ollama setup

Download and install Ollama from [ollama.com](https://ollama.com/), then pull a model:

```powershell
ollama pull llama3.2:1b
ollama list
ollama run llama3.2:1b
```

Use `/bye` to exit the interactive Ollama prompt. Ollama normally continues running in the background.

For a more capable model on a computer with sufficient memory, use `llama3.2:3b` instead.

## 4. AI service setup

Create `ai-service/.env`:

```env
AI_SERVICE_TOKEN=replace-with-the-shared-ai-service-token
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2:1b
OLLAMA_TIMEOUT_SECONDS=120
OLLAMA_MAX_OUTPUT_TOKENS=500
```

The model name must match a model shown by `ollama list`.

Create the virtual environment, install packages, and start FastAPI:

```powershell
cd ai-service
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Verify the service:

```text
http://localhost:8000/health
```

The expected provider status is `ok`. Interactive API documentation is available at `http://localhost:8000/docs`.

## 5. Frontend setup

The `frontend/.env` file should contain:

```env
REACT_APP_API_URL=http://localhost:8080/api
```

Install packages and start React:

```powershell
cd frontend
npm install
npm start
```

Open `http://localhost:3000`.

## Recommended run order

Run each service in a separate terminal:

1. PostgreSQL
2. Ollama
3. Python AI service on port `8000`
4. Go backend on port `8080`
5. React frontend on port `3000`

## AI assistant flow

The floating AI button appears at the bottom-right of authenticated pages.

```text
React sends message + selected season ID
    ↓
Go validates JWT and loads authorized database context
    ↓
Go sends role, team, competition, match, and budget context
    ↓
FastAPI constructs the assistant prompt
    ↓
Ollama generates the response locally
```

The assistant is read-only. It can explain data and offer advice, but it cannot execute transfers, contracts, deletions, or budget changes.

## Tests and verification

Backend tests:

```powershell
cd backend
go test ./...
```

Frontend TypeScript check:

```powershell
cd frontend
npx tsc --noEmit
```

Frontend production build:

```powershell
cd frontend
npm run build
```

Python syntax check:

```powershell
cd ai-service
.\venv\Scripts\python.exe -m py_compile app\main.py app\assistant.py app\schemas.py
```

## Common issues

### AI service is unavailable

Confirm that Ollama and FastAPI are running:

```powershell
ollama list
Invoke-RestMethod http://localhost:8000/health
```

### AI service returns `401 Invalid service token`

Make sure `AI_SERVICE_TOKEN` is identical in:

- `backend/.env`
- `ai-service/.env`

Restart both services after changing environment files.

### Ollama reports `model_missing`

Pull the configured model and ensure its name matches `OLLAMA_MODEL`:

```powershell
ollama pull llama3.2:1b
ollama list
```

### Backend returns a database connection error

Confirm PostgreSQL is running and verify `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME` in `backend/.env`.

### Port already in use

Stop the previous process using the port before starting another instance of the same service.

## Security notes

- Never commit real `.env` files or credentials.
- Never place `AI_SERVICE_TOKEN`, `JWT_SECRET`, or database credentials in React.
- Use a long random `JWT_SECRET` in production.
- Keep Ollama and the Python AI service private in production deployments.
- Configure explicit CORS origins instead of allowing every origin.
- The backend rejects unsupported JWT signing algorithms.

## License

This project is intended for educational and portfolio use. Add a license file before distributing or using it commercially.
