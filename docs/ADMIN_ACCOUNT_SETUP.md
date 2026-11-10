# Production administrator bootstrap

This is a one-time operator procedure for creating or promoting the first AgroGrowth platform administrator. There is deliberately no default admin email or password in the repository.

## 1. Configure Render secrets

In the **AgroDev-3** Render service, open **Environment** and set these server-side environment variables:

- `ADMIN_API_TOKEN`: generate a long random secret (at least 32 random bytes). Keep it private.
- `SUPABASE_URL`: the project URL.
- `SUPABASE_ANON_KEY`: the public anon key used by the server's verified JWT client.
- `SUPABASE_SERVICE_ROLE_KEY`: the Supabase service-role key. This is server-only and must never be prefixed with `VITE_`, placed in client code, or sent to a browser.

Save the environment changes and wait for Render to redeploy. Do not commit any of these values to Git.

## 2. Create the administrator identity

Choose the email address and a unique password (12+ characters) that the administrator will use on the normal AgroGrowth sign-in page.

Run this from a trusted PowerShell terminal. Replace the email with the intended administrator address. The token is entered interactively and is not echoed by `Read-Host -AsSecureString`.

```powershell
$adminTokenSecure = Read-Host "ADMIN_API_TOKEN" -AsSecureString
$adminToken = [System.Net.NetworkCredential]::new("", $adminTokenSecure).Password
$adminPasswordSecure = Read-Host "New administrator password (12+ characters)" -AsSecureString
$adminPassword = [System.Net.NetworkCredential]::new("", $adminPasswordSecure).Password

$payload = @{
  email = "YOUR_ADMIN_EMAIL"
  password = $adminPassword
} | ConvertTo-Json

try {
  Invoke-RestMethod `
    -Method Post `
    -Uri "https://agrodev-3.onrender.com/api/setup-admin" `
    -Headers @{ "x-admin-token" = $adminToken } `
    -ContentType "application/json" `
    -Body $payload
}
finally {
  $adminToken = $null
  $adminPassword = $null
  $payload = $null
  $adminTokenSecure.Dispose()
  $adminPasswordSecure.Dispose()
}
```

The endpoint is rate-limited. If the email already exists in Supabase Auth, the protected bootstrap action promotes that identity to `admin` and applies the password entered in this request. It also persists the trusted `public.users.role = 'admin'` record.

## 3. Sign in as the administrator

1. Open [AgroGrowth sign-in](https://agrodev-3.onrender.com/login).
2. Sign in using the exact email and password supplied in step 2.
3. Open [Admin Panel](https://agrodev-3.onrender.com/admin-panel).

The browser obtains a normal Supabase session. Admin access is determined server-side from `public.users.role`, not from a role selector or client-supplied user metadata.

## 4. Troubleshooting

- **403 — endpoint disabled:** `ADMIN_API_TOKEN` is not configured on Render (or the service is running an older deployment).
- **401 — unauthorized:** the supplied `x-admin-token` does not match the Render secret.
- **429 — too many requests:** wait for the rate-limit window to reset.
- **503 — Supabase admin client not configured:** verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` on the Render server service, then redeploy.
- **500 — role not persisted:** inspect Render server logs and verify the `public.users` schema/migrations are applied.
- **Login succeeds but Admin Panel redirects:** confirm the same Auth user has `public.users.role = 'admin'` or `administrator`, and that the latest server deployment is active.

## Security notes

- Never put `ADMIN_API_TOKEN` or `SUPABASE_SERVICE_ROLE_KEY` in a `VITE_*` variable, browser console, frontend request, screenshot, Git commit, or public issue.
- Do not use the service-role key as the admin token. They are different secrets.
- The bootstrap endpoint is for operator provisioning only; it is not a public signup or role-change endpoint.
- The admin dashboard data APIs currently fail closed with `503 DASHBOARD_DATA_SOURCE_NOT_CONNECTED` until real admin data persistence is implemented. Admin login and route authorization do not imply that those dashboard analytics are already live.


## Administrator role management (new)

Before using the role editor in **Admin Panel → Users**, apply
`database/admin-role-management.sql` in the Supabase SQL Editor (or with
`psql`). This migration creates the service-role-only audit table and an
atomic database function for role changes. It serializes role changes and
refuses to demote the last active administrator.

The Render API service must have all three server-side variables configured:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

The service-role key is a server secret. Never add it to a `VITE_*` variable,
frontend code, Git, screenshots, or chat. The API now refuses to use the anon
key as a substitute for a privileged Supabase client.

A signed-in administrator with a verified Supabase session can change roles
from the Users tab. Changes are written to `public.users` and recorded in
`public.admin_audit_logs`. Operator `x-admin-token` credentials are not
accepted for this human-attributed mutation.

If the migration has not been applied or the service-role key is missing, the
endpoint fails closed; it does not pretend the role change succeeded.


## Administrator audit trail (new)

The `GET /api/admin/activity-logs` endpoint reads the latest records from
`public.admin_audit_logs` with bounded pagination (25 by default, maximum
100 per page). The Admin Panel → Activity tab displays the action, actor
user ID, target user ID, before/after role values, and timestamp.

The audit view is intentionally read-only. It displays no fabricated events.
If the migration is missing or the service-role client is not configured,
the API returns an explicit 503 and the UI explains that audit records are
not available. Apply `database/admin-role-management.sql` before expecting
role-change audit events to appear.
