# AI Trip Planner — Frontend

A React 18 + TypeScript/Vite client for the AI Trip Planner backend. It presents streaming itinerary generation, explicit connection/parsing/error states, RAG indicators, and shareable saved trips.

## Demo / status

A public frontend URL is **pending verification**; the README intentionally does not claim a live demo. The backend repository is [ai-trip-planner-backend](https://github.com/Yashsh101/ai-trip-planner-backend).

## Architecture

```mermaid
flowchart LR
  A[Trip form] --> B[API client]
  B --> C[POST /api/v1/itinerary/generate]
  C --> D[SSE parser]
  D --> E[State machine: connect / enrich / stream / parse / done / error]
  E --> F[Itinerary UI + RAG badges]
  F --> G[/trip/:id saved itinerary]
```

The SSE contract is implemented in `src/hooks/useSSEItinerary.ts` with `fetch`, `ReadableStream`, and `TextDecoder`. Cached JSON responses from the backend are also normalized.

## Quickstart

### 1. Clone and install

```bash
git clone https://github.com/Yashsh101/ai-trip-planner-frontend.git
cd ai-trip-planner-frontend
npm ci
```

### 2. Configure

```bash
cp .env.example .env
# Set VITE_API_BASE_URL to the backend origin when services are separate.
```

`VITE_GENERATE_PATH` defaults to `/api/v1/itinerary/generate`. Do not put private backend or provider keys in Vite variables; browser-exposed variables are public.

### 3. Run

```bash
npm run dev
```

Open the Vite URL shown in the terminal.

## Verification

```bash
npm ci
npm run lint
npm run type-check
npm run build
```

CI runs the same checks and a Docker build. No live itinerary generation is claimed in this repository because it requires configured provider credentials and can consume quota.

## Backend contract

The selected backend route is `POST /api/v1/itinerary/generate`. It returns either cached JSON (`{ "itinerary": ... }`) or SSE events for metadata, tokens, completion, and errors. The frontend also supports `/trip/:id` lookup through the current backend trip route.

## Limitations and roadmap

- No verified public frontend deployment URL is recorded.
- End-to-end generation requires a running backend and provider credentials.
- Add a contract fixture covering SSE meta/token/done/error events.
- Add browser-level tests for timeout, malformed events, and saved-trip loading.
- Add a verified screenshot or GIF only after deployment and current UI behavior are checked.

## License

MIT — see [`LICENSE`](LICENSE).
