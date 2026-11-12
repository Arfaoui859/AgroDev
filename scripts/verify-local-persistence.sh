#!/usr/bin/env bash
#
# End-to-end persistence + tenant-isolation verification against a real
# Postgres + PostgREST stack (the same RLS mechanism Supabase uses).
#
# This is the missing evidence for the "farmer CRUD persistence" item: the RLS
# suite in tests/db/rls-verification.sql proves the *policies* with role
# switching, but not that a real HTTP client carrying a real JWT can create,
# read, and fail to touch another tenant's rows through PostgREST.
#
# Prerequisites (not installed by this script):
#   - PostgreSQL 17 with PostGIS, running and reachable.
#   - A PostgREST binary whose `jwt-secret` matches $JWT_SECRET below.
#   - $PGREST_URL points at it.
#
# Usage:
#   DATABASE_URL=postgresql://... PGREST_URL=http://127.0.0.1:3001 \
#     bash scripts/verify-local-persistence.sh
#
# Exit code 0 means every isolation assertion held.

set -u

# Seeding runs as a privileged role; the authenticated traffic below goes
# through PostgREST as the low-privilege `authenticator` role.
SEED_DATABASE_URL="${SEED_DATABASE_URL:-postgresql://postgres@127.0.0.1:5433/agrogrowth}"
DATABASE_URL="${DATABASE_URL:-$SEED_DATABASE_URL}"
PGREST_URL="${PGREST_URL:-http://127.0.0.1:3001}"
JWT_SECRET="${JWT_SECRET:-super-secret-jwt-token-with-at-least-32-characters-long}"
PSQL="${PSQL:-psql}"

FARMER_A="aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
FARMER_B="bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"

pass=0
fail=0
check() {
  local label="$1" actual="$2" expected="$3"
  if [ "$actual" = "$expected" ]; then
    echo "  ok   - $label"
    pass=$((pass + 1))
  else
    echo "  FAIL - $label (expected '$expected', got '$actual')"
    fail=$((fail + 1))
  fi
}

# --- Mint HS256 JWTs (no external deps beyond python3) -----------------------
mint_jwt() {
  python3 - "$1" "$2" "$JWT_SECRET" <<'PY'
import base64, hashlib, hmac, json, sys, time
uid, role, secret = sys.argv[1], sys.argv[2], sys.argv[3].encode()
b64 = lambda b: base64.urlsafe_b64encode(b).rstrip(b"=")
now = int(time.time())
seg = b".".join([
    b64(json.dumps({"alg": "HS256", "typ": "JWT"}, separators=(",", ":")).encode()),
    b64(json.dumps({"sub": uid, "role": role, "aud": "authenticated",
                    "iat": now, "exp": now + 3600}, separators=(",", ":")).encode()),
])
print((seg + b"." + b64(hmac.new(secret, seg, hashlib.sha256).digest())).decode())
PY
}

TOK_A="$(mint_jwt "$FARMER_A" authenticated)"
TOK_B="$(mint_jwt "$FARMER_B" authenticated)"
TOK_SVC="$(mint_jwt "$FARMER_A" service_role)"

api() { curl -s -m 10 "$@"; }

echo "== Seed two farmer profiles =="
"$PSQL" "$SEED_DATABASE_URL" -q -c "
  INSERT INTO public.users (id,email,full_name,role) VALUES
    ('$FARMER_A','farmer.a@example.tn','Farmer A','farmer'),
    ('$FARMER_B','farmer.b@example.tn','Farmer B','farmer')
  ON CONFLICT (id) DO UPDATE SET role='farmer';
  DELETE FROM public.farms WHERE owner_id IN ('$FARMER_A','$FARMER_B');
" >/dev/null 2>&1 || { echo "cannot reach $DATABASE_URL" >&2; exit 2; }

echo "== 1. Farmer A creates a farm over REST =="
CREATED="$(api -X POST "$PGREST_URL/farms" -H "Authorization: Bearer $TOK_A" \
  -H 'Content-Type: application/json' -H 'Prefer: return=representation' \
  -d "{\"owner_id\":\"$FARMER_A\",\"name\":\"Ferme A\",\"location\":{\"region\":\"Beja\"},\"size_hectares\":4.5,\"soil_type\":\"clay\"}")"
FARM_ID="$(printf '%s' "$CREATED" | python3 -c 'import sys,json;d=json.load(sys.stdin);print(d[0]["id"] if isinstance(d,list) and d else "")' 2>/dev/null)"
check "farm created and returned" "$([ -n "$FARM_ID" ] && echo yes || echo no)" "yes"

echo "== 2. Farmer A reads own farm; Farmer B and anon see nothing =="
check "A sees 1 farm" "$(api "$PGREST_URL/farms?select=id" -H "Authorization: Bearer $TOK_A" | python3 -c 'import sys,json;print(len(json.load(sys.stdin)))')" "1"
check "B sees 0 farms" "$(api "$PGREST_URL/farms?select=id" -H "Authorization: Bearer $TOK_B" | python3 -c 'import sys,json;print(len(json.load(sys.stdin)))')" "0"
check "anon sees 0 farms" "$(api "$PGREST_URL/farms?select=id" | python3 -c 'import sys,json;print(len(json.load(sys.stdin)))')" "0"

echo "== 3. Farmer B cannot update or delete A's farm =="
check "B update affects 0 rows" "$(api -X PATCH "$PGREST_URL/farms?id=eq.$FARM_ID" -H "Authorization: Bearer $TOK_B" -H 'Content-Type: application/json' -H 'Prefer: return=representation' -d '{"name":"HACKED"}' | python3 -c 'import sys,json;print(len(json.load(sys.stdin)))')" "0"
check "B delete affects 0 rows" "$(api -X DELETE "$PGREST_URL/farms?id=eq.$FARM_ID" -H "Authorization: Bearer $TOK_B" -H 'Prefer: return=representation' | python3 -c 'import sys,json;print(len(json.load(sys.stdin)))')" "0"
check "A farm name unchanged" "$(api "$PGREST_URL/farms?select=name&id=eq.$FARM_ID" -H "Authorization: Bearer $TOK_A" | python3 -c 'import sys,json;print(json.load(sys.stdin)[0]["name"])')" "Ferme A"

echo "== 4. Farmer B cannot insert a farm owned by A (ownership spoof) =="
SPOOF_CODE="$(api -X POST "$PGREST_URL/farms" -H "Authorization: Bearer $TOK_B" -H 'Content-Type: application/json' -d "{\"owner_id\":\"$FARMER_A\",\"name\":\"spoof\",\"location\":{},\"size_hectares\":1}" | python3 -c 'import sys,json;print(json.load(sys.stdin).get("code",""))' 2>/dev/null)"
check "spoof insert denied (42501)" "$SPOOF_CODE" "42501"

echo "== 5. Farmer cannot escalate their own role =="
api -X PATCH "$PGREST_URL/users?id=eq.$FARMER_A" -H "Authorization: Bearer $TOK_A" -H 'Content-Type: application/json' -d '{"role":"admin"}' >/dev/null
check "role unchanged" "$("$PSQL" "$SEED_DATABASE_URL" -tA -c "SELECT role FROM public.users WHERE id='$FARMER_A'")" "farmer"

echo "== 6. admin_change_user_role is not callable by a client, and rejects a non-admin actor =="
# A client either cannot resolve the function (PGRST202) or lacks EXECUTE
# (42501); both are denials. Assert the call is refused, not which code.
CLIENT_RPC="$(api -X POST "$PGREST_URL/rpc/admin_change_user_role" -H "Authorization: Bearer $TOK_A" -H 'Content-Type: application/json' -d "{\"p_actor_user_id\":\"$FARMER_A\",\"p_target_user_id\":\"$FARMER_B\",\"p_new_role\":\"admin\"}" | python3 -c 'import sys,json;print(json.load(sys.stdin).get("code",""))' 2>/dev/null)"
check "client RPC refused" "$(case "$CLIENT_RPC" in 42501|PGRST202) echo denied;; *) echo "$CLIENT_RPC";; esac)" "denied"
check "non-admin actor rejected (42501)" "$(api -X POST "$PGREST_URL/rpc/admin_change_user_role" -H "Authorization: Bearer $TOK_SVC" -H 'Content-Type: application/json' -d "{\"p_actor_user_id\":\"$FARMER_A\",\"p_target_user_id\":\"$FARMER_B\",\"p_new_role\":\"admin\"}" | python3 -c 'import sys,json;print(json.load(sys.stdin).get("code",""))' 2>/dev/null)" "42501"

echo "== 7. admin_audit_logs is not reachable by clients =="
check "authenticated read denied (42501)" "$(api "$PGREST_URL/admin_audit_logs?select=id" -H "Authorization: Bearer $TOK_A" | python3 -c 'import sys,json;print(json.load(sys.stdin).get("code",""))' 2>/dev/null)" "42501"
check "anon read denied (42501)" "$(api "$PGREST_URL/admin_audit_logs?select=id" | python3 -c 'import sys,json;print(json.load(sys.stdin).get("code",""))' 2>/dev/null)" "42501"

echo
echo "passed: $pass   failed: $fail"
[ "$fail" -eq 0 ]
