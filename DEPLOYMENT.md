# 🚀 Deployment Guide: AI Interview Preparation Portal

This guide provides step-by-step instructions to deploy the AI Interview Preparation Portal live on the web for free using **Render**.

---

## 🌟 Quick Overview: Unified Architecture

The application is packaged with a multi-stage Docker build:
- **Frontend**: React + Vite compiled into a high-performance static SPA.
- **Backend**: FastAPI serving REST endpoints and serving the frontend from `/` with client-side SPA routing.
- **All on One URL**: No cross-origin CORS hassles, no separate hosting fees, and automatic free HTTPS/SSL certificates.

---

## ⚡ Method 1: Deploy on Render via Blueprint (Fastest — 2 Minutes)

1. **Sign in to Render**:
   - Go to [render.com](https://render.com/) and click **Sign Up** or **Sign In** with your GitHub account.

2. **Create New Blueprint Instance**:
   - In the Render Dashboard, click the **New +** button in the top navigation bar.
   - Select **Blueprint**.

3. **Connect Your GitHub Repository**:
   - Select your repository: `Daraniedaran/ai-interview-preparation`.
   - Render will detect the [`render.yaml`](render.yaml) file automatically.

4. **Review & Deploy**:
   - Render displays the service specifications:
     - **Name**: `ai-interview-portal`
     - **Runtime**: `Docker`
     - **Plan**: `Free`
     - **Region**: `Oregon` (or closest to you)
   - Click **Apply**.
   - Render will pull the repository, build the multi-stage Docker container (compiling React and setting up Python), seed the database, and launch your website!
   - Once the build log says `Application startup complete`, your app is live at `https://<your-service-name>.onrender.com`!

---

## 🛠️ Method 2: Deploy Manually as a Web Service on Render

If you prefer to configure the Web Service manually:

1. Go to your [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** -> **Web Service**.
3. Choose **Build and deploy from a Git repository**.
4. Select `Daraniedaran/ai-interview-preparation`.
5. Fill in the following settings:
   - **Name**: `ai-interview-portal` (or any name you prefer)
   - **Region**: Nearest to your users (e.g., `Singapore`, `Frankfurt`, or `Oregon`)
   - **Branch**: `main`
   - **Language / Runtime**: `Docker`
   - **Dockerfile Path**: `./Dockerfile`
   - **Instance Type**: `Free`
6. Under **Environment Variables**, add:
   | Key | Value | Notes |
   |-----|-------|-------|
   | `ENVIRONMENT` | `production` | Production mode |
   | `DEBUG` | `false` | Disable debug logs |
   | `SECRET_KEY` | *(Click "Generate" or use 32 random chars)* | JWT encryption key |
   | `DATABASE_URL` | `sqlite:///./ai_interview.db` | Default SQLite database |
   | `ALLOWED_ORIGINS` | `*` | Or your exact domain |
7. Under **Advanced**:
   - **Health Check Path**: `/health`
8. Click **Create Web Service**.

---

## 🔑 Default Accounts (Pre-Seeded)

The application automatically seeds demonstration accounts upon first launch:

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@aiinterview.com` | `Admin@123` |
| **Student** | `student@aiinterview.com` | `Student@123` |

You can also register any new student account directly from the register page.

---

## 🗄️ Optional: Add Persistent PostgreSQL Database (Render Free Tier)

Render free web services use ephemeral storage (data in SQLite resets if the free service spins down after 15 minutes of inactivity). To persist data permanently:

1. In the Render Dashboard, click **New +** -> **PostgreSQL**.
2. Set a database name (e.g. `ai-interview-db`) and select the **Free** tier.
3. Once provisioned, copy the **Internal Database URL** (e.g., `postgres://user:pass@dpg-xxx:5432/db_name`).
4. Go to your `ai-interview-portal` Web Service -> **Environment**.
5. Change `DATABASE_URL` to your PostgreSQL URL (ensure the prefix starts with `postgresql://` instead of `postgres://`).
6. Save changes — Render will automatically redeploy with permanent database persistence!

---

## 🤖 Optional: Enable External Services

In the Render Web Service **Environment** tab, you can add your API keys:

- `OPENAI_API_KEY`: For real OpenAI mock interviews and resume reviews. *(If omitted, the platform gracefully falls back to intelligent mock AI responses).*
- `JUDGE0_API_KEY`: For live remote code execution.
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`: For cloud image and resume file storage.

---

## 💡 Notes on Render Free Tier

- **Cold Starts**: On the Render free tier, web services spin down after 15 minutes of inactivity. When a new request arrives, it may take 30–50 seconds to wake up. This is standard behavior for free hosting.
- **Custom Domains**: Render allows you to add custom domains (e.g., `myinterviewportal.com`) with automated free SSL under the **Settings** tab.
