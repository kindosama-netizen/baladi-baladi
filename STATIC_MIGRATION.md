# Baladi Static Architecture

## Stack
- **Frontend:** React + Vite (Arabic RTL SPA)
- **Hosting:** Render **Static Site** (always on, no sleep)
- **Backend data:** Firebase Auth + Firestore + Storage
- **QR:** Generated in-browser (qrcode + canvas + jsPDF)

## Why
Render free Web Services sleep after inactivity. Static Sites stay available.

## Setup checklist
1. Create a Firebase project (Google Cloud Console).
2. Enable **Authentication** (Email/Password) and create user `admin@baladi.local`.
3. Create Firestore database and deploy `firebase/firestore.rules`.
4. Enable **Storage** and deploy `firebase/storage.rules`.
5. Import demo data from `firebase/seed.json` (Firestore console or a small import script).
6. Copy web app config into Render Static Site env (see `frontend/.env.example`).
7. Deploy via Blueprint/`render.yaml` (rootDir `frontend`).

## Admin login
Use Firebase Auth email + password.  
If username `admin` is entered, the app tries `admin@baladi.local`.

## Notes
- Menu/ads/settings updates appear immediately (no redeploy).
- Images upload to Firebase Storage under `media/`.
- Old Django web service can be deleted after cutover.