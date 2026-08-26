# LMS Backend

Strapi 5 REST API backend for the Learning Management System.

**Stack:** Strapi 5 · TypeScript · PostgreSQL · Railway

---

## Local Development Setup

### Prerequisites

- Node.js >= 20
- PostgreSQL running locally
- A database named `lms_dev` (or configure your own via `.env`)

### 1. Install dependencies

```bash
cd backend
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` and set your local PostgreSQL credentials:

```
DATABASE_HOST=127.0.0.1
DATABASE_PORT=5432
DATABASE_NAME=lms_dev
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=yourpassword
```

### 3. Start in development mode

```bash
npm run develop
```

Strapi will start at **http://localhost:1337**

The admin panel is at **http://localhost:1337/admin**

On first run, Strapi will prompt you to create an admin account.

### 4. Build for production

```bash
npm run build
npm run start
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `HOST` | Yes | Server bind address. Use `0.0.0.0` for Railway |
| `PORT` | Yes | Server port. Default `1337` |
| `APP_KEYS` | Yes | Comma-separated session keys. Generate 4 random base64 strings |
| `API_TOKEN_SALT` | Yes | Salt for API token hashing |
| `ADMIN_JWT_SECRET` | Yes | Secret for admin panel JWTs |
| `JWT_SECRET` | Yes | Secret for Users & Permissions JWTs |
| `TRANSFER_TOKEN_SALT` | Yes | Salt for data transfer tokens |
| `ENCRYPTION_KEY` | Yes | Key for field-level encryption |
| `JWT_EXPIRES_IN` | No | JWT expiry duration. Default `7d` |
| `DATABASE_CLIENT` | Yes | Must be `postgres` |
| `DATABASE_HOST` | Yes (local) | PostgreSQL host |
| `DATABASE_PORT` | Yes (local) | PostgreSQL port. Default `5432` |
| `DATABASE_NAME` | Yes (local) | Database name |
| `DATABASE_USERNAME` | Yes (local) | Database user |
| `DATABASE_PASSWORD` | Yes (local) | Database password |
| `DATABASE_SSL` | No | Enable SSL. Set `true` in production |
| `DATABASE_URL` | Yes (prod) | Full PostgreSQL connection string. Overrides individual fields. Railway sets this automatically |
| `CORS_ORIGIN` | Yes | Comma-separated allowed frontend origins |

> **Security:** Never commit `.env`. All secrets must be rotated before production deployment.

---

## Generating Secrets

```bash
node -e "console.log(require('crypto').randomBytes(16).toString('base64'))"
```

Run this 4 times for `APP_KEYS`, and once each for the remaining secret fields.

---

## API Authentication

Strapi's built-in **Users & Permissions** plugin handles authentication.

| Endpoint | Method | Description |
|---|---|---|
| `/api/auth/local/register` | POST | Register a new user |
| `/api/auth/local` | POST | Login — returns JWT |
| `/api/users/me` | GET | Get current user (requires `Authorization: Bearer <token>`) |

---

## Production Deployment (Railway)

1. Push the `backend/` directory to a Railway service
2. Set all environment variables in the Railway dashboard
3. Railway automatically provides `DATABASE_URL` when a PostgreSQL plugin is attached
4. Set `DATABASE_SSL=true` for Railway PostgreSQL
5. Set `CORS_ORIGIN` to your Vercel frontend URL
6. Railway runs `npm run start` by default — ensure `npm run build` runs first (set as build command)

**Railway build command:** `npm run build`  
**Railway start command:** `npm run start`
