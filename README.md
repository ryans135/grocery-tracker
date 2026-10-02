# Pantry — grocery tracker

React + Vite front end, Supabase (Postgres, Storage, Auth, Realtime) back end.
Hosted on GitHub Pages; every push to `main` rebuilds and redeploys via
`.github/workflows/deploy.yml`.

## Access

Sign-in is by emailed magic link. Only emails listed in the
`public.allowed_users` table can read or change data (enforced by RLS — see
`supabase/auth-lockdown.sql`). To add someone:

```sql
insert into public.allowed_users (email) values ('someone@example.com');
```

## Deploy configuration

- **Repo secrets** (Settings → Secrets and variables → Actions):
  `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- **Pages** (Settings → Pages): Source = GitHub Actions
- **Supabase** (Authentication → URL Configuration): Site URL and Redirect
  URLs include the Pages URL, e.g. `https://<user>.github.io/<repo>/`

## Local development (optional)

```bash
cp .env.example .env   # fill in the two values
npm install
npm run dev
```

Add `http://localhost:5173/` to Supabase's Redirect URLs to sign in locally.
