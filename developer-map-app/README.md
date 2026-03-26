## World Map of Developers

Premium interactive map experience where developers appear as glowing points across the globe.

## Environment Setup

1. Copy `.env.example` to `.env.local`
2. Keep real secrets only in `.env.local`

```bash
cp .env.example .env.local
```

Set these variables:

- `DATABASE_URL=file:./dev.db` → local sqlite database
- `X_LIVE_MODE=false` → mock demo mode (default and safe)
- `X_LIVE_MODE=true` → enables live X integration path
- `X_BEARER_TOKEN=...` → required when `X_LIVE_MODE=true`
- `INGEST_API_TOKEN=...` → protects `/api/x/ingest`
- `X_TARGET_TWEET_ID=...` → tweet conversation to sync from X
- `ADMIN_API_TOKEN=...` → protects moderation admin endpoints
- `MODERATION_MODE=true` → submissions enter pending queue
- `SUBMISSION_COOLDOWN_SECONDS=20` → anti-spam per-user cooldown

Important:

- Never commit `.env.local`
- Never expose server token with `NEXT_PUBLIC_` prefix
- If token leaks, rotate immediately

## Getting Started

Install dependencies and run dev server:

```bash
npm install
npm run db:generate
npm run db:push
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

If `X_LIVE_MODE=true` without `X_BEARER_TOKEN`, the API returns a guarded error by design.

## Backend Skeleton Included

- Prisma schema: `prisma/schema.prisma`
- DB models:
  - `Developer`
  - `Submission`
- Prisma client singleton: `lib/prisma.ts`
- Country parser service: `lib/country-parser.ts`
- Geocoding service: `lib/geocode.ts`
- Submission pipeline: `lib/submission-service.ts`
- SSE event bus: `lib/live-events.ts`

## API Routes

- `GET /api/developers`
  - initial map payload
  - merges DB data and mock demo depending on mode
- `POST /api/submissions`
  - accepts a single comment payload
  - parses country + geocodes + stores submission
  - auto-approve or queue for moderation based on `MODERATION_MODE`
- `POST /api/x/ingest`
  - batch ingest endpoint for worker/webhook adapters
  - protected by `Authorization: Bearer <INGEST_API_TOKEN>`
- `POST /api/x/sync`
  - pulls latest replies from X recent-search API
  - stores them as moderated submissions (`PENDING`)
  - protected by `Authorization: Bearer <INGEST_API_TOKEN>`
- `GET /api/live/stream`
  - SSE stream for real-time join events (`developer-joined`)
- `POST /api/mock/pulse`
  - pushes one simulated join into pipeline (used by mock mode)
- `GET /api/admin/submissions`
  - returns pending queue + moderation stats
  - protected by `x-admin-token` header
- `PATCH /api/admin/submissions/:id`
  - approve/reject pending submission
  - protected by `x-admin-token` header

## Admin Moderation UI

- Open `/admin`
- Paste `ADMIN_API_TOKEN`
- Load queue and approve/reject pending submissions
- Approving emits SSE event and instantly updates live map

## Quick Manual Test (Real Event Path)

Open one terminal for app:

```bash
npm run dev
```

Then trigger a real backend event:

```bash
curl -X POST http://localhost:3000/api/submissions ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"@testdev\",\"text\":\"Serbia\"}"
```

If `MODERATION_MODE=false`, you should immediately see:
- new glowing point on map
- counter update
- latest join panel update

If `MODERATION_MODE=true`, the submission enters pending queue.
Approve it in `/admin` to push live map event.

## Trigger X Sync Worker

Manually trigger X fetch + queue:

```bash
curl -X POST http://localhost:3000/api/x/sync ^
  -H "Authorization: Bearer YOUR_INGEST_API_TOKEN"
```

## Deploy

Deploy on [Vercel](https://vercel.com/) and set environment variables in project settings.

Use Next.js deployment docs for production hardening:
[https://nextjs.org/docs/app/building-your-application/deploying](https://nextjs.org/docs/app/building-your-application/deploying)
