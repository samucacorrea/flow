# Deploy Flowio on EasyPanel

The browser uses the same origin for the frontend and API (`/api`). Next.js forwards `/api/*` and `/install*` privately to Laravel, so the browser does not call `localhost:8000` and the login flow does not depend on permissive CORS settings.

## 1. Prepare the source

Push this repository to a Git provider that EasyPanel can access. The EasyPanel Compose source supports Git or inline Compose; Git is the practical choice here because the Compose file builds the frontend and backend from this repository.

In EasyPanel, create a project and a Compose service using:

- Source: your Git repository and branch
- Build Path: `/`
- Compose file: `compose.easypanel.yaml`

Do not use the older `deploy/docker-compose.yml` for this deployment. It publishes ports and mounts local source folders, which are intended for a different setup.

## 2. Add environment variables

In the Compose service's environment editor, add these variables before deploying:

```dotenv
FLOWIO_APP_NAME=Flowio
FLOWIO_APP_URL=https://flow.example.com
FLOWIO_APP_KEY=base64:REPLACE_WITH_GENERATED_KEY
FLOWIO_DB_NAME=flowio
FLOWIO_DB_USER=flowio
FLOWIO_DB_PASSWORD=REPLACE_WITH_A_LONG_RANDOM_PASSWORD
```

Use your real public hostname in `FLOWIO_APP_URL`, including `https://`. Generate a stable Laravel key with PHP:

```sh
php -r 'echo "base64:".base64_encode(random_bytes(32)).PHP_EOL;'
```

Copy the generated value into EasyPanel as `FLOWIO_APP_KEY`. Keep it stable across redeploys; changing it invalidates encrypted cookies and sessions. Keep the database password private. Never commit these values into the repository.

## 3. Deploy and connect the domain

Deploy/build the Compose service. In EasyPanel's domain settings, attach `flow.example.com` to service `frontend` on internal port `3000`, enable HTTPS/TLS, and point the domain's DNS `A` record to your server's public IP. Do not expose the database or backend ports publicly; EasyPanel and the Compose network route traffic internally.

## 4. Run the installer

Open `https://flow.example.com/install`. Use the same values configured above:

- Application URL: `https://flow.example.com`
- Database host: `db`
- Database port: `5432`
- Database name: the value of `FLOWIO_DB_NAME` (default `flowio`)
- Database username: the value of `FLOWIO_DB_USER` (default `flowio`)
- Database password: the value of `FLOWIO_DB_PASSWORD`
- Admin fields: choose your administrator name, email, and a unique strong password

The `db` hostname is the Compose service name, not `localhost` or `127.0.0.1`. The database volume and Laravel storage volume are persistent. Do not remove them during normal redeploys. Back up both volumes regularly.

## 5. Verify

- `https://flow.example.com/install` should show the installer until installation completes.
- `https://flow.example.com/api/health` should return JSON with `status: ok`.
- Sign in from `https://flow.example.com/login`; browser requests should go to `/api/login`, not `localhost:8000`.

If changing the frontend/API proxy configuration after the first build, redeploy with a rebuild so the Next.js rewrite destinations are regenerated. The production proxy target is `http://backend:8000` and the browser-facing API base is `/api`.

## Optional payment configuration

If billing is enabled, configure `STRIPE_KEY`, `STRIPE_SECRET`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_PRO`, and `STRIPE_PRICE_TEAM` as backend environment variables in EasyPanel. Set the Stripe webhook URL to `https://flow.example.com/api/stripe/webhook`.

## CORS and direct API access

This deployment avoids browser CORS preflight by proxying requests through the frontend origin. Keep `CORS_ALLOW_ALL=false`. If you later expose Laravel directly or use another frontend origin, set `FRONTEND_URLS` to the exact trusted origin(s), comma-separated; do not use `*` with credentials.
