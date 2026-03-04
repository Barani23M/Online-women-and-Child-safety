# SafeGuard — Women & Child Safety Platform

A full-stack web application providing safety resources, emergency SOS alerts, incident reporting, and community support for women and children.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | FastAPI, SQLAlchemy 2.0, SQLite, python-jose JWT, bcrypt |
| Frontend | React 18, React Router v6, Tailwind CSS, Recharts, React Leaflet, Axios |
| Auth | JWT Bearer tokens (15-minute access tokens) |

---

## Project Structure

```
Ai/
├── mobile/                  # React Native (Expo) mobile app
│   ├── App.js               # Root: navigation + provider setup
│   ├── app.json             # Expo config (name, permissions)
│   ├── babel.config.js
│   ├── package.json
│   └── src/
│       ├── config.js        # API_BASE_URL (change for your device)
│       ├── theme.js         # Colors, shadows, radii
│       ├── context/
│       │   └── AuthContext.js
│       ├── services/
│       │   └── api.js
│       └── screens/
│           ├── auth/        # LoginScreen, RegisterScreen
│           ├── main/        # Dashboard, SOS, Report, Profile, Helplines,
│           │                #  SafeRoutes, LegalResources, Counseling,
│           │                #  ChildSafety, MyIncidents
│           └── admin/       # AdminDashboardScreen
├── backend/
│   ├── main.py              # FastAPI app, CORS, router mounts
│   ├── database.py          # SQLAlchemy engine & session
│   ├── auth.py              # JWT + bcrypt password hashing
│   ├── schemas.py           # Pydantic request/response models
│   ├── seed.py              # Database seeder (18 safe places, helplines, resources)
│   ├── requirements.txt
│   └── routers/
│       ├── auth_router.py       # /api/auth/*
│       ├── incident_router.py   # /api/incidents/*
│       ├── sos_router.py        # /api/sos/*
│       ├── helpline_router.py   # /api/helplines/*
│       ├── resources_router.py  # /api/resources/*
│       ├── safe_places_router.py # /api/safe-places/*
│       └── admin_router.py      # /api/admin/*
├── frontend/
│   └── src/
│       ├── pages/           # 14 page components
│       ├── components/      # Navbar, Footer
│       ├── context/         # AuthContext (JWT + user state)
│       └── services/
│           └── api.js       # Axios API client
├── start-backend.ps1        # PowerShell: start uvicorn
├── start-frontend.ps1       # PowerShell: start React dev server
└── README.md
```

---

## Quick Start

### Prerequisites
- Python 3.10+ with `venv` support
- Node.js 18+ with npm

### 1. Backend Setup

```powershell
# From the Ai/ folder
python -m venv .venv
.venv\Scripts\Activate.ps1

cd backend
pip install -r requirements.txt
```

### 2. Start Both Servers

Open **two terminals** from `C:\Users\jayam\Downloads\Ai\`:

**Terminal 1 — Backend (port 8000)**
```powershell
.\start-backend.ps1
```

**Terminal 2 — Frontend (port 3000)**
```powershell
.\start-frontend.ps1
```

Then open: **http://localhost:3000**

### 3. Mobile App Setup (React Native / Expo)

**Prerequisites**: Install [Expo Go](https://expo.dev/go) on your Android/iOS device, or use an Android/iOS emulator.

```powershell
cd mobile
npm install
```

**Configure the backend URL** in [mobile/src/config.js](mobile/src/config.js):
- Android Emulator: use `http://10.0.2.2:8000`
- iOS Simulator: use `http://localhost:8000`
- Physical Device: use your machine's local IP, e.g. `http://192.168.1.5:8000`

**Run the mobile app:**
```powershell
# From the Ai/ folder
.\start-mobile.ps1
# or manually:
cd mobile && npx expo start
```

Scan the QR code with **Expo Go** on your phone, or press `a` for Android emulator / `i` for iOS simulator.



| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@safeguard.in` | `Admin@1234` |
| Test User | Register a new account | Your choice |

> The SQLite database (`backend/safeguard.db`) is auto-created and seeded on first backend run.

---

## Features

### All Users
| Feature | Route |
|---------|-------|
| Register / Login | `/register`, `/login` |
| Dashboard | `/dashboard` — live incident stats + active SOS warnings |
| SOS Alert | `/sos` — one-click emergency alert with GPS location |
| Report Incident | `/report-incident` — categorized incident submission |
| My Incidents | `/my-incidents` — view personal incident history |
| Profile | `/profile` — 3 tabs: Trusted Contacts, My Reports, SOS History |
| Helplines | `/helplines` — emergency numbers directory |
| Legal Resources | `/legal` — legal aid information |
| Counseling | `/counseling` — mental health resources |
| Safe Routes | `/safe-routes` — interactive map of verified safe places |
| Child Safety | `/child-safety` — child safety information |

### Admin Only (`/admin`)
| Tab | Functionality |
|-----|---------------|
| Overview | Incident status chart, active SOS badge |
| Incidents | View all incidents, change status (pending/under review/resolved/closed) |
| SOS Alerts | Real-time SOS list, resolve active alerts |
| Users | View all users, activate/deactivate accounts |

---

## API Reference

Base URL: `http://localhost:8000`

### Auth
```
POST /api/auth/register     Register new user
POST /api/auth/login        Login → JWT token
GET  /api/auth/me           Current user info (auth required)
```

### Incidents
```
POST   /api/incidents/            Create incident (auth)
GET    /api/incidents/my          My incidents (auth)
GET    /api/incidents/            All incidents (admin)
PATCH  /api/incidents/{id}/status Update status (admin)
```

### SOS
```
POST  /api/sos/              Trigger SOS alert (auth)
GET   /api/sos/my-alerts     My SOS history (auth)
```

### Admin
```
GET   /api/admin/users                       All users (admin)
PATCH /api/admin/users/{id}/toggle-active    Activate/deactivate user (admin)
GET   /api/admin/sos-alerts                  All SOS alerts (admin)
PATCH /api/admin/sos-alerts/{id}/resolve     Resolve SOS alert (admin)
```

### Resources
```
GET /api/helplines/          Helpline directory
GET /api/resources/          Legal & counseling resources
GET /api/safe-places/        Safe places map data
```

---

## Environment Variables

No `.env` file required for local development. Production overrides:

| Variable | Default | Description |
|----------|---------|-------------|
| `SECRET_KEY` | hardcoded | Change in `backend/auth.py` for production |
| `DATABASE_URL` | `sqlite:///./safeguard.db` | In `backend/database.py` |
| `REACT_APP_API_URL` | `http://localhost:8000` | In `frontend/src/services/api.js` |

---

## Known Constraints

- SQLite is used for simplicity; switch to PostgreSQL for production
- JWT tokens expire in 15 minutes (configurable in `auth.py`)
- GPS location requires browser permission on the SOS page
- Map uses OpenStreetMap tiles (no API key needed)

---

## Seeded Data

On first run, the backend seeds:
- **18 safe places** across Delhi, Mumbai, Bangalore, Chennai, Kolkata, Hyderabad
- **12 emergency helplines** (national + women/child specific)
- **8 legal resources**
- **8 counseling resources**
- **1 admin account** (`admin@safeguard.in` / `Admin@1234`)

To reset the database and re-seed, delete `backend/safeguard.db` and restart the backend.
