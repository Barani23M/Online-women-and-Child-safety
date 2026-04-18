# Safeguard Project Guide

This file shows how to:
1. Run the project locally
2. Generate a fresh Android APK

## Project Layout

- `backend`: FastAPI API with SQLite
- `frontend`: React web app
- `frontend/android`: Capacitor Android project used to build the APK

## 1) Run The Project Locally

### Requirements

- Windows PowerShell
- Python 3.13+
- Node.js 18+
- npm

### Start Backend

Run this command from the project root:

```powershell
c:/python313/python.exe -m uvicorn main:app --app-dir c:/Users/jayam/Downloads/Ai/backend --host 0.0.0.0 --port 8000
```

Backend URLs:
- http://localhost:8000
- http://localhost:8000/docs

### Start Frontend

Open a second terminal in the project root and run:

```powershell
npm --prefix frontend install
npm --prefix frontend run start
```

Frontend URL:
- http://localhost:3000

### Same WiFi Access

- Keep the backend on `0.0.0.0`
- Use your PC IP address for mobile or another device on the same WiFi
- Example format: `http://192.168.x.x:8000`

## 2) Generate A New APK

This workspace builds the Android APK from the Capacitor project inside `frontend/android`.

### Before Building

Make sure:
- Android SDK is installed
- `frontend/android/local.properties` contains your SDK path
- Example SDK path on this machine:

```text
sdk.dir=C:\Users\jayam\AppData\Local\Android\Sdk
```

### Build Steps

Run these commands from the project root:

```powershell
cd frontend
npm install
npm run build
npx cap sync android
cd android
.\gradlew assembleDebug
```

### APK Output

After the build finishes, the APK is created here:

- `frontend/android/app/build/outputs/apk/debug/app-debug.apk`

### Release APK

If you need a release APK instead of a debug APK:

```powershell
cd frontend/android
.\gradlew assembleRelease
```

Release output:

- `frontend/android/app/build/outputs/apk/release/app-release.apk`

## 3) Quick Commands

Backend:

```powershell
c:/python313/python.exe -m uvicorn main:app --app-dir c:/Users/jayam/Downloads/Ai/backend --host 0.0.0.0 --port 8000
```

Frontend:

```powershell
npm --prefix c:/Users/jayam/Downloads/Ai/frontend run start
```

APK build:

```powershell
cd c:/Users/jayam/Downloads/Ai/frontend
npm run build
npx cap sync android
cd android
.\gradlew assembleDebug
```

## 4) Common Problems

1. Port already in use
- Stop the old process on port 8000 or 3000, then run again.

2. APK build fails with Android SDK error
- Check `frontend/android/local.properties`
- Confirm the `sdk.dir` path is correct

3. APK build fails after web changes
- Run `npm run build` again
- Then run `npx cap sync android`

4. Mobile app cannot reach backend
- Use the PC IP address, not `localhost`
- Backend must listen on `0.0.0.0`

## 5) Existing Helper Scripts

These scripts also exist in the project root:

- `start-backend.ps1`
- `start-frontend.ps1`
- `start-mobile.ps1`

Use them if they match your current setup.
