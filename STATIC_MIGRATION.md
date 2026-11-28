# Baladi Static Architecture

## Stack
- **Frontend:** React + Vite (Arabic RTL SPA)
- **Hosting:** Render **Static Site** (always on, no sleep)
- **Backend data:** Supabase Postgres + Auth + Storage
- **QR:** Generated in-browser (qrcode + canvas + jsPDF)

## Why
Render free Web Services sleep after inactivity. Static Sites stay available.

## Setup checklist
1. Create a free Supabase project.
2. In SQL Editor run `supabase/schema.sql` then `supabase/seed.sql`.
3. Create a public Storage bucket named `media`.
4. Auth → create user `admin@baladi.local` (or any email) with a strong password.
5. Copy Project URL + anon key into Render Static Site env:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_PUBLIC_SITE_URL` = your static site URL
6. Deploy via Blueprint/`render.yaml` (rootDir `frontend`).

## Admin login
Use the Supabase Auth email + password.  
If username `admin` is entered, the app tries `admin@baladi.local`.

## Notes
- Menu/ads/settings updates appear immediately (no redeploy).
- Images upload to Supabase Storage (`media` bucket).
- Old Django web service can be deleted after cutover.
