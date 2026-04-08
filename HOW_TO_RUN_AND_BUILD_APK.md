# Safeguard Project Guide

This document explains:
1. How to run this project locally (backend + frontend)
2. How to build Android APK for mobile app

## Project Structure

- backend: FastAPI server (SQLite database)
- frontend: React web app
- mobile: Expo React Native mobile app

## 1) Run The Project Locally

### Prerequisites

- Windows PowerShell
- Python 3.13+
- Node.js 18+
- npm

### Backend Setup And Run

1. Open terminal in project root.
2. Go to backend folder:

   cd backend

3. Install Python packages:

   c:/python313/python.exe -m pip install -r requirements.txt

4. Start backend server:

   c:/python313/python.exe -m uvicorn main:app --host 0.0.0.0 --port 8000

Backend URLs:
- Local: http://localhost:8000
- API docs: http://localhost:8000/docs

### Frontend Setup And Run

Open a second terminal in project root:

1. Install packages:

   npm --prefix frontend install

2. Start frontend:

   npm --prefix frontend run start

Frontend URL:
- http://localhost:3000

### Same WiFi Testing

- Keep backend running with host 0.0.0.0
- Find your system IP (WiFi IP), example: 172.16.x.x
- Ensure frontend and mobile API base URL points to that IP with port 8000

## 2) Build Mobile APK (Android)

This repository has a separate mobile app in mobile folder.

There are 2 options:

## Option A: Cloud APK Build (Recommended) using EAS

### Prerequisites

- Expo account
- EAS CLI installed globally

Commands:

1. Install EAS CLI:

   npm install -g eas-cli

2. Go to mobile folder:

   cd mobile

3. Install dependencies:

   npm install

4. Login:

   eas login

5. Build APK using preview profile (already configured in eas.json):

   eas build -p android --profile preview

6. After build completes, open the build URL from terminal and download APK.

Notes:
- eas.json already includes preview profile with buildType apk
- production profile creates AAB, not APK

## Option B: Local APK Build Using Android Gradle

### Prerequisites

- Android Studio
- Android SDK + Build Tools
- Java JDK (compatible with Expo/Gradle)

Commands:

1. Go to mobile folder:

   cd mobile

2. Install dependencies:

   npm install

3. Ensure native android project exists:

   npx expo prebuild --platform android

4. Build debug APK:

   cd android
   .\gradlew assembleDebug

APK output path:

- mobile/android/app/build/outputs/apk/debug/app-debug.apk

For release APK:

- Configure signing first in Android project
- Then run:

  .\gradlew assembleRelease

Release output path:

- mobile/android/app/build/outputs/apk/release/app-release.apk

## Quick Start Commands (From Project Root)

Backend:

- c:/python313/python.exe -m uvicorn main:app --app-dir c:/Users/jayam/Downloads/Ai/backend --host 0.0.0.0 --port 8000

Frontend:

- npm --prefix c:/Users/jayam/Downloads/Ai/frontend run start

Mobile APK (EAS preview):

- cd mobile
- eas build -p android --profile preview

## Common Issues

1. Port already in use
- Stop old processes on ports 8000 or 3000, then restart.

2. Mobile app cannot connect to backend
- Backend must run on 0.0.0.0
- Use same WiFi IP in mobile API URL
- Allow firewall access for port 8000

3. APK not found after local build
- Check exact output paths shown above
- Re-run Gradle build command and watch for errors

## Optional Existing Scripts

At project root, these helper scripts exist:
- start-backend.ps1
- start-frontend.ps1
- start-mobile.ps1

You can use them if they match your current environment settings.
