# Flowio Setup (Local)

## Prereqs
- PHP 8.3+
- Composer
- Node.js 20+
- Docker (optional, for Postgres)

## Backend (Laravel)
1. `cp backend/.env.example backend/.env`
2. Update database and Stripe variables in `backend/.env`.
   - Required: `STRIPE_KEY`, `STRIPE_SECRET`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_PRO`, `STRIPE_PRICE_TEAM`
   - Optional: `FRONTEND_URL` (defaults to `http://localhost:3000`)
3. Start Postgres (optional): `docker-compose up -d`
4. Install dependencies: `cd backend && composer install`
5. Run migrations: `php artisan migrate`
6. Start API: `php artisan serve`

## Frontend (Next.js)
1. `cp frontend/.env.example frontend/.env.local`
2. Install dependencies: `cd frontend && npm install`
3. Start dev server: `npm run dev`

## Notes
- API base URL is read from `NEXT_PUBLIC_API_URL`.
- Stripe webhooks hit `POST /api/stripe/webhook`.
