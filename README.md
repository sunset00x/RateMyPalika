# ratemypalika
Nepal Municipality Performance & Civic Transparency Platform.

Stack: React + TypeScript + Vite, Express + TypeScript, PostgreSQL + Prisma.

## Setup
1. Create PostgreSQL database `ratemypalika`.
2. Copy  `server/.env` and set DATABASE_URL/JWT_SECRET.
3. `cd server && npm install && npx prisma migrate dev --name initial && npm run seed && npm run dev`
4. New terminal: `cd client && npm install && npm run dev`
