# EduAdmin

**A Comprehensive Teacher Administration Platform**

Stack: Python 3.12 · Django 5 · React 18 · PostgreSQL 16 · Redis 7

---

## Quick Start

### Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Python | 3.12+ | Backend runtime |
| Node.js | 20 LTS | Frontend tooling |
| PostgreSQL | 16 | Primary database |
| Redis | 7 | Cache + task queue |

### 1. Clone & Setup

```bash
git clone https://github.com/yourorg/eduadmin.git
cd eduadmin

# Create virtual environment
python3.12 -m venv venv
source venv/bin/activate  # Mac/Linux
# .\venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements/base.txt
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your database credentials and secret key
```

### 3. Database Setup

```bash
# Create the database
psql -U postgres -c "CREATE DATABASE eduadmin;"

# Run migrations (AUTH_USER_MODEL is already set)
python manage.py makemigrations accounts
python manage.py makemigrations schools
python manage.py makemigrations planning learners assessments behaviour reflections
python manage.py migrate

# Create admin user
python manage.py createsuperuser
```

### 4. Run Development Server

```bash
python manage.py runserver
# Open http://127.0.0.1:8000/admin
```

### 5. Run Background Workers (separate terminals)

```bash
celery -A config worker --loglevel=info
celery -A config beat --loglevel=info
```

### 6. Frontend (when ready)

```bash
cd frontend
npx create-react-app . --template typescript
npm install axios @reduxjs/toolkit react-redux react-router-dom tailwindcss lucide-react
npm start
```

---

## Project Structure

```
eduadmin/
├── apps/
│   ├── accounts/       # Users, roles, JWT auth
│   ├── schools/        # School, Grade, Class, Timetable
│   ├── planning/       # Lesson plans, curriculum
│   ├── learners/       # Learner profiles, attendance
│   ├── assessments/    # Marks, exams, invigilation
│   ├── behaviour/      # Logs, flags, escalations
│   ├── resources/      # File library, S3 uploads
│   ├── reflections/    # Reflections, to-dos, carry-overs
│   ├── calendar_events/# School calendar, events
│   ├── analytics/      # Dashboards, reports
│   └── notifications/  # Email, push, WebSocket alerts
├── config/
│   ├── settings/
│   │   ├── base.py
│   │   ├── development.py
│   │   └── production.py
│   ├── urls.py
│   ├── celery.py
│   └── wsgi.py
├── requirements/
├── frontend/           # React app (created separately)
├── .github/workflows/  # CI/CD pipeline
├── Dockerfile
├── docker-compose.yml
└── manage.py
```

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/auth/login/` | POST | Get JWT tokens |
| `/api/v1/auth/refresh/` | POST | Refresh access token |
| `/api/v1/accounts/me/` | GET/PUT | Current user profile |
| `/api/v1/learners/attendance/` | GET/POST | Bulk attendance capture |

---

## Key Architecture Decisions

- **TimetableSlot is the backbone** — every attendance record, behaviour log, lesson plan, and assessment references a TimetableSlot
- **AUTH_USER_MODEL** is set to `accounts.User` before first migration — never change this
- **JWT tokens** — 15-min access, 7-day refresh
- **Celery** handles background tasks: notifications, risk score calculations, report generation
- **Role-based permissions** enforce data access at every API endpoint

---

## Build Phases

| Phase | Focus | Timeline |
|-------|-------|----------|
| 1 | Foundation (models, auth, timetable) | Months 1–2 |
| 2 | Core Teacher Loop (attendance, plans) | Months 2–3 |
| 3 | Intelligence (behaviour, carry-overs, risk) | Months 3–4 |
| 4 | Assessments & Analytics | Months 4–5 |
| 5 | Mobile & Production | Months 5–6 |

---

## Testing

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=apps --cov-report=html

# Run specific app tests
pytest apps/learners/
```

---

## Docker

```bash
# Full stack with Docker Compose
docker-compose up --build
```

---

## Daily Commands

```bash
source venv/bin/activate
python manage.py runserver          # Django dev server
python manage.py makemigrations <app>  # Create migration
python manage.py migrate            # Apply migrations
python manage.py shell              # Django shell
pytest                              # Run tests
```
