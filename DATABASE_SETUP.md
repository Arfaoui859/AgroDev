# Database Setup Guide

## Issue: "TypeError: Failed to fetch" when accessing Users table

This error occurs because the database tables (`users` and `user_profiles`) haven't been created in your Supabase database yet.

---

## Quick Fix (5 minutes)

### Step 1: Open Supabase SQL Editor
1. Go to your Supabase project: https://app.supabase.com
2. Select your project
3. Click **"SQL Editor"** in the left sidebar
4. Click **"New Query"**

### Step 2: Copy the Setup Script
- Open the file: `supabase-tables-setup.sql` (in your project root)
- Copy the entire contents

### Step 3: Run the Script
1. Paste the SQL into the Supabase SQL Editor
2. Click **"Run"** button (or press `Cmd+Enter` / `Ctrl+Enter`)
3. Wait for the script to complete (you should see "Success" messages)

### Step 4: Verify Tables Were Created
The script output should show:
```
✅ Tables created successfully!
✅ RLS policies configured
```

### Step 5: Refresh Your Application
- Refresh your browser or restart the dev server
- The "Users table issue" error should now be gone

---

## What the Script Does

The `supabase-tables-setup.sql` script:

1. **Creates the `users` table** with fields:
   - id, email, full_name, full_name_ar
   - phone, role, location, specialization
   - experience_years, verified
   - created_at, updated_at (auto-managed)

2. **Creates the `user_profiles` table** with fields:
   - user_id, avatar_url, bio, bio_ar
   - farm_size_hectares, crops_grown, certifications
   - preferences (JSON)
   - created_at, updated_at (auto-managed)

3. **Configures Row Level Security (RLS)** policies:
   - Users can only see/modify their own records
   - Service role (admin) can do everything
   - Authenticated and anonymous users can insert during signup

4. **Sets up automatic timestamp management** via triggers

5. **Creates indexes** for better performance

---

## Alternative: If You Prefer the Dashboard

You can also create tables manually via the Supabase dashboard:

1. Go to **Tables** → **Create a new table**
2. Name it `users`
3. Add the columns listed above
4. Repeat for `user_profiles`
5. Configure RLS policies in the **RLS** tab

However, using the SQL script is faster and ensures everything is configured correctly.

---

## Troubleshooting

### Error: "Relation "users" already exists"
- This means the tables were already created
- Just click **Cancel** and refresh your app

### Error: "Permission denied for schema"
- This usually means the service role key isn't correct
- Verify your SUPABASE_SERVICE_ROLE_KEY in environment variables

### Still getting "TypeError: Failed to fetch"
- Check browser console (F12 → Console tab)
- Verify tables exist in Supabase dashboard (Tables tab)
- Make sure RLS policies allow your anon key to access the tables
- Try re-running the SQL script

---

## Commercial weather-provider configuration

AgroGrowth is a commercial product. The public Open-Meteo API is restricted to
non-commercial use; production must use the licensed customer endpoint and a
server-side `OPEN_METEO_API_KEY`. Historical archive access for the
weather/yield planner requires the Open-Meteo Professional plan or higher.
Never put this key in a `VITE_*` variable. Without it, production weather
endpoints return an explicit 503 instead of silently using the non-commercial
free API. The development-only free endpoint can be enabled outside production.

## Admin panel database connection and user management

After the base tables exist, run `database/rls-hardening.sql` and then
`database/admin-user-management.sql` in the same Supabase project's SQL Editor.
The admin migration adds persistent account status, an administrator-only RLS
policy for listing/updating users, and an audit table for admin CRUD actions.
It is idempotent and does not create demonstration users.

The Admin dashboard reads actual `public.users` rows. It does not seed mock users.
Role and status updates use the verified administrator JWT and RLS. Creating and
deleting Supabase Auth accounts additionally require a server-side
`SUPABASE_SERVICE_ROLE_KEY` on Render; never expose it in a `VITE_*` variable.

Verify that the frontend and Render `SUPABASE_URL` point to the same Supabase
project. The signed-in account must have `public.users.role = 'admin'` and must
not be inactive/suspended. The Admin API rejects unverified or non-admin JWTs.

## Demo Users

After setting up the database, you can test with:

```
Email: farmer@demo.com
Password: demo123
Role: Farmer

Email: admin@demo.com
Password: demo123
Role: Admin
```

(If these don't exist, you can create them manually or use the API)

---

## Next Steps

Once the database is set up:

1. ✅ Create demo users (via admin panel or API)
2. ✅ Test user registration and login
3. ✅ Verify AI features are working
4. ✅ Deploy to production when ready

---

## Need Help?

If you encounter other issues:

1. Check the browser console (F12)
2. Review Supabase logs in the project dashboard
3. Verify all environment variables are set correctly
4. Ensure your Supabase API keys haven't expired

---

**Last Updated**: February 2025  
**Status**: Database setup required (one-time operation)
