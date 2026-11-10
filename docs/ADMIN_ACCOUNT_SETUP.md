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
- The overview and user directory use verified Supabase records. Revenue, subscription, uptime, and other optional analytics remain explicitly unavailable until their source tables/integrations are connected. Admin login and route authorization do not imply that every dashboard metric is live.


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


## Account activation and suspension (new)

The Admin Panel → Users actions call `PATCH /api/admin/users/:userId/status`.
The backend requires a verified administrator JWT and a configured Supabase
service-role client. It synchronizes the account with Supabase Auth using
`ban_duration: '876000h'` for suspension and `ban_duration: 'none'` for
reactivation, then invokes `admin_set_user_active` to update
`public.users.is_active` and append an audit record. If the database rejects
the operation, the API attempts to restore the previous Auth ban state.

The database function serializes status changes, blocks self-suspension, and
prevents suspension of the last active administrator. It is included in the
same `database/admin-role-management.sql` migration; re-apply the updated
migration before using the controls.

A suspended user's Auth ban prevents new sign-ins and token refresh. Existing
access tokens may remain valid until expiry; role-protected/admin endpoints
also check `public.users.is_active` and reject inactive accounts. This is
not a substitute for short access-token lifetimes or a session-revocation
strategy if immediate revocation of every existing token is required.


## Admin user invitations and directory (2026-11-10)

The **Admin Panel → Users** tab supports server-side search by email/name,
role and account-status filters, and pagination across the full user directory.
The page size is 50 records; the API caps it at 100.

The **Add User** action calls `POST /api/admin/users` using the signed-in
administrator's verified JWT. It accepts a full name, email, and a supported
non-admin platform role. The API sends a Supabase Auth invitation email,
creates the matching `public.users` profile, and appends a
`user.created` record to `public.admin_audit_logs`. If profile or audit
persistence fails, the API attempts to roll back the newly created Auth
identity and profile rather than reporting a successful creation.

**Email delivery prerequisite:** configure and test the Supabase Auth email
provider/SMTP settings. If invitation delivery fails, the endpoint returns an
explicit error; it does not create a password in the browser or expose a
service-role credential. Existing Auth identities are not silently promoted
or overwritten by this invitation flow.

User invitations, role changes, and account activation/suspension require
the database migration `database/admin-role-management.sql` and the
server-side Supabase service-role configuration. Do not apply this migration
or claim production readiness until it has been run against the intended
Supabase project.


### Editing user profiles

The Users table's **Edit** action updates the user's full name in both
`public.users.full_name` and Supabase Auth user metadata. The mutation
requires a verified administrator JWT and writes a before/after
`user.profile.updated` audit record. It does not change the user's email
address or password. If either persistence step or audit write fails, the
API attempts to restore the previous values and reports a partial failure
rather than claiming success.


### User detail data integrity (2026-11-10)

The user details dialog now displays only fields returned by the persisted
user directory: account creation time, recorded last sign-in, account ID,
and the profile's email-verification flag. Missing or invalid timestamps are
shown as unavailable/not recorded. Login counts, phone verification, and
two-factor enrollment are explicitly marked as not connected/unavailable;
the UI no longer reads placeholder properties or presents them as real
account-security facts. Connect verified Auth/session telemetry before
enabling those indicators.


### Administrator-triggered password recovery

The user details dialog provides a **Send password reset email** action. It is available only through the admin-protected API and the handler also requires a verified administrator JWT (the shared bootstrap token is not accepted as the human actor). The endpoint resolves the target through public.users and Supabase Auth, then calls Supabase Auth's resetPasswordForEmail recovery flow. It never reads, creates, returns, or displays a user's password. The recovery redirect uses the Supabase project's configured Auth Site URL; configure that URL and the Auth email/SMTP provider for the production domain before relying on delivery.

A user.password_reset.requested event is appended to public.admin_audit_logs. If email submission succeeds but the audit write fails, the API reports an explicit partial failure so the operator can inspect the audit log before retrying. This flow has not been exercised against the production Supabase project; email delivery, redirect configuration, and migration readiness must be verified there.
