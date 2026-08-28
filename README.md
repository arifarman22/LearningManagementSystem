# LMS — Learning Management System

A full-stack Learning Management System built with **Next.js 15** (frontend) and **Strapi 5** (backend), backed by **PostgreSQL**.

**Live stack:**
- Frontend → https://learning-management-system-flax-ten.vercel.app
- Backend → https://learningmanagementsystem-production-d309.up.railway.app
- Database → Neon PostgreSQL

---

## Table of Contents

1. [Project Structure](#project-structure)
2. [Local Development Setup](#local-development-setup)
3. [Environment Variables](#environment-variables)
4. [Production Deployment](#production-deployment)
   - [PostgreSQL Setup](#1-postgresql-setup-railway)
   - [Backend on Railway](#2-backend-on-railway)
   - [Frontend on Vercel](#3-frontend-on-vercel)
5. [Post-Deployment Verification](#post-deployment-verification)
6. [Demo Accounts](#demo-accounts)
7. [Role Verification Guide](#role-verification-guide)

---

## Project Structure

```
/
├── backend/          # Strapi 5 API
│   ├── config/       # Database, server, CORS, plugins config
│   ├── src/api/      # Custom API controllers & routes
│   └── .env.example  # Backend env template
├── frontend/         # Next.js 15 app
│   ├── src/app/      # App router pages
│   ├── src/components/
│   └── .env.example  # Frontend env template
└── README.md
```

---

## Local Development Setup

### Prerequisites

- Node.js >= 20
- PostgreSQL running locally (or use a free [Neon](https://neon.tech) / [Supabase](https://supabase.com) database)
- npm >= 6

### 1. Clone the repository

```bash
git clone https://github.com/arifarman22/LearningManagementSystem.git
cd LearningManagementSystem
```

### 2. Set up the backend

```bash
cd backend
npm install
cp .env.example .env
```

Edit `backend/.env` — set your local PostgreSQL credentials:

```env
DATABASE_HOST=127.0.0.1
DATABASE_PORT=5432
DATABASE_NAME=lms_dev
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=your_password
```

Generate secrets (run once each):

```bash
# Run this command 4 times for APP_KEYS, once for each other secret
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Start the backend:

```bash
npm run develop
# Strapi starts at http://localhost:1337
# Admin panel at http://localhost:1337/admin
```

On first run, Strapi will prompt you to create an admin account.

### 3. Set up the frontend

```bash
cd ../frontend
npm install
cp .env.example .env.local
```

`frontend/.env.local` defaults are already correct for local dev:

```env
NEXT_PUBLIC_API_URL=http://localhost:1337/api
NEXT_PUBLIC_STRAPI_URL=http://localhost:1337
```

Start the frontend:

```bash
npm run dev
# Next.js starts at http://localhost:3000
```

### 4. Configure Strapi permissions

In the Strapi admin panel (`http://localhost:1337/admin`):

1. Go to **Settings → Users & Permissions → Roles**
2. For the **Public** role, enable:
   - `course.find`, `course.findOne`
   - `blog-post.find`, `blog-post.findOne`, `blog-post.getBySlug`
   - `admin-panel.getPublicStats`
3. For the **Authenticated** role, enable all endpoints your students need.

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `HOST` | Yes | Bind address. Use `0.0.0.0` |
| `PORT` | Yes | Port. Default `1337` |
| `APP_KEYS` | Yes | 4 comma-separated random base64 strings |
| `API_TOKEN_SALT` | Yes | Random base64 string |
| `ADMIN_JWT_SECRET` | Yes | Random base64 string |
| `JWT_SECRET` | Yes | Random base64 string |
| `TRANSFER_TOKEN_SALT` | Yes | Random base64 string |
| `ENCRYPTION_KEY` | Yes | Random base64 string |
| `JWT_EXPIRES_IN` | No | Default `7d` |
| `DATABASE_URL` | Prod | Full Postgres connection string. Overrides individual fields. Railway sets this automatically |
| `DATABASE_HOST` | Local | Postgres host |
| `DATABASE_PORT` | Local | Postgres port. Default `5432` |
| `DATABASE_NAME` | Local | Database name |
| `DATABASE_USERNAME` | Local | Database user |
| `DATABASE_PASSWORD` | Local | Database password |
| `DATABASE_SSL` | No | `true` in production |
| `DATABASE_SSL_REJECT_UNAUTHORIZED` | No | `false` for Railway/Neon |
| `CORS_ORIGIN` | Yes | Comma-separated allowed origins. Set to your Vercel URL in production |

### Frontend (`frontend/.env.local`)

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Yes | Strapi API URL with `/api` suffix |
| `NEXT_PUBLIC_STRAPI_URL` | Yes | Strapi base URL without `/api` — used for media |

---

## Production Deployment

### 1. PostgreSQL Setup (Railway)

1. Log in to [Railway](https://railway.app) and create a new project.
2. Click **+ New** → **Database** → **PostgreSQL**.
3. Railway provisions the database and sets `DATABASE_URL` automatically.
4. Note the `DATABASE_URL` from the **Variables** tab — you'll need it for the backend service.

> **Alternative:** Use [Neon](https://neon.tech) (free tier). Create a project, copy the connection string, and set it as `DATABASE_URL` in the backend.

---

### 2. Backend on Railway

#### a. Create the service

1. In your Railway project, click **+ New** → **GitHub Repo**.
2. Select your repository.
3. Set the **Root Directory** to `backend`.
4. Railway will auto-detect Node.js.

#### b. Set build & start commands

In the service **Settings → Deploy**:

```
Build Command:  npm run build
Start Command:  npm run start
```

#### c. Set environment variables

In the service **Variables** tab, add every variable from the table above.

**Generate production secrets** (run locally, copy output):

```bash
node -e "
const c = require('crypto');
console.log('APP_KEYS=' + [1,2,3,4].map(() => c.randomBytes(32).toString('base64')).join(','));
console.log('API_TOKEN_SALT=' + c.randomBytes(32).toString('base64'));
console.log('ADMIN_JWT_SECRET=' + c.randomBytes(32).toString('base64'));
console.log('JWT_SECRET=' + c.randomBytes(32).toString('base64'));
console.log('TRANSFER_TOKEN_SALT=' + c.randomBytes(32).toString('base64'));
console.log('ENCRYPTION_KEY=' + c.randomBytes(32).toString('base64'));
"
```

**Minimum required variables for Railway:**

```env
HOST=0.0.0.0
PORT=1337
APP_KEYS=<generated>
API_TOKEN_SALT=<generated>
ADMIN_JWT_SECRET=<generated>
JWT_SECRET=<generated>
TRANSFER_TOKEN_SALT=<generated>
ENCRYPTION_KEY=<generated>
JWT_EXPIRES_IN=7d
DATABASE_URL=<from Railway PostgreSQL plugin>
DATABASE_SSL=true
DATABASE_SSL_REJECT_UNAUTHORIZED=false
CORS_ORIGIN=https://your-app.vercel.app
```

> Set `CORS_ORIGIN` to your Vercel URL **before** deploying the frontend. You can update it after.

#### d. Deploy

Railway deploys automatically on push to `main`. Trigger a manual deploy from the dashboard if needed.

Your backend URL will be: `https://<service-name>.up.railway.app`

#### e. Create Strapi admin account

Visit `https://<service-name>.up.railway.app/admin` and create your admin account on first run.

---

### 3. Frontend on Vercel

#### a. Import the project

1. Go to [vercel.com](https://vercel.com) → **Add New Project**.
2. Import your GitHub repository.
3. Set **Root Directory** to `frontend`.
4. Framework preset: **Next.js** (auto-detected).

#### b. Set environment variables

In **Project Settings → Environment Variables**, add:

```env
NEXT_PUBLIC_API_URL=https://<your-backend>.up.railway.app/api
NEXT_PUBLIC_STRAPI_URL=https://<your-backend>.up.railway.app
```

#### c. Deploy

Click **Deploy**. Vercel builds and deploys automatically.

Your frontend URL will be: `https://<project-name>.vercel.app`

#### d. Update backend CORS

Go back to Railway → backend service → Variables, and update:

```env
CORS_ORIGIN=https://<project-name>.vercel.app
```

Redeploy the backend (Railway auto-redeploys on variable change).

---

## Post-Deployment Verification

Work through this checklist after deploying:

### Backend health

- [ ] `GET https://<backend>.up.railway.app/api/courses` returns `200` with JSON
- [ ] `GET https://<backend>.up.railway.app/admin` loads the Strapi admin panel
- [ ] Strapi admin login works with your admin credentials
- [ ] `GET https://<backend>.up.railway.app/api/admin-panel/public-stats` returns `{ data: { enrollments, courses, instructors } }`

### Frontend health

- [ ] `https://<frontend>.vercel.app` loads the landing page
- [ ] Landing page stat counters show real numbers (not 0)
- [ ] Course cards appear in the "Popular courses" section
- [ ] `/login` and `/register` pages load correctly
- [ ] Clicking the LMS logo on login/register redirects to `/`

### Auth flow

- [ ] Register a new account → redirected to correct dashboard
- [ ] Login with existing account → redirected to correct dashboard
- [ ] Logout → redirected to `/login`
- [ ] Accessing `/dashboard` while logged out → redirected to `/login`

### CORS

- [ ] No CORS errors in browser console when the frontend calls the backend
- [ ] Network tab shows `Access-Control-Allow-Origin` header on API responses

### Role-based routing

- [ ] Admin → lands on `/admin/dashboard`
- [ ] Instructor → lands on `/instructor`
- [ ] Content Manager → lands on `/content`
- [ ] Student → lands on `/student/dashboard`

---

## Demo Accounts

Use these credentials to test the live deployment at https://learning-management-system-flax-ten.vercel.app

### Test accounts

| Role | Email | Password | Dashboard |
|---|---|---|---|
| Admin | `admin@test.com` | `Test1234!` | `/admin/dashboard` |
| Instructor | `instructor@test.com` | `Test1234!` | `/instructor` |
| Content Manager | `content@test.com` | `Test1234!` | `/content` |
| Student | `student@test.com` | `Test1234!` | `/student/dashboard` |

### Strapi admin panel

- URL: https://learningmanagementsystem-production-d309.up.railway.app/admin
- Email: `arifarman7862@gmail.com`

### How to assign roles (for new accounts)

1. Log in to Strapi admin
2. Go to **Content Manager → User**
3. Find the user → click **Edit**
4. Change the **Role** field → **Save**

---

## Role Verification Guide

Test each role end-to-end after deployment:

### Admin
1. Log in as `admin@test.com`
2. Should land on `/admin/dashboard` with platform stats
3. Navigate to `/admin/users` — should see all users and be able to change roles
4. Navigate to `/admin/courses`, `/admin/blog`, `/admin/quizzes`
5. Sidebar should show: Dashboard, Users, Content, All Courses, Blog Posts, Quizzes, Blog

### Instructor
1. Log in as `instructor@test.com`
2. Should land on `/instructor` with course stats
3. Navigate to `/instructor/courses` — should see only their own courses
4. Create a new course at `/instructor/courses/new`
5. Sidebar should show: Dashboard, My Courses

### Content Manager
1. Log in as `content@test.com`
2. Should land on `/content` with content stats
3. Navigate to `/content/courses` — should see all courses with edit access
4. Navigate to `/content/blog` — should see all blog posts
5. Sidebar should show: Dashboard, Courses, Blog
6. Should NOT see `/admin/*` routes

### Student
1. Log in as `student@test.com`
2. Should land on `/student/dashboard`
3. Browse courses at `/courses` and enroll in one
4. Navigate to `/my-learning` — enrolled course should appear with progress
5. Complete a lesson — progress bar should update
6. Take a quiz — result should appear on dashboard
7. Sidebar should show: Dashboard, My Learning, Courses, Blog

---

## Security Notes

- All secrets in `.env` / `.env.local` are gitignored — never commit them
- Rotate all Strapi secrets before production deployment
- Use a strong, unique `JWT_SECRET` in production
- Set `DATABASE_SSL=true` for all production database connections
- `CORS_ORIGIN` must be set to your exact Vercel URL — wildcard `*` is not used
- The Strapi admin panel should be protected with a strong password
