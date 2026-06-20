# GATE Tracker

A modern, responsive, and calming full-stack web application designed for GATE Computer Science exam preparation. It helps students track syllabus completion across a 3-phase study plan, log test/PYQ performance, map mood/energy trends, and spot burnout patterns early.

## Features

- **Syllabus Checklist**: Pre-loaded with the full 3-phase GATE CS syllabus, structured by Phase > Week > Topic. Features a 3-state checkbox (Not Started → In Progress → Done) and nested progress tracking bars.
- **Performance Analytics**: Log practice tests, track score percentages over time (overall and per-subject) with interactive Recharts line charts, and auto-identify weakest and most-improved subjects.
- **Mood & Energy Log**: Log daily mood (non-emoji states) and energy levels (1-5 scale) with note journaling. Includes a weekly trend line chart and a supportive burnout banner if three consecutive days of "Stressed" or "Burnt Out" are logged.
- **Dashboard**: Home view showing overall progress, target count downs (customizable exam date), active focus topics, quick log shortcuts, and a chronological history of the last 5 logs.
- **Syllabus Editor & Backup Settings**: Add custom topics, edit or delete existing topics, download a full JSON backup of all logged records, or securely reset database progress.
- **Authentication-less Session Scoping**: Generates an anonymous device ID on first visit, stores it in browser `localStorage`, and scopes all database entries on the backend. Multiple devices can use the same server with completely independent progress.

---

## Project Structure

```
gate_tracker/
├── backend/
│   ├── data/
│   │   └── database.sqlite
│   ├── src/
│   │   ├── db.js          # SQLite connection and queries
│   │   ├── seedData.js    # Default syllabus topic list
│   │   └── index.js       # Express API routes
│   ├── .env.example
│   ├── .env
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/    # Navigation layouts
│   │   ├── pages/         # Dashboard, Syllabus, Performance, Mood, Settings
│   │   ├── api.js         # API request wrapper with x-device-id headers
│   │   ├── App.jsx        # Tab router and root state
│   │   └── index.css      # Tailwind v4 theme configurations
│   ├── index.html
│   └── package.json
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm (v9 or higher)

### Setup & Run Locally

#### 1. Start the Backend Server

1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy the environment file:
   ```bash
   cp .env.example .env
   ```
4. Start the server (runs on `http://localhost:5000` by default):
   ```bash
   npm start
   ```

*Note: On first startup, the application creates a `data/` folder and `database.sqlite` file automatically.*

#### 2. Start the Frontend Server

1. Open a new terminal and navigate to the `frontend/` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server (runs on `http://localhost:5173`):
   ```bash
   npm run dev
   ```

Open [http://localhost:5173](http://localhost:5173) in your browser to start using GATE Tracker!

---

## Deployment Guide

### Backend Deployment (Railway or Render)

Because the backend uses **SQLite** (a file-based database), any server container will wipe the database on rebuild/restart unless a persistent storage volume is attached.

#### Deploying on Railway (Recommended)

1. Create a new project on Railway.
2. Link your Git repository or deploy via the Railway CLI.
3. **Important**: Add a persistent volume to preserve the database file.
   - Go to your service settings in Railway.
   - Click **Volumes** -> **New Volume**. Set the Mount Path to `/app/data` (or whatever matches your configured folder).
4. Add environment variables:
   - `PORT`: `5000` (Railway will assign this automatically, but setting it is fine)
   - `DATABASE_PATH`: `/app/data/database.sqlite`
5. Railway will automatically run `npm install` and `npm start` based on the package scripts.

#### Deploying on Render

1. Create a new **Web Service** on Render.
2. Connect your Git repository and specify the subfolder `backend`.
3. Set the build command to `npm install` and start command to `npm start`.
4. In the service settings, go to **Advanced** -> **Disk** -> **Add Disk**.
   - Mount Path: `/app/data`
   - Size: `1 GB` (more than enough for SQLite)
5. Set environment variables:
   - `DATABASE_PATH`: `/app/data/database.sqlite`

---

### Frontend Deployment (Vercel)

Vercel is ideal for hosting the static React SPA frontend.

1. Install the Vercel CLI (`npm install -g vercel`) or import your Git repository in the Vercel Dashboard.
2. Configure project settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Add the environment variable:
   - `VITE_API_URL`: Set this to your deployed backend URL (e.g., `https://your-backend-service.railway.app`). Do not add a trailing slash.
4. Deploy the project!
