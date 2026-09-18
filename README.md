# ratemypalika
Nepal Municipality Performance & Civic Transparency Platform.

Stack: React + TypeScript + Vite, Express + TypeScript, PostgreSQL + Prisma.

## Setup
1. Create PostgreSQL database `ratemypalika`.
2. Copy `server/.env.example` to `server/.env` and set DATABASE_URL/JWT_SECRET.
3. `cd server && npm install && npx prisma migrate dev --name initial && npm run seed && npm run dev`
4. New terminal: `cd client && npm install && npm run dev`

This package contains the Phase 1-10 architecture. It includes a development seed, not fabricated nationwide performance data. Import verified Nepal administrative data before production use.
