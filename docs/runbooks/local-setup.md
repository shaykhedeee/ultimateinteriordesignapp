# Local Development Setup

## Setup Order

Run these steps **in this order** each time.

### Step 1 — install dependencies

```bash
pnpm install
```

### Step 2 — bring up infra/services

```bash
docker compose -f infra/docker/compose/docker-compose.local.yml up -d
```

### Step 3 — run DB migrations

```bash
pnpm --filter db migrate
```

### Step 4 — seed dev org + users + feature flags

```bash
pnpm --filter db seed
```

### Step 5 — pull local models if using Ollama

```bash
ollama pull qwen2.5vl
ollama pull smolvlm2
```

### Step 6 — start apps if not running in compose

```bash
pnpm --filter api dev
pnpm --filter worker dev
pnpm --filter web dev
```

### Step 7 — verify health

- web: http://localhost:3000
- api: http://localhost:4000/health
- vision: http://localhost:5000/health
- inference-gateway: http://localhost:7000/health
- minio console: http://localhost:9001

## Compose Profiles

Use profiles to run lightweight subsets:

```bash
docker compose --profile core up
```

Profiles:
- `core`
- `ai`
- `monitoring`
- `admin`

## Health Endpoints

| Service | Path | Required |
|---------|------|----------|
| Web | `/healthz` | optional |
| API | `GET /health`, `/ready`, `/live` | required |
| Worker | `GET /health` | optional |
| Vision | `GET /health`, `/ready` | required |
| Inference Gateway | `GET /health`, `/providers/status` | required |
