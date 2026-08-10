# 🎯 AI Interview Preparation Portal

A modern, production-ready, AI-powered Interview Preparation Platform for campus placements and software engineering interviews.

---

## 🚀 Tech Stack

### Frontend
- **React.js** + **Vite** — Fast development and build
- **Tailwind CSS** — Utility-first styling
- **React Router v6** — Client-side routing
- **Axios** + **React Query** — API calls & server state
- **React Hook Form** — Form handling
- **Chart.js** — Analytics charts
- **Framer Motion** — Smooth animations
- **Monaco Editor** — VS Code-grade code editor

### Backend
- **FastAPI** — High-performance Python REST API
- **SQLAlchemy** — ORM (SQLite by default; PostgreSQL supported via `DATABASE_URL`)
- **Pydantic** — Data validation
- **JWT** — Authentication (access + refresh tokens)

### AI & Integrations
- **OpenAI API** — Resume review, mock interviews, feedback
- **Cloudinary** — File/image uploads
- **Judge0 API** — Code execution
- **SMTP** — Email notifications

---

## 📦 Prerequisites

- **Python** 3.11+
- **Node.js** 18+
- PostgreSQL 15+ (optional — SQLite is used by default, no external DB server required)

---

## ⚙️ Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate      # Windows
# source venv/bin/activate # Linux/Mac

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your credentials

# Tables are auto-created on startup in DEBUG mode (SQLite dev default).
# Optionally seed sample data:
python seed.py

# Start the server
uvicorn main:app --reload --port 8000
```

API docs available at: http://localhost:8000/docs

---

## 🎨 Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local — set VITE_API_URL=http://localhost:8000/api/v1

# Start development server
npm run dev
```

App available at: http://localhost:5173

---

## 🔑 Environment Variables

### Backend (`.env`)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | SQLAlchemy connection string (SQLite by default; PostgreSQL optional) |
| `SECRET_KEY` | JWT secret key (generate with `openssl rand -hex 32`) |
| `OPENAI_API_KEY` | OpenAI API key for AI features (app falls back to mock responses if missing) |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `SMTP_HOST` | SMTP server host |
| `SMTP_PORT` | SMTP port (587 for TLS) |
| `SMTP_USER` | SMTP username |
| `SMTP_PASSWORD` | SMTP password |
| `JUDGE0_API_KEY` | Judge0 API key for code execution |

### Frontend (`.env.local`)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API base URL |

---

## 📁 Project Structure

```
AI Interview Preparation Portal/
├── frontend/               # React + Vite frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Route-level pages
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # Axios API services
│   │   ├── context/        # Auth & Theme context
│   │   └── utils/          # Helpers & constants
│   └── package.json
│
├── backend/                # FastAPI backend
│   ├── app/
│   │   ├── routers/        # API endpoints (17 modules)
│   │   ├── models/         # SQLAlchemy models (20 tables)
│   │   ├── schemas/        # Pydantic schemas
│   │   ├── services/       # Business logic
│   │   ├── core/           # Config, JWT, security
│   │   ├── database/       # DB connection + lightweight auto-migrations
│   │   ├── middleware/      # CORS, logging
│   │   └── utils/          # Email, AI, helpers
│   ├── seed.py             # Sample data seeder
│   └── main.py
│
└── README.md
```

---

## 🎯 Features

### Student
- 📝 Registration, Login, Email Verification
- 📄 AI Resume Review (score, ATS, improvements)
- 🧠 Aptitude Practice (5 categories, 3 difficulties)
- 💻 Coding Challenges (Python, Java, C++, JS, SQL)
- 🤖 AI Mock Interviews (Behavioral, Technical, HR)
- 🏢 Company-wise Interview Preparation
- 📊 Progress Tracking & Analytics
- 🏆 Leaderboard & Achievements
- 🃏 Flashcards & Study Planner
- 💬 Discussion Forum

### Admin
- 📈 Dashboard with stats & charts
- 👥 User management
- ❓ Question & coding problem management
- 🏢 Company management
- 📋 Interview management
- 📊 Reports & analytics

---

## 🔒 Security

- Bcrypt password hashing
- JWT access tokens (15 min) + refresh tokens (7 days)
- Role-based access control (Student / Admin)
- Rate limiting on auth endpoints
- Input validation via Pydantic
- CORS configuration
- SQL injection protection (SQLAlchemy ORM)

---

## 📚 API Documentation

After starting the backend, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

---

## 🧪 Running Tests

```bash
cd backend
# End-to-end API smoke test (starts a server, runs checks, stops it)
powershell -ExecutionPolicy Bypass -File run_tests.ps1
```

---

## 🎨 Color Palette

| Color | Hex |
|-------|-----|
| Primary | `#2563EB` |
| Secondary | `#0EA5E9` |
| Success | `#10B981` |
| Warning | `#F59E0B` |
| Danger | `#EF4444` |
| Background | `#F8FAFC` |
| Dark | `#111827` |

---

## 📄 License

MIT License — Built for educational purposes.
