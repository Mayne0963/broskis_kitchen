# Broski Admin — Production Env & Verification

## 1) Set Production Env Var (Vercel)
1. Open Vercel ➜ Project ➜ **Settings** ➜ **Environment Variables**.
2. Add:
   - **Name:** `BK_ADMIN_CODE`
   - **Value:** *(your secret admin pass, e.g., `my-secret-broski-pass`)*
   - **Environment:** **Production** (and **Preview** if you want to test on previews)
3. Click **Save**.
4. Trigger a new **Production** deploy from branch **main** (Redeploy or push a commit).

> Note: `.env.local` is for local only and must not be committed. `BK_ADMIN_CODE` in Vercel replaces the default dev code.

## 2) Post-Deploy Verification (Production)
After the deploy finishes, test on your live domain:

- `https://broskiskitchen.com/admin/health` ➜ **200 OK** and shows ✅ text.
- `https://broskiskitchen.com/admin` (not logged in) ➜ **redirects to `/login`**.
- `https://broskiskitchen.com/login` ➜ enter your `BK_ADMIN_CODE` ➜ should redirect to `/admin`.
- `https://broskiskitchen.com/admin` (logged in) ➜ shows Admin Dashboard with orders table.
- Optional: Press **Logout** ➜ should return to `/login`.

## 3) Rotating the Admin Code
- In Vercel ➜ Project ➜ Settings ➜ **Environment Variables**, edit `BK_ADMIN_CODE` to a new value.
- Click **Save**, then **Redeploy** Production.
- New logins require the updated code. Existing sessions expire automatically after their cookie max-age.

## 4) Rollback (Git Tag)
If you tagged a known-good release:
```bash
git checkout main
git reset --hard <YOUR_LAST_GOOD_TAG>
git push -f origin main
```
Then redeploy Production.

## 5) Notes
- Keep `/admin/health` public for uptime checks.
- Keep `/admin` behind the cookie (`bk_session`), managed by `/api/auth/login` and `/api/auth/logout`.
- Never commit secrets. Use Vercel Env Vars for Production.