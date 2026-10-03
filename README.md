# AI Trip Planner — Frontend

![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue)

> React frontend for the AI Trip Planner, built at **Google Gen AI Exchange Hackathon 2025** and rebuilt into a streaming UI.

**Live Demo:** add the Netlify URL after deployment  
**Backend API:** [AI Trip Planner Backend](https://github.com/Yashsh101/ai-trip-planner-backend)

## What this UI does that generic AI apps do not

- **Real-time streaming:** itinerary tokens appear as Gemini generates them.
- **RAG visibility:** activities show a `RAG` badge when grounded in retrieved knowledge.
- **Live status machine:** connecting, enriching, streaming, parsing, done, and error states are explicit.
- **Shareable trips:** saved itineraries load from `/trip/:id`.

## Stack

React 18 · TypeScript strict · Vite · React Query · Google Maps JS API

## Local dev

```bash
git clone https://github.com/Yashsh101/ai-trip-planner-frontend
cd ai-trip-planner-frontend
cp .env.example .env
npm install
npm run dev
```

Set `VITE_API_BASE_URL` to the backend URL before testing generation. The default path is the current backend contract: `POST /api/v1/itinerary/generate` (SSE, with cached JSON responses also supported).

## Architecture note

The SSE stream is consumed by `src/hooks/useSSEItinerary.ts`, a custom hook with a clear state machine. It uses `fetch`, a `ReadableStream` reader, and `TextDecoder`, so there is no separate SSE client library.
